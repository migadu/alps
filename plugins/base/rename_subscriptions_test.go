package alpsbase

import (
	"slices"
	"testing"

	"github.com/migadu/alps/provider"
)

func listed(name string, subscribed bool, attrs ...string) provider.Mailbox {
	return provider.Mailbox{Name: name, Delimiter: '/', Attributes: attrs, Subscribed: subscribed}
}

// A subscription is not guaranteed to follow a RENAME, so a renamed folder,
// and every subscribed folder under it, is subscribed again under its new name.
func TestRenameKeepsSubscriptions(t *testing.T) {
	mailboxes := []provider.Mailbox{
		listed("INBOX", true),
		listed("Trash", true, `\Trash`),
		listed("Work", true),
		listed("Work/Clients", true),
		listed("Work/Old", false),
		listed("Workshop", true),
	}
	plan := planRenameSubscriptions(mailboxes, "Work", "Jobs")
	if plan.unsubscribeOld {
		t.Error("a rename outside Trash left the subscriptions")
	}
	// Not Work/Old, which was not subscribed, nor Workshop, which only shares
	// the prefix.
	if want := []string{"Jobs", "Jobs/Clients"}; !slices.Equal(plan.subscribe, want) {
		t.Errorf("subscribe %v, want %v", plan.subscribe, want)
	}
}

func TestRenameOfAnUnsubscribedFolderSubscribesNothing(t *testing.T) {
	mailboxes := []provider.Mailbox{listed("INBOX", true), listed("Old", false)}
	if plan := planRenameSubscriptions(mailboxes, "Old", "Older"); plan.unsubscribeOld || len(plan.subscribe) != 0 {
		t.Errorf("plan %+v, want nothing", plan)
	}
}

// Deleting a folder moves it into Trash, and it leaves the subscriptions.
func TestRenameIntoTrashUnsubscribes(t *testing.T) {
	mailboxes := []provider.Mailbox{listed("INBOX", true), listed("Papierkorb", true, `\Trash`), listed("Work", true)}
	plan := planRenameSubscriptions(mailboxes, "Work", "Papierkorb/Work")
	if !plan.unsubscribeOld || len(plan.subscribe) != 0 {
		t.Errorf("plan %+v, want only the unsubscribe", plan)
	}
}

// Its Undo brings it back out, and back into the subscriptions the delete took
// it out of.
func TestRenameOutOfTrashSubscribes(t *testing.T) {
	mailboxes := []provider.Mailbox{listed("INBOX", true), listed("Trash", true, `\Trash`), listed("Trash/Work", false)}
	plan := planRenameSubscriptions(mailboxes, "Trash/Work", "Work")
	if plan.unsubscribeOld {
		t.Error("a folder leaving Trash was unsubscribed")
	}
	if want := []string{"Work"}; !slices.Equal(plan.subscribe, want) {
		t.Errorf("subscribe %v, want %v", plan.subscribe, want)
	}
}

// Trash is the folder carrying \Trash, so a user's own "Trash notes" is not it.
func TestRenameKnowsTrashByItsAttribute(t *testing.T) {
	mailboxes := []provider.Mailbox{listed("INBOX", true), listed("Bin", true, `\Trash`), listed("Work", true)}
	if plan := planRenameSubscriptions(mailboxes, "Work", "Trash notes"); plan.unsubscribeOld {
		t.Error("a folder renamed to \"Trash notes\" was treated as deleted")
	}
}

// Without a listing nothing is known about subscriptions, and Trash is
// guessed by name, as the rename always could.
func TestRenameWithoutAListing(t *testing.T) {
	if plan := planRenameSubscriptions(nil, "Work", "Trash/Work"); !plan.unsubscribeOld {
		t.Error("a move into a folder called Trash was not recognised")
	}
	if plan := planRenameSubscriptions(nil, "Work", "Jobs"); plan.unsubscribeOld || len(plan.subscribe) != 0 {
		t.Errorf("plan %+v, want nothing", plan)
	}
}
