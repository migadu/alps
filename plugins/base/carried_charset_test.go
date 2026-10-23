package alpsbase

import (
	"bufio"
	"io"
	"net/http"
	"net/url"
	"strings"
	"testing"

	"github.com/emersion/go-message"
	"github.com/emersion/go-message/textproto"
)

// latin1Notes is a message carrying a Latin-1 text file: "café", with the é
// as the single byte E9.
const latin1Notes = "From: " + testUser + "\r\nTo: mary@remote.test\r\nSubject: Notes\r\n" +
	"Date: Mon, 02 Jan 2006 15:04:05 +0000\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=outer\r\n\r\n" +
	"--outer\r\nContent-Type: text/plain; charset=utf-8\r\n\r\nSee the file.\r\n" +
	"--outer\r\nContent-Type: text/plain; charset=iso-8859-1; format=flowed\r\n" +
	"Content-Disposition: attachment; filename=notes.txt\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\n" +
	"caf=E9\r\n--outer--\r\n"

func carryNotes(source, uid string) url.Values {
	return url.Values{
		"to":               {"mary@remote.test"},
		"subject":          {"Notes"},
		"text":             {"See the file."},
		"prev_attachments": {"2"},
		"source_mailbox":   {source},
		"source_uid":       {uid},
	}
}

// carriedNotes checks the notes.txt part of a message alps wrote: its bytes
// and the charset its Content-Type names must agree. alps writes a text in
// UTF-8, so the file is "café" in UTF-8, labelled so, and keeps its other
// parameters.
func carriedNotes(t *testing.T, raw string) {
	t.Helper()
	// Read with textproto, which leaves each part's bytes as written:
	// go-message's own reader would convert a text to UTF-8 by its charset.
	br := bufio.NewReader(strings.NewReader(raw))
	h, err := textproto.ReadHeader(br)
	if err != nil {
		t.Fatal(err)
	}
	outerHeader := message.Header{Header: h}
	_, outer, _ := outerHeader.ContentType()
	mr := textproto.NewMultipartReader(br, outer["boundary"])
	for {
		p, err := mr.NextPart()
		if err != nil {
			break
		}
		header := message.Header{Header: p.Header}
		if _, params, _ := header.ContentDisposition(); params["filename"] != "notes.txt" {
			continue
		}
		mediaType, params, _ := header.ContentType()
		// The transfer encoding undone, and nothing else: the bytes a client
		// reads in the charset the label names.
		body, _ := io.ReadAll(transferOnly(t, p.Header, p))
		if mediaType != "text/plain" || !strings.EqualFold(params["charset"], "utf-8") || string(body) != "café" {
			t.Errorf("notes.txt went out as %q with the bytes % x, want text/plain; charset=utf-8 with 63 61 66 c3 a9",
				header.Get("Content-Type"), body)
		}
		if params["format"] != "flowed" {
			t.Errorf("notes.txt lost its format=flowed: %q", header.Get("Content-Type"))
		}
		return
	}
	t.Fatalf("no notes.txt in the message:\n%s", raw)
}

// A text file carried from a draft into the message sent says the charset its
// bytes are in. It was read converted to UTF-8 and written with no parameters
// at all, so a Latin-1 file went out as UTF-8 bytes labelled text/plain,
// which a recipient reads as US-ASCII: "café" became "cafÃ©".
func TestHTTP_ACarriedTextFileKeepsItsCharset(t *testing.T) {
	t.Run("maildir, sent from a draft", func(t *testing.T) {
		addr, rec := listenRecorder(t)
		s := newTestServerWithSMTP(t, addr)
		if err := s.store.CreateMailbox("Drafts"); err != nil {
			t.Fatal(err)
		}
		if _, _, _, err := s.store.AppendMessage("Drafts", rawMessage(latin1Notes), 0); err != nil {
			t.Fatal(err)
		}
		s.login()
		s.expect(s.do("POST", "/messages", carryNotes("Drafts", s.mailbox("Drafts").Messages[0].UID)), http.StatusOK)
		rec.mu.Lock()
		data := rec.data
		rec.mu.Unlock()
		carriedNotes(t, data)
	})

	t.Run("imap, saved as a draft", func(t *testing.T) {
		s, _ := newRecordedIMAPTestServer(t, latin1Notes)
		s.login()
		s.expect(s.do("POST", "/mailboxes", url.Values{"name": {"Drafts"}}), http.StatusOK)
		form := carryNotes("INBOX", s.mailbox("INBOX").Messages[0].UID)
		form.Set("save_as_draft", "1")
		s.expect(s.do("POST", "/messages", form), http.StatusOK)
		drafts := s.mailbox("Drafts").Messages
		if len(drafts) != 1 {
			t.Fatalf("Drafts holds %d messages", len(drafts))
		}
		carriedNotes(t, s.rawMessage("Drafts", drafts[0].UID))
	})
}

// transferOnly reads body with only its header's transfer encoding undone.
func transferOnly(t *testing.T, h textproto.Header, body io.Reader) io.Reader {
	t.Helper()
	var only textproto.Header
	if enc := h.Get("Content-Transfer-Encoding"); enc != "" {
		only.Set("Content-Transfer-Encoding", enc)
	}
	e, err := message.New(message.Header{Header: only}, body)
	if err != nil {
		t.Fatal(err)
	}
	return e.Body
}

// A text file in a charset alps does not know cannot be converted, and the
// message writer writes a text under no charset but UTF-8 or US-ASCII: it is
// carried as it is stored, without a charset. Reading it failed, and the
// send answered 500.
func TestHTTP_ACarriedTextFileInAnUnknownCharsetGoesAsStored(t *testing.T) {
	addr, rec := listenRecorder(t)
	s := newTestServerWithSMTP(t, addr)
	if err := s.store.CreateMailbox("Drafts"); err != nil {
		t.Fatal(err)
	}
	unknown := strings.Replace(latin1Notes, "charset=iso-8859-1", "charset=x-unknown-charset", 1)
	if _, _, _, err := s.store.AppendMessage("Drafts", rawMessage(unknown), 0); err != nil {
		t.Fatal(err)
	}
	s.login()
	s.expect(s.do("POST", "/messages", carryNotes("Drafts", s.mailbox("Drafts").Messages[0].UID)), http.StatusOK)
	rec.mu.Lock()
	data := rec.data
	rec.mu.Unlock()

	br := bufio.NewReader(strings.NewReader(data))
	h, err := textproto.ReadHeader(br)
	if err != nil {
		t.Fatal(err)
	}
	outerHeader := message.Header{Header: h}
	_, outer, _ := outerHeader.ContentType()
	mr := textproto.NewMultipartReader(br, outer["boundary"])
	for {
		p, err := mr.NextPart()
		if err != nil {
			t.Fatalf("no notes.txt in the message:\n%s", data)
		}
		header := message.Header{Header: p.Header}
		if _, params, _ := header.ContentDisposition(); params["filename"] != "notes.txt" {
			continue
		}
		_, params, _ := header.ContentType()
		body, _ := io.ReadAll(transferOnly(t, p.Header, p))
		if _, ok := params["charset"]; ok || string(body) != "caf\xe9" {
			t.Errorf("notes.txt went out as %q with the bytes % x, want no charset and the bytes as stored", header.Get("Content-Type"), body)
		}
		return
	}
}
