package alpsbase

import (
	"encoding/base64"
	"errors"
	"net/http"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

// recoveryReadGate pauses one credential read after it has copied the stored
// record. A competing writer that bypasses the account lock can then finish
// before the paused request saves its stale copy. This forces the interleaving
// from the review rather than hoping a stress run happens to hit it.
type recoveryReadGate struct {
	armed         atomic.Bool
	active        atomic.Bool
	failWrite     atomic.Bool
	read          chan struct{}
	overtaken     chan struct{}
	resume        chan struct{}
	resumeOnce    sync.Once
	overtakenOnce sync.Once
}

func (g *recoveryReadGate) release() { g.resumeOnce.Do(func() { close(g.resume) }) }

type recoveryRaceProvider struct {
	provider.MailProvider
	gate *recoveryReadGate
}

func (p recoveryRaceProvider) GetStore() (provider.Store, error) {
	s, err := p.MailProvider.GetStore()
	return recoveryRaceStore{s, p.gate}, err
}

type recoveryRaceStore struct {
	provider.Store
	gate *recoveryReadGate
}

func (s recoveryRaceStore) GetFresh(key string, out interface{}) error {
	err := provider.GetFresh(s.Store, key, out)
	if key != "webauthn" || err != nil {
		return err
	}
	g := s.gate
	if g.armed.CompareAndSwap(true, false) {
		g.active.Store(true)
		close(g.read)
		<-g.resume
		g.active.Store(false)
	} else if g.active.Load() {
		g.overtakenOnce.Do(func() { close(g.overtaken) })
	}
	return err
}

func (s recoveryRaceStore) Put(key string, v interface{}) error {
	if key == "webauthn" && s.gate.failWrite.Load() {
		return errors.New("metadata write refused")
	}
	return s.Store.Put(key, v)
}

func recoveryRaceServer(t *testing.T) (*testServer, *recoveryReadGate) {
	t.Helper()
	g := &recoveryReadGate{read: make(chan struct{}), overtaken: make(chan struct{}), resume: make(chan struct{})}
	s := newTestServerWrapping(t, "smtp://127.0.0.1:1", alps.NewLogger(), func(p provider.MailProvider) provider.MailProvider {
		return recoveryRaceProvider{p, g}
	})
	t.Cleanup(g.release)
	s.withWebAuthn()
	s.login()
	return s, g
}

func recoveryAsync(f func() response) <-chan response {
	done := make(chan response, 1)
	go func() { done <- f() }()
	return done
}

func recoveryAwait(t *testing.T, done <-chan response) response {
	t.Helper()
	select {
	case r := <-done:
		return r
	case <-time.After(5 * time.Second):
		t.Fatal("credential request did not finish")
		return response{}
	}
}

func (g *recoveryReadGate) interleave(t *testing.T, first, second func() response) (response, response) {
	t.Helper()
	g.armed.Store(true)
	a := recoveryAsync(first)
	select {
	case <-g.read:
	case <-time.After(5 * time.Second):
		t.Fatal("first request did not read the credential record")
	}
	b := recoveryAsync(second)
	select {
	case <-g.overtaken:
		// On the broken implementation, let the second writer finish, then
		// allow the first to overwrite it. With the account lock the second
		// cannot read until the first is released.
		rb := recoveryAwait(t, b)
		g.release()
		return recoveryAwait(t, a), rb
	case <-time.After(100 * time.Millisecond):
		g.release()
		return recoveryAwait(t, a), recoveryAwait(t, b)
	}
}

func TestHTTP_ConcurrentCredentialWritersCannotRestoreSpentRecoveryCode(t *testing.T) {
	for _, writer := range []string{"trust", "add key", "remove key", "signature counter"} {
		t.Run(writer, func(t *testing.T) {
			s, gate := recoveryRaceServer(t)
			key := newSoftKey(t)
			codes := s.firstKeyCodes(key, "laptop")
			var write func() response
			switch writer {
			case "trust":
				write = func() response { return s.setTrust(false, "") }
			case "add key":
				_, challenge := s.beginEnrolment()
				phone := newSoftKey(t)
				write = func() response { return s.finishEnrolment(phone, challenge, "phone") }
			case "remove key":
				phone := newSoftKey(t)
				s.enrolKey(phone, "phone")
				write = func() response {
					return s.do("POST", "/settings/2fa/credential/"+base64.URLEncoding.EncodeToString(phone.id)+"/delete", map[string]string{"current_password": testPassword})
				}
			case "signature counter":
				browser := s.atTheKey()
				assertion := browser.keyAssertion(key, 7)
				write = func() response { return browser.do("POST", "/webauthn/verify/finish", assertion) }
			}
			b, c := s.atTheKey(), s.atTheKey()
			ra, rb := gate.interleave(t, write, func() response { return b.giveRecoveryCode(codes[0]) })
			s.expect(ra, http.StatusOK)
			b.expect(rb, http.StatusOK)
			expectError(t, c.giveRecoveryCode(codes[0]), http.StatusBadRequest, "wrong_code")
			c.expect(c.do("GET", "/mailboxes/INBOX", nil), http.StatusUnauthorized)
			if left := s.recoveryCodesLeft(); left != 9 {
				t.Fatalf("%d codes left, want 9", left)
			}
		})
	}
}

func TestHTTP_ConcurrentRedemptionCannotUndoRecoveryCodeRotation(t *testing.T) {
	s, gate := recoveryRaceServer(t)
	old := s.firstKeyCodes(newSoftKey(t), "laptop")
	b, c := s.atTheKey(), s.atTheKey()
	ra, rb := gate.interleave(t, func() response { return b.giveRecoveryCode(old[0]) }, func() response { return s.newRecoveryCodes(testPassword) })
	b.expect(ra, http.StatusOK)
	s.expect(rb, http.StatusOK)
	var answer struct {
		Codes []string `json:"recovery_codes"`
	}
	rb.json(t, &answer)
	if len(answer.Codes) != 10 {
		t.Fatalf("new codes: %s", rb.body)
	}
	expectError(t, c.giveRecoveryCode(old[1]), http.StatusBadRequest, "wrong_code")
	c.expect(c.giveRecoveryCode(answer.Codes[0]), http.StatusOK)
	if left := c.recoveryCodesLeft(); left != 9 {
		t.Fatalf("%d codes left, want 9 from the new set", left)
	}
}

func TestHTTP_ConcurrentRecoveryCodeRedemption(t *testing.T) {
	for _, same := range []bool{true, false} {
		name := "different codes"
		if same {
			name = "same code"
		}
		t.Run(name, func(t *testing.T) {
			s, gate := recoveryRaceServer(t)
			codes := s.firstKeyCodes(newSoftKey(t), "laptop")
			b, c := s.atTheKey(), s.atTheKey()
			second := codes[1]
			if same {
				second = codes[0]
			}
			ra, rb := gate.interleave(t, func() response { return b.giveRecoveryCode(codes[0]) }, func() response { return c.giveRecoveryCode(second) })
			b.expect(ra, http.StatusOK)
			left := 8
			if same {
				expectError(t, rb, http.StatusBadRequest, "wrong_code")
				c.expect(c.do("GET", "/mailboxes/INBOX", nil), http.StatusUnauthorized)
				left = 9
			} else {
				c.expect(rb, http.StatusOK)
			}
			if got := s.recoveryCodesLeft(); got != left {
				t.Fatalf("%d codes left, want %d", got, left)
			}
		})
	}
}

func TestHTTP_RecoveryCodeWriteFailureDoesNotAuthenticate(t *testing.T) {
	s, gate := recoveryRaceServer(t)
	codes := s.firstKeyCodes(newSoftKey(t), "laptop")
	b := s.atTheKey()
	gate.failWrite.Store(true)
	expectError(t, b.giveRecoveryCode(codes[0]), http.StatusServiceUnavailable, "keys_unavailable")
	b.expect(b.do("GET", "/mailboxes/INBOX", nil), http.StatusUnauthorized)
	gate.failWrite.Store(false)
	b.expect(b.giveRecoveryCode(codes[0]), http.StatusOK)
	if left := b.recoveryCodesLeft(); left != 9 {
		t.Fatalf("%d codes left, want 9", left)
	}
}

func TestHTTP_MalformedCredentialCleanupCannotDeleteConcurrentEnrollment(t *testing.T) {
	s, gate := recoveryRaceServer(t)
	s.firstKeyCodes(newSoftKey(t), "laptop")
	_, challenge := s.beginEnrolment()
	phone := newSoftKey(t)
	store, err := s.store.GetStore()
	if err != nil {
		t.Fatal(err)
	}
	if err := store.Put("webauthn", "not a credential record"); err != nil {
		t.Fatal(err)
	}
	b := s.anotherBrowser()
	ra, rb := gate.interleave(t, b.signIn, func() response { return s.finishEnrolment(phone, challenge, "phone") })
	b.expect(ra, http.StatusOK)
	s.expect(rb, http.StatusOK)
	if keys := s.webAuthnSettings().CredentialCount; keys != 1 {
		t.Fatalf("cleanup deleted the newly enrolled key: %d keys", keys)
	}
}

func TestHTTP_BlockedCredentialWriteDoesNotBlockAnotherAccount(t *testing.T) {
	s, gate := recoveryRaceServer(t)
	s.addBob()
	s.firstKeyCodes(newSoftKey(t), "laptop")
	gate.armed.Store(true)
	a := recoveryAsync(func() response { return s.setTrust(false, "") })
	select {
	case <-gate.read:
	case <-time.After(5 * time.Second):
		t.Fatal("credential request did not read")
	}
	b := s.anotherBrowser()
	done := recoveryAsync(func() response {
		return b.do("POST", "/session", map[string]string{"username": bobUser, "password": bobPassword})
	})
	b.expect(recoveryAwait(t, done), http.StatusOK)
	b.mailbox("INBOX")
	gate.release()
	s.expect(recoveryAwait(t, a), http.StatusOK)
}

type recoveryClusterBroadcaster struct{}

func (recoveryClusterBroadcaster) Broadcast([]byte) {}

func TestHTTP_ClusterDoesNotIssueRecoveryCodes(t *testing.T) {
	s := newTestServerWithOptions(t, "smtp://127.0.0.1:1", alps.NewLogger(), func(o *alps.Options) {
		o.ClusterBroadcaster = recoveryClusterBroadcaster{}
	})
	s.withWebAuthn()
	s.login()
	key := newSoftKey(t)
	if codes := s.enrolKeyForCodes(key, "laptop"); len(codes) != 0 {
		t.Fatalf("cluster issued %d recovery codes", len(codes))
	}
	settings := s.webAuthnSettings()
	if settings.RecoveryCodesAvailable || settings.RecoveryCodesLeft != 0 {
		t.Fatalf("cluster offers recovery codes: %+v", settings)
	}
	expectError(t, s.newRecoveryCodes(testPassword), http.StatusServiceUnavailable, "recovery_unavailable")
	pending := s.atTheKey()
	begin := pending.do("POST", "/webauthn/verify/begin", nil)
	pending.expect(begin, http.StatusOK)
	var options struct {
		RecoveryCodesAvailable *bool `json:"recoveryCodesAvailable"`
	}
	begin.json(t, &options)
	if options.RecoveryCodesAvailable == nil || *options.RecoveryCodesAvailable {
		t.Fatalf("key page was not told recovery is unavailable: %s", begin.body)
	}
	b, r := s.signInWithKey(key, 1)
	b.expect(r, http.StatusOK)
	b.mailbox("INBOX")
}

// The same previously issued code must be refused by both nodes, even when
// their session managers and locks are independent and the record is shared.
func TestHTTP_TwoClusterNodesRefusePreviouslyIssuedRecoveryCodes(t *testing.T) {
	s := newTestServer(t)
	s.withWebAuthn()
	s.login()
	key := newSoftKey(t)
	codes := s.firstKeyCodes(key, "laptop")
	for range 2 {
		node := newTestServerWithOptions(t, "smtp://127.0.0.1:1", alps.NewLogger(), func(o *alps.Options) {
			o.Provider = s.server.Options.Provider
			o.ClusterBroadcaster = recoveryClusterBroadcaster{}
		})
		node.withWebAuthn()
		b := node.atTheKey()
		expectError(t, b.giveRecoveryCode(codes[0]), http.StatusServiceUnavailable, "recovery_unavailable")
		b.expect(b.do("GET", "/mailboxes/INBOX", nil), http.StatusUnauthorized)
		// Security-key sign-in continues to work on the same pending session.
		b.expect(b.giveKey(key, 1), http.StatusOK)
		b.mailbox("INBOX")
		expectError(t, b.newRecoveryCodes(testPassword), http.StatusServiceUnavailable, "recovery_unavailable")
		if b.webAuthnSettings().RecoveryCodesAvailable {
			t.Fatal("cluster offers new codes")
		}
	}
	if left := s.recoveryCodesLeft(); left != 10 {
		t.Fatalf("cluster consumed codes: %d left", left)
	}
}

func TestHTTP_QueuedRecoveryGuessesCheckTheLimitAfterWaiting(t *testing.T) {
	gate := &recoveryReadGate{read: make(chan struct{}), overtaken: make(chan struct{}), resume: make(chan struct{})}
	s, config := newLimitedServer(t, func(o *alps.Options) {
		o.Provider = wrappedOptions{o.Provider, func(p provider.MailProvider) provider.MailProvider {
			return recoveryRaceProvider{p, gate}
		}}
	})
	t.Cleanup(gate.release)
	s.withWebAuthn()
	s.login()
	codes := s.firstKeyCodes(newSoftKey(t), "laptop")
	const tries = 12
	browsers := make([]*testServer, tries)
	for i := range browsers {
		browsers[i] = s.atTheKey()
	}
	gate.armed.Store(true)
	results := make([]<-chan response, tries)
	results[0] = recoveryAsync(func() response { return browsers[0].giveRecoveryCode("zzzzz-zzzzz") })
	select {
	case <-gate.read:
	case <-time.After(5 * time.Second):
		t.Fatal("first guess did not read")
	}
	for i := 1; i < tries; i++ {
		results[i] = recoveryAsync(func() response { return browsers[i].giveRecoveryCode("zzzzz-zzzzz") })
	}
	// Give the HTTP requests a chance to queue while the first guess is held.
	// The account lock must cover the limit check, not just reading the codes.
	select {
	case <-gate.overtaken:
	case <-time.After(100 * time.Millisecond):
	}
	gate.release()
	wrong, limited := 0, 0
	for _, result := range results {
		r := recoveryAwait(t, result)
		switch r.status {
		case http.StatusBadRequest:
			wrong++
		case http.StatusTooManyRequests:
			limited++
		default:
			t.Fatalf("guess answered %d: %s", r.status, r.body)
		}
	}
	if wrong != config.UsernameFailsPerQuarter || limited != tries-wrong {
		t.Fatalf("%d checked guesses, %d limited; want %d checked", wrong, limited, config.UsernameFailsPerQuarter)
	}
	expectError(t, browsers[0].giveRecoveryCode(codes[0]), http.StatusTooManyRequests, "rate_limited")
	if left := s.recoveryCodesLeft(); left != 10 {
		t.Fatalf("a limited request spent a code: %d left", left)
	}
}
