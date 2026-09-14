package davsave

import (
	"context"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
)

func TestPut(t *testing.T) {
	var header http.Header
	var lengthStated bool
	status, answerETag := http.StatusCreated, `"v2"`
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		header = r.Header.Clone()
		body, _ := io.ReadAll(r.Body)
		lengthStated = r.ContentLength == int64(len(body))
		if answerETag != "" {
			w.Header().Set("ETag", answerETag)
		}
		w.WriteHeader(status)
	}))
	defer srv.Close()

	put := func(etag string) (string, error) {
		return Put(context.Background(), srv.Client(), srv.URL+"/cal/work/x.ics", "text/calendar", []byte("BEGIN:VCALENDAR\r\n"), etag)
	}

	t.Run("a version is sent as If-Match, and the new one returned", func(t *testing.T) {
		got, err := put("v1")
		if err != nil || got != "v2" {
			t.Fatalf("got %q, %v", got, err)
		}
		if header.Get("If-Match") != `"v1"` || header.Get("Content-Type") != "text/calendar" || !lengthStated {
			t.Fatalf("request headers %v, length stated %v", header, lengthStated)
		}
	})

	t.Run("a quoted version is not quoted again", func(t *testing.T) {
		if _, err := put(`"v1"`); err != nil || header.Get("If-Match") != `"v1"` {
			t.Fatalf("If-Match %q, %v", header.Get("If-Match"), err)
		}
	})

	t.Run("a weak version is not sent, since If-Match cannot match it", func(t *testing.T) {
		if _, err := put(`W/"v1"`); err != nil || header.Get("If-Match") != "" {
			t.Fatalf("If-Match %q, %v", header.Get("If-Match"), err)
		}
	})

	t.Run("no version, no precondition", func(t *testing.T) {
		if _, err := put(""); err != nil || header.Get("If-Match") != "" {
			t.Fatalf("If-Match %q, %v", header.Get("If-Match"), err)
		}
	})

	t.Run("a withheld ETag is reported as none", func(t *testing.T) {
		status, answerETag = http.StatusNoContent, ""
		defer func() { status, answerETag = http.StatusCreated, `"v2"` }()
		if got, err := put("v1"); err != nil || got != "" {
			t.Fatalf("got %q, %v", got, err)
		}
	})

	t.Run("412 is a conflict", func(t *testing.T) {
		status = http.StatusPreconditionFailed
		defer func() { status = http.StatusCreated }()
		if _, err := put("v1"); !errors.Is(err, ErrConflict) {
			t.Fatalf("err = %v", err)
		}
	})

	t.Run("any other refusal is an error, not a conflict", func(t *testing.T) {
		status = http.StatusForbidden
		defer func() { status = http.StatusCreated }()
		if _, err := put("v1"); err == nil || errors.Is(err, ErrConflict) {
			t.Fatalf("err = %v", err)
		}
	})
}

func TestSame(t *testing.T) {
	if !Same("v1", `"v1"`) || Same("v1", "v2") || Same(`W/"v1"`, `"v1"`) {
		t.Fatal("ETags compared wrongly")
	}
}

func TestURL(t *testing.T) {
	endpoint, _ := url.Parse("https://dav.example.com/dav/")
	cases := map[string]string{
		"/dav/calendars/ada/work/x.ics": "https://dav.example.com/dav/calendars/ada/work/x.ics",
		"calendars/ada/work/x.ics":      "https://dav.example.com/dav/calendars/ada/work/x.ics",
		"/dav/calendars/ada/a b/x.ics":  "https://dav.example.com/dav/calendars/ada/a%20b/x.ics",
	}
	for href, want := range cases {
		if got := URL(endpoint, href); got != want {
			t.Errorf("URL(%q) = %q, want %q", href, got, want)
		}
	}
}
