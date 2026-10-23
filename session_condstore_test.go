package alps

import (
	"errors"
	"net"
	"testing"
	"time"

	"github.com/migadu/alps/provider"
)

// trackingConnection is a connection whose mail server can number its
// changes.
type trackingConnection struct {
	provider.MockProvider
	trackErr error
	asked    int
	closed   bool
}

func (c *trackingConnection) TrackChanges() (bool, error) {
	c.asked++
	return c.trackErr == nil, c.trackErr
}

func (c *trackingConnection) ChangedFlags(string, []provider.MessageID, uint64) ([]provider.Message, error) {
	return nil, nil
}

func (c *trackingConnection) Close() error {
	c.closed = true
	return nil
}

func trackingManager(track bool, conns ...*trackingConnection) *SessionManager {
	dial := 0
	sm := newSessionManager(func(username, password string) (provider.MailProvider, error) {
		c := conns[dial]
		dial++
		return c, nil
	}, nil, &NilLogger{}, time.Minute, true, nil, 30*time.Minute, time.Hour, 0, 0, 0, 0, 0)
	sm.trackChanges = track
	return sm
}

// With condstore on, every connection has the mail server number its changes
// as it is made, before it is used.
func TestEachConnectionHasChangesNumberedWithCondStoreOn(t *testing.T) {
	c := &trackingConnection{}
	if _, err := trackingManager(true, c).connectProvider("ada", "pass"); err != nil {
		t.Fatal(err)
	}
	if c.asked != 1 {
		t.Errorf("TrackChanges was called %d times, want once", c.asked)
	}

	off := &trackingConnection{}
	if _, err := trackingManager(false, off).connectProvider("ada", "pass"); err != nil {
		t.Fatal(err)
	}
	if off.asked != 0 {
		t.Errorf("with condstore off, TrackChanges was called %d times", off.asked)
	}
}

// A connection lost while it is asked is closed, and the connection fails.
func TestAConnectionLostWhileChangesAreTurnedOnFails(t *testing.T) {
	c := &trackingConnection{trackErr: net.ErrClosed}
	_, err := trackingManager(true, c).connectProvider("ada", "pass")
	if !errors.Is(err, net.ErrClosed) {
		t.Errorf("connectProvider: %v, want the connection's error", err)
	}
	if !c.closed {
		t.Error("the connection was left open")
	}
}
