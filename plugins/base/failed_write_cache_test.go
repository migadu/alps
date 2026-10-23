package alpsbase

import (
	"context"
	"errors"
	"net"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapserver"
	"github.com/emersion/go-imap/v2/imapserver/imapmemserver"
	"github.com/fernet/fernet-go"
	"github.com/migadu/alps"
	imapprovider "github.com/migadu/alps/provider/imap"
)

// halfDoneWrites is an account whose server does a write, or part of one, and
// then fails it: the request is answered with an error, and what the server
// holds has changed all the same.
type halfDoneWrites struct {
	// moveThenDrop: a MOVE is done, and the connection goes before its reply.
	moveThenDrop bool
	// expungeThenRefuse: an EXPUNGE is done, and answered NO.
	expungeThenRefuse bool
	// refuseStoreAbove: a STORE that names a UID above it is refused, and
	// one that names none is done.
	refuseStoreAbove imap.UID
}

type halfDoneSession struct {
	imapserver.Session
	conn   *imapserver.Conn
	writes halfDoneWrites
}

func (s halfDoneSession) Move(ctx context.Context, w *imapserver.MoveWriter, numSet imap.NumSet, dest string) error {
	err := s.Session.(imapserver.SessionMove).Move(ctx, w, numSet, dest)
	if err == nil && s.writes.moveThenDrop {
		s.conn.NetConn().Close()
	}
	return err
}

func (s halfDoneSession) Expunge(ctx context.Context, w *imapserver.ExpungeWriter, uids *imap.UIDSet) error {
	err := s.Session.Expunge(ctx, w, uids)
	if err == nil && s.writes.expungeThenRefuse {
		return errors.New("expunged, and refused all the same")
	}
	return err
}

func (s halfDoneSession) Store(ctx context.Context, w *imapserver.FetchWriter, numSet imap.NumSet, flags *imap.StoreFlags, options *imap.StoreOptions) error {
	if uids, ok := numSet.(imap.UIDSet); ok && s.writes.refuseStoreAbove != 0 {
		nums, _ := uids.Nums()
		for _, uid := range nums {
			if uid > s.writes.refuseStoreAbove {
				return errors.New("this batch is refused")
			}
		}
	}
	return s.Session.Store(ctx, w, numSet, flags, options)
}

// newHalfDoneServer serves an account holding messages in the given folders,
// INBOX among them, on a server that half does the writes named.
func newHalfDoneServer(t *testing.T, writes halfDoneWrites, folders map[string]int) *testServer {
	t.Helper()
	ctx := context.Background()
	user := imapmemserver.NewUser(testUser, testPassword)
	for name, count := range folders {
		if err := user.Create(ctx, name, nil); err != nil {
			t.Fatal(err)
		}
		message := "From: Charles <charles@remote.test>\r\nTo: " + testUser + "\r\nSubject: In " + name + "\r\n\r\nBody\r\n"
		for i := 0; i < count; i++ {
			if _, err := user.Append(ctx, name, strings.NewReader(message), &imap.AppendOptions{}); err != nil {
				t.Fatal(err)
			}
		}
	}
	mem := imapmemserver.New()
	mem.AddUser(user)
	imapSrv := imapserver.New(&imapserver.Options{NewSession: func(c *imapserver.Conn) (imapserver.Session, *imapserver.GreetingData, error) {
		return halfDoneSession{mem.NewSession(), c, writes}, nil, nil
	}, Caps: imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapUIDPlus: {}, imap.CapMove: {}}, InsecureAuth: true})
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	go imapSrv.Serve(ln)
	t.Cleanup(func() { imapSrv.Close() })
	var key fernet.Key
	if err := key.Generate(); err != nil {
		t.Fatal(err)
	}
	options, err := (&imapprovider.Config{Server: "imap+insecure://" + ln.Addr().String()}).ToOptions()
	if err != nil {
		t.Fatal(err)
	}
	srv, err := alps.New(alps.NewLogger(), &alps.Options{Provider: options, SMTP: alps.SMTPOptions{Server: "smtp://127.0.0.1:1"}, LoginKey: &key, CacheEnabled: true, CacheTTL: time.Minute})
	if err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewServer(srv)
	t.Cleanup(func() { ts.Close(); srv.Close() })
	jar, _ := cookiejar.New(nil)
	s := &testServer{t: t, url: ts.URL, client: &http.Client{Jar: jar}}
	s.login()
	return s
}

// A MOVE whose reply is lost has moved the message, and the request is
// answered with an error. The message's parts the session had read were kept
// under its UID in the folder it left, and it went on opening there.
func TestHTTP_AMoveWithALostReplyForgetsTheMessage(t *testing.T) {
	s := newHalfDoneServer(t, halfDoneWrites{moveThenDrop: true}, map[string]int{"INBOX": 1, "Archive": 0})
	const part = "/mailboxes/INBOX/messages/1/raw?part=1"
	s.mailbox("INBOX")
	s.expect(s.do("GET", part, nil), http.StatusOK)

	if r := s.do("PUT", "/mailboxes/INBOX/messages/move", map[string]any{"uids": []string{"1"}, "to": "Archive"}); r.status == http.StatusOK {
		t.Fatalf("the move with a lost reply answered %d, want an error", r.status)
	}
	if got := s.mailbox("Archive").Total; got != 1 {
		t.Fatalf("Archive holds %d messages, want the one moved", got)
	}

	if r := s.do("GET", part, nil); r.status == http.StatusOK {
		t.Errorf("the moved message still opens in the INBOX: %d %s", r.status, r.body)
	}
}

// An EXPUNGE that is done and answered NO has emptied the folder, and the
// request is answered with an error. The folder's page was kept, and it went
// on listing the messages that had gone.
func TestHTTP_AnEmptyingThatFailsLateIsListedAgain(t *testing.T) {
	s := newHalfDoneServer(t, halfDoneWrites{expungeThenRefuse: true}, map[string]int{"INBOX": 0, "Trash": 2})
	if got := s.mailbox("Trash").Total; got != 2 {
		t.Fatalf("Trash holds %d messages, want the two seeded", got)
	}

	if r := s.do("POST", "/mailboxes/Trash/empty", nil); r.status == http.StatusOK {
		t.Fatalf("the emptying answered %d, want an error", r.status)
	}

	if got := s.mailbox("Trash").Total; got != 0 {
		t.Errorf("Trash lists %d messages after they were expunged, want none", got)
	}
}

// A flag change over a whole folder is written a batch at a time, and one
// refused after the first has changed the first batch's messages. The
// folder's page was kept, and it went on showing them as they had been.
func TestHTTP_AFlagChangeRefusedPartWayIsListedAgain(t *testing.T) {
	s := newHalfDoneServer(t, halfDoneWrites{refuseStoreAbove: maxScopeBatch}, map[string]int{"INBOX": maxScopeBatch + 1})
	flagged := func() int {
		n := 0
		for _, m := range s.mailbox("INBOX").Messages {
			if contains(m.Flags, `\Flagged`) {
				n++
			}
		}
		return n
	}
	if got := flagged(); got != 0 {
		t.Fatalf("%d messages are listed starred before the change", got)
	}

	if r := s.do("PUT", "/mailboxes/INBOX/messages/flag", map[string]any{
		"all": true, "flags": []string{`\Flagged`}, "action": "add",
	}); r.status == http.StatusOK {
		t.Fatalf("the change answered %d, want an error for the refused batch", r.status)
	}

	if got := flagged(); got == 0 {
		t.Error("no message is listed starred, though the first batch was")
	}
}
