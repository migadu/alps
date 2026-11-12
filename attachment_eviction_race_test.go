package alps

import (
	"fmt"
	"mime/multipart"
	"testing"
	"time"
)

func TestAttachmentEvictionRecognizesCompetingRemoval(t *testing.T) {
	// Stop the scan on an empty session while another request removes all
	// candidates. Map iteration may reach that session first, so repeat until
	// a scan has observed a candidate before stopping there.
	progressed := false
	for attempt := 0; attempt < 128; attempt++ {
		manager := &SessionManager{sessions: make(map[string]*Session)}
		blocker := &Session{attachments: make(map[string]*Attachment), manager: manager}
		manager.sessions["blocker"] = blocker
		var candidates []*Session
		for i := range 32 {
			s := &Session{manager: manager, attachments: map[string]*Attachment{"old": {File: &multipart.FileHeader{Size: 1}, CreatedAt: time.Unix(1, 0)}}}
			manager.sessions[fmt.Sprint(i)] = s
			candidates = append(candidates, s)
		}
		manager.globalAttachmentSize.Store(32)
		blocker.attachmentsLocker.Lock()
		done := make(chan bool, 1)
		started := make(chan struct{})
		go func() { close(started); done <- manager.evictOldestAttachment() }()
		<-started
		time.Sleep(time.Millisecond)
		for _, s := range candidates {
			if a := s.PopAttachment("old"); a != nil {
				a.Remove()
			}
		}
		blocker.attachmentsLocker.Unlock()
		if <-done {
			progressed = true
		}
		if manager.globalAttachmentSize.Load() != 0 {
			t.Fatal("competing removal failed to free budget")
		}
	}
	if !progressed {
		t.Fatal("every eviction reported no progress after competing removals freed the budget")
	}
}
