package alps

import (
	"bytes"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"testing/fstest"
	"time"

	"github.com/fernet/fernet-go"
	"github.com/migadu/alps/provider"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

// logBuffer collects JSON log lines written from more than one goroutine.
type logBuffer struct {
	mu sync.Mutex
	b  bytes.Buffer
}

func (l *logBuffer) Write(p []byte) (int, error) {
	l.mu.Lock()
	defer l.mu.Unlock()
	return l.b.Write(p)
}

func (l *logBuffer) String() string {
	l.mu.Lock()
	defer l.mu.Unlock()
	return l.b.String()
}

// lines decodes the logged lines whose message is msg.
func (l *logBuffer) lines(t *testing.T, msg string) []map[string]any {
	t.Helper()
	var out []map[string]any
	for _, line := range strings.Split(strings.TrimSpace(l.String()), "\n") {
		if line == "" {
			continue
		}
		var m map[string]any
		require.NoError(t, json.Unmarshal([]byte(line), &m), line)
		if m["msg"] == msg {
			out = append(out, m)
		}
	}
	return out
}

func newBufferLogger(w *logBuffer) Logger {
	level := &slog.LevelVar{}
	return &logger{slog: slog.New(slog.NewJSONHandler(w, &slog.HandlerOptions{Level: level})), level: level}
}

func newLoggedSessionManager(t *testing.T, logger Logger, idle time.Duration) *SessionManager {
	t.Helper()
	mockProvider := &provider.MockProvider{}
	mockStore := &provider.MockStore{}
	mockProvider.On("Close").Return(nil)
	mockProvider.On("GetStore").Return(mockStore, nil)
	mockStore.On("Get", mock.Anything, mock.Anything).Return(provider.ErrNoStoreEntry)
	var loginKey fernet.Key
	loginKey.Generate()
	return newSessionManager(
		func(username, password string) (provider.MailProvider, error) { return mockProvider, nil },
		nil, logger, 10*time.Minute, false, &loginKey, idle, 24*time.Hour, 100, 10, 32, 128, 1024,
	)
}

// waitGone waits for a closed or expired session to leave the manager. Its end
// is logged before it does.
func waitGone(t *testing.T, sm *SessionManager, token string) {
	t.Helper()
	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		if _, err := sm.Get(token); errors.Is(err, ErrSessionExpired) {
			return
		}
		time.Sleep(5 * time.Millisecond)
	}
	t.Fatal("the session was never removed")
}

// Every request is logged once answered: what was asked, how it was answered,
// from where and, once signed in, by whom. A switch to another account is
// logged as asked by the account it left. Neither the session token nor the
// query string reaches the log.
func TestAccessLogNamesWhoAsked(t *testing.T) {
	var buf logBuffer
	log := newBufferLogger(&buf)
	sm := newLoggedSessionManager(t, log, 30*time.Minute)
	t.Cleanup(sm.Close)
	session, err := sm.Put("ada@example.com", "pass")
	require.NoError(t, err)

	server := &Server{logger: log, Options: &Options{AccessLog: true}, Sessions: sm}
	router := NewRouter(server)
	server.setupMiddleware(router)
	router.GET("/mailboxes", func(ctx *Context) error {
		return ctx.String(http.StatusOK, "ok")
	})
	var switched *Session
	router.POST("/switch", func(ctx *Context) error {
		var err error
		switched, err = ctx.Server.Sessions.Put("grace@example.com", "pass")
		if err != nil {
			return err
		}
		ctx.Session.CloseWithReason("switched")
		ctx.SetSession(switched)
		return ctx.String(http.StatusOK, "ok")
	})
	router.StaticFS("", http.FS(fstest.MapFS{
		"app.js": &fstest.MapFile{Data: []byte("console.log(1)")},
	}))

	send := func(method, target string, signedIn bool) {
		req := httptest.NewRequest(method, "http://example.com"+target, nil)
		req.Header.Set("Origin", "http://example.com")
		if signedIn {
			req.AddCookie(&http.Cookie{Name: cookieName, Value: session.Token()})
		}
		router.ServeHTTP(httptest.NewRecorder(), req)
	}
	send(http.MethodGet, "/mailboxes?query=secret+words", true)
	send(http.MethodGet, "/mailboxes", false)
	send(http.MethodGet, "/app.js", false)
	send(http.MethodPost, "/switch", true)

	lines := buf.lines(t, "request")
	require.Len(t, lines, 4, buf.String())

	assert.Equal(t, "GET", lines[0]["method"])
	assert.Equal(t, "/mailboxes", lines[0]["path"])
	assert.EqualValues(t, http.StatusOK, lines[0]["status"])
	assert.EqualValues(t, 2, lines[0]["bytes"])
	assert.Equal(t, "192.0.2.1", lines[0]["ip"])
	assert.Equal(t, "ada@example.com", lines[0]["user"])
	assert.Equal(t, session.ID(), lines[0]["session"])
	assert.Contains(t, lines[0], "duration_ms")

	assert.EqualValues(t, http.StatusUnauthorized, lines[1]["status"])
	assert.NotContains(t, lines[1], "user")

	assert.Equal(t, "/app.js", lines[2]["path"])
	assert.EqualValues(t, http.StatusOK, lines[2]["status"])
	assert.NotContains(t, lines[2], "user")

	require.NotNil(t, switched)
	assert.Equal(t, "ada@example.com", lines[3]["user"], "a switch is asked for by the account it leaves")
	assert.Equal(t, session.ID(), lines[3]["session"])

	assert.NotContains(t, buf.String(), session.Token())
	assert.NotContains(t, buf.String(), switched.Token())
	assert.NotContains(t, buf.String(), "secret")
}

func TestAccessLogOff(t *testing.T) {
	var buf logBuffer
	server := &Server{logger: newBufferLogger(&buf), Options: &Options{}}
	router := NewRouter(server)
	router.GET("/thing", func(ctx *Context) error {
		return ctx.String(http.StatusOK, "ok")
	})
	router.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/thing", nil))
	assert.Empty(t, buf.lines(t, "request"))
}

// The status logged is the one the client got, whether the handler wrote it
// itself, answered with a body alone, or wrote nothing at all.
func TestAccessWriterStatus(t *testing.T) {
	for name, tc := range map[string]struct {
		write func(w http.ResponseWriter)
		want  int
	}{
		"explicit":   {func(w http.ResponseWriter) { w.WriteHeader(http.StatusNotFound) }, http.StatusNotFound},
		"body alone": {func(w http.ResponseWriter) { w.Write([]byte("hi")) }, http.StatusOK},
		"nothing":    {func(w http.ResponseWriter) {}, http.StatusOK},
		"twice":      {func(w http.ResponseWriter) { w.WriteHeader(http.StatusCreated); w.WriteHeader(http.StatusTeapot) }, http.StatusCreated},
	} {
		t.Run(name, func(t *testing.T) {
			var buf logBuffer
			server := &Server{logger: newBufferLogger(&buf), Options: &Options{AccessLog: true}}
			server.serveLogged(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { tc.write(w) }),
				httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/x", nil))
			lines := buf.lines(t, "request")
			require.Len(t, lines, 1)
			assert.EqualValues(t, tc.want, lines[0]["status"])
		})
	}
}

// A session a browser held is logged when it ends, with why and after how
// long. The ones alps opens for itself are not, and neither are those a
// shutdown closes: the browser's login token signs those back in.
func TestSessionEndIsLogged(t *testing.T) {
	end := func(t *testing.T, idle, maxAge time.Duration, issued bool, close func(*SessionManager, *Session)) []map[string]any {
		t.Helper()
		var buf logBuffer
		sm := newLoggedSessionManager(t, newBufferLogger(&buf), idle)
		if maxAge > 0 {
			sm.absoluteSessionDuration = maxAge
		}
		s, err := sm.Put("ada@example.com", "pass")
		require.NoError(t, err)
		if issued {
			ctx := NewContext(httptest.NewRecorder(), httptest.NewRequest(http.MethodPost, "/session", nil), &Server{})
			ctx.SetSession(s)
		}
		close(sm, s)
		waitGone(t, sm, s.Token())
		lines := buf.lines(t, "session ended")
		for _, l := range lines {
			assert.Equal(t, "ada@example.com", l["user"])
			assert.Equal(t, s.ID(), l["session"])
			assert.Contains(t, l, "duration")
		}
		assert.NotContains(t, buf.String(), s.Token())
		return lines
	}

	t.Run("sign-out", func(t *testing.T) {
		lines := end(t, 30*time.Minute, 0, true, func(_ *SessionManager, s *Session) { s.CloseWithReason("sign-out") })
		require.Len(t, lines, 1)
		assert.Equal(t, "sign-out", lines[0]["reason"])
	})
	t.Run("idle", func(t *testing.T) {
		lines := end(t, 50*time.Millisecond, 0, true, func(*SessionManager, *Session) {})
		require.Len(t, lines, 1)
		assert.Equal(t, "idle", lines[0]["reason"])
	})
	t.Run("max-age", func(t *testing.T) {
		// The cap is floored at the idle window, so the two are equal here and
		// the cap is what is reached.
		lines := end(t, 50*time.Millisecond, 50*time.Millisecond, true, func(*SessionManager, *Session) {})
		require.Len(t, lines, 1)
		assert.Equal(t, "max-age", lines[0]["reason"])
	})
	t.Run("only the first reason counts", func(t *testing.T) {
		lines := end(t, 30*time.Minute, 0, true, func(_ *SessionManager, s *Session) {
			s.CloseWithReason("switched")
			s.CloseWithReason("sign-out")
		})
		require.Len(t, lines, 1)
		assert.Equal(t, "switched", lines[0]["reason"])
	})
	t.Run("never issued", func(t *testing.T) {
		assert.Empty(t, end(t, 30*time.Minute, 0, false, func(_ *SessionManager, s *Session) { s.Close() }))
	})
	t.Run("shutdown", func(t *testing.T) {
		assert.Empty(t, end(t, 30*time.Minute, 0, true, func(sm *SessionManager, _ *Session) { sm.Close() }))
	})
}

func TestSessionLogIDHidesTheToken(t *testing.T) {
	id := sessionLogID("c2VjcmV0LXRva2Vu")
	assert.Len(t, id, 12)
	assert.Equal(t, id, sessionLogID("c2VjcmV0LXRva2Vu"))
	assert.NotEqual(t, id, sessionLogID("c2VjcmV0LXRva2Vv"))
	assert.NotContains(t, "c2VjcmV0LXRva2Vu", id)
}
