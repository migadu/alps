package imap

import (
	"bufio"
	"bytes"
	"fmt"
	"io"
	"mime"
	"net"
	"os"
	"regexp"
	"strings"
	"syscall"
	"time"

	"github.com/emersion/go-imap/v2/imapclient"
	"github.com/emersion/go-message/charset"
)

// sanitizingWriter wraps an io.Writer and redacts sensitive information from IMAP debug logs
type sanitizingWriter struct {
	w io.Writer
	// Pre-compiled regex patterns for credential redaction
	loginPattern *regexp.Regexp
	authPattern  *regexp.Regexp
}

func newSanitizingWriter(w io.Writer) *sanitizingWriter {
	return &sanitizingWriter{
		w: w,
		// Match LOGIN commands: C: <tag> LOGIN username "password" or LOGIN username password
		loginPattern: regexp.MustCompile(`(?i)(LOGIN\s+\S+\s+)("?[^"\s]+"?|{[0-9]+})`),
		// Match AUTHENTICATE PLAIN: base64-encoded credentials
		authPattern: regexp.MustCompile(`(?i)(AUTHENTICATE\s+PLAIN\s+)([A-Za-z0-9+/=]+)`),
	}
}

func (sw *sanitizingWriter) Write(p []byte) (n int, err error) {
	// Process line by line to avoid splitting credentials across buffer boundaries
	scanner := bufio.NewScanner(bytes.NewReader(p))
	var sanitized bytes.Buffer

	for scanner.Scan() {
		line := scanner.Text()

		// Redact LOGIN password (keep username visible for debugging)
		line = sw.loginPattern.ReplaceAllString(line, `${1}[REDACTED]`)

		// Redact AUTHENTICATE PLAIN credentials
		line = sw.authPattern.ReplaceAllString(line, `${1}[REDACTED]`)

		// Also redact literal string passwords (IMAP literals: {length}\r\ndata)
		// If we see a LOGIN command followed by a literal, mark it for redaction
		if strings.Contains(strings.ToUpper(line), "LOGIN") && strings.Contains(line, "{") {
			line = regexp.MustCompile(`\{[0-9]+\}`).ReplaceAllString(line, `{REDACTED}`)
		}

		sanitized.WriteString(line)
		sanitized.WriteString("\n")
	}

	if err := scanner.Err(); err != nil {
		// If scanning failed, write original data to avoid losing debug info
		return sw.w.Write(p)
	}

	// Write sanitized output
	_, err = sw.w.Write(sanitized.Bytes())
	return len(p), err // Return original length to satisfy io.Writer contract
}

// TargetGuard inspects the address a dial actually resolved to. Returning an
// error aborts the connection.
//
// It runs from net.Dialer.Control, after resolution and before connect, so it
// sees the IP the kernel is about to reach. Validating a hostname beforehand
// cannot do that: the dial resolves again and a low-TTL record can answer
// differently the second time (DNS rebinding).
type TargetGuard func(net.IP) error

func controlFor(guard TargetGuard) func(network, address string, c syscall.RawConn) error {
	if guard == nil {
		return nil
	}
	return func(network, address string, c syscall.RawConn) error {
		host, _, err := net.SplitHostPort(address)
		if err != nil {
			return fmt.Errorf("cannot parse dial address %q: %w", address, err)
		}
		ip := net.ParseIP(host)
		if ip == nil {
			return fmt.Errorf("dial address %q is not an IP", host)
		}
		return guard(ip)
	}
}

func Connect(host string, tls bool, insecure bool, timeout time.Duration, debug bool, guard TargetGuard) (*imapclient.Client, error) {
	var debugWriter io.Writer
	if debug {
		// Wrap os.Stderr with sanitizing writer to redact credentials
		debugWriter = newSanitizingWriter(os.Stderr)
	}

	// Configure timeout for IMAP operations
	if timeout == 0 {
		timeout = 30 * time.Second // Default to 30s
	}

	dialer := &net.Dialer{
		Timeout: timeout,
		Control: controlFor(guard),
	}

	options := &imapclient.Options{
		DebugWriter: debugWriter,
		WordDecoder: &mime.WordDecoder{
			CharsetReader: charset.Reader,
		},
		Dialer: dialer,
	}

	var c *imapclient.Client
	var err error
	if tls {
		c, err = imapclient.DialTLS(host, options)
		if err != nil {
			return nil, fmt.Errorf("failed to connect to IMAPS server: %v", err)
		}
	} else if !insecure {
		c, err = imapclient.DialStartTLS(host, options)
		if err != nil {
			return nil, fmt.Errorf("failed to connect to IMAP server: %v", err)
		}
	} else {
		// Dial through the same dialer so the guard still applies.
		conn, err := dialer.Dial("tcp", host)
		if err != nil {
			return nil, fmt.Errorf("failed to connect to IMAP server: %v", err)
		}
		c = imapclient.New(conn, options)
	}

	return c, err
}
