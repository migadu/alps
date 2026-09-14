// Package davsave writes a CalDAV or CardDAV object only while it is still the
// version that was read.
//
// go-webdav's PutCalendarObject and PutAddressObject send no precondition (both
// carry a TODO for If-Match), so an edit that read an object, changed it and
// wrote it back overwrote whatever another client had saved in between: a
// contact edited on a phone while it was open here lost the phone's change,
// with neither side told. This sends the same PUT with If-Match, and reports
// the server's 412 as ErrConflict so a caller can say what happened instead.
package davsave

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"path"
	"strconv"
	"strings"
)

// ErrConflict is a write the server refused because the object is no longer
// the version it was read at.
var ErrConflict = errors.New("davsave: the object changed since it was read")

// URL resolves an object href against the DAV endpoint the way go-webdav's own
// client does: a server-rooted href is used as it is, a relative one is joined
// onto the endpoint's path.
func URL(endpoint *url.URL, href string) string {
	p := href
	if !strings.HasPrefix(p, "/") {
		p = path.Join(endpoint.Path, p)
	}
	return (&url.URL{Scheme: endpoint.Scheme, User: endpoint.User, Host: endpoint.Host, Path: p}).String()
}

// Put writes body to target. With an etag, the write carries If-Match, so a
// server holding a newer version refuses it rather than letting it replace
// that version; with none (a create, or a server that gives no ETags) it is an
// unconditional PUT, as before.
//
// It returns the ETag of the version just written, or "" when the response
// carried none: RFC 4791 §5.3.4 lets a server withhold it when what it stored
// differs from what it was sent.
func Put(ctx context.Context, hc *http.Client, target, contentType string, body []byte, etag string) (string, error) {
	// A bytes.Reader, so the request states its Content-Length: some servers
	// refuse a chunked PUT (go-webdav buffers for the same reason).
	req, err := http.NewRequestWithContext(ctx, http.MethodPut, target, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", contentType)
	// Not for a weak ETag: If-Match compares strongly (RFC 9110 §13.1.1), so a
	// weak one matches nothing and every save would be refused. Such a write
	// goes out unconditional, as it did before; the caller's own comparison of
	// the version it read is still made.
	if etag != "" && !strings.HasPrefix(etag, "W/") {
		req.Header.Set("If-Match", `"`+Unquote(etag)+`"`)
	}

	resp, err := hc.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	_, _ = io.Copy(io.Discard, io.LimitReader(resp.Body, 64<<10))

	switch {
	case resp.StatusCode == http.StatusPreconditionFailed:
		return "", ErrConflict
	case resp.StatusCode/100 != 2:
		return "", fmt.Errorf("davsave: PUT failed: %s", resp.Status)
	}
	return Unquote(resp.Header.Get("ETag")), nil
}

// Same reports whether two ETags name the same version, however each was
// quoted: go-webdav hands them over unquoted, and a browser echoes back
// whatever it was given.
func Same(a, b string) bool {
	return Unquote(a) == Unquote(b)
}

// Unquote strips an ETag's quotes. A weak ETag keeps its W/ prefix: it is not
// the same validator as the strong one with the same text.
func Unquote(etag string) string {
	if s, err := strconv.Unquote(etag); err == nil {
		return s
	}
	return etag
}
