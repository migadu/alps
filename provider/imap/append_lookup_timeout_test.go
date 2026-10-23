package imap

import (
	"context"
	"errors"
	"net"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapserver"
	"github.com/emersion/go-imap/v2/imapserver/imapmemserver"
	"github.com/migadu/alps/provider"
)

type stalledAppendLookup struct {
	imapserver.Session
	mode    string
	appends *atomic.Int32
	entered chan struct{}
	once    *sync.Once
}

func (s stalledAppendLookup) stall(ctx context.Context) error {
	s.once.Do(func() { close(s.entered) })
	<-ctx.Done()
	return ctx.Err()
}

func (s stalledAppendLookup) Status(ctx context.Context, mailbox string, options *imap.StatusOptions) (*imap.StatusData, error) {
	switch s.mode {
	case "status":
		return nil, s.stall(ctx)
	case "NO":
		return nil, &imap.Error{Type: imap.StatusResponseTypeNo, Text: "STATUS refused"}
	case "BAD":
		return nil, &imap.Error{Type: imap.StatusResponseTypeBad, Text: "STATUS unsupported"}
	}
	return s.Session.Status(ctx, mailbox, options)
}

func (s stalledAppendLookup) Select(ctx context.Context, mailbox string, options *imap.SelectOptions) (*imap.SelectData, error) {
	if s.mode == "select" {
		return nil, s.stall(ctx)
	}
	return s.Session.Select(ctx, mailbox, options)
}

func (s stalledAppendLookup) Search(ctx context.Context, kind imapserver.NumKind, criteria *imap.SearchCriteria, options *imap.SearchOptions) (*imap.SearchData, error) {
	if s.mode == "search" {
		return nil, s.stall(ctx)
	}
	return s.Session.Search(ctx, kind, criteria, options)
}

func (s stalledAppendLookup) Fetch(ctx context.Context, w *imapserver.FetchWriter, numSet imap.NumSet, options *imap.FetchOptions) error {
	if s.mode == "fetch" {
		return s.stall(ctx)
	}
	return s.Session.Fetch(ctx, w, numSet, options)
}

func (s stalledAppendLookup) Append(ctx context.Context, mailbox string, r imap.LiteralReader, options *imap.AppendOptions) (*imap.AppendData, error) {
	s.appends.Add(1)
	_, err := s.Session.Append(ctx, mailbox, r, options)
	return nil, err
}

func TestAppendWithoutUIDPlusBoundsAuxiliaryLookups(t *testing.T) {
	for _, mode := range []string{"status", "select", "search", "fetch", "NO", "BAD", "normal"} {
		t.Run(mode, func(t *testing.T) {
			user := imapmemserver.NewUser("ada", "pass")
			for _, name := range []string{"INBOX", "Drafts"} {
				if err := user.Create(context.Background(), name, nil); err != nil {
					t.Fatal(err)
				}
			}
			mem := imapmemserver.New()
			mem.AddUser(user)
			var appends atomic.Int32
			entered := make(chan struct{})
			var once sync.Once
			srv := imapserver.New(&imapserver.Options{
				NewSession: func(*imapserver.Conn) (imapserver.Session, *imapserver.GreetingData, error) {
					return stalledAppendLookup{mem.NewSession(), mode, &appends, entered, &once}, nil, nil
				},
				Caps: imap.CapSet{imap.CapIMAP4rev1: {}}, InsecureAuth: true,
			})
			ln, err := net.Listen("tcp", "127.0.0.1:0")
			if err != nil {
				t.Fatal(err)
			}
			go srv.Serve(ln)
			t.Cleanup(func() { srv.Close() })
			opts, err := (&Config{Server: "imap+insecure://" + ln.Addr().String()}).ToOptions()
			if err != nil {
				t.Fatal(err)
			}
			mp, err := opts.CreateFactory(100*time.Millisecond, false)("ada", "pass")
			if err != nil {
				t.Fatal(err)
			}
			p := mp.(*IMAPProvider)
			t.Cleanup(func() { p.client.Close() })
			type result struct {
				uid provider.MessageID
				err error
			}
			done := make(chan result, 1)
			go func() {
				_, uid, _, err := p.AppendMessage("", rawMessage(conversation("Draft", "draft@example.test", "")), provider.MailboxTypeDrafts)
				done <- result{uid, err}
			}()
			stalled := mode != "NO" && mode != "BAD" && mode != "normal"
			if stalled {
				select {
				case <-entered:
				case <-time.After(time.Second):
					t.Fatal("the auxiliary command was not sent")
				}
			}
			var got result
			select {
			case got = <-done:
			case <-time.After(500 * time.Millisecond):
				t.Error("the auxiliary lookup exceeded the configured100ms response timeout")
				p.client.Close()
				got = <-done
			}
			if mode == "status" {
				if !errors.Is(got.err, provider.ErrAppendNotStarted) || !errors.Is(got.err, net.ErrClosed) {
					t.Errorf("failed pre-APPEND STATUS returned %v, want safely retryable lost connection", got.err)
				}
				if appends.Load() != 0 {
					t.Errorf("%d APPENDs were sent after failed preflight", appends.Load())
				}
				return
			}
			if got.err != nil || appends.Load() != 1 {
				t.Fatalf("completed APPEND: uid%v err%v appends%d", got.uid, got.err, appends.Load())
			}
			if mode == "normal" {
				if got.uid == nil {
					t.Error("the successful lookup did not identify the draft")
				}
			} else if got.uid != nil {
				t.Errorf("failed/refused lookup invented UID%v", got.uid)
			}
			if !stalled {
				if err := p.client.Noop().Wait(); err != nil {
					t.Errorf("successful/refused lookup closed healthy connection: %v", err)
				}
			}
		})
	}
}
