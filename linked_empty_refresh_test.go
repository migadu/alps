package alps

import (
	"fmt"
	"strings"
	"testing"
)

type linkedRefreshLogger struct {
	NilLogger
	lines []string
}

func (l *linkedRefreshLogger) Printf(format string, args ...interface{}) {
	l.lines = append(l.lines, fmt.Sprintf(format, args...))
}

func TestRefreshLinkedCredentialsWithoutPeersNeedsNoLoginKey(t *testing.T) {
	for _, record := range []string{"", `{"accounts":[]}`} {
		t.Run(record, func(t *testing.T) {
			store := &rawStore{entries: map[string]string{}}
			if record != "" {
				store.entries[linkedAccountsStoreKey] = record
			}
			connects := 0
			s := newStoreSession(store, &connects)
			t.Cleanup(s.Close)
			log := &linkedRefreshLogger{}
			s.manager.logger = log
			if failed := s.RefreshLinkedCredentials("changed-password"); failed != 0 {
				t.Fatalf("refresh with no peers failed: %d", failed)
			}
			for _, line := range log.lines {
				if strings.Contains(line, "cannot encrypt") {
					t.Errorf("reported encryption failure with no linked accounts: %s", line)
				}
			}
		})
	}
}
