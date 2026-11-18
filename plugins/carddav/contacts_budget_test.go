package alpscarddav

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/migadu/alps"
)

func TestContactListingBudgetDoesNotChangeIndividualRequests(t *testing.T) {
	h := startConnectionHarness(t, nil, true)
	session := connectionSession(t, h)
	saveConnection(t, session, "", "http+insecure://"+strings.TrimPrefix(h.davURL, "http://"), "dav-ada", "dav password")
	p := &plugin{GoPlugin: alps.GoPlugin{Name: "carddav"}, srv: h.srv}
	router := alps.NewRouter(h.srv)
	router.Use(func(next alps.HandlerFunc) alps.HandlerFunc {
		return func(ctx *alps.Context) error {
			ctx.Session = session
			return next(ctx)
		}
	})
	type budget struct {
		ClientTimeout time.Duration
		HasDeadline   bool
		Remaining     time.Duration
	}
	for _, route := range []struct{ method, path string }{
		{http.MethodGet, "/contacts"},
		{http.MethodGet, "/contacts/{path}"},
		{http.MethodPost, "/contacts/create"},
	} {
		p.addRoute(route.method, route.path, func(ctx *alps.Context) error {
			deadline, ok := ctx.Request.Context().Deadline()
			return ctx.JSON(http.StatusOK, budget{
				ClientTimeout: p.requestConnection(ctx).client.Timeout,
				HasDeadline:   ok,
				Remaining:     time.Until(deadline),
			})
		})
	}
	p.Plugin().SetRoutes(router.Group(""))
	server := httptest.NewServer(router)
	t.Cleanup(server.Close)
	for _, route := range []struct{ method, path string }{
		{http.MethodGet, "/contacts"},
		{http.MethodGet, "/contacts/grace.vcf"},
		{http.MethodPost, "/contacts/create"},
	} {
		request, err := http.NewRequest(route.method, server.URL+route.path, nil)
		if err != nil {
			t.Fatal(err)
		}
		response, err := server.Client().Do(request)
		if err != nil {
			t.Fatal(err)
		}
		var got budget
		err = json.NewDecoder(response.Body).Decode(&got)
		response.Body.Close()
		if err != nil {
			t.Fatal(err)
		}
		if route.path == "/contacts" {
			if got.ClientTimeout != 5*time.Minute || !got.HasDeadline || got.Remaining < 4*time.Minute || got.Remaining > 5*time.Minute {
				t.Errorf("listing budget: %+v", got)
			}
		} else if got.ClientTimeout != time.Minute || got.HasDeadline {
			t.Errorf("%s %s acquired a listing budget: %+v", route.method, route.path, got)
		}
	}
}

func TestContactListingBudgetCancelsAStalledReport(t *testing.T) {
	previous := contactsReadTimeout
	contactsReadTimeout = 250 * time.Millisecond
	t.Cleanup(func() { contactsReadTimeout = previous })
	started, canceled := make(chan struct{}), make(chan struct{})
	h := stalledContactsReport(t, started, canceled)
	transport := &http.Transport{DisableKeepAlives: true}
	t.Cleanup(transport.CloseIdleConnections)
	client := &http.Client{Jar: h.client.Jar, Transport: transport, Timeout: 5 * time.Second}
	done := make(chan struct{})
	go func() {
		defer close(done)
		response, err := client.Get(h.url + "/contacts")
		if err == nil {
			io.Copy(io.Discard, response.Body)
			response.Body.Close()
		}
	}()
	waitContactsSignal(t, started, "REPORT started")
	select {
	case <-canceled:
	case <-time.After(2 * time.Second):
		t.Fatal("contacts budget did not cancel REPORT before the client's five-second timeout")
	}
	waitContactsSignal(t, done, "stalled listing ended")
}

func TestCancelingContactListingStillCancelsItsReport(t *testing.T) {
	started, canceled := make(chan struct{}), make(chan struct{})
	h := stalledContactsReport(t, started, canceled)
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, h.url+"/contacts", nil)
	if err != nil {
		t.Fatal(err)
	}
	done := make(chan error, 1)
	go func() {
		response, err := h.client.Do(request)
		if response != nil {
			response.Body.Close()
		}
		done <- err
	}()
	waitContactsSignal(t, started, "REPORT started")
	cancel()
	waitContactsSignal(t, canceled, "client cancellation reached REPORT")
	select {
	case err := <-done:
		if !errors.Is(err, context.Canceled) {
			t.Fatalf("canceled listing: %v", err)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("client request did not end after cancellation")
	}
}

func stalledContactsReport(t *testing.T, started, canceled chan struct{}) *harness {
	t.Helper()
	return newHarnessWrapping(t, func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Method != "REPORT" {
				next.ServeHTTP(w, r)
				return
			}
			io.Copy(io.Discard, r.Body)
			close(started)
			<-r.Context().Done()
			close(canceled)
		})
	})
}

func waitContactsSignal(t *testing.T, signal <-chan struct{}, description string) {
	t.Helper()
	select {
	case <-signal:
	case <-time.After(5 * time.Second):
		t.Fatal(description + " did not happen")
	}
}
