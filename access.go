package alps

import (
	"context"
	"net/http"
	"time"
)

// accessRecord collects who made a request, for the line logged once it has
// been answered. The line is opened before routing and the session is read
// deeper in, by the auth middleware or by a sign-in, so it is noted on the way
// down and read on the way out. Nil when the access log is off.
type accessRecord struct {
	user    string
	session string
}

type accessRecordKey struct{}

func accessRecordFrom(r *http.Request) *accessRecord {
	a, _ := r.Context().Value(accessRecordKey{}).(*accessRecord)
	return a
}

// noteSession names the session the request was made in. The first one noted
// stands: a switch to a linked account was asked for by the account it left.
func (a *accessRecord) noteSession(s *Session) {
	if a == nil || s == nil || a.session != "" {
		return
	}
	a.user = s.username
	a.session = s.id
}

// accessWriter remembers the status and size of an answer for the access line.
type accessWriter struct {
	http.ResponseWriter
	status int
	bytes  int64
}

func (w *accessWriter) WriteHeader(code int) {
	if w.status == 0 && code >= 200 {
		w.status = code
	}
	w.ResponseWriter.WriteHeader(code)
}

func (w *accessWriter) Write(b []byte) (int, error) {
	if w.status == 0 {
		w.status = http.StatusOK
	}
	n, err := w.ResponseWriter.Write(b)
	w.bytes += int64(n)
	return n, err
}

// Unwrap lets http.ResponseController reach the connection's own writer, to
// flush or to set a deadline.
func (w *accessWriter) Unwrap() http.ResponseWriter {
	return w.ResponseWriter
}

func (s *Server) accessLogEnabled() bool {
	return s != nil && s.Options != nil && s.Options.AccessLog
}

// serveLogged serves req and logs one line for it: what was asked, by whom,
// from where, how it was answered and how long that took. The query string is
// left out: it carries search terms and the addresses of remote images.
func (s *Server) serveLogged(h http.Handler, w http.ResponseWriter, req *http.Request) {
	start := time.Now()
	record := &accessRecord{}
	aw := &accessWriter{ResponseWriter: w}
	h.ServeHTTP(aw, req.WithContext(context.WithValue(req.Context(), accessRecordKey{}, record)))

	status := aw.status
	if status == 0 {
		status = http.StatusOK
	}
	args := []any{
		"method", req.Method,
		"path", req.URL.Path,
		"status", status,
		"bytes", aw.bytes,
		"duration_ms", float64(time.Since(start).Microseconds()) / 1000,
		"ip", getClientIP(req, s.Options.TrustedProxies),
	}
	if record.user != "" {
		args = append(args, "user", record.user, "session", record.session)
	}
	s.Logger().Slog().Info("request", args...)
}
