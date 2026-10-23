package alps

import (
	"bytes"
	"mime/multipart"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/migadu/alps/provider"
	"github.com/stretchr/testify/mock"
)

// uploadForm is a form holding one file of size bytes, kept on disk as an
// upload over the in-memory threshold is. It returns the file's path too.
func uploadForm(t *testing.T, size int) (*multipart.FileHeader, *multipart.Form, string) {
	t.Helper()
	var body bytes.Buffer
	w := multipart.NewWriter(&body)
	part, err := w.CreateFormFile("attachments", "notes.txt")
	if err != nil {
		t.Fatal(err)
	}
	part.Write([]byte(strings.Repeat("x", size)))
	w.Close()
	form, err := multipart.NewReader(&body, w.Boundary()).ReadForm(1)
	if err != nil {
		t.Fatal(err)
	}
	fh := form.File["attachments"][0]
	f, err := fh.Open()
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	file, ok := f.(*os.File)
	if !ok {
		t.Fatal("the upload is not on disk")
	}
	return fh, form, file.Name()
}

func attachmentTestSession(t *testing.T, sessionMiB int) (*SessionManager, *Session) {
	t.Helper()
	mockProvider := &provider.MockProvider{}
	mockStore := &provider.MockStore{}
	mockProvider.On("Close").Return(nil)
	mockProvider.On("GetStore").Return(mockStore, nil)
	mockStore.On("Get", mock.Anything, mock.Anything).Return(provider.ErrNoStoreEntry)
	connect := func(string, string) (provider.MailProvider, error) { return mockProvider, nil }
	sm := newSessionManager(connect, nil, &NilLogger{}, 10*time.Minute, false, nil,
		30*time.Minute, 24*time.Hour, 10, 0, 1, sessionMiB, 1024)
	t.Cleanup(sm.Close)
	s, err := sm.Put("user@example.com", "pass")
	if err != nil {
		t.Fatal(err)
	}
	return sm, s
}

func onDisk(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

// An upload a request has taken for the message it writes is out of reach of
// what else removes uploads: room made for another one, here. Given back
// after the request failed, it is there again for the next one, and counted.
func TestSession_AnUploadTakenByARequestIsGivenBack(t *testing.T) {
	sm, s := attachmentTestSession(t, 1)
	fh, form, path := uploadForm(t, 700<<10)
	id, err := s.PutAttachment("c1", fh, form)
	if err != nil {
		t.Fatal(err)
	}

	taken := s.PopAttachment(id)
	// Another composer's upload, which the session's 1 MiB would have made
	// room for by evicting the first, were it still in the session.
	other, otherForm, _ := uploadForm(t, 700<<10)
	if _, err := s.PutAttachment("c2", other, otherForm); err != nil {
		t.Fatal(err)
	}
	if !onDisk(path) {
		t.Fatal("the taken upload's file was removed while the request held it")
	}

	s.ReturnAttachment(id, taken)
	if got := s.GetAttachment(id); got != taken {
		t.Errorf("after it was given back, the session holds %v", got)
	}
	if got, want := sm.globalAttachmentSize.Load(), int64(1400<<10); got != want {
		t.Errorf("global budget %d, want %d", got, want)
	}
	if !onDisk(path) {
		t.Error("the given-back upload has no file")
	}
}

// One given back after the session ended is removed, as the session's own
// uploads were, rather than kept by a session nobody can use.
func TestSession_AnUploadGivenBackAfterTheSessionEndedIsRemoved(t *testing.T) {
	sm, s := attachmentTestSession(t, 128)
	fh, form, path := uploadForm(t, 64<<10)
	id, err := s.PutAttachment("c1", fh, form)
	if err != nil {
		t.Fatal(err)
	}
	taken := s.PopAttachment(id)

	s.teardown()
	s.ReturnAttachment(id, taken)

	if s.GetAttachment(id) != nil {
		t.Error("the ended session holds the upload again")
	}
	if onDisk(path) {
		t.Error("the upload's file is still on disk")
	}
	if got := sm.globalAttachmentSize.Load(); got != 0 {
		t.Errorf("global budget %d, want 0", got)
	}
}
