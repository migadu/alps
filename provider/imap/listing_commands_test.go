package imap

import (
	"testing"
)

// A page of a threaded listing asks the server for news once. ListMessages
// sent a NOOP of its own, and the conversations, kept or threaded again, sent
// another to learn what the mailbox holds: two round trips for one answer.
func TestAThreadedPageAsksForNewsOnce(t *testing.T) {
	for i, l := range listings(nil) {
		t.Run(l.how, func(t *testing.T) {
			s := threadingServer()
			p := threadedInbox(t, s)
			l := listings(p)[i]
			if _, _, err := l.list(0); err != nil {
				t.Fatal(err)
			}

			before := len(s.traffic.String())
			if _, _, err := l.list(1); err != nil {
				t.Fatal(err)
			}
			if n := len(noopCommands.FindAllString(s.traffic.String()[before:], -1)); n != 1 {
				t.Errorf("%d NOOPs for one page, want 1", n)
			}
		})
	}
}
