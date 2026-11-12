// Package serviceurl parses configured service endpoints without network access.
package serviceurl

import (
	"fmt"
	"net"
	"net/url"
	"strings"
)

// ParseServer accepts bare hosts for services with startup discovery.
func ParseServer(str string) (*url.URL, error) {
	if !strings.ContainsAny(str, ":/") {
		// This is a raw domain name, make it an URL with an empty scheme
		str = "//" + str
	}
	return url.Parse(str)
}

// ParseSMTP returns the submission address and transport flags.
func ParseSMTP(raw string, insecureOpt bool) (host string, tls bool, insecure bool, err error) {
	if !strings.Contains(raw, "://") {
		return "", false, false, fmt.Errorf("SMTP server requires a scheme (smtps://, smtp://, smtp+insecure://), got: %v", raw)
	}
	u, err := ParseServer(raw)
	if err != nil {
		return "", false, false, fmt.Errorf("failed to parse SMTP server: %v", err)
	}

	if u.Scheme == "" {
		return "", false, false, fmt.Errorf("SMTP server requires a scheme (smtps://, smtp://, smtp+insecure://), got: %v", u.String())
	}

	switch u.Scheme {
	case "smtps":
		tls = true
	case "smtp+insecure":
		insecure = true
	case "smtp":
	default:
		return "", false, false, fmt.Errorf("unknown scheme for SMTP server: %v", u.Scheme)
	}

	if insecureOpt {
		insecure = true
	}

	hostname := u.Hostname()
	if hostname == "" {
		return "", false, false, fmt.Errorf("SMTP server host cannot be empty")
	}
	port := u.Port()
	if port == "" {
		if u.Scheme == "smtps" {
			port = "465"
		} else {
			port = "587"
		}
	}
	host = net.JoinHostPort(hostname, port)

	return host, tls, insecure, nil
}

// ParseCalDAV requires a complete routed CalDAV endpoint.
func ParseCalDAV(raw string) (*url.URL, error) {
	u, err := ParseCalDAVServer(raw)
	if err != nil {
		return nil, err
	}
	if u.Scheme == "" {
		return nil, fmt.Errorf("CalDAV server requires a scheme (https://, http+insecure://), got: %v", u.String())
	}
	return u, nil
}

// ParseCalDAVServer also accepts a bare host for startup discovery.
func ParseCalDAVServer(raw string) (*url.URL, error) {
	u, err := ParseServer(raw)
	if err != nil {
		return nil, fmt.Errorf("failed to parse CalDAV server: %v", err)
	}
	switch u.Scheme {
	case "https", "http", "":
	case "caldavs":
		u.Scheme = "https"
	case "caldav+insecure", "http+insecure":
		u.Scheme = "http"
	default:
		return nil, fmt.Errorf("unknown scheme for CalDAV server: %q (use https://, caldavs://, http+insecure:// or caldav+insecure://)", u.Scheme)
	}
	if u.Hostname() == "" || u.Opaque != "" {
		return nil, fmt.Errorf("CalDAV server requires a host in an HTTP(S) URL (https://, caldavs://, http+insecure:// or caldav+insecure://), got: %v", u)
	}
	if u.Scheme == "" && (u.Path != "" || u.RawQuery != "" || u.Fragment != "" || u.Port() != "" || u.User != nil) {
		return nil, fmt.Errorf("CalDAV discovery requires a bare host without a port, path or query, got: %v", u)
	}
	return u, nil
}

// ParseCardDAV requires a complete CardDAV endpoint.
func ParseCardDAV(raw string) (*url.URL, error) {
	u, err := ParseServer(raw)
	if err != nil {
		return nil, fmt.Errorf("failed to parse CardDAV server: %v", err)
	}

	// A value such as host:port parses with the host as its scheme. Any
	// scheme but these stops here instead of failing every request.
	switch u.Scheme {
	case "https", "http":
	case "carddavs":
		u.Scheme = "https"
	case "carddav+insecure", "http+insecure":
		u.Scheme = "http"
	case "":
		return nil, fmt.Errorf("CardDAV server requires a scheme (https://, http+insecure://), got: %v", u.String())
	default:
		return nil, fmt.Errorf("unknown scheme for CardDAV server: %q (use https://, carddavs://, http+insecure:// or carddav+insecure://)", u.Scheme)
	}
	if u.Hostname() == "" || u.Opaque != "" {
		return nil, fmt.Errorf("CardDAV server requires a host in an HTTP(S) URL (https://, carddavs://, http+insecure:// or carddav+insecure://), got: %v", u)
	}
	return u, nil
}

// ParseSieve returns the ManageSieve endpoint and its cleartext opt-in.
func ParseSieve(raw string) (*url.URL, bool, error) {
	u, err := ParseServer(raw)
	if err != nil {
		return nil, false, fmt.Errorf("failed to parse ManageSieve server: %v", err)
	}
	insecure := false
	switch u.Scheme {
	case "managesieves", "managesieve", "sieve", "":
	case "managesieve+insecure", "sieve+insecure":
		insecure = true
	default:
		return nil, false, fmt.Errorf("unknown scheme for ManageSieve server: %q (use managesieves://, managesieve://, or managesieve+insecure://)", u.Scheme)
	}
	if u.Hostname() == "" || u.Opaque != "" {
		return nil, false, fmt.Errorf("ManageSieve server requires a host, got: %v", u)
	}
	return u, insecure, nil
}

// Validate checks a routed endpoint with the same parser as its runtime client.
func Validate(service, raw string) error {
	var err error
	switch service {
	case "smtp":
		_, _, _, err = ParseSMTP(raw, false)
	case "caldav":
		_, err = ParseCalDAV(raw)
	case "carddav":
		_, err = ParseCardDAV(raw)
	case "managesieve":
		_, _, err = ParseSieve(raw)
	default:
		return fmt.Errorf("unknown service %q", service)
	}
	return err
}
