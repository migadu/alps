package alpsbase

import (
	"encoding/json"
	"net/http"
	"sync"
	"testing"
)

// activeList is the folder list as an answer carries it, with the folder the
// answer is for marked active.
type activeList struct {
	Mailboxes []struct {
		Mailbox string
		Active  bool
	}
}

func (l activeList) active() []string {
	var names []string
	for _, m := range l.Mailboxes {
		if m.Active {
			names = append(names, m.Mailbox)
		}
	}
	return names
}

// A listing marks the folder it is for active in its answer, and in no other.
// It marked it in the folder list the session holds, so the answer read from
// that list next, the folder list's own route here, still had the folder
// opened before marked active.
func TestHTTP_TheFolderOpenedIsActiveInItsOwnAnswerAlone(t *testing.T) {
	s := newTestServer(t)
	s.login()
	s.expect(s.do("GET", "/mailboxes/Archive?page=0", nil), http.StatusOK)

	r := s.do("GET", "/mailboxes", nil)
	s.expect(r, http.StatusOK)
	var list activeList
	r.json(t, &list)
	if got := list.active(); len(got) != 0 {
		t.Errorf("the folder list answers %v as active, the folder an earlier listing opened", got)
	}
}

// Two tabs list folders of one session at once, each with its own folder
// active. They wrote the same list the session holds, a data race the race
// detector reports, and an answer could carry the other tab's folder active.
func TestHTTP_ListingsOfOneSessionAtOnceAnswerEachTheirOwn(t *testing.T) {
	s := newTestServer(t)
	s.login()
	s.expect(s.do("GET", "/mailboxes/INBOX?page=0", nil), http.StatusOK)

	var wg sync.WaitGroup
	for _, mailbox := range []string{"INBOX", "Archive", "Trash"} {
		wg.Add(1)
		go func(mailbox string) {
			defer wg.Done()
			for i := 0; i < 20; i++ {
				r := s.do("GET", "/mailboxes/"+mailbox+"?page=0", nil)
				if r.status != http.StatusOK {
					t.Errorf("listing %s answered %d: %s", mailbox, r.status, r.body)
					return
				}
				var list activeList
				if err := json.Unmarshal(r.body, &list); err != nil {
					t.Errorf("listing %s: %v", mailbox, err)
					return
				}
				if got := list.active(); len(got) != 1 || got[0] != mailbox {
					t.Errorf("the listing of %s answers %v as active", mailbox, got)
					return
				}
			}
		}(mailbox)
	}
	wg.Wait()
}
