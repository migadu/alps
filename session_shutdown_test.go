package alps

import (
	"testing"
	"time"
)

func TestSessionManagerCloseWaitsForTeardown(t *testing.T) {
	sm, s := attachmentTestSession(t, 128)
	fh, form, path := uploadForm(t, 2048)
	if _, err := s.PutAttachment("composer", fh, form); err != nil {
		t.Fatal(err)
	}
	// Keep the provider in use while shutdown begins.
	s.providerLocker.Lock()
	finished := make(chan struct{})
	go func() { sm.Close(); close(finished) }()
	select {
	case <-finished:
		t.Error("manager returned before session teardown completed")
	case <-time.After(50 * time.Millisecond):
	}
	s.providerLocker.Unlock()
	select {
	case <-finished:
	case <-time.After(time.Second):
		t.Fatal("shutdown did not finish")
	}
	if onDisk(path) {
		t.Error("shutdown left an upload on disk")
	}
}
