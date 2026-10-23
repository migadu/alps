package imap

import (
	"regexp"
	"testing"

	"github.com/migadu/alps/provider"
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

// bodyStructures matches a server response carrying a message's structure.
var bodyStructures = regexp.MustCompile(`(?m)^\* \d+ FETCH \([^\r\n]*BODYSTRUCTURE`)

// A page of a threaded listing fetches the structure of its rows' messages
// alone. The other messages of each conversation are listed with their flags
// and envelope, which is what the list shows of them; what needs a member's
// structure reads it when it is needed. Every member was fetched with its
// structure, and a page of a few long conversations fetched hundreds.
func TestAThreadedPageFetchesTheStructureOfItsRowsAlone(t *testing.T) {
	s := threadingServer()
	p := threadedInbox(t, s)

	before := len(s.traffic.String())
	rows, _, err := p.ListMessages("INBOX", "desc", 0, 3)
	if err != nil || len(rows) != 3 {
		t.Fatalf("%d rows, %v", len(rows), err)
	}
	if n := len(bodyStructures.FindAllString(s.traffic.String()[before:], -1)); n != 3 {
		t.Errorf("%d messages fetched with their structure for three rows, want 3", n)
	}
	var engines *provider.Message
	for i := range rows {
		if rows[i].Envelope.Subject == "Re: Engines" {
			engines = &rows[i]
		}
	}
	if engines == nil || engines.BodyStructure == nil || len(engines.SubMessages) != 1 {
		t.Fatalf("the conversation's row is %+v", engines)
	}
	member := engines.SubMessages[0]
	if member.Envelope == nil || member.Envelope.Subject != "Engines" || member.BodyStructure != nil {
		t.Errorf("the conversation's older message is listed as %+v, want its envelope and no structure", member)
	}
}
