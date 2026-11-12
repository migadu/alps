package alps

import (
	"bytes"
	"errors"
	"mime/multipart"
	"testing"
)

func heldUploadCount(sm *SessionManager) int {
	sm.uploads.mu.Lock()
	defer sm.uploads.mu.Unlock()
	return len(sm.uploads.uploads)
}

// The sweep knows an upload's file by its path, which FileHeader does not
// say: it is read from the file Open answers, a whole one or a section of one
// the request's files share. A file kept in memory has none.
func TestUploadFilePath(t *testing.T) {
	fh, _, path := uploadForm(t, 64<<10)
	if got := uploadFilePath(fh); got != path {
		t.Errorf("a file of its own: got %q, want %q", got, path)
	}

	batch := attachmentBatchForm(t, 2, 64<<10)
	first := uploadFilePath(batch.File["attachments"][0])
	second := uploadFilePath(batch.File["attachments"][1])
	if first == "" || first != second || !onDisk(first) {
		t.Errorf("a shared file: got %q and %q, want one path on disk", first, second)
	}

	var body bytes.Buffer
	w := multipart.NewWriter(&body)
	part, err := w.CreateFormFile("attachments", "small.txt")
	if err != nil {
		t.Fatal(err)
	}
	part.Write([]byte("small"))
	w.Close()
	form, err := multipart.NewReader(&body, w.Boundary()).ReadForm(1 << 20)
	if err != nil {
		t.Fatal(err)
	}
	if got := uploadFilePath(form.File["attachments"][0]); got != "" {
		t.Errorf("a file in memory: got %q", got)
	}

	if err := batch.RemoveAll(); err != nil {
		t.Fatal(err)
	}
	if got := uploadFilePath(batch.File["attachments"][0]); got != "" {
		t.Errorf("a removed file: got %q", got)
	}
}

// An upload's file is held from when its request stores it until the last
// attachment from it goes, and no longer: a leftover is the sweep's.
func TestHeldUploadFiles_FollowTheHolds(t *testing.T) {
	sm, s := attachmentTestSession(t, 128)

	fh, form, path := uploadForm(t, 64<<10)
	id, err := s.PutAttachment("c1", fh, form)
	if err != nil {
		t.Fatal(err)
	}
	batch := attachmentBatchForm(t, 2, 64<<10)
	batchPath := uploadFilePath(batch.File["attachments"][0])
	batchIDs, err := s.PutAttachments("c2", batch)
	if err != nil {
		t.Fatal(err)
	}
	held := sm.heldUploadFiles()
	if len(held) != 2 || !held[path] || !held[batchPath] {
		t.Errorf("held %v, want %s and %s", held, path, batchPath)
	}

	// Taken by a request, an upload is still held.
	taken := s.PopAttachment(id)
	if !sm.heldUploadFiles()[path] {
		t.Error("an upload taken by a request is no longer held")
	}
	taken.Remove()
	if sm.heldUploadFiles()[path] {
		t.Error("a removed upload is still held")
	}

	// One file of two from a request goes; their shared file is still held.
	if a := s.PopAttachment(batchIDs[0]); a != nil {
		a.Remove()
	}
	if !sm.heldUploadFiles()[batchPath] {
		t.Error("the file the other attachment of the request needs is no longer held")
	}

	// The session's end lets go of the rest.
	s.teardown()
	if n := heldUploadCount(sm); n != 0 {
		t.Errorf("after the session ended, %d uploads are held", n)
	}

	// A refused request holds nothing once it ends.
	_, other := attachmentTestSession(t, 128)
	if _, err := other.PutAttachments("c3", attachmentBatchForm(t, 2, 700<<10)); !errors.Is(err, ErrAttachmentCacheSize) {
		t.Fatalf("over-budget request: %v", err)
	}
	if n := heldUploadCount(other.manager); n != 0 {
		t.Errorf("after a refused request, %d uploads are held", n)
	}
}
