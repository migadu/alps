package alpscaldav

import (
	"net/http"
	"testing"
)

// davAnswer is what a CalDAV server answers one request with.
type davAnswer struct {
	status int
	body   string
}

// renamesAnswered stands in front of the CalDAV server and answers a rename:
// the PROPPATCH with *proppatch, and the POST alps sends when the PROPPATCH
// is not understood with *post.
func renamesAnswered(proppatch, post *davAnswer) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var a *davAnswer
			switch r.Method {
			case "PROPPATCH":
				a = proppatch
			case http.MethodPost:
				a = post
			}
			if a == nil || a.status == 0 {
				next.ServeHTTP(w, r)
				return
			}
			if a.body != "" {
				w.Header().Set("Content-Type", "application/xml; charset=utf-8")
			}
			w.WriteHeader(a.status)
			w.Write([]byte(a.body))
		})
	}
}

// displayNameAnswered is a 207 Multi-Status that gives the display name the
// status line status.
func displayNameAnswered(status string) davAnswer {
	return davAnswer{http.StatusMultiStatus, `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">
  <D:response>
    <D:href>` + testCalendar + `</D:href>
    <D:propstat>
      <D:prop><D:displayname/></D:prop>
      <D:status>HTTP/1.1 ` + status + `</D:status>
    </D:propstat>
  </D:response>
</D:multistatus>`}
}

// A 207 Multi-Status is the usual answer to a PROPPATCH, whether or not the
// server set the property: a refusal of the name, a 403 or a 409, is in the
// propstat that answers for it. alps took every 207 for a rename done, so
// the page said the calendar was renamed and the next read gave its old name
// back. The rename now succeeds only when the display name's propstat is
// 2xx, through the PROPPATCH or the POST alps falls back to; otherwise the
// route fails, and the page says the calendar was not saved.
func TestRenameReadsTheMultiStatus(t *testing.T) {
	notUnderstood := davAnswer{status: http.StatusMethodNotAllowed}
	for _, c := range []struct {
		what            string
		proppatch, post davAnswer
		renamed         bool
	}{
		{what: "the name taken", proppatch: displayNameAnswered("200 OK"), renamed: true},
		{what: "the name taken, in another server's spelling", proppatch: davAnswer{http.StatusMultiStatus, `<multistatus xmlns="DAV:"><response><href>` + testCalendar + `</href><propstat><prop><displayname/></prop><status>HTTP/1.1 200 OK</status></propstat></response></multistatus>`}, renamed: true},
		{what: "a 2xx other than 207", proppatch: davAnswer{status: http.StatusNoContent}, renamed: true},
		{what: "the name refused", proppatch: displayNameAnswered("403 Forbidden")},
		{what: "the name in conflict", proppatch: displayNameAnswered("409 Conflict")},
		{what: "the name failed along with another property", proppatch: displayNameAnswered("424 Failed Dependency")},
		{what: "the calendar refused as a whole", proppatch: davAnswer{http.StatusMultiStatus, `<D:multistatus xmlns:D="DAV:"><D:response><D:href>` + testCalendar + `</D:href><D:status>HTTP/1.1 403 Forbidden</D:status></D:response></D:multistatus>`}},
		{what: "a 207 that says nothing of the name", proppatch: davAnswer{http.StatusMultiStatus, `<D:multistatus xmlns:D="DAV:"><D:response><D:href>` + testCalendar + `</D:href><D:propstat><D:prop><X:color xmlns:X="urn:x"/></D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response></D:multistatus>`}},
		{what: "a 207 that cannot be read", proppatch: davAnswer{http.StatusMultiStatus, "<D:multistatus"}},
		{what: "a refusal in the status line", proppatch: davAnswer{status: http.StatusForbidden}},
		{what: "the name taken through POST", proppatch: notUnderstood, post: displayNameAnswered("200 OK"), renamed: true},
		{what: "the name refused through POST", proppatch: notUnderstood, post: displayNameAnswered("403 Forbidden")},
	} {
		t.Run(c.what, func(t *testing.T) {
			h := startHarness(t, harnessOptions{wrap: renamesAnswered(&c.proppatch, &c.post)})
			r := h.do("PATCH", "/calendar/calendars/"+pathParam(testCalendar), map[string]string{"name": "Projects"})
			if renamed := r.status == http.StatusOK; renamed != c.renamed {
				t.Fatalf("status %d, renamed %v, want %v: %s", r.status, renamed, c.renamed, r.body)
			}
		})
	}
}
