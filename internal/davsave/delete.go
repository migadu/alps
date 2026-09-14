package davsave

import (
	"context"
	"io"
	"net/http"
	"strings"
)

// Delete removes the object at target. With an etag it carries If-Match, as
// Put does. header adds fields a caller needs, such as RFC 6638's
// Schedule-Reply. An object already gone is not an error: what was asked for
// is so.
func Delete(ctx context.Context, hc *http.Client, target, etag string, header http.Header) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, target, nil)
	if err != nil {
		return err
	}
	for name, values := range header {
		for _, v := range values {
			req.Header.Add(name, v)
		}
	}
	if etag != "" && !strings.HasPrefix(etag, "W/") {
		req.Header.Set("If-Match", `"`+Unquote(etag)+`"`)
	}
	resp, err := hc.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	_, _ = io.Copy(io.Discard, io.LimitReader(resp.Body, 64<<10))

	switch {
	case resp.StatusCode == http.StatusPreconditionFailed:
		return ErrConflict
	case resp.StatusCode == http.StatusNotFound || resp.StatusCode/100 == 2:
		return nil
	}
	return &StatusError{Method: http.MethodDelete, Status: resp.Status}
}

// StatusError is a DAV request the server refused for a reason other than a
// version conflict.
type StatusError struct {
	Method string
	Status string
}

func (e *StatusError) Error() string {
	return "davsave: " + e.Method + " failed: " + e.Status
}
