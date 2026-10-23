package alps

import (
	"context"
	"errors"
	"fmt"
	"io"
	"testing"

	"github.com/migadu/alps/provider"
)

func TestDoMailOnceWithContextDoesNotReplayAndReconnectsNextTime(t *testing.T) {
	var connections connectionCounter
	s := newCountedSession(t, &connections)
	calls := 0
	err := s.DoMailOnceWithContext(context.Background(), func(provider.MailProvider) error {
		calls++
		return fmt.Errorf("uncertain write: %w", io.ErrUnexpectedEOF)
	})
	if !errors.Is(err, io.ErrUnexpectedEOF) || calls != 1 {
		t.Fatalf("write ran %d times and returned %v", calls, err)
	}
	if opened, closed := connections.opened.Load(), connections.closed.Load(); opened != 1 || closed != 1 {
		t.Fatalf("connections opened=%d closed=%d, want failed connection closed without reconnect", opened, closed)
	}
	if err := s.DoMail(func(provider.MailProvider) error { return nil }); err != nil {
		t.Fatal(err)
	}
	if opened := connections.opened.Load(); opened != 2 {
		t.Errorf("next operation did not reconnect: %d connections", opened)
	}
}

func TestDoMailOnceWithContextGivenUpRequestDoesNoWork(t *testing.T) {
	var connections connectionCounter
	s := newCountedSession(t, &connections)
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	called := false
	err := s.DoMailOnceWithContext(ctx, func(provider.MailProvider) error { called = true; return nil })
	if !errors.Is(err, context.Canceled) || called || connections.opened.Load() != 0 {
		t.Errorf("cancelled mutation: err=%v called=%v opened=%d", err, called, connections.opened.Load())
	}
}
