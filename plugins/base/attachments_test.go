package alpsbase

import (
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapclient"
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
