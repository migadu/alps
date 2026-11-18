package alpscarddav

import (
	"bytes"
	"encoding/json"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/emersion/go-vcard"
)

// contactsDeadlineListener records the ordinary HTTP server deadline before a
// contacts handler extends it. The upstream REPORT can then finish just after
// that deadline, without a sleep whose timing depends on when the handler ran.
type contactsDeadlineListener struct {
	net.Listener
	deadline chan time.Time
}

func (l *contactsDeadlineListener) Accept() (net.Conn, error) {
	c, err := l.Listener.Accept()
	if err != nil {
		return nil, err
	}
	return &contactsDeadlineConn{Conn: c, deadline: l.deadline}, nil
}

type contactsDeadlineConn struct {
	net.Conn
	deadline chan time.Time
	once     sync.Once
}

func (c *contactsDeadlineConn) SetWriteDeadline(deadline time.Time) error {
	if !deadline.IsZero() {
		c.once.Do(func() { c.deadline <- deadline })
	}
	return c.Conn.SetWriteDeadline(deadline)
}

func TestContactListingOutlivesOrdinaryHTTPWriteDeadline(t *testing.T) {
	t.Skip("#992: enable with the coordinated contacts deadline")
	for _, query := range []string{"", "?query=grace"} {
		t.Run(query, func(t *testing.T) {
			deadline := make(chan time.Time, 1)
			h := newHarnessWrapping(t, func(next http.Handler) http.Handler {
				return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					if r.Method == "REPORT" {
						// Drain the request so net/http can notice a canceled stream.
						body, err := io.ReadAll(r.Body)
						if err != nil {
							t.Error(err)
							return
						}
						r.Body = io.NopCloser(bytes.NewReader(body))
						select {
						case at := <-deadline:
							timer := time.NewTimer(time.Until(at))
							defer timer.Stop()
							select {
							case <-timer.C:
							case <-r.Context().Done():
								return
							}
						case <-r.Context().Done():
							return
						}
					}
					next.ServeHTTP(w, r)
				})
			})
			card := grace("+1 555 0100")
			// More than net/http's response buffer, so the complete JSON must
			// reach the actual socket rather than pass only through a recorder.
			photo := "data:image/jpeg;base64," + strings.Repeat("A", 16<<10)
			card.SetValue(vcard.FieldPhoto, photo)
			h.dav.save(testBook+"grace.vcf", card)

			server := httptest.NewUnstartedServer(h.srv)
			server.Config.WriteTimeout = 25 * time.Millisecond
			server.Listener = &contactsDeadlineListener{Listener: server.Listener, deadline: deadline}
			server.Start()
			t.Cleanup(server.Close)
			client := &http.Client{Jar: h.client.Jar, Timeout: 5 * time.Second}
			response, err := client.Get(server.URL + "/contacts" + query)
			if err != nil {
				t.Fatalf("listing after ordinary write deadline: %v", err)
			}
			defer response.Body.Close()
			if response.StatusCode != http.StatusOK {
				t.Fatalf("listing status %d, want 200", response.StatusCode)
			}
			var listing struct{ Contacts []ContactData }
			if err := json.NewDecoder(response.Body).Decode(&listing); err != nil {
				t.Fatalf("complete listing after ordinary write deadline: %v", err)
			}
			if len(listing.Contacts) != 1 || listing.Contacts[0].Avatar != photo {
				t.Fatalf("incomplete listing: %d contacts", len(listing.Contacts))
			}
		})
	}
}
