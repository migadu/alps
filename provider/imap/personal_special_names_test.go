package imap

import (
	"fmt"
	"github.com/migadu/alps/provider"
	"testing"
)

func TestListCarriesPersonalNamespacePrefix(t *testing.T) {
	srv := &scriptedIMAP{caps: "IMAP4rev1 NAMESPACE", namespace: `* NAMESPACE (("INBOX." ".")) NIL NIL`, list: []string{`* LIST () "." "INBOX"`, `* LIST () "." "INBOX.Sent"`}}
	mailboxes, err := scriptedProvider(t, srv).ListMailboxes()
	if err != nil {
		t.Fatal(err)
	}
	if prefix := listed(t, mailboxes, "INBOX.Sent").NamespacePrefix; prefix != "INBOX." {
		t.Fatalf("personal prefix = %q", prefix)
	}
}

func TestSpecialMailboxFallbackNamesMatchThePage(t *testing.T) {
	for _, tc := range []struct {
		name string
		kind provider.MailboxType
	}{{"Draft", provider.MailboxTypeDrafts}, {"Drafts", provider.MailboxTypeDrafts}, {"Deleted", provider.MailboxTypeTrash}, {"Deleted Items", provider.MailboxTypeTrash}, {"Spam", provider.MailboxTypeJunk}, {"Archives", provider.MailboxTypeArchive}} {
		t.Run(tc.name, func(t *testing.T) {
			name := "INBOX." + tc.name
			srv := &scriptedIMAP{caps: "IMAP4rev1 NAMESPACE", namespace: `* NAMESPACE (("INBOX." ".")) NIL NIL`, list: []string{fmt.Sprintf(`* LIST () "." %q`, name)}}
			box, err := scriptedProvider(t, srv).FindMailboxByType(tc.kind)
			if err != nil || box == nil || box.Name != name {
				t.Fatalf("resolved %+v, %v; want %q", box, err, name)
			}
		})
	}
}

func TestSpecialMailboxFallbackPrefersCanonicalNamesInEitherListOrder(t *testing.T) {
	for _, tc := range []struct {
		kind             provider.MailboxType
		canonical, alias string
	}{
		{provider.MailboxTypeDrafts, "Drafts", "Draft"},
		{provider.MailboxTypeTrash, "Trash", "Deleted"},
		{provider.MailboxTypeArchive, "Archive", "Archives"},
	} {
		for _, reverse := range []bool{false, true} {
			names := []string{tc.canonical, tc.alias}
			if reverse {
				names[0], names[1] = names[1], names[0]
			}
			t.Run(fmt.Sprintf("%s/reverse=%t", tc.canonical, reverse), func(t *testing.T) {
				srv := &scriptedIMAP{caps: "IMAP4rev1 NAMESPACE", namespace: `* NAMESPACE (("INBOX." ".")) NIL NIL`, list: []string{fmt.Sprintf(`* LIST () "." "INBOX.%s"`, names[0]), fmt.Sprintf(`* LIST () "." "INBOX.%s"`, names[1])}}
				box, err := scriptedProvider(t, srv).FindMailboxByType(tc.kind)
				if err != nil || box == nil || box.Name != "INBOX."+tc.canonical {
					t.Fatalf("resolved %+v, %v; want canonical %q", box, err, tc.canonical)
				}
			})
		}
	}
}
