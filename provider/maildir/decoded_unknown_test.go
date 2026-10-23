package maildir

import "testing"

// An unknown charset must not hide a separate unknown transfer encoding.
// Such a part has bytes for raw fallback, but no decoded content to carry.
func TestUnknownCharsetDoesNotHideUnknownTransferEncoding(t *testing.T) {
	p := NewProvider(t.TempDir(), "ada@example.com")
	raw := "From: sender@example.com\r\nSubject: Both unknown\r\nContent-Type: text/plain; charset=x-unknown-charset\r\nContent-Transfer-Encoding: x-unknown\r\n\r\nstill-encoded"
	id := appendOne(t, p, raw)
	if _, _, err := p.GetMessagePart("INBOX", id, []int{1}); err == nil {
		t.Error("decoded part accepted a transfer encoding it cannot undo")
	}
	if _, _, _, _, err := p.GetMessagePartWithData("INBOX", id, []int{1}); err == nil {
		t.Error("decoded part with data accepted a transfer encoding it cannot undo")
	}
	_, _, body, err := p.GetMessagePartRaw("INBOX", id, []int{1}, 0)
	if err != nil || string(body) != "still-encoded" {
		t.Errorf("raw fallback lost stored bytes: %q %v", body, err)
	}
}
