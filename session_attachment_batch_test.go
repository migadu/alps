package alps

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"strings"
	"testing"
)

func attachmentBatchForm(t *testing.T, count, size int) *multipart.Form {
	t.Helper()
	var body bytes.Buffer
	w := multipart.NewWriter(&body)
	for i := 0; i < count; i++ {
		part, err := w.CreateFormFile("attachments", fmt.Sprintf("part-%d.txt", i))
		if err != nil {
			t.Fatal(err)
		}
		if _, err := io.Copy(part, strings.NewReader(strings.Repeat("x", size))); err != nil {
			t.Fatal(err)
		}
	}
	if err := w.Close(); err != nil {
		t.Fatal(err)
	}
	form, err := multipart.NewReader(&body, w.Boundary()).ReadForm(1)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { form.RemoveAll() })
	return form
}

func TestSession_OneUploadCannotEvictItsOwnFiles(t *testing.T) {
	for _, limit := range []string{"session", "global"} {
		t.Run(limit, func(t *testing.T) {
			sm, s := attachmentTestSession(t, 128)
			sm.maxAttachmentSize = 2 << 20
			if limit == "session" {
				sm.maxSessionAttachmentSize = 1 << 20
			} else {
				sm.maxGlobalAttachmentSize = 1 << 20
			}
			ids, err := s.PutAttachments("c1", attachmentBatchForm(t, 2, 700<<10))
			if !errors.Is(err, ErrAttachmentCacheSize) {
				t.Errorf("impossible batch returned ids %v, error %v; want budget refusal", ids, err)
			}
			if len(ids) != 0 {
				t.Errorf("refused batch returned ids %v", ids)
			}
			if got := sm.globalAttachmentSize.Load(); got != 0 {
				t.Errorf("refused batch retains %d bytes", got)
			}
		})
	}
}

func TestSession_AnEndedUploadDoesNotEvictALiveSessionsFiles(t *testing.T) {
	sm, ended := attachmentTestSession(t, 128)
	live, err := sm.Put("other@example.com", "pass")
	if err != nil {
		t.Fatal(err)
	}
	sm.maxGlobalAttachmentSize = 1 << 20
	first, form, path := uploadForm(t, 700<<10)
	id, err := live.PutAttachment("live", first, form)
	if err != nil {
		t.Fatal(err)
	}
	ended.teardown()
	late, lateForm, latePath := uploadForm(t, 700<<10)
	if _, err := ended.PutAttachment("ended", late, lateForm); !errors.Is(err, ErrSessionExpired) {
		t.Errorf("late upload: %v", err)
	}
	if live.GetAttachment(id) == nil || !onDisk(path) {
		t.Error("refused upload evicted the live session's attachment")
	}
	if onDisk(latePath) {
		t.Error("refused upload left its file behind")
	}
	if got := sm.globalAttachmentSize.Load(); got != 700<<10 {
		t.Errorf("live budget %d, want %d", got, 700<<10)
	}
}

func TestSession_AFittingBatchKeepsEveryReturnedFile(t *testing.T) {
	sm, s := attachmentTestSession(t, 1)
	sm.maxGlobalAttachmentSize = 1 << 20
	ids, err := s.PutAttachments("c1", attachmentBatchForm(t, 2, 300<<10))
	if err != nil || len(ids) != 2 {
		t.Fatalf("fitting batch: %v, %v", ids, err)
	}
	for _, id := range ids {
		a := s.GetAttachment(id)
		if a == nil {
			t.Fatalf("returned UUID %s is missing", id)
		}
		f, err := a.File.Open()
		if err != nil {
			t.Fatal(err)
		}
		data, err := io.ReadAll(f)
		f.Close()
		if err != nil || len(data) != 300<<10 {
			t.Fatalf("returned file: %d bytes, %v", len(data), err)
		}
	}
	if got := sm.globalAttachmentSize.Load(); got != 600<<10 {
		t.Errorf("batch budget %d", got)
	}
}
