package davsave

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestDeleteCarriesIfMatchAndHeaders(t *testing.T) {
	var got *http.Request
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		got = r
		w.WriteHeader(http.StatusNoContent)
	}))
	defer srv.Close()

	err := Delete(context.Background(), srv.Client(), srv.URL+"/cal/x.ics", `"v3"`, http.Header{"Schedule-Reply": {"F"}})
	if err != nil {
		t.Fatal(err)
	}
	if got.Method != http.MethodDelete || got.Header.Get("If-Match") != `"v3"` || got.Header.Get("Schedule-Reply") != "F" {
		t.Fatalf("request %s If-Match %q Schedule-Reply %q", got.Method, got.Header.Get("If-Match"), got.Header.Get("Schedule-Reply"))
	}

	if err := Delete(context.Background(), srv.Client(), srv.URL+"/cal/x.ics", `W/"v3"`, nil); err != nil || got.Header.Get("If-Match") != "" {
		t.Fatalf("a weak ETag was sent as If-Match %q: %v", got.Header.Get("If-Match"), err)
	}
}

func TestDeleteOutcomes(t *testing.T) {
	for status, want := range map[int]error{
		http.StatusPreconditionFailed: ErrConflict,
		// Already gone is what was asked for.
		http.StatusNotFound: nil,
		http.StatusOK:       nil,
	} {
		srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(status) }))
		err := Delete(context.Background(), srv.Client(), srv.URL, "v1", nil)
		srv.Close()
		if !errors.Is(err, want) {
			t.Errorf("status %d: %v, want %v", status, err, want)
		}
	}
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusForbidden) }))
	defer srv.Close()
	var statusErr *StatusError
	if err := Delete(context.Background(), srv.Client(), srv.URL, "", nil); !errors.As(err, &statusErr) {
		t.Fatalf("a refusal: %v", err)
	}
}
