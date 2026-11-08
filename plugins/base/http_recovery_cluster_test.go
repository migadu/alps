package alpsbase

import (
	"encoding/base64"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

// Independent server/session managers talk to one shared, linearizable
// METADATA namespace. Hooks pause an RPC before the backend applies it, after
// the originating handler has already read its old credential snapshot.
type clusterRecoveryMetadata struct {
	mu         sync.Mutex
	entries    map[string]json.RawMessage
	hook       func(string, json.RawMessage) error
	afterApply func(string, json.RawMessage)
}

func (s *clusterRecoveryMetadata) Get(key string, out interface{}) error { return s.GetFresh(key, out) }
func (s *clusterRecoveryMetadata) GetFresh(key string, out interface{}) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	raw, ok := s.entries[key]
	if !ok {
		return provider.ErrNoStoreEntry
	}
	return json.Unmarshal(raw, out)
}
func (s *clusterRecoveryMetadata) apply(key string, raw json.RawMessage) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if raw == nil {
		delete(s.entries, key)
	} else {
		s.entries[key] = append(json.RawMessage(nil), raw...)
	}
}
func (s *clusterRecoveryMetadata) Put(key string, value interface{}) error {
	var raw json.RawMessage
	if value != nil {
		var err error
		raw, err = json.Marshal(value)
		if err != nil {
			return err
		}
	}
	if s.hook != nil {
		if err := s.hook(key, raw); err != nil {
			return err
		}
	}
	s.apply(key, raw)
	if s.afterApply != nil {
		s.afterApply(key, raw)
	}
	return nil
}
func (s *clusterRecoveryMetadata) List(prefix string) (map[string]json.RawMessage, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	entries := make(map[string]json.RawMessage)
	for key, raw := range s.entries {
		if key == prefix || strings.HasPrefix(key, prefix+"/") {
			entries[key] = append(json.RawMessage(nil), raw...)
		}
	}
	return entries, nil
}

type clusterRecoveryProvider struct {
	provider.MailProvider
	metadata *clusterRecoveryMetadata
}

func (p clusterRecoveryProvider) GetStore() (provider.Store, error) { return p.metadata, nil }

func clusterRecoveryPair(t *testing.T) (*testServer, *testServer, *clusterRecoveryMetadata) {
	t.Helper()
	metadata := &clusterRecoveryMetadata{entries: make(map[string]json.RawMessage)}
	a := newTestServerWithOptionsWrapping(t, "smtp://127.0.0.1:1", alps.NewLogger(), func(o *alps.Options) {
		o.ClusterBroadcaster = recoveryClusterBroadcaster{}
	}, func(p provider.MailProvider) provider.MailProvider { return clusterRecoveryProvider{p, metadata} })
	b := newTestServerWithOptions(t, "smtp://127.0.0.1:1", alps.NewLogger(), func(o *alps.Options) {
		o.ClusterBroadcaster = recoveryClusterBroadcaster{}
		o.Provider = a.server.Options.Provider
	})
	a.withWebAuthn()
	b.withWebAuthn()
	a.login()
	return a, b, metadata
}

func pauseClusterCommit(t *testing.T, metadata *clusterRecoveryMetadata) (<-chan struct{}, func()) {
	t.Helper()
	paused, release := make(chan struct{}), make(chan struct{})
	var armed atomic.Bool
	armed.Store(true)
	var once sync.Once
	resume := func() { once.Do(func() { close(release) }) }
	t.Cleanup(resume)
	metadata.hook = func(key string, raw json.RawMessage) error {
		var envelope struct{ Committed bool }
		_ = json.Unmarshal(raw, &envelope)
		if strings.HasPrefix(key, "webauthn-state/") && envelope.Committed && armed.CompareAndSwap(true, false) {
			close(paused)
			<-release
		}
		return nil
	}
	return paused, resume
}

func waitClusterPause(t *testing.T, paused <-chan struct{}) {
	t.Helper()
	select {
	case <-paused:
	case <-time.After(5 * time.Second):
		t.Fatal("credential write did not reach backend gate")
	}
}

func TestHTTP_ClusterRecoveryCodesAreAvailableAndSingleUse(t *testing.T) {
	a, b, metadata := clusterRecoveryPair(t)
	codes := a.firstKeyCodes(newSoftKey(t), "laptop")
	if !a.webAuthnSettings().RecoveryCodesAvailable {
		t.Fatal("cluster hides available recovery")
	}
	x, y := a.atTheKey(), b.atTheKey()
	paused, resume := pauseClusterCommit(t, metadata)
	first := recoveryAsync(func() response { return x.giveRecoveryCode(codes[0]) })
	waitClusterPause(t, paused)
	y.expect(y.giveRecoveryCode(codes[0]), http.StatusOK)
	resume()
	x.expect(recoveryAwait(t, first), http.StatusServiceUnavailable)
	x.expect(x.do("GET", "/mailboxes/INBOX", nil), http.StatusUnauthorized)
	y.mailbox("INBOX")
	expectError(t, x.giveRecoveryCode(codes[0]), http.StatusBadRequest, "wrong_code")
	x.expect(x.giveRecoveryCode(codes[1]), http.StatusOK)
	if left := x.recoveryCodesLeft(); left != 8 {
		t.Fatalf("%d codes left", left)
	}
}

func TestHTTP_CrossNodeCredentialWritersCannotResurrectSpentCode(t *testing.T) {
	for _, writer := range []string{"trust", "add key", "remove key", "signature counter"} {
		t.Run(writer, func(t *testing.T) {
			a, b, metadata := clusterRecoveryPair(t)
			key := newSoftKey(t)
			codes := a.firstKeyCodes(key, "laptop")
			var write func() response
			switch writer {
			case "trust":
				write = func() response { return a.setTrust(false, "") }
			case "add key":
				_, challenge := a.beginEnrolment()
				phone := newSoftKey(t)
				write = func() response { return a.finishEnrolment(phone, challenge, "phone") }
			case "remove key":
				phone := newSoftKey(t)
				a.enrolKey(phone, "phone")
				write = func() response {
					return a.do("POST", "/settings/2fa/credential/"+base64.URLEncoding.EncodeToString(phone.id)+"/delete", map[string]string{"current_password": testPassword})
				}
			case "signature counter":
				browser := a.atTheKey()
				assertion := browser.keyAssertion(key, 7)
				write = func() response { return browser.do("POST", "/webauthn/verify/finish", assertion) }
			}
			pending := b.atTheKey()
			paused, resume := pauseClusterCommit(t, metadata)
			first := recoveryAsync(write)
			waitClusterPause(t, paused)
			pending.expect(pending.giveRecoveryCode(codes[0]), http.StatusOK)
			resume()
			result := recoveryAwait(t, first)
			if writer == "signature counter" {
				a.expect(result, http.StatusOK)
			} else if result.status < 500 {
				t.Fatalf("stale writer answered %d: %s", result.status, result.body)
			}
			c := b.atTheKey()
			expectError(t, c.giveRecoveryCode(codes[0]), http.StatusBadRequest, "wrong_code")
			if left := a.recoveryCodesLeft(); left != 9 {
				t.Fatalf("spent code restored: %d left", left)
			}
		})
	}
}

func TestHTTP_CrossNodeRedemptionCannotUndoCodeRotation(t *testing.T) {
	a, b, metadata := clusterRecoveryPair(t)
	old := a.firstKeyCodes(newSoftKey(t), "laptop")
	owner := b.atTheKey()
	owner.expect(owner.giveRecoveryCode(old[9]), http.StatusOK)
	pending := a.atTheKey()
	paused, resume := pauseClusterCommit(t, metadata)
	first := recoveryAsync(func() response { return pending.giveRecoveryCode(old[0]) })
	waitClusterPause(t, paused)
	rotated := owner.newRecoveryCodes(testPassword)
	owner.expect(rotated, http.StatusOK)
	resume()
	pending.expect(recoveryAwait(t, first), http.StatusServiceUnavailable)
	var answer struct {
		Codes []string `json:"recovery_codes"`
	}
	rotated.json(t, &answer)
	expectError(t, pending.giveRecoveryCode(old[1]), http.StatusBadRequest, "wrong_code")
	pending.expect(pending.giveRecoveryCode(answer.Codes[0]), http.StatusOK)
}

func TestHTTP_ClusterAutomaticallyRecoversFromUnknownDelayedWrite(t *testing.T) {
	a, b, metadata := clusterRecoveryPair(t)
	codes := a.firstKeyCodes(newSoftKey(t), "laptop")
	x, y := a.atTheKey(), b.atTheKey()
	var armed atomic.Bool
	armed.Store(true)
	type delayedWrite struct {
		key string
		raw json.RawMessage
	}
	captured := make(chan delayedWrite, 1)
	var target atomic.Value
	target.Store("")
	var attempts atomic.Int32
	metadata.hook = func(key string, raw json.RawMessage) error {
		var envelope struct{ Committed bool }
		_ = json.Unmarshal(raw, &envelope)
		if envelope.Committed && strings.HasPrefix(key, "webauthn-state/") && armed.CompareAndSwap(true, false) {
			target.Store(key)
			captured <- delayedWrite{key, append(json.RawMessage(nil), raw...)}
		}
		if key == target.Load().(string) && envelope.Committed {
			attempts.Add(1)
			return io.ErrUnexpectedEOF
		}
		return nil
	}
	x.expect(x.giveRecoveryCode(codes[0]), http.StatusServiceUnavailable)
	x.expect(x.do("GET", "/mailboxes/INBOX", nil), http.StatusUnauthorized)
	y.expect(y.giveRecoveryCode(codes[0]), http.StatusOK)
	// The failed node's stale write finally arrives after the other node
	// authenticated. No operator clears a lock; it is permanently obsolete.
	if attempts.Load() != 1 {
		t.Fatalf("ambiguous credential write replayed %d times", attempts.Load())
	}
	delayed := <-captured
	metadata.apply(delayed.key, delayed.raw)
	c := b.atTheKey()
	expectError(t, c.giveRecoveryCode(codes[0]), http.StatusBadRequest, "wrong_code")
	c.expect(c.giveRecoveryCode(codes[1]), http.StatusOK)
}

func TestHTTP_CrossNodeDifferentCodesPreserveBothSuccessfulRedemptions(t *testing.T) {
	a, b, metadata := clusterRecoveryPair(t)
	codes := a.firstKeyCodes(newSoftKey(t), "laptop")
	x, y := a.atTheKey(), b.atTheKey()
	paused, resume := make(chan struct{}), make(chan struct{})
	var once sync.Once
	release := func() { once.Do(func() { close(resume) }) }
	t.Cleanup(release)
	var armed atomic.Bool
	armed.Store(true)
	metadata.afterApply = func(key string, raw json.RawMessage) {
		var envelope struct{ Committed bool }
		_ = json.Unmarshal(raw, &envelope)
		if envelope.Committed && strings.HasPrefix(key, "webauthn-state/") && armed.CompareAndSwap(true, false) {
			// The first state is durable, but its writer has not received the
			// reply or validated the fence. The second node incorporates it.
			close(paused)
			<-resume
		}
	}
	first := recoveryAsync(func() response { return x.giveRecoveryCode(codes[0]) })
	waitClusterPause(t, paused)
	y.expect(y.giveRecoveryCode(codes[1]), http.StatusOK)
	release()
	x.expect(recoveryAwait(t, first), http.StatusOK)
	if left := x.recoveryCodesLeft(); left != 8 {
		t.Fatalf("%d codes left", left)
	}
	z := b.atTheKey()
	expectError(t, z.giveRecoveryCode(codes[0]), http.StatusBadRequest, "wrong_code")
	expectError(t, z.giveRecoveryCode(codes[1]), http.StatusBadRequest, "wrong_code")
}

func TestHTTP_ClusterMigratesLegacyCodesAndDeletionNeverFallsBack(t *testing.T) {
	legacy := newTestServer(t)
	legacy.withWebAuthn()
	legacy.login()
	key := newSoftKey(t)
	codes := legacy.firstKeyCodes(key, "legacy laptop")
	old, ok := legacy.storedWebAuthn()
	if !ok {
		t.Fatal("no legacy record")
	}
	a, b, metadata := clusterRecoveryPair(t)
	if err := metadata.Put("webauthn", old); err != nil {
		t.Fatal(err)
	}
	pending := b.atTheKey()
	pending.expect(pending.giveRecoveryCode(codes[0]), http.StatusOK)
	if left := pending.recoveryCodesLeft(); left != 9 {
		t.Fatalf("legacy codes did not migrate: %d", left)
	}
	pending.expect(pending.do("POST", "/settings/2fa/credential/"+base64.URLEncoding.EncodeToString(key.id)+"/delete", map[string]string{"current_password": testPassword}), http.StatusOK)
	fresh := a.anotherBrowser()
	r := fresh.signIn()
	fresh.expect(r, http.StatusOK)
	var answer struct {
		Requires bool `json:"requires_2fa"`
	}
	r.json(t, &answer)
	if answer.Requires {
		t.Fatal("deletion fell back to legacy credentials")
	}
	fresh.mailbox("INBOX")
	// Bootstrap data is left intact, but no reader may resurrect it after a
	// versioned deletion tombstone, even from a different instance.
	var retained map[string]any
	if err := metadata.Get("webauthn", &retained); err != nil || retained["enabled"] != true {
		t.Fatalf("legacy bootstrap changed: %v %v", retained, err)
	}
}

func TestHTTP_CrossNodeMalformedRecordEnrollmentCannotClaimPartialSuccess(t *testing.T) {
	a, b, metadata := clusterRecoveryPair(t)
	_, challenge := a.beginEnrolment()
	firstKey := newSoftKey(t)
	if err := metadata.Put("webauthn", "malformed credential record"); err != nil {
		t.Fatal(err)
	}
	paused, release := make(chan struct{}), make(chan struct{})
	var once sync.Once
	resume := func() { once.Do(func() { close(release) }) }
	t.Cleanup(resume)
	var armed atomic.Bool
	armed.Store(true)
	metadata.hook = func(key string, raw json.RawMessage) error {
		var envelope struct {
			Committed bool
			Data      struct{ Credentials []struct{ Name string } }
		}
		_ = json.Unmarshal(raw, &envelope)
		if envelope.Committed && len(envelope.Data.Credentials) > 0 && envelope.Data.Credentials[0].Name == "first" && armed.CompareAndSwap(true, false) {
			close(paused)
			<-release
		}
		return nil
	}
	first := recoveryAsync(func() response { return a.finishEnrolment(firstKey, challenge, "first") })
	waitClusterPause(t, paused)
	// Another node repairs the bootstrap entry and completes its own first
	// enrollment while the original enrollment's snapshot is still delayed.
	b.login()
	secondKey := newSoftKey(t)
	codes := b.firstKeyCodes(secondKey, "second")
	resume()
	result := recoveryAwait(t, first)
	if result.status < 500 {
		t.Fatalf("unretained enrollment reported success: %d %s", result.status, result.body)
	}
	if count := b.webAuthnSettings().CredentialCount; count != 1 {
		t.Fatalf("%d keys retained", count)
	}
	pending := a.atTheKey()
	pending.expect(pending.giveRecoveryCode(codes[0]), http.StatusOK)
}
