package alpsbase

import (
	"testing"

	"github.com/migadu/alps/provider"
)

// Emptying is permanent, so the name fallback must not reach a folder whose role
// the server has given to another mailbox.
func TestMayEmptyMailbox(t *testing.T) {
	mb := func(name string, attrs ...string) provider.Mailbox {
		return provider.Mailbox{Name: name, Attributes: attrs}
	}
	cases := []struct {
		desc      string
		name      string
		mailboxes []provider.Mailbox
		want      bool
	}{
		{"the server's Trash, under any name", "Deleted Items", []provider.Mailbox{mb("INBOX"), mb("Deleted Items", `\Trash`)}, true},
		{"attributes compare case-insensitively", "Bin", []provider.Mailbox{mb("Bin", `\trash`)}, true},
		{"the server's Junk", "Spam", []provider.Mailbox{mb("Spam", `\Junk`)}, true},
		{"a folder named Trash when the server gave that role elsewhere", "Trash", []provider.Mailbox{mb("Trash"), mb("Deleted Items", `\Trash`)}, false},
		{"a folder named Spam when the server gave Junk elsewhere", "Spam", []provider.Mailbox{mb("Spam"), mb("Junk", `\Junk`)}, false},
		{"a named Trash on a server that advertises no roles", "Trash", []provider.Mailbox{mb("INBOX"), mb("Trash")}, true},
		{"one claimed role leaves the other's fallback alone", "Junk", []provider.Mailbox{mb("Junk"), mb("Deleted Items", `\Trash`)}, true},
		{"an ordinary folder", "Archive", []provider.Mailbox{mb("Archive", `\Archive`)}, false},
	}
	for _, c := range cases {
		if got := mayEmptyMailbox(c.name, c.mailboxes); got != c.want {
			t.Errorf("%s: mayEmptyMailbox(%q) = %v, want %v", c.desc, c.name, got, c.want)
		}
	}
}
