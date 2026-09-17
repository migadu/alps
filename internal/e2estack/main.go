// Command e2estack runs the servers a browser test run needs around a real
// IMAP server: an object store for that server's message bodies, the SMTP
// submission server alps sends through, a CalDAV/CardDAV server, and a
// small HTTP API tests use to reset an account and to read what was sent.
//
// Everything is held in memory and gone when the process exits, so no run can
// see the state of an earlier one. scripts/e2e.sh starts it; it is not meant
// to be deployed.
package main

import (
	"errors"
	"flag"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/emersion/go-smtp"
)

func main() {
	var (
		s3Addr       = flag.String("s3", "127.0.0.1:9900", "object store listen address")
		smtpAddr     = flag.String("smtp", "127.0.0.1:2525", "SMTP submission listen address")
		relayAddr    = flag.String("relay", "127.0.0.1:2526", "SMTP relay listen address, for mail the IMAP server sends itself")
		davAddr      = flag.String("dav", "127.0.0.1:5232", "CalDAV/CardDAV listen address")
		controlAddr  = flag.String("control", "127.0.0.1:9901", "control API listen address")
		imapAddr     = flag.String("imap", "127.0.0.1:1143", "IMAP server that owns the accounts")
		sieveAddr    = flag.String("sieve", "127.0.0.1:4190", "ManageSieve server")
		deliverURL   = flag.String("deliver-url", "http://127.0.0.1:8080/admin/mail/deliver", "mail server endpoint for local delivery")
		deliverKey   = flag.String("deliver-key", "", "bearer key for -deliver-url")
		localDomains = flag.String("local-domains", "example.test", "comma-separated domains delivered locally")
	)
	flag.Parse()

	creds := newCredentials(*imapAddr)
	sent := &outbox{}
	dav := newDAVStore()

	var domains []string
	for _, d := range strings.Split(*localDomains, ",") {
		if d = strings.TrimSpace(strings.ToLower(d)); d != "" {
			domains = append(domains, d)
		}
	}

	serveHTTP("s3", *s3Addr, newFakeS3())
	serveHTTP("dav", *davAddr, davHandler(creds, dav))
	serveHTTP("control", *controlAddr, (&control{
		creds:     creds,
		outbox:    sent,
		dav:       dav,
		sieveAddr: *sieveAddr,
	}).handler())

	sub := &submission{
		creds:        creds,
		outbox:       sent,
		localDomains: domains,
		deliverURL:   *deliverURL,
		deliverKey:   *deliverKey,
	}
	smtpServer := serveSMTP("smtp", *smtpAddr, sub)
	// The IMAP server's own mail (vacation replies, redirects) arrives on a
	// port of its own, because it does not authenticate and alps must.
	relayServer := serveSMTP("relay", *relayAddr, &relay{sub})

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop
	_ = smtpServer.Close()
	_ = relayServer.Close()
}

func serveSMTP(name, addr string, be smtp.Backend) *smtp.Server {
	srv := smtp.NewServer(be)
	srv.Domain = "localhost"
	srv.AllowInsecureAuth = true
	srv.MaxMessageBytes = 64 << 20
	srv.ReadTimeout = time.Minute
	srv.WriteTimeout = time.Minute
	ln, err := net.Listen("tcp", addr)
	if err != nil {
		log.Fatalf("%s: %v", name, err)
	}
	go func() {
		if err := srv.Serve(ln); err != nil && !errors.Is(err, smtp.ErrServerClosed) {
			log.Fatalf("%s: %v", name, err)
		}
	}()
	log.Printf("%s listening on %s", name, addr)
	return srv
}

// serveHTTP listens before returning, so a port that is taken fails the
// process at once rather than after the servers around it have started.
func serveHTTP(name, addr string, h http.Handler) {
	ln, err := net.Listen("tcp", addr)
	if err != nil {
		log.Fatalf("%s: %v", name, err)
	}
	srv := &http.Server{Handler: h, ReadHeaderTimeout: 10 * time.Second}
	go func() {
		if err := srv.Serve(ln); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("%s: %v", name, err)
		}
	}()
	log.Printf("%s listening on %s", name, addr)
}
