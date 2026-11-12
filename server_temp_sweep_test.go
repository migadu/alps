package alps

import (
	"io"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/migadu/alps/provider"
	"github.com/stretchr/testify/mock"
)

const tempSweepJob = "core:cleanup_temp_attachments"

func scheduledJob(s *Server, name string) JobFunc {
	s.Scheduler.mu.Lock()
	defer s.Scheduler.mu.Unlock()
	return s.Scheduler.jobs[name]
}

// Loading the plugins, which New does once, adds their jobs to the scheduler
// beside the server's own. It used to empty the scheduler first, so the temp
// sweep newServer registers was gone before the server served anything.
func TestNew_TheTempSweepSurvivesPluginLoading(t *testing.T) {
	loaders := pluginLoaders
	t.Cleanup(func() { pluginLoaders = loaders })
	plugin := GoPlugin{Name: "sweeptest"}
	plugin.AddJob("job", func() error { return nil })
	pluginLoaders = append(loaders[:len(loaders):len(loaders)], plugin.Loader())

	s, err := New(&NilLogger{}, &Options{
		Provider: &provider.MockOptions{},
		SMTP:     SMTPOptions{Server: "smtps://example.com"},
	})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(s.Close)

	for _, name := range []string{tempSweepJob, "sweeptest:job"} {
		if scheduledJob(s, name) == nil {
			t.Errorf("after New, %s is not scheduled", name)
		}
	}
}

// sweepTestServer is a server whose sessions sign in to a mock provider, with
// the process temp directory, where uploads and the sweep go, a test's own.
func sweepTestServer(t *testing.T) (*Server, string) {
	t.Helper()
	dir := t.TempDir()
	t.Setenv("TMPDIR", dir)
	s, err := newServer(&NilLogger{}, &Options{
		Provider: &provider.MockOptions{},
		SMTP:     SMTPOptions{Server: "smtps://example.com"},
	})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(s.Close)
	mockProvider := &provider.MockProvider{}
	mockStore := &provider.MockStore{}
	mockProvider.On("Close").Return(nil)
	mockProvider.On("GetStore").Return(mockStore, nil)
	mockStore.On("Get", mock.Anything, mock.Anything).Return(provider.ErrNoStoreEntry)
	s.Sessions.connectProviderFunc = func(string, string) (provider.MailProvider, error) {
		return mockProvider, nil
	}
	return s, dir
}

// ageMultipartFiles backdates every upload file in dir to past the sweep's
// 7 days, as a session that lasts longer than that can hold one.
func ageMultipartFiles(t *testing.T, dir string, age time.Duration) {
	t.Helper()
	entries, err := os.ReadDir(dir)
	if err != nil {
		t.Fatal(err)
	}
	old := time.Now().Add(-age)
	for _, e := range entries {
		if strings.HasPrefix(e.Name(), "multipart-") {
			if err := os.Chtimes(filepath.Join(dir, e.Name()), old, old); err != nil {
				t.Fatal(err)
			}
		}
	}
}

// readsWhole says whether the attachment's bytes can still be read, as a send
// or a draft save reads them.
func readsWhole(a *Attachment) bool {
	f, err := a.File.Open()
	if err != nil {
		return false
	}
	defer f.Close()
	n, err := io.Copy(io.Discard, f)
	return err == nil && n == a.File.Size
}

// The sweep removes the upload files a crash or a kill left behind once they
// are 7 days old, and keeps the files of the uploads alps still holds, however
// old: a session can last longer than 7 days. It used to remove those too, and
// a send or a draft save of the upload then failed, again on every try.
func TestTempSweep_KeepsTheUploadsAlpsHolds(t *testing.T) {
	s, dir := sweepTestServer(t)
	sweep := scheduledJob(s, tempSweepJob)
	if sweep == nil {
		t.Fatal("the temp sweep is not scheduled")
	}
	sess, err := s.Sessions.Put("user@example.com", "pass")
	if err != nil {
		t.Fatal(err)
	}

	// An upload the session keeps for a composer, one a request has taken to
	// send it, and two files of one request, which share one file on disk.
	keptFile, keptForm, _ := uploadForm(t, 64<<10)
	keptID, err := sess.PutAttachment("c1", keptFile, keptForm)
	if err != nil {
		t.Fatal(err)
	}
	takenFile, takenForm, _ := uploadForm(t, 64<<10)
	takenID, err := sess.PutAttachment("c2", takenFile, takenForm)
	if err != nil {
		t.Fatal(err)
	}
	batchIDs, err := sess.PutAttachments("c3", attachmentBatchForm(t, 2, 64<<10))
	if err != nil {
		t.Fatal(err)
	}
	taken := sess.PopAttachment(takenID)
	if taken == nil {
		t.Fatal("the upload to take is not in the session")
	}

	// What a crash left: an old upload file nobody holds, a recent one, and
	// an old file that is not an upload's.
	left, err := os.CreateTemp(dir, "multipart-")
	if err != nil {
		t.Fatal(err)
	}
	left.Close()
	ageMultipartFiles(t, dir, 8*24*time.Hour)
	recent, err := os.CreateTemp(dir, "multipart-")
	if err != nil {
		t.Fatal(err)
	}
	recent.Close()
	other := filepath.Join(dir, "other")
	if err := os.WriteFile(other, nil, 0600); err != nil {
		t.Fatal(err)
	}
	old := time.Now().Add(-8 * 24 * time.Hour)
	if err := os.Chtimes(other, old, old); err != nil {
		t.Fatal(err)
	}

	if err := sweep(); err != nil {
		t.Fatal(err)
	}

	if onDisk(left.Name()) {
		t.Error("an old upload file nobody holds was kept")
	}
	if !onDisk(recent.Name()) {
		t.Error("a recent upload file was removed")
	}
	if !onDisk(other) {
		t.Error("a file that is not an upload's was removed")
	}
	held := map[string]*Attachment{"kept": sess.GetAttachment(keptID), "taken": taken}
	for i, id := range batchIDs {
		held["batch "+string(rune('a'+i))] = sess.GetAttachment(id)
	}
	for name, a := range held {
		if a == nil {
			t.Errorf("%s: the session no longer has the upload", name)
		} else if !readsWhole(a) {
			t.Errorf("%s: the sweep removed the file of an upload alps holds", name)
		}
	}

	// Given back after its send failed, the taken upload is there for the
	// next try, its file with it.
	sess.ReturnAttachment(takenID, taken)
	if a := sess.GetAttachment(takenID); a == nil || !readsWhole(a) {
		t.Error("the upload given back cannot be read")
	}
}
