package imap

import "testing"

func TestAllFolderSearchRefusesAnInboxOnlyServer(t *testing.T) {
	p := memIMAP(t, &memServer{}, "Subject: invoice\r\n\r\nbody\r\n")
	messages, _, err := p.SearchMessages("*", "invoice", "desc", 0, 50)
	if err == nil {
		t.Fatalf("all-folder search silently returned %d INBOX messages", len(messages))
	}
}
