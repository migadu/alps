package alpscaldav

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"
)

// The OPTIONS probe must give up on an unresponsive server rather than block
// plugin startup forever, which is what http.DefaultClient's zero timeout did.
func TestSanityCheckURLTimesOut(t *testing.T) {
	block := make(chan struct{})
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		<-block
	}))
	defer func() {
		close(block)
		srv.Close()
	}()

	oldTimeout := sanityCheckTimeout
	sanityCheckTimeout = 200 * time.Millisecond
	defer func() { sanityCheckTimeout = oldTimeout }()

	u, err := url.Parse(srv.URL)
	if err != nil {
		t.Fatal(err)
	}

	done := make(chan error, 1)
	go func() { done <- sanityCheckURL(u) }()

	select {
	case err := <-done:
		if err == nil {
			t.Fatal("expected a timeout error from unresponsive server")
		}
	case <-time.After(2 * time.Second):
		t.Fatal("sanityCheckURL still blocked after 2s: no timeout bound")
	}
}
