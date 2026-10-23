package alpsbase

import (
	"bytes"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"strings"
	"testing"

	"github.com/migadu/alps"
)

// uploadTogether posts several files to /attachments in one request, as the
// composer does for files dropped together, and answers the status and the
// ids the session keeps them under.
func (s *testServer) uploadTogether(files ...[2]string) (int, []string) {
	s.t.Helper()
	var body bytes.Buffer
	w := multipart.NewWriter(&body)
	for _, f := range files {
		part, err := w.CreateFormFile("attachments", f[0])
		if err != nil {
			s.t.Fatal(err)
		}
		if _, err := io.WriteString(part, f[1]); err != nil {
			s.t.Fatal(err)
		}
	}
	if err := w.Close(); err != nil {
		s.t.Fatal(err)
	}
	req, err := http.NewRequest("POST", s.url+"/attachments?composer_id=c1", &body)
	if err != nil {
		s.t.Fatal(err)
	}
	req.Header.Set("Content-Type", w.FormDataContentType())
	req.Header.Set("Origin", s.url)
	res, err := s.client.Do(req)
	if err != nil {
		s.t.Fatal(err)
	}
	defer res.Body.Close()
	data, _ := io.ReadAll(res.Body)
	var ids []string
	if res.StatusCode == http.StatusOK {
		if err := json.Unmarshal(data, &ids); err != nil {
			s.t.Fatalf("upload: %q, %v", data, err)
		}
	}
	return res.StatusCode, ids
}

// Past the size an upload is kept in memory at, so each file's bytes are in a
// file of their own on disk.
var (
	notesContent  = strings.Repeat("remember the milk\n", 4<<10)
	ledgerContent = strings.Repeat("one two three\n", 5<<10)
)

// Files uploaded in one request were kept under that request's one form, and
// removing any of them removed the files of all: the user removed one chip,
// and the message then failed to send for want of the file of another.
func TestHTTP_RemovingOneOfFilesUploadedTogetherKeepsTheOthers(t *testing.T) {
	addr, rec := listenRecorder(t)
	s := newTestServerWithSMTP(t, addr)
	s.login()
	status, ids := s.uploadTogether([2]string{"notes.txt", notesContent}, [2]string{"ledger.txt", ledgerContent})
	if status != http.StatusOK || len(ids) != 2 {
		t.Fatalf("the upload answered %d %v", status, ids)
	}
	s.expect(s.do("DELETE", "/attachments/"+ids[0], nil), http.StatusOK)

	send := draftWith(ids[1])
	send.Del("save_as_draft")
	r := s.do("POST", "/messages", send)
	if r.status != http.StatusOK {
		t.Fatalf("the send answered %d: %s", r.status, r.body)
	}
	rec.mu.Lock()
	defer rec.mu.Unlock()
	if got := fileIn(t, rec.data, "ledger.txt"); got != ledgerContent {
		t.Errorf("ledger.txt went out with %d of its %d bytes", len(got), len(ledgerContent))
	}
}

// A request whose second file is over the composer's budget is refused
// whole, and leaves nothing behind. The first file stayed in the session,
// counted against the budget, with its bytes removed with the refused
// request's: the next upload was refused for room the user could not see.
func TestHTTP_ARefusedUploadOfSeveralFilesLeavesNoneBehind(t *testing.T) {
	s := newTestServerWithOptions(t, "smtp://127.0.0.1:1", alps.NewLogger(), func(o *alps.Options) { o.MaxAttachmentMiB = 1 })
	s.login()
	big := strings.Repeat("x", 700<<10)
	status, _ := s.uploadTogether([2]string{"first.bin", big}, [2]string{"second.bin", big})
	if status != http.StatusBadRequest {
		t.Fatalf("an upload over the composer's budget answered %d", status)
	}

	// 400 KiB fits a composer that holds nothing, and not one that still
	// holds the refused request's first 700 KiB.
	status, ids := s.uploadTogether([2]string{"notes.txt", strings.Repeat("y", 400<<10)})
	if status != http.StatusOK || len(ids) != 1 {
		t.Fatalf("the next upload answered %d %v, as though the refused one had left a file behind", status, ids)
	}
}

func TestHTTP_AnUploadCannotReturnFilesItEvictedFromItsOwnBatch(t *testing.T) {
	for _, limit := range []string{"session", "global"} {
		t.Run(limit, func(t *testing.T) {
			s := newTestServerWithOptions(t, "smtp://127.0.0.1:1", alps.NewLogger(), func(o *alps.Options) {
				o.MaxAttachmentMiB = 2
				if limit == "session" {
					o.MaxSessionAttachmentMiB = 1
				} else {
					o.MaxGlobalAttachmentMiB = 1
				}
			})
			s.login()
			big := strings.Repeat("x", 700<<10)
			status, ids := s.uploadTogether([2]string{"first.bin", big}, [2]string{"second.bin", big})
			if status != http.StatusBadRequest || len(ids) != 0 {
				t.Fatalf("impossible batch answered %d %v", status, ids)
			}
			status, ids = s.uploadTogether([2]string{"fits.bin", big})
			if status != http.StatusOK || len(ids) != 1 {
				t.Fatalf("next fitting upload answered %d %v", status, ids)
			}
		})
	}
}
