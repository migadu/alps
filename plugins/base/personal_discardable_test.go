package alpsbase

import (
	"github.com/migadu/alps/provider"
	"testing"
)

func TestMayEmptyPersonalNamespaceAliases(t *testing.T) {
	for _, name := range []string{"Deleted", "INBOX.Trash", "INBOX.Deleted", "INBOX.Deleted Items", "INBOX.Junk", "INBOX.Spam"} {
		mb := provider.Mailbox{Name: name, NamespacePrefix: "INBOX."}
		if !mayEmptyMailbox(name, []provider.Mailbox{mb}) {
			t.Errorf("refused selectable personal discard folder %q", name)
		}
		for _, attrs := range [][]string{{`\Noselect`}, {`\NonExistent`}} {
			mb.Attributes = attrs
			if mayEmptyMailbox(name, []provider.Mailbox{mb}) {
				t.Errorf("allowed placeholder %q", name)
			}
		}
		mb.Attributes = nil
		mb.Namespace = provider.NamespaceShared
		if mayEmptyMailbox(name, []provider.Mailbox{mb}) {
			t.Errorf("allowed other namespace %q", name)
		}
	}
}

func TestRenameIntoPersonalTrashAliasesLeavesSubscriptions(t *testing.T) {
	for _, name := range []string{"Deleted", "INBOX.Trash", "INBOX.Deleted", "INBOX.Deleted Items"} {
		mailboxes := []provider.Mailbox{{Name: name, NamespacePrefix: "INBOX.", Delimiter: '.'}, {Name: "Work", Subscribed: true}}
		if plan := planRenameSubscriptions(mailboxes, "Work", name+".Work"); !plan.unsubscribeOld || len(plan.subscribe) != 0 {
			t.Errorf("rename into %q kept subscriptions: %+v", name, plan)
		}
		if isInTrash(mailboxes, name+"can") {
			t.Errorf("prefix sibling misclassified as trash: %q", name+"can")
		}
	}
}
