package alpsbase

import "testing"

// Removal is not creation, so a keyword another client or a spam filter left
// behind must be removable even though this server would never mint one.
func TestIsValidIMAPKeyword(t *testing.T) {
	valid := []string{"Junk", "NotJunk", "$Phishing", "$label1", "$MDNSent", "a"}
	for _, k := range valid {
		if !isValidIMAPKeyword(k) {
			t.Errorf("%q should be a valid keyword", k)
		}
	}

	// Atom-specials and control characters would travel into a STORE command,
	// so they are refused rather than escaped.
	invalid := []string{"", "with space", "paren(", "brace{", "pct%", "star*", `quote"`, `back\slash`, "bracket]", "tab\there", "hi\x00"}
	for _, k := range invalid {
		if isValidIMAPKeyword(k) {
			t.Errorf("%q should be refused", k)
		}
	}

	long := make([]byte, 256)
	for i := range long {
		long[i] = 'a'
	}
	if isValidIMAPKeyword(string(long)) {
		t.Error("an over-long keyword should be refused")
	}
}

// The hierarchy delimiter is per-mailbox in IMAP, so the child test asks only
// that SOMETHING non-alphanumeric follows the prefix — enough to admit every
// delimiter a server might report while still refusing `Trashcan` under `Trash`.
func TestIsAtOrUnderMailbox(t *testing.T) {
	under := [][2]string{
		{"Trash", "Trash"},
		{"trash", "Trash"}, // IMAP names are compared case-insensitively here
		{"Trash/Old", "Trash"},
		{"Trash.Old", "Trash"},
		{"[Gmail]/Trash/Old", "[Gmail]/Trash"},
	}
	for _, c := range under {
		if !isAtOrUnderMailbox(c[0], c[1]) {
			t.Errorf("%q should be at or under %q", c[0], c[1])
		}
	}

	notUnder := [][2]string{
		{"Trashcan", "Trash"},
		{"Trash notes", "Trashy"},
		{"Archive", "Trash"},
		{"Tra", "Trash"},
		{"", "Trash"},
		{"Trash", ""},
	}
	for _, c := range notUnder {
		if isAtOrUnderMailbox(c[0], c[1]) {
			t.Errorf("%q should NOT be at or under %q", c[0], c[1])
		}
	}
}
