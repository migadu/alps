// Sharing a folder with other people: GET, PUT and DELETE
// /mailboxes/{mbox}/sharing, over the scripted IMAP server of
// folder_namespaces_test.go, which keeps access lists (RFC 4314).
package alpsbase

import (
	"errors"
	"net/http"
	"net/url"
	"reflect"
	"slices"
	"strings"
	"testing"

	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
	"github.com/migadu/go-imap"
)

// readSharing asks GET /mailboxes/{mbox}/sharing, expecting status.
func (s *testServer) readSharing(mailbox string, status int) sharingAnswer {
	s.t.Helper()
	r := s.do("GET", "/mailboxes/"+url.PathEscape(mailbox)+"/sharing", nil)
	s.expect(r, status)
	var answer sharingAnswer
	if status == http.StatusOK {
		r.json(s.t, &answer)
	}
	return answer
}

func sharingPath(mailbox, who string) string {
	return "/mailboxes/" + url.PathEscape(mailbox) + "/sharing/" + url.PathEscape(who)
}

// errorOf is the error word of an answer.
func errorOf(t *testing.T, r response) string {
	t.Helper()
	var body map[string]string
	r.json(t, &body)
	return body["error"]
}

// The user's own rights, and everyone else's with the level they stand for:
// a level of rights alps does not give is "". The user's own entry, which the
// server lists for the owner, is not one of the others.
func TestHTTP_SharingReadsWhoHasAccess(t *testing.T) {
	s, _ := sharingServer(t, true)
	got := s.readSharing("Shared/Team", http.StatusOK)
	want := sharingAnswer{Rights: "lrswipkxteacd", Entries: []sharingEntry{
		{Identifier: "bob@example.com", Rights: "lrs", Level: "read_only"},
		{Identifier: "zoe@example.com", Rights: "lr", Level: ""},
	}}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("answered %+v, want %+v", got, want)
	}
}

// A grant gives exactly the rights of its level, in place of what the person
// had, and the list then says so.
func TestHTTP_SharingGrantsALevel(t *testing.T) {
	s, state := sharingServer(t, true)
	for _, c := range []struct{ who, level, rights string }{
		{"carol@example.com", "read_only", "lrs"},
		{"bob@example.com", "read_write", "lrswite"},
		{"zoe@example.com", "full", "lrswipkxte"},
	} {
		s.expect(s.do("PUT", sharingPath("Shared/Team", c.who), map[string]string{"level": c.level}), http.StatusOK)
		entries := s.readSharing("Shared/Team", http.StatusOK).Entries
		i := slices.IndexFunc(entries, func(e sharingEntry) bool { return e.Identifier == c.who })
		if i < 0 || entries[i].Level != c.level {
			t.Errorf("after granting %s %s, the list holds %+v", c.who, c.level, entries)
		}
		if last := state.changes()[len(state.changes())-1]; last != "SETACL Shared/Team "+c.who+" "+c.rights {
			t.Errorf("sent %q for %s", last, c.level)
		}
	}
}

// Revoking takes the person off the list.
func TestHTTP_SharingRevokes(t *testing.T) {
	s, state := sharingServer(t, true)
	s.expect(s.do("DELETE", sharingPath("Shared/Team", "bob@example.com"), nil), http.StatusOK)
	if got := state.changes(); !slices.Equal(got, []string{"DELETEACL Shared/Team bob@example.com"}) {
		t.Errorf("sent %q", got)
	}
	for _, e := range s.readSharing("Shared/Team", http.StatusOK).Entries {
		if e.Identifier == "bob@example.com" {
			t.Errorf("bob still has %s", e.Rights)
		}
	}
}

// Only one person's address is shared with, never the user themselves, and
// only at a level alps gives: "anyone", an identifier that takes rights away,
// a name with the address, or rights spelled out are refused before anything
// is sent.
func TestHTTP_SharingRefusesWhatIsNoGrant(t *testing.T) {
	s, state := sharingServer(t, true)
	for _, c := range []struct {
		who, level, want string
	}{
		{"anyone", "read_only", "invalid_identifier"},
		{"authenticated", "read_only", "invalid_identifier"},
		{"-bob@example.com", "read_only", "invalid_identifier"},
		{"Bob <bob@example.com>", "read_only", "invalid_identifier"},
		{"bob@example.com, carol@example.com", "read_only", "invalid_identifier"},
		{" bob@example.com", "read_only", "invalid_identifier"},
		{strings.ToUpper(testUser), "read_only", "self"},
		{"bob@example.com", "lrswipkxtea", "invalid_level"},
		{"bob@example.com", "", "invalid_level"},
	} {
		r := s.do("PUT", sharingPath("Shared/Team", c.who), map[string]string{"level": c.level})
		if r.status != http.StatusBadRequest || errorOf(t, r) != c.want {
			t.Errorf("sharing with %q at %q answered %d %s, want 400 %s", c.who, c.level, r.status, r.body, c.want)
		}
	}
	r := s.do("DELETE", sharingPath("Shared/Team", "anyone"), nil)
	if r.status != http.StatusBadRequest || errorOf(t, r) != "invalid_identifier" {
		t.Errorf("revoking anyone answered %d %s", r.status, r.body)
	}
	if got := state.changes(); len(got) != 0 {
		t.Errorf("sent %q", got)
	}
}

// The server's refusals, each a status and a word for it, without the
// server's own words: a person the server does not know is told apart from
// a folder that is not there, which the server answers alike.
func TestHTTP_SharingRefusedByTheServer(t *testing.T) {
	s, state := sharingServer(t, true)
	for _, c := range []struct {
		name, method, mailbox, who string
		refusal                    error
		status                     int
		want                       string
	}{
		{"unknown person", "PUT", "Shared/Team", "nobody@example.com", nil, http.StatusNotFound, "unknown_identifier"},
		{"unknown person revoked", "DELETE", "Shared/Team", "nobody@example.com", nil, http.StatusNotFound, "unknown_identifier"},
		{"folder gone", "PUT", "Shared/Gone", "bob@example.com", nil, http.StatusNotFound, "not_found"},
		{"not the user's to share", "PUT", "Shared/News", "bob@example.com", nil, http.StatusForbidden, "forbidden"},
		{"not the user's to unshare", "DELETE", "Shared/News", "bob@example.com", nil, http.StatusForbidden, "forbidden"},
		{"refused as such", "PUT", "Shared/Team", "bob@example.com", &imap.Error{Type: imap.StatusResponseTypeBad, Code: imap.ResponseCodeClientBug, Text: "db4 takes no such rights"}, http.StatusUnprocessableEntity, "refused"},
		{"refused without a reason", "PUT", "Shared/Team", "bob@example.com", &imap.Error{Type: imap.StatusResponseTypeNo, Text: "db4 will not"}, http.StatusUnprocessableEntity, "refused"},
	} {
		t.Run(c.name, func(t *testing.T) {
			state.mu.Lock()
			state.refusal = c.refusal
			state.mu.Unlock()
			r := s.do(c.method, sharingPath(c.mailbox, c.who), map[string]string{"level": "read_only"})
			if r.status != c.status || errorOf(t, r) != c.want {
				t.Errorf("answered %d %s, want %d %s", r.status, r.body, c.status, c.want)
			}
			if strings.Contains(string(r.body), "db4") {
				t.Errorf("the answer repeats the server's own words: %s", r.body)
			}
		})
	}
	// Reading the list of a folder the user may not administer is refused too.
	s.readSharing("Shared/News", http.StatusForbidden)
	s.readSharing("Shared/Gone", http.StatusNotFound)
}

// A mail server without access lists shares nothing, and each request says
// so rather than failing as the server's fault.
func TestHTTP_SharingWithoutAccessLists(t *testing.T) {
	s, _ := sharingServer(t, false)
	for _, r := range []response{
		s.do("GET", "/mailboxes/Shared%2FTeam/sharing", nil),
		s.do("PUT", sharingPath("Shared/Team", "bob@example.com"), map[string]string{"level": "read_only"}),
		s.do("DELETE", sharingPath("Shared/Team", "bob@example.com"), nil),
	} {
		if r.status != http.StatusNotImplemented || errorOf(t, r) != "not_supported" {
			t.Errorf("answered %d %s, want 501 not_supported", r.status, r.body)
		}
	}
}

// sharingFailureProvider is a connection whose sharing fails with err.
type sharingFailureProvider struct {
	provider.MailProvider
	err error
}

func (p sharingFailureProvider) SharesFolders() (bool, error) { return true, nil }
func (p sharingFailureProvider) FolderAccess(string) (*provider.FolderAccess, error) {
	return nil, p.err
}
func (p sharingFailureProvider) FolderRights(string) (string, error)            { return "", p.err }
func (p sharingFailureProvider) GrantFolderAccess(string, string, string) error { return p.err }
func (p sharingFailureProvider) RevokeFolderAccess(string, string) error        { return p.err }

// A sign-in that is gone and a mail server that cannot be reached are the
// server handler's to answer, as for every other mail request: a 401 that
// signs the page out, and a 503. Neither is a 500.
func TestHTTP_SharingPreservesSessionAndServiceErrors(t *testing.T) {
	for _, failure := range []struct {
		name   string
		err    error
		status int
	}{
		{"auth", provider.AuthError{Cause: &imap.Error{Type: imap.StatusResponseTypeNo, Code: imap.ResponseCodeAuthenticationFailed, Text: "Credentials no longer accepted"}}, http.StatusUnauthorized},
		{"outage", errors.Join(alps.ErrMailProviderUnavailable, errors.New("backend offline")), http.StatusServiceUnavailable},
	} {
		for _, op := range []struct{ name, method string }{{"read", "GET"}, {"grant", "PUT"}, {"revoke", "DELETE"}} {
			t.Run(failure.name+"/"+op.name, func(t *testing.T) {
				s := newTestServerWrapping(t, "smtp://127.0.0.1:1", alps.NewLogger(), func(p provider.MailProvider) provider.MailProvider {
					return sharingFailureProvider{MailProvider: p, err: failure.err}
				})
				s.login()
				path := sharingPath("INBOX", "bob@example.com")
				if op.method == "GET" {
					path = "/mailboxes/INBOX/sharing"
				}
				s.expect(s.do(op.method, path, map[string]string{"level": "read_only"}), failure.status)
			})
		}
	}
}

type sharingProbeFailureProvider struct {
	sharingFailureProvider
	probeErr error
}

func (p sharingProbeFailureProvider) FolderRights(string) (string, error) { return "", p.probeErr }

func TestHTTP_SharingPreservesFailuresDuringTheExistenceProbe(t *testing.T) {
	for _, failure := range []struct {
		name   string
		err    error
		status int
	}{
		{"auth", provider.AuthError{Cause: errors.New("credentials expired")}, http.StatusUnauthorized},
		{"outage", errors.Join(alps.ErrMailProviderUnavailable, errors.New("backend offline")), http.StatusServiceUnavailable},
	} {
		for _, method := range []string{"PUT", "DELETE"} {
			t.Run(failure.name+"/"+method, func(t *testing.T) {
				s := newTestServerWrapping(t, "smtp://127.0.0.1:1", alps.NewLogger(), func(p provider.MailProvider) provider.MailProvider {
					return sharingProbeFailureProvider{
						sharingFailureProvider: sharingFailureProvider{MailProvider: p, err: &imap.Error{Type: imap.StatusResponseTypeNo, Code: imap.ResponseCodeNonExistent}},
						probeErr:               failure.err,
					}
				})
				s.login()
				s.expect(s.do(method, sharingPath("INBOX", "bob@example.com"), map[string]string{"level": "read_only"}), failure.status)
			})
		}
	}
}

// The levels are the rights alps gives, whatever order or virtual rights the
// server spells them with.
func TestShareLevelOf(t *testing.T) {
	for rights, want := range map[string]string{
		"lrs":           "read_only",
		"srl":           "read_only",
		"lrswite":       "read_write",
		"lrswited":      "read_write",
		"lrswipkxte":    "full",
		"lrswipkxtecd":  "full",
		"lrswipkxtea":   "",
		"lrswipkxteacd": "",
		"lr":            "",
		"":              "",
	} {
		if got := shareLevelOf(rights); got != want {
			t.Errorf("shareLevelOf(%q) = %q, want %q", rights, got, want)
		}
	}
}
