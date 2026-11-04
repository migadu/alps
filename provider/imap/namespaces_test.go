// Other people's folders in the folder list (NAMESPACE, RFC 2342, and
// MYRIGHTS, RFC 4314): whose each listed folder is, and what the user may do
// in another's.
package imap

import (
	"slices"
	"strings"
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps/provider"
)

// sharedLayout is sora's: the user's own folders under no prefix, folders
// shared among the domain's users under Shared/, and no namespace of other
// users' own folders.
const sharedLayout = `* NAMESPACE (("" "/")) NIL (("Shared/" "/"))`

// listed is the listed folder called name, failing the test without one.
func listed(t *testing.T, mailboxes []provider.Mailbox, name string) provider.Mailbox {
	t.Helper()
	for _, mbox := range mailboxes {
		if mbox.Name == name {
			return mbox
		}
	}
	t.Fatalf("%q is not listed among %v", name, mailboxes)
	return provider.Mailbox{}
}

func rightsOf(mbox provider.Mailbox) string {
	if mbox.Rights == nil {
		return "<own>"
	}
	return *mbox.Rights
}

// A folder of the shared namespace is said to be one, under its prefix, with
// the user's rights in it, read with MYRIGHTS. The user's own folders are
// their own, with no rights to read. A placeholder (\Noselect) is in its
// namespace too, and has no rights to ask.
func TestListMailboxesSaysWhoseFoldersTheyAre(t *testing.T) {
	srv := &scriptedIMAP{
		caps:      "IMAP4rev1 NAMESPACE ACL",
		namespace: sharedLayout,
		list: []string{
			`* LIST (\HasNoChildren) "/" INBOX`,
			`* LIST (\HasNoChildren) "/" Work`,
			`* LIST (\Noselect \HasChildren) "/" Shared`,
			`* LIST (\HasNoChildren) "/" "Shared/Team"`,
		},
		rights: map[string]string{"Shared/Team": "lrs"},
	}
	mailboxes, err := scriptedProvider(t, srv).ListMailboxes()
	if err != nil {
		t.Fatal(err)
	}
	for _, name := range []string{"INBOX", "Work"} {
		if mbox := listed(t, mailboxes, name); mbox.Namespace != "" || mbox.Rights != nil || mbox.Shareable {
			t.Errorf("%s is in namespace %q with rights %s, shareable %v; want the user's own, unrestricted, and not shareable without a namespace of other users", name, mbox.Namespace, rightsOf(mbox), mbox.Shareable)
		}
	}
	team := listed(t, mailboxes, "Shared/Team")
	if team.Namespace != provider.NamespaceShared || team.NamespacePrefix != "Shared/" || rightsOf(team) != "lrs" || team.Shareable {
		t.Errorf("Shared/Team is in namespace %q (prefix %q) with rights %s, shareable %v; want the shared one under Shared/, lrs, not shareable", team.Namespace, team.NamespacePrefix, rightsOf(team), team.Shareable)
	}
	if root := listed(t, mailboxes, "Shared"); root.Namespace != provider.NamespaceShared || root.Rights != nil {
		t.Errorf("the namespace's root is in %q with rights %s; want the shared namespace, with none asked", root.Namespace, rightsOf(root))
	}
	if got := srv.aclCommands(); !slices.Equal(got, []string{`MYRIGHTS "Shared/Team"`}) {
		t.Errorf("sent %q, want MYRIGHTS of Shared/Team alone", got)
	}
}

// Where the server has a namespace of other users' folders, a folder of the
// user's own can be shared: the person it is shared with finds it there. A
// folder of another user's that the user administers can be shared on.
func TestListMailboxesSaysWhichFoldersCanBeShared(t *testing.T) {
	srv := &scriptedIMAP{
		caps:      "IMAP4rev1 NAMESPACE ACL",
		namespace: `* NAMESPACE (("" "/")) (("Other Users/" "/")) NIL`,
		list: []string{
			`* LIST (\HasNoChildren) "/" INBOX`,
			`* LIST (\HasNoChildren) "/" Work`,
			`* LIST (\Noselect \HasChildren) "/" "Other Users/bob"`,
			`* LIST (\HasNoChildren) "/" "Other Users/bob/Plans"`,
			`* LIST (\HasNoChildren) "/" "Other Users/bob/Notes"`,
		},
		rights: map[string]string{"Other Users/bob/Plans": "lrswipkxteacd", "Other Users/bob/Notes": "lrswite"},
	}
	mailboxes, err := scriptedProvider(t, srv).ListMailboxes()
	if err != nil {
		t.Fatal(err)
	}
	for name, want := range map[string]bool{"INBOX": true, "Work": true, "Other Users/bob/Plans": true, "Other Users/bob/Notes": false, "Other Users/bob": false} {
		if got := listed(t, mailboxes, name).Shareable; got != want {
			t.Errorf("%s shareable %v, want %v", name, got, want)
		}
	}
	if notes := listed(t, mailboxes, "Other Users/bob/Notes"); notes.Namespace != provider.NamespaceOther || notes.NamespacePrefix != "Other Users/" {
		t.Errorf("bob's Notes are in namespace %q (prefix %q), want other users' under Other Users/", notes.Namespace, notes.NamespacePrefix)
	}
}

// A server that lists only the user's own folders for "*" has the others
// listed under their namespace's prefix, with the same options, and merged
// into the one listing in order. A namespace the listing reaches into is not
// listed again.
func TestListMailboxesListsANamespaceTheListingLeftOut(t *testing.T) {
	srv := &scriptedIMAP{
		caps:      "IMAP4rev1 NAMESPACE ACL",
		namespace: `* NAMESPACE (("" "/")) (("Other Users/" "/")) (("Shared/" "/"))`,
		list: []string{
			`* LIST (\HasNoChildren) "/" INBOX`,
			`* LIST (\HasNoChildren) "/" Zeta`,
			`* LIST (\HasNoChildren) "/" "Other Users/bob/Plans"`,
		},
		listUnder: map[string][]string{
			`"" "Shared/*"`: {`* LIST (\HasNoChildren) "/" "Shared/Team"`},
		},
		lsub:   []string{`* LSUB () "/" INBOX`, `* LSUB () "/" "Shared/Team"`},
		rights: map[string]string{"Shared/Team": "lrs", "Other Users/bob/Plans": "lr"},
	}
	mailboxes, err := scriptedProvider(t, srv).ListMailboxes()
	if err != nil {
		t.Fatal(err)
	}
	var names []string
	for _, mbox := range mailboxes {
		names = append(names, mbox.Name)
	}
	if want := []string{"INBOX", "Other Users/bob/Plans", "Shared/Team", "Zeta"}; !slices.Equal(names, want) {
		t.Fatalf("listed %q, want %q", names, want)
	}
	if got, want := srv.listCommands(), []string{`"" "*"`, `"" "Shared/*"`}; !slices.Equal(got, want) {
		t.Errorf("LIST commands sent: %q, want %q", got, want)
	}
	if team := listed(t, mailboxes, "Shared/Team"); !team.Subscribed || rightsOf(team) != "lrs" {
		t.Errorf("Shared/Team subscribed %v with rights %s, want subscribed, as its LSUB says, with lrs", team.Subscribed, rightsOf(team))
	}
}

// NAMESPACE is asked once for the connection: the namespaces stay as they
// are while it is open.
func TestNamespacesAreAskedOncePerConnection(t *testing.T) {
	srv := &scriptedIMAP{caps: "IMAP4rev1 NAMESPACE ACL", namespace: sharedLayout, rights: map[string]string{}}
	p := scriptedProvider(t, srv)
	for range 2 {
		if _, err := p.ListMailboxes(); err != nil {
			t.Fatal(err)
		}
	}
	if n := srv.commandCount("NAMESPACE"); n != 1 {
		t.Errorf("NAMESPACE sent %d times, want once", n)
	}
}

// A server without NAMESPACE has every folder the user's own, as alps always
// took it to, and one without ACL has no rights to ask and nothing to share.
func TestListMailboxesWithoutNamespacesOrAccessLists(t *testing.T) {
	for name, srv := range map[string]*scriptedIMAP{
		"no NAMESPACE": {caps: "IMAP4rev1 ACL", list: []string{`* LIST () "/" INBOX`, `* LIST () "/" "Shared/Team"`}},
		"no ACL":       {caps: "IMAP4rev1 NAMESPACE", namespace: `* NAMESPACE (("" "/")) (("Other Users/" "/")) NIL`, list: []string{`* LIST () "/" INBOX`, `* LIST () "/" "Other Users/bob/Plans"`}},
	} {
		t.Run(name, func(t *testing.T) {
			mailboxes, err := scriptedProvider(t, srv).ListMailboxes()
			if err != nil {
				t.Fatal(err)
			}
			for _, mbox := range mailboxes {
				if mbox.Rights != nil || mbox.Shareable {
					t.Errorf("%s has rights %s, shareable %v; want none asked and nothing shareable", mbox.Name, rightsOf(mbox), mbox.Shareable)
				}
			}
			if srv.received("NAMESPACE") != strings.Contains(srv.caps, "NAMESPACE") {
				t.Errorf("NAMESPACE sent %v, with the capabilities %q", srv.received("NAMESPACE"), srv.caps)
			}
			if got := srv.aclCommands(); len(got) != 0 {
				t.Errorf("sent %q", got)
			}
		})
	}
	// Without ACL the namespaces are still said.
	srv := &scriptedIMAP{caps: "IMAP4rev1 NAMESPACE", namespace: `* NAMESPACE (("" "/")) (("Other Users/" "/")) NIL`, list: []string{`* LIST () "/" "Other Users/bob/Plans"`}}
	mailboxes, err := scriptedProvider(t, srv).ListMailboxes()
	if err != nil {
		t.Fatal(err)
	}
	if plans := listed(t, mailboxes, "Other Users/bob/Plans"); plans.Namespace != provider.NamespaceOther {
		t.Errorf("bob's Plans are in namespace %q without ACL, want other users'", plans.Namespace)
	}
}

// Rights the server will not say are no rights to act on: the folder is
// listed, with nothing offered in it, and the listing goes on.
func TestListMailboxesWithRightsRefused(t *testing.T) {
	srv := &scriptedIMAP{
		caps:      "IMAP4rev1 NAMESPACE ACL",
		namespace: sharedLayout,
		list:      []string{`* LIST () "/" INBOX`, `* LIST () "/" "Shared/Gone"`, `* LIST () "/" "Shared/Team"`},
		rights:    map[string]string{"Shared/Team": "lrswipkxtea"},
	}
	mailboxes, err := scriptedProvider(t, srv).ListMailboxes()
	if err != nil {
		t.Fatal(err)
	}
	if gone := listed(t, mailboxes, "Shared/Gone"); rightsOf(gone) != "" || gone.Shareable {
		t.Errorf("a folder whose rights were refused has rights %s, shareable %v; want none", rightsOf(gone), gone.Shareable)
	}
	if team := listed(t, mailboxes, "Shared/Team"); !team.Shareable {
		t.Error("a folder the user administers is not shareable")
	}
}

// The namespace a name is in is the one with the longest prefix it starts
// with, the user's own winning a tie and INBOX always the user's own: Cyrus
// keeps the user's folders under INBOX. and its shared ones under no prefix.
func TestNamespaceOf(t *testing.T) {
	cyrus := &imap.NamespaceData{
		Personal: []imap.NamespaceDescriptor{{Prefix: "INBOX.", Delim: '.'}},
		Other:    []imap.NamespaceDescriptor{{Prefix: "user.", Delim: '.'}},
		Shared:   []imap.NamespaceDescriptor{{Prefix: "", Delim: '.'}},
	}
	sora := &imap.NamespaceData{
		Personal: []imap.NamespaceDescriptor{{Prefix: "", Delim: '/'}},
		Shared:   []imap.NamespaceDescriptor{{Prefix: "Shared/", Delim: '/'}},
	}
	for _, c := range []struct {
		ns           *imap.NamespaceData
		name         string
		kind, prefix string
	}{
		{cyrus, "INBOX", "", ""},
		{cyrus, "INBOX.Sent", "", ""},
		{cyrus, "user.bob.Plans", provider.NamespaceOther, "user."},
		{cyrus, "user", provider.NamespaceOther, "user."},
		{cyrus, "Announcements", provider.NamespaceShared, ""},
		{sora, "inbox", "", ""},
		{sora, "Work", "", ""},
		{sora, "Shared", provider.NamespaceShared, "Shared/"},
		{sora, "Shared/Team", provider.NamespaceShared, "Shared/"},
		{sora, "Sharedness", "", ""},
		{nil, "Shared/Team", "", ""},
	} {
		if kind, prefix := namespaceOf(c.ns, c.name); kind != c.kind || prefix != c.prefix {
			t.Errorf("namespaceOf(%q) = %q, %q; want %q, %q", c.name, kind, prefix, c.kind, c.prefix)
		}
	}
}
