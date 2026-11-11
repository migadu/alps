package imap

import (
	"regexp"
	"strings"
	"testing"

	"github.com/migadu/alps/provider"
	"github.com/migadu/go-imap"
)

var (
	// lazyPreviewAsks matches a FETCH asking PREVIEW (LAZY), nonLazyPreviewAsks
	// one asking PREVIEW alone.
	lazyPreviewAsks    = regexp.MustCompile(`(?i)FETCH [^\r\n]*PREVIEW \(LAZY\)`)
	nonLazyPreviewAsks = regexp.MustCompile(`(?i)FETCH [^\r\n]*PREVIEW\)`)
)

func previewServers(caps imap.CapSet, notToHand bool) []struct {
	name   string
	server *memServer
	rows   int
} {
	threaded := imap.CapSet{imap.Cap("THREAD=REFERENCES"): {}}
	for c := range caps {
		threaded[c] = struct{}{}
	}
	return []struct {
		name   string
		server *memServer
		rows   int
	}{
		{"flat", &memServer{caps: caps, previewsNotToHand: notToHand}, 3},
		{"threaded", &memServer{caps: threaded, previewsNotToHand: notToHand, threads: []imap.ThreadData{{Chain: []uint32{1, 2}}, {Chain: []uint32{3}}}}, 2},
	}
}

func previewMessages() []string {
	return []string{
		"From: a@example.test\r\nSubject: one\r\n\r\nFirst message\r\n",
		"From: b@example.test\r\nSubject: Re: one\r\n\r\nSecond message\r\n",
		"From: c@example.test\r\nSubject: three\r\n\r\nThird message\r\n",
	}
}

// Listings ask PREVIEW (LAZY) of a server that offers it, flat and threaded,
// and carry the text it answers.
func TestListingsAskForLazyPreviews(t *testing.T) {
	for _, srv := range previewServers(imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapPreview: {}}, false) {
		t.Run(srv.name, func(t *testing.T) {
			p := memIMAP(t, srv.server, previewMessages()...)
			for _, l := range []struct {
				how  string
				list func() ([]provider.Message, provider.PageInfo, error)
			}{
				{"listed", func() ([]provider.Message, provider.PageInfo, error) { return p.ListMessages("INBOX", "", 0, 50) }},
				{"searched", func() ([]provider.Message, provider.PageInfo, error) { return p.SearchMessages("INBOX", "", "", 0, 50) }},
			} {
				before := len(srv.server.traffic.String())
				rows, _, err := l.list()
				if err != nil {
					t.Fatalf("%s: %v", l.how, err)
				}
				if len(rows) != srv.rows {
					t.Fatalf("%s: %d rows, want %d", l.how, len(rows), srv.rows)
				}
				for _, r := range rows {
					if !strings.HasSuffix(r.Preview, "message") || r.PreviewPending {
						t.Errorf("%s: row %s has preview %q (pending %v), want its text", l.how, r.ID, r.Preview, r.PreviewPending)
					}
				}
				if traffic := srv.server.traffic.String()[before:]; !lazyPreviewAsks.MatchString(traffic) {
					t.Errorf("%s: no FETCH asked PREVIEW (LAZY):\n%s", l.how, traffic)
				}
			}
		})
	}
}

// A server that does not offer PREVIEW is never asked for it, and its listings
// carry no previews and nothing pending.
func TestListingsAskNoPreviewsOfAServerWithout(t *testing.T) {
	for _, srv := range previewServers(imap.CapSet{imap.CapIMAP4rev1: {}}, false) {
		t.Run(srv.name, func(t *testing.T) {
			p := memIMAP(t, srv.server, previewMessages()...)
			rows, _, err := p.ListMessages("INBOX", "", 0, 50)
			if err != nil {
				t.Fatal(err)
			}
			for _, r := range rows {
				if r.Preview != "" || r.PreviewPending {
					t.Errorf("row %s has preview %q (pending %v), want none", r.ID, r.Preview, r.PreviewPending)
				}
			}
			if traffic := srv.server.traffic.String(); strings.Contains(strings.ToUpper(traffic), "PREVIEW") {
				t.Errorf("PREVIEW asked of a server that does not offer it:\n%s", traffic)
			}
			if _, _, supported, err := p.Previews("INBOX", []provider.MessageID{IMAPUID(1)}); err != nil || supported {
				t.Errorf("Previews() supported = %v, err = %v; want unsupported", supported, err)
			}
		})
	}
}

// A message the server has no preview to hand for is pending. Previews then
// asks for it without LAZY, once: the session keeps it, and the next listing
// carries it.
func TestPendingPreviewsAreAskedForOnce(t *testing.T) {
	srv := &memServer{caps: imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapPreview: {}}, previewsNotToHand: true}
	p := memIMAP(t, srv, previewMessages()...)

	rows, _, err := p.ListMessages("INBOX", "", 0, 50)
	if err != nil {
		t.Fatal(err)
	}
	var ids []provider.MessageID
	for _, r := range rows {
		if !r.PreviewPending || r.Preview != "" {
			t.Errorf("row %s: preview %q, pending %v; want pending", r.ID, r.Preview, r.PreviewPending)
		}
		ids = append(ids, r.ID)
	}

	before := len(srv.traffic.String())
	previews, scope, supported, err := p.Previews("INBOX", ids)
	if err != nil || !supported || scope == "" {
		t.Fatalf("Previews() = scope %q, supported %v, err %v", scope, supported, err)
	}
	if len(previews) != 3 || previews["1"] != "First message" {
		t.Errorf("Previews() = %v, want the three texts", previews)
	}
	if traffic := srv.traffic.String()[before:]; !nonLazyPreviewAsks.MatchString(traffic) {
		t.Errorf("Previews() did not ask PREVIEW without LAZY:\n%s", traffic)
	}

	before = len(srv.traffic.String())
	if again, _, _, err := p.Previews("INBOX", ids); err != nil || len(again) != 3 {
		t.Errorf("second Previews() = %v, %v", again, err)
	}
	if traffic := srv.traffic.String()[before:]; strings.Contains(traffic, "PREVIEW") {
		t.Errorf("the second Previews() asked the server again:\n%s", traffic)
	}

	rows, _, err = p.ListMessages("INBOX", "", 0, 50)
	if err != nil {
		t.Fatal(err)
	}
	for _, r := range rows {
		if r.PreviewPending || !strings.HasSuffix(r.Preview, "message") {
			t.Errorf("relisted row %s: preview %q, pending %v; want the kept text", r.ID, r.Preview, r.PreviewPending)
		}
	}
}

// Previews kept on one connection answer on another the session shares its
// cache with.
func TestPreviewsAreSharedAcrossConnections(t *testing.T) {
	srv := &memServer{caps: imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapPreview: {}}, previewsNotToHand: true}
	first := memIMAP(t, srv, previewMessages()...)
	second := memIMAP(t, &memServer{caps: srv.caps, previewsNotToHand: true}, previewMessages()...)
	var shared provider.PreviewCache
	first.SharePreviews(&shared)
	second.SharePreviews(&shared)

	if _, _, _, err := first.Previews("INBOX", []provider.MessageID{IMAPUID(1)}); err != nil {
		t.Fatal(err)
	}
	rows, _, err := second.ListMessages("INBOX", "", 0, 50)
	if err != nil {
		t.Fatal(err)
	}
	for _, r := range rows {
		if r.ID.String() == "1" && (r.PreviewPending || r.Preview != "First message") {
			t.Errorf("row 1 on the second connection: preview %q, pending %v", r.Preview, r.PreviewPending)
		}
	}
}
