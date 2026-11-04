// The folder list's word on whose each folder is and what the user may do in
// it, over an IMAP server that keeps namespaces (RFC 2342) and access lists
// (RFC 4314). The scripted server here is the one the sharing requests talk to
// as well (see sharing_test.go).
package alpsbase

import (
	"context"
	"net/http"
	"net/url"
	"reflect"
	"slices"
	"strings"
	"sync"
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapserver"
)

// aclState is the access lists of a scripted IMAP server, shared by every
// connection to it. rights are the signed-in user's own, by mailbox: a
// mailbox missing from it does not exist. acl is each mailbox's list, by
// identifier, and known the identifiers the server has users for.
type aclState struct {
	mu        sync.Mutex
	namespace *imap.NamespaceData
	rights    map[string]string
	acl       map[string]map[string]string
	known     map[string]bool
	// refusal answers every SETACL and DELETEACL in place of the checks.
	refusal error
	// commands are the changes asked for, each its name and arguments.
	commands []string
}

// aclSession is a session of the in-memory server that keeps access lists.
type aclSession struct {
	imapserver.Session
	state *aclState
}

func (s aclSession) Namespace(context.Context) (*imap.NamespaceData, error) {
	return s.state.namespace, nil
}

func (s aclSession) MyRights(_ context.Context, mailbox string) (*imap.MyRightsData, error) {
	s.state.mu.Lock()
	defer s.state.mu.Unlock()
	rights, ok := s.state.rights[mailbox]
	if !ok {
		return nil, &imap.Error{Type: imap.StatusResponseTypeNo, Code: imap.ResponseCodeNonExistent, Text: "no mailbox " + mailbox + " on db4"}
	}
	return &imap.MyRightsData{Mailbox: mailbox, Rights: imap.RightSet(rights)}, nil
}

// administer answers the refusal a change to mailbox's list gets, or nil.
func (st *aclState) administer(mailbox string) error {
	rights, ok := st.rights[mailbox]
	if !ok {
		return &imap.Error{Type: imap.StatusResponseTypeNo, Code: imap.ResponseCodeNonExistent, Text: "no mailbox " + mailbox + " on db4"}
	}
	if !strings.ContainsRune(rights, 'a') {
		return &imap.Error{Type: imap.StatusResponseTypeNo, Code: imap.ResponseCodeNoPerm, Text: "acl backend db4 says no"}
	}
	return nil
}

func (s aclSession) GetACL(_ context.Context, mailbox string) (*imap.GetACLData, error) {
	s.state.mu.Lock()
	defer s.state.mu.Unlock()
	if err := s.state.administer(mailbox); err != nil {
		return nil, err
	}
	data := &imap.GetACLData{Mailbox: mailbox}
	for who, rights := range s.state.acl[mailbox] {
		data.ACL = append(data.ACL, imap.ACLEntry{Identifier: imap.RightsIdentifier(who), Rights: imap.RightSet(rights)})
	}
	return data, nil
}

func (s aclSession) SetACL(_ context.Context, mailbox string, who imap.RightsIdentifier, mod imap.RightModification, rights imap.RightSet) error {
	s.state.mu.Lock()
	defer s.state.mu.Unlock()
	change := string(rights)
	if mod != imap.RightModificationReplace {
		change = string(mod) + change
	}
	s.state.commands = append(s.state.commands, "SETACL "+mailbox+" "+string(who)+" "+change)
	if s.state.refusal != nil {
		return s.state.refusal
	}
	if err := s.state.administer(mailbox); err != nil {
		return err
	}
	if !s.state.known[string(who)] {
		return &imap.Error{Type: imap.StatusResponseTypeNo, Code: imap.ResponseCodeNonExistent, Text: "no user " + string(who) + " on db4"}
	}
	if s.state.acl[mailbox] == nil {
		s.state.acl[mailbox] = map[string]string{}
	}
	s.state.acl[mailbox][string(who)] = string(rights)
	return nil
}

func (s aclSession) DeleteACL(_ context.Context, mailbox string, who imap.RightsIdentifier) error {
	s.state.mu.Lock()
	defer s.state.mu.Unlock()
	s.state.commands = append(s.state.commands, "DELETEACL "+mailbox+" "+string(who))
	if s.state.refusal != nil {
		return s.state.refusal
	}
	if err := s.state.administer(mailbox); err != nil {
		return err
	}
	if !s.state.known[string(who)] {
		return &imap.Error{Type: imap.StatusResponseTypeNo, Code: imap.ResponseCodeNonExistent, Text: "no user " + string(who) + " on db4"}
	}
	delete(s.state.acl[mailbox], string(who))
	return nil
}

func (s aclSession) ListRights(context.Context, string, imap.RightsIdentifier) (*imap.ListRightsData, error) {
	return nil, &imap.Error{Type: imap.StatusResponseTypeNo, Text: "not here"}
}

// namespaceSession keeps namespaces and no access lists.
type namespaceSession struct {
	imapserver.Session
	state *aclState
}

func (s namespaceSession) Namespace(context.Context) (*imap.NamespaceData, error) {
	return s.state.namespace, nil
}

// sharingServer is a test server, signed in as ada, on an IMAP server whose
// shared folders are under Shared/, as sora's are, holding Shared/Team, which
// ada administers and shares with bob, and Shared/News, which she only
// reads. With acl false the server keeps no access lists.
func sharingServer(t *testing.T, acl bool) (*testServer, *aclState) {
	t.Helper()
	state := &aclState{
		namespace: &imap.NamespaceData{
			Personal: []imap.NamespaceDescriptor{{Prefix: "", Delim: '/'}},
			Shared:   []imap.NamespaceDescriptor{{Prefix: "Shared/", Delim: '/'}},
		},
		rights: map[string]string{"INBOX": "lrswipkxtea", "Shared/Team": "lrswipkxtea", "Shared/News": "lrs"},
		acl: map[string]map[string]string{
			"Shared/Team": {testUser: "lrswipkxtea", "bob@example.com": "lrs", "zoe@example.com": "lr"},
		},
		known: map[string]bool{"bob@example.com": true, "carol@example.com": true, "zoe@example.com": true},
	}
	caps := imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapNamespace: {}}
	s := newIMAPTestServerWith(t, caps, func(inner imapserver.Session) imapserver.Session {
		if acl {
			return aclSession{inner, state}
		}
		return namespaceSession{inner, state}
	})
	s.login()
	for _, name := range []string{"Shared/Team", "Shared/News"} {
		s.expect(s.do("POST", "/mailboxes", url.Values{"name": {name}}), http.StatusOK)
	}
	return s, state
}

func (st *aclState) changes() []string {
	st.mu.Lock()
	defer st.mu.Unlock()
	return slices.Clone(st.commands)
}

// The folder list says whose each folder is, what the user may do in the
// folders of others, and which folders the user can share: on this server,
// with shared folders and no namespace of other users, only a shared folder
// the user administers.
func TestHTTP_FolderListSaysWhoseFoldersTheyAre(t *testing.T) {
	s, _ := sharingServer(t, true)
	r := s.do("GET", "/mailboxes", nil)
	s.expect(r, http.StatusOK)
	var list struct {
		Mailboxes []struct {
			Mailbox         string
			Namespace       string
			NamespacePrefix string
			Rights          *string
			Shareable       bool
		}
	}
	r.json(t, &list)
	type folder struct {
		namespace, prefix, rights string
		shareable                 bool
	}
	got := map[string]folder{}
	for _, mb := range list.Mailboxes {
		f := folder{namespace: mb.Namespace, prefix: mb.NamespacePrefix, shareable: mb.Shareable, rights: "<own>"}
		if mb.Rights != nil {
			f.rights = *mb.Rights
		}
		got[mb.Mailbox] = f
	}
	want := map[string]folder{
		"INBOX":       {rights: "<own>"},
		"Shared/News": {namespace: "shared", prefix: "Shared/", rights: "lrs"},
		"Shared/Team": {namespace: "shared", prefix: "Shared/", rights: "lrswipkxteacd", shareable: true},
	}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("listed %+v, want %+v", got, want)
	}
}
