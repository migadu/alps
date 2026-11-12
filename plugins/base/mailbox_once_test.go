package alpsbase

import (
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
	"io"
	"net/url"
	"sync/atomic"
	"testing"
)

type mailboxLostReply struct {
	provider.MailProvider
	operation string
	armed     *atomic.Bool
	calls     *atomic.Int32
}

func (p mailboxLostReply) result(op string, run func() error) error {
	if p.armed.Load() && p.operation == op {
		p.calls.Add(1)
		if err := run(); err != nil {
			return err
		}
		return io.EOF
	}
	return run()
}
func (p mailboxLostReply) CreateMailbox(name string) error {
	return p.result("create", func() error { return p.MailProvider.CreateMailbox(name) })
}
func (p mailboxLostReply) DeleteMailbox(name string) error {
	return p.result("delete", func() error { return p.MailProvider.DeleteMailbox(name) })
}
func (p mailboxLostReply) RenameMailbox(old, name string) error {
	return p.result("rename", func() error { return p.MailProvider.RenameMailbox(old, name) })
}
func (p mailboxLostReply) EmptyMailbox(name string) (int, error) {
	var count int
	err := p.result("empty", func() error { var err error; count, err = p.MailProvider.EmptyMailbox(name); return err })
	return count, err
}

func TestHTTP_MailboxMutationsDoNotReplayLostReplies(t *testing.T) {
	for _, op := range []string{"create", "delete", "rename", "empty"} {
		t.Run(op, func(t *testing.T) {
			var armed atomic.Bool
			var calls atomic.Int32
			s := newTestServerWrapping(t, "smtp://127.0.0.1:1", alps.NewLogger(), func(p provider.MailProvider) provider.MailProvider { return mailboxLostReply{p, op, &armed, &calls} })
			s.login()
			if op == "delete" || op == "rename" {
				if err := s.store.CreateMailbox("Work"); err != nil {
					t.Fatal(err)
				}
			}
			if op == "empty" {
				if _, _, _, err := s.store.AppendMessage("Trash", rawMessage("From: a@example.test\r\nSubject: discard\r\n\r\nbody"), 0); err != nil {
					t.Fatal(err)
				}
			}
			s.expect(s.do("GET", "/mailboxes", nil), 200)
			armed.Store(true)
			switch op {
			case "create":
				s.do("POST", "/mailboxes", url.Values{"name": {"Work"}})
			case "delete":
				s.do("DELETE", "/mailboxes/Work", nil)
			case "rename":
				s.do("PUT", "/mailboxes/Work/rename", map[string]string{"new_name": "Jobs"})
			case "empty":
				s.do("POST", "/mailboxes/Trash/empty", nil)
			}
			if calls.Load() != 1 {
				t.Errorf("%s committed before a lost reply but ran %d times", op, calls.Load())
			}
			boxes, err := s.store.ListMailboxes()
			if err != nil {
				t.Fatal(err)
			}
			exists := func(name string) bool {
				for _, b := range boxes {
					if b.Name == name {
						return true
					}
				}
				return false
			}
			if op == "create" && !exists("Work") || op == "delete" && exists("Work") || op == "rename" && (!exists("Jobs") || exists("Work")) {
				t.Errorf("%s did not commit first operation: %+v", op, boxes)
			}
			r := s.do("GET", "/mailboxes", nil)
			s.expect(r, 200)
			var page mailboxPage
			r.json(t, &page)
			listed := func(name string) bool {
				for _, box := range page.Mailboxes {
					if box.Mailbox == name {
						return true
					}
				}
				return false
			}
			if op == "create" && !listed("Work") || op == "delete" && listed("Work") || op == "rename" && (!listed("Jobs") || listed("Work")) {
				t.Errorf("%s left a stale folder listing: %+v", op, page.Mailboxes)
			}
			if op == "empty" && len(s.mailbox("Trash").Messages) != 0 {
				t.Fatal("first empty did not commit")
			}
		})
	}
}
