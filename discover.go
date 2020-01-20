package koushin

import (
	"fmt"
	"net"
	"net/url"
	"strings"
)

func discoverTCP(service, name string) (string, error) {
	_, addrs, err := net.LookupSRV(service, "tcp", name)
	if dnsErr, ok := err.(*net.DNSError); ok {
		if dnsErr.IsTemporary {
			return "", err
		}
	} else if err != nil {
		return "", err
	}

	if len(addrs) == 0 {
		return "", nil
	}
	addr := addrs[0]

	target := strings.TrimSuffix(addr.Target, ".")
	if target == "" {
		return "", nil
	}

	return fmt.Sprintf("%v:%v", target, addr.Port), nil
}

// discoverIMAP performs a DNS-based IMAP service discovery, as defined in
// RFC 6186 section 3.2.
func discoverIMAP(domain string) (*url.URL, error) {
	imapsHost, err := discoverTCP("imaps", domain)
	if err != nil {
		return nil, err
	}
	if imapsHost != "" {
		return &url.URL{Scheme: "imaps", Host: imapsHost}, nil
	}

	imapHost, err := discoverTCP("imap", domain)
	if err != nil {
		return nil, err
	}
	if imapHost != "" {
		return &url.URL{Scheme: "imap", Host: imapHost}, nil
	}

	return nil, fmt.Errorf("IMAP service discovery not configured for domain %q", domain)
}

// discoverSMTP performs a DNS-based SMTP submission service discovery, as
// defined in RFC 6186 section 3.1.
func discoverSMTP(domain string) (*url.URL, error) {
	host, err := discoverTCP("submission", domain)
	if err != nil {
		return nil, err
	}
	if host == "" {
		return nil, fmt.Errorf("SMTP service discovery not configured for domain %q", domain)
	}
	return &url.URL{Scheme: "smtp", Host: host}, nil
}
