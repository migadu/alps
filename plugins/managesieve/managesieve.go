package alpsmanagesieve

import (
	"crypto/tls"
	"fmt"
	"net"
	"net/url"
	"strings"

	"git.sr.ht/~migadu/alps"
	"github.com/emersion/go-sasl"
	"go.guido-berhoerster.org/managesieve"
)

type plainAuth struct {
	auth sasl.Client
}

func (a *plainAuth) Start(server *managesieve.ServerInfo) (mech string, ir []byte, err error) {
	mech, ir, err = a.auth.Start()
	if mech != sasl.Plain {
		err = fmt.Errorf("expected PLAIN authentication mechanism")
	}
	return
}

func (a *plainAuth) Next(challenge []byte, more bool) (response []byte, err error) {
	return a.auth.Next(challenge)
}

func (a *plainAuth) SASLSecurityLayer() bool {
	return false
}

func newPlainAuth(auth sasl.Client) managesieve.Auth {
	return &plainAuth{auth: auth}
}

type client struct {
	*managesieve.Client
}

func (c *client) Auth(a sasl.Client) error {
	return c.Authenticate(newPlainAuth(a))
}

func dial(addr string) (*client, error) {
	msc, err := managesieve.Dial(addr)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to ManageSieve server: %v", err)
	}

	c := &client{Client: msc}

	serverName, _, _ := net.SplitHostPort(addr)
	config := &tls.Config{ServerName: serverName}
	if err := c.StartTLS(config); err != nil {
		c.Logout()
		return nil, fmt.Errorf("STARTTLS failed: %v", err)
	}

	return c, nil
}

func connect(addr string, session *alps.Session) (*client, error) {
	c, err := dial(addr)
	if err != nil {
		return nil, err
	}

	if err := session.PlainAuth(c); err != nil {
		c.Logout()
		return nil, fmt.Errorf("AUTHENTICATE failed: %v", err)
	}

	return c, nil
}

// discover performs a DNS-based ManageSieve service discovery, as defined in
// RFC 5804 section 1.8
func discover(domain string) (string, error) {
	_, addrs, err := net.LookupSRV("sieve", "tcp", domain)
	if dnsErr, ok := err.(*net.DNSError); ok {
		if dnsErr.IsTemporary {
			return "", err
		}
	} else if err != nil {
		return "", err
	}

	if len(addrs) == 0 {
		return "", fmt.Errorf("domain doesn't have an SRV record")
	}
	addr := addrs[0]

	target := strings.TrimSuffix(addr.Target, ".")
	if target == "" {
		return "", fmt.Errorf("empty target in SRV record")
	}

	u := url.URL{Scheme: "sieve", Host: fmt.Sprintf("%v:%v", target, addr.Port)}
	return u.String(), nil
}
