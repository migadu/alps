package alps

import (
	"github.com/migadu/alps/provider"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestTempAttachmentSweepSurvivesStartup(t *testing.T) {
	s, err := New(&NilLogger{}, &Options{Provider: &provider.MockOptions{}, SMTP: SMTPOptions{Server: "smtps://example.com"}})
	if err != nil {
		t.Fatal(err)
	}
	defer s.Close()
	if _, ok := s.Scheduler.jobs["core:cleanup_temp_attachments"]; !ok {
		t.Fatal("startup removed the core attachment sweep")
	}
}

func TestTempAttachmentSweepPreservesHeldUploads(t *testing.T) {
	t.Setenv("TMPDIR", t.TempDir())
	_, s := attachmentTestSession(t, 128)
	for _, shared := range []bool{false, true} {
		count := 1
		if shared {
			count = 2
		}
		form := attachmentBatchForm(t, count, 2048)
		ids, err := s.PutAttachments("composer", form)
		if err != nil {
			t.Fatal(err)
		}
		// A send owns an upload outside the session map until it completes.
		taken := s.PopAttachment(ids[0])
		defer taken.Remove()
	}
	orphan := filepath.Join(os.TempDir(), "multipart-orphan")
	if err := os.WriteFile(orphan, []byte("abandoned"), 0600); err != nil {
		t.Fatal(err)
	}
	entries, err := os.ReadDir(os.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	old := time.Now().Add(-8 * 24 * time.Hour)
	for _, entry := range entries {
		if err := os.Chtimes(filepath.Join(os.TempDir(), entry.Name()), old, old); err != nil {
			t.Fatal(err)
		}
	}
	if err := cleanupTempAttachments(); err != nil {
		t.Fatal(err)
	}
	for _, entry := range entries {
		_, err := os.Stat(filepath.Join(os.TempDir(), entry.Name()))
		if entry.Name() == "multipart-orphan" {
			if !os.IsNotExist(err) {
				t.Errorf("old orphan remains: %v", err)
			}
		} else if err != nil {
			t.Errorf("held upload %s removed: %v", entry.Name(), err)
		}
	}
}
