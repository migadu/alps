package imap

import (
	"testing"

	"github.com/emersion/go-imap/v2/imapclient"
)

func authResultsFetch(block string) *imapclient.FetchMessageBuffer {
	return &imapclient.FetchMessageBuffer{
		UID:         7,
		BodySection: []imapclient.FetchBodySectionBuffer{{Section: authResultsSection(), Bytes: []byte(block)}},
	}
}

func TestConvertIMAPMessageReadsOnlyTheReceiversVerdict(t *testing.T) {
	cases := []struct {
		name              string
		block             string
		potential, failed bool
	}{
		{"receiver passed", "Authentication-Results: mx.test; spf=pass smtp.mailfrom=brand.test; dkim=pass header.d=brand.test; dmarc=pass header.from=brand.test\r\n\r\n", true, false},
		{"folded", "Authentication-Results: mx.test;\r\n\tspf=pass smtp.mailfrom=brand.test;\r\n\tdmarc=pass (p=reject) header.from=brand.test\r\n\r\n", true, false},
		{"any case", "Authentication-Results: mx.test; DMARC=Pass header.from=brand.test\r\n\r\n", true, false},
		{"bimi pass", "Authentication-Results: mx.test; bimi=pass header.d=brand.test\r\n\r\n", true, false},
		{"pass wins over a failed spf", "Authentication-Results: mx.test; spf=hardfail; dmarc=pass\r\n\r\n", true, false},
		{"receiver failed, forged pass below", "Authentication-Results: mx.test; dmarc=fail header.from=brand.test\r\nAuthentication-Results: brand.test; dmarc=pass header.from=brand.test\r\n\r\n", false, true},
		{"receiver silent, forged pass below", "Authentication-Results: mx.test; none\r\nAuthentication-Results: brand.test; dmarc=pass\r\n\r\n", false, false},
		{"pass only in a comment or a value", "Authentication-Results: mx.test; dmarc=none (wanted dmarc=pass) header.from=dmarc=pass.test\r\n\r\n", false, false},
		{"dkim failed", "Authentication-Results: mx.test; dkim=fail header.d=brand.test; dmarc=none\r\n\r\n", false, true},
		{"no field", "\r\n", false, false},
	}
	p := &IMAPProvider{}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got := p.convertIMAPMessage(authResultsFetch(c.block), "INBOX")
			if got.BimiPotential != c.potential || got.BimiFailed != c.failed {
				t.Fatalf("potential=%v failed=%v, want potential=%v failed=%v", got.BimiPotential, got.BimiFailed, c.potential, c.failed)
			}
		})
	}

	got := p.convertIMAPMessage(&imapclient.FetchMessageBuffer{UID: 7}, "INBOX")
	if got.BimiPotential || got.BimiFailed {
		t.Fatalf("a fetch without the section: potential=%v failed=%v", got.BimiPotential, got.BimiFailed)
	}
}
