package provider

import (
	"io"
	"testing"

	"github.com/emersion/go-message"
)

func TestDecodePartSeparatesCharsetAndTransferFailures(t *testing.T) {
	for _, tc := range []struct {
		name, charset, encoding, raw, want string
		unknownCharset, unknownEncoding    bool
	}{
		{name: "known text", charset: "utf-8", encoding: "base64", raw: "Y2Fmw6k=", want: "café"},
		{name: "unknown charset, valid transfer", charset: "x-unknown", encoding: "quoted-printable", raw: "caf=E9", want: "caf\xe9", unknownCharset: true},
		{name: "both unknown", charset: "x-unknown", encoding: "x-unknown", raw: "stored", unknownEncoding: true},
		{name: "unknown transfer, known charset", charset: "utf-8", encoding: "x-unknown", raw: "stored", unknownEncoding: true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			var header message.Header
			header.SetContentType("text/plain", map[string]string{"charset": tc.charset, "format": "flowed"})
			header.Set("Content-Transfer-Encoding", tc.encoding)
			original := header.Get("Content-Type")
			part, err := DecodePart(header, []byte(tc.raw))
			if message.IsUnknownCharset(err) != tc.unknownCharset || message.IsUnknownEncoding(err) != tc.unknownEncoding {
				t.Fatalf("decode error %v, want charset=%v transfer=%v", err, tc.unknownCharset, tc.unknownEncoding)
			}
			if header.Get("Content-Type") != original {
				t.Fatal("validation changed the original header")
			}
			if tc.unknownEncoding {
				return
			}
			if err != nil && !tc.unknownCharset {
				t.Fatal(err)
			}
			data, err := io.ReadAll(part.Body)
			if err != nil || string(data) != tc.want {
				t.Fatalf("decoded %q (%v), want %q", data, err, tc.want)
			}
		})
	}
}
