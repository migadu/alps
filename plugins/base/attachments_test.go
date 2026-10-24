package alpsbase

import (
	"bytes"
	"encoding/base64"
	"strings"
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapclient"
	"github.com/emersion/go-imap/v2/imapserver"
)

// newTestMessage wraps a body structure in an IMAPMessage for exercising the
// TextPart/HTMLPart/Attachments helpers.
func newTestMessage(bs imap.BodyStructure) *IMAPMessage {
	return &IMAPMessage{
		FetchMessageBuffer: &imapclient.FetchMessageBuffer{BodyStructure: bs},
	}
}

func inlineDisposition() *imap.BodyStructureSinglePartExt {
	return &imap.BodyStructureSinglePartExt{
		Disposition: &imap.BodyStructureDisposition{Value: "inline"},
	}
}

// A message forwarded "as an attachment" whose message/rfc822 part is marked
// inline, carries no Content-ID and no filename — the exact shape that used to
// be dropped from Attachments(), leaving the reader completely blank.
func TestAttachmentsIncludesInlineMessageRFC822(t *testing.T) {
	msg := newTestMessage(&imap.BodyStructureMultiPart{
		Subtype: "mixed",
		Children: []imap.BodyStructure{
			// The (empty) forwarding note.
			&imap.BodyStructureSinglePart{Type: "text", Subtype: "plain"},
			// The forwarded message, marked inline with no filename / no ID.
			&imap.BodyStructureSinglePart{
				Type:    "message",
				Subtype: "rfc822",
				MessageRFC822: &imap.BodyStructureMessageRFC822{
					Envelope: &imap.Envelope{Subject: "Quarterly report"},
				},
				Extended: inlineDisposition(),
			},
		},
	})

	atts := msg.Attachments()
	if len(atts) != 1 {
		t.Fatalf("expected the forwarded message to be listed as 1 attachment, got %d", len(atts))
	}
	if atts[0].MIMEType != "message/rfc822" {
		t.Errorf("expected message/rfc822 attachment, got %q", atts[0].MIMEType)
	}
	// The forwarded message has no filename, so the subject is used as a
	// friendly fallback name.
	if atts[0].Filename != "Quarterly report.eml" {
		t.Errorf("expected filename derived from subject, got %q", atts[0].Filename)
	}

	// It must not be mistaken for a renderable text/HTML body.
	if tp := msg.TextPart(); tp == nil {
		t.Error("expected the text/plain note to still be the text part")
	}
}

// An explicit filename on the forwarded part must win over the subject fallback.
func TestAttachmentsMessageRFC822KeepsExplicitFilename(t *testing.T) {
	msg := newTestMessage(&imap.BodyStructureMultiPart{
		Subtype: "mixed",
		Children: []imap.BodyStructure{
			&imap.BodyStructureSinglePart{
				Type:    "message",
				Subtype: "rfc822",
				Params:  map[string]string{"name": "forwarded.eml"},
				MessageRFC822: &imap.BodyStructureMessageRFC822{
					Envelope: &imap.Envelope{Subject: "ignored subject"},
				},
				Extended: inlineDisposition(),
			},
		},
	})

	atts := msg.Attachments()
	if len(atts) != 1 {
		t.Fatalf("expected 1 attachment, got %d", len(atts))
	}
	if atts[0].Filename != "forwarded.eml" {
		t.Errorf("expected explicit filename to be kept, got %q", atts[0].Filename)
	}
}

// A composer carrying a saved draft's parts needs the body's images listed too,
// apart from its files: it replaces what it carries with what the draft holds.
func TestEmbeddedPartsAreTheBodysImages(t *testing.T) {
	attachment := &imap.BodyStructureSinglePartExt{
		Disposition: &imap.BodyStructureDisposition{Value: "attachment", Params: map[string]string{"filename": "ledger.txt"}},
	}
	msg := newTestMessage(&imap.BodyStructureMultiPart{
		Subtype: "mixed",
		Children: []imap.BodyStructure{
			&imap.BodyStructureMultiPart{
				Subtype: "related",
				Children: []imap.BodyStructure{
					&imap.BodyStructureMultiPart{
						Subtype: "alternative",
						Children: []imap.BodyStructure{
							&imap.BodyStructureSinglePart{Type: "text", Subtype: "plain"},
							&imap.BodyStructureSinglePart{Type: "text", Subtype: "html"},
						},
					},
					&imap.BodyStructureSinglePart{Type: "image", Subtype: "png", ID: "<chart@remote.test>", Extended: inlineDisposition()},
				},
			},
			&imap.BodyStructureSinglePart{Type: "text", Subtype: "plain", Extended: attachment},
			// An ID on a part that says it is an attachment makes it a file.
			&imap.BodyStructureSinglePart{Type: "image", Subtype: "gif", ID: "<logo@remote.test>", Extended: attachment},
		},
	})

	images := msg.EmbeddedParts()
	if len(images) != 1 || formatPartPath(images[0].Path) != "1.2" || !images[0].IsInline {
		t.Fatalf("embedded parts = %+v", images)
	}
	var files []string
	for _, a := range msg.Attachments() {
		files = append(files, formatPartPath(a.Path))
	}
	if len(files) != 2 || files[0] != "2" || files[1] != "3" {
		t.Errorf("files = %v", files)
	}
}

// base64Lines encodes data as a MIME body may: base64 in lines of 76
// characters, each ended by CRLF (RFC 2045 §6.8), the last one included.
func base64Lines(data []byte) string {
	encoded := base64.StdEncoding.EncodeToString(data)
	var b strings.Builder
	for len(encoded) > 76 {
		b.WriteString(encoded[:76] + "\r\n")
		encoded = encoded[76:]
	}
	if encoded != "" {
		b.WriteString(encoded + "\r\n")
	}
	return b.String()
}

// sizeAsWritten is the size BODYSTRUCTURE gives a file of n bytes that alps
// attached: the message written as it is sent and saved, and its structure
// read off it as the IMAP server reads it. The last line of base64 ends in no
// CRLF of its own there, as the one before the next boundary belongs to the
// boundary (RFC 2046 §5.1.1).
func sizeAsWritten(t *testing.T, n int) uint32 {
	t.Helper()
	msg := outgoing()
	msg.Attachments = []Attachment{memAttachment{name: "file.bin", mimeType: "application/octet-stream", body: bytes.Repeat([]byte{7}, n)}}
	var buf bytes.Buffer
	if _, err := msg.WriteTo(&buf); err != nil {
		t.Fatal(err)
	}
	mixed, ok := imapserver.ExtractBodyStructure(&buf).(*imap.BodyStructureMultiPart)
	if !ok || len(mixed.Children) != 2 {
		t.Fatalf("%d bytes: unexpected structure %#v", n, mixed)
	}
	part, ok := mixed.Children[1].(*imap.BodyStructureSinglePart)
	if !ok || !strings.EqualFold(part.Encoding, "base64") {
		t.Fatalf("%d bytes: the attachment is not a base64 part: %#v", n, mixed.Children[1])
	}
	return part.Size
}

// BODYSTRUCTURE gives a base64 part's encoded size, line breaks included. The
// size shown for the attachment is the file's: the line breaks are not data,
// and counting them read a 128 KiB file as 131 KiB. Whether the last line
// ends in a CRLF or not, the estimate may only be up to two bytes over, for
// the padding a size alone cannot tell apart.
func TestBase64AttachmentSizeLeavesOutLineBreaks(t *testing.T) {
	sizes := []int{128 * 1024, 1 << 20, 57 * 20}
	for n := 0; n <= 300; n++ {
		sizes = append(sizes, n)
	}
	for _, n := range sizes {
		framings := map[string]uint32{
			"as alps writes it":            sizeAsWritten(t, n),
			"with a CRLF on its last line": uint32(len(base64Lines(make([]byte, n)))),
		}
		for framing, encoded := range framings {
			msg := newTestMessage(&imap.BodyStructureMultiPart{
				Subtype: "mixed",
				Children: []imap.BodyStructure{
					&imap.BodyStructureSinglePart{Type: "text", Subtype: "plain"},
					&imap.BodyStructureSinglePart{
						Type: "application", Subtype: "octet-stream", Encoding: "base64",
						Size:     encoded,
						Extended: &imap.BodyStructureSinglePartExt{Disposition: &imap.BodyStructureDisposition{Value: "attachment", Params: map[string]string{"filename": "file.bin"}}},
					},
				},
			})
			atts := msg.Attachments()
			if len(atts) != 1 {
				t.Fatalf("%d bytes: expected 1 attachment, got %d", n, len(atts))
			}
			if got := int(atts[0].Size); got < n || got > n+2 {
				t.Errorf("a %d-byte file encoded %s in %d octets reads %d bytes (%s)", n, framing, encoded, got, atts[0].SizeString())
			}
		}
	}
}
