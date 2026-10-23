package provider

import (
	"io"
	"strings"
	"testing"

	"github.com/emersion/go-message"
	"github.com/emersion/go-message/textproto"
)

func TestNewPartEntityReportsAnUnknownEncodingBesideAnUnknownCharset(t *testing.T) {
	part := func(fields ...string) message.Header {
		var h textproto.Header
		for i := 0; i+1 < len(fields); i += 2 {
			h.Set(fields[i], fields[i+1])
		}
		return message.Header{Header: h}
	}
	for _, tc := range []struct {
		name     string
		header   message.Header
		charset  bool // the error is an unknown charset's
		encoding bool // the error is an unknown transfer encoding's
		body     string
	}{
		{"known", part("Content-Type", "text/plain; charset=utf-8", "Content-Transfer-Encoding", "quoted-printable"), false, false, "caf\xc3\xa9"},
		{"unknown charset", part("Content-Type", "text/plain; charset=x-unknown-charset", "Content-Transfer-Encoding", "quoted-printable"), true, false, "caf\xc3\xa9"},
		{"unknown encoding", part("Content-Type", "text/plain; charset=utf-8", "Content-Transfer-Encoding", "x-unknown"), false, true, ""},
		{"both unknown", part("Content-Type", "text/plain; charset=x-unknown-charset", "Content-Transfer-Encoding", "x-unknown"), false, true, ""},
	} {
		t.Run(tc.name, func(t *testing.T) {
			entity, err := NewPartEntity(tc.header, strings.NewReader("caf=C3=A9"))
			if got := message.IsUnknownCharset(err); got != tc.charset {
				t.Errorf("unknown charset reported: %v, want %v (%v)", got, tc.charset, err)
			}
			if got := message.IsUnknownEncoding(err); got != tc.encoding {
				t.Errorf("unknown encoding reported: %v, want %v (%v)", got, tc.encoding, err)
			}
			if tc.body != "" {
				if data, _ := io.ReadAll(entity.Body); string(data) != tc.body {
					t.Errorf("body %q, want %q", data, tc.body)
				}
			}
		})
	}
}
