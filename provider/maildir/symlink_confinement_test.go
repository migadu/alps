package maildir

import (
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/migadu/alps/provider"
)

// The user's maildir sits beside a directory that is not theirs, holding a
// maildir and a file. Everything is in the test's own directory.
const outsideMessage = "From: grace@remote.test\r\nSubject: Outside secret\r\n\r\nNot the user's.\r\n"

func outsideOfMaildir(t *testing.T) (base, outside string) {
	t.Helper()
	dir := t.TempDir()
	base, outside = filepath.Join(dir, "ada"), filepath.Join(dir, "outside")
	for _, sub := range []string{"tmp", "new", "cur"} {
		if err := os.MkdirAll(filepath.Join(outside, sub), 0o700); err != nil {
			t.Fatal(err)
		}
	}
	files := map[string]string{
		filepath.Join(outside, "cur", "1700000000.outside:2,S"): outsideMessage,
		filepath.Join(outside, "secret"):                        outsideMessage,
		filepath.Join(outside, "settings.json"):                 `{"base.settings":{"theme":"outside"}}`,
	}
	for name, content := range files {
		if err := os.WriteFile(name, []byte(content), 0o600); err != nil {
			t.Fatal(err)
		}
	}
	return base, outside
}

// snapshot is every entry under dir, with each file's content and each link's
// target, so that any change to it shows.
func snapshot(t *testing.T, dir string) string {
	t.Helper()
	var b strings.Builder
	err := filepath.WalkDir(dir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel, _ := filepath.Rel(dir, path)
		switch {
		case d.Type()&fs.ModeSymlink != 0:
			target, _ := os.Readlink(path)
			fmt.Fprintf(&b, "%s -> %s\n", rel, target)
		case d.IsDir():
			fmt.Fprintf(&b, "%s/\n", rel)
		default:
			content, _ := os.ReadFile(path)
			fmt.Fprintf(&b, "%s: %q\n", rel, content)
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
	return b.String()
}

// Every operation of the provider on a mailbox, each answering what it read.
func everyOperation(p *Provider, mailbox string, key provider.MessageID) []struct {
	name string
	do   func() (string, error)
} {
	ids := []provider.MessageID{key}
	return []struct {
		name string
		do   func() (string, error)
	}{
		{"status", func() (string, error) {
			s, err := p.GetMailboxStatus(mailbox)
			if err != nil {
				return "", err
			}
			return fmt.Sprintf("%d messages", s.NumMessages), nil
		}},
		{"list", func() (string, error) {
			msgs, _, err := p.ListMessages(mailbox, "desc", 0, 50)
			return subjects(msgs...), err
		}},
		{"search", func() (string, error) {
			msgs, _, err := p.SearchMessages(mailbox, "Outside", "desc", 0, 50)
			return subjects(msgs...), err
		}},
		{"search IDs", func() (string, error) {
			found, err := p.SearchMessageIDs(mailbox, "Outside")
			return fmt.Sprintf("%v", found), err
		}},
		{"references", func() (string, error) {
			msgs, err := p.FindByReferences(mailbox, []string{"anything@remote.test"})
			return subjects(msgs...), err
		}},
		{"metadata", func() (string, error) {
			msg, err := p.GetMessageMetadata(mailbox, key)
			if err != nil {
				return "", err
			}
			return subjects(*msg), nil
		}},
		{"raw part", func() (string, error) {
			_, header, body, err := p.GetMessagePartRaw(mailbox, key, []int{1}, 0)
			return string(header) + string(body), err
		}},
		{"flag", func() (string, error) {
			return "", p.SetMessagesFlags(mailbox, ids, provider.FlagOperation{Op: provider.FlagOpAdd, Flags: []provider.Flag{provider.FlagFlagged}})
		}},
		{"copy", func() (string, error) {
			copied, err := p.CopyMessages(mailbox, "Kept", ids)
			if err != nil || len(copied) == 0 {
				return "", err
			}
			msg, err := p.GetMessageMetadata("Kept", copied[key])
			if err != nil {
				return "", err
			}
			return subjects(*msg), nil
		}},
		{"append", func() (string, error) {
			_, _, _, err := p.AppendMessage(mailbox, &mockMessage{content: []byte("Subject: Filed\r\n\r\nfiled\r\n")}, 0)
			return "", err
		}},
		{"move", func() (string, error) {
			_, err := p.MoveMessages(mailbox, "Kept", ids)
			return "", err
		}},
		{"delete", func() (string, error) {
			return "", p.DeleteMessages(mailbox, ids)
		}},
		// The user's INBOX is not emptied, renamed or deleted: what it holds
		// besides the link is theirs.
		{"empty", func() (string, error) {
			if mailbox == "INBOX" {
				return "", nil
			}
			n, err := p.EmptyMailbox(mailbox)
			return fmt.Sprintf("%d emptied", n), err
		}},
		{"rename the folder", func() (string, error) {
			if mailbox == "INBOX" {
				return "", nil
			}
			return "", p.RenameMailbox(mailbox, "Renamed")
		}},
		{"delete the folder", func() (string, error) {
			if mailbox == "INBOX" {
				return "", nil
			}
			return "", p.DeleteMailbox(mailbox)
		}},
	}
}

// alps never follows a symbolic link out of the user's maildir: not a
// folder's, not a folder's cur directory, not a message file's. A link that
// leads outside was followed by every operation, which read the files there
// as the user's mail and renamed, moved and removed them: a flag change, a
// move or a delete of the user's message reached into a directory that was
// not theirs.
func TestNoSymlinkIsFollowedOutOfTheMaildir(t *testing.T) {
	cases := []struct {
		name    string
		mailbox string
		key     string
		plant   func(t *testing.T, base, outside string)
	}{
		{"a folder that is a link", "Work", "1700000000.outside", func(t *testing.T, base, outside string) {
			link(t, outside, filepath.Join(base, ".Work"))
		}},
		{"a folder whose cur is a link", "Archive", "1700000000.outside", func(t *testing.T, base, outside string) {
			for _, sub := range []string{"tmp", "new"} {
				if err := os.MkdirAll(filepath.Join(base, ".Archive", sub), 0o700); err != nil {
					t.Fatal(err)
				}
			}
			link(t, filepath.Join(outside, "cur"), filepath.Join(base, ".Archive", "cur"))
		}},
		{"a message that is a link", "INBOX", "1700000001.link", func(t *testing.T, base, outside string) {
			link(t, filepath.Join(outside, "secret"), filepath.Join(base, "cur", "1700000001.link:2,"))
		}},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			base, outside := outsideOfMaildir(t)
			p := NewProvider(base, "ada@example.com")
			putMessages(t, p, "Engines")
			if err := p.CreateMailbox("Kept"); err != nil {
				t.Fatal(err)
			}
			c.plant(t, base, outside)
			before := snapshot(t, outside)

			for _, op := range everyOperation(p, c.mailbox, MaildirMessageID(c.key)) {
				got, err := op.do()
				if strings.Contains(got, "Outside secret") || strings.Contains(got, "Not the user's") {
					t.Errorf("%s read the file outside the maildir: %.120s", op.name, got)
				}
				if op.name == "status" && err == nil && c.mailbox != "INBOX" && got != "0 messages" {
					t.Errorf("status counted the messages outside the maildir: %s", got)
				}
				// The refusal is reported, not taken for a message that is gone.
				if op.name == "flag" && err == nil && c.mailbox != "INBOX" {
					t.Error("the flag change through the link answered success")
				}
				if now := snapshot(t, outside); now != before {
					t.Errorf("%s changed what is outside the maildir:\n%s\nwas:\n%s", op.name, now, before)
					before = now
				}
			}
			if _, err := p.GetMessageMetadata("INBOX", putMessagesID(t, p, "Engines")); err != nil {
				t.Errorf("the user's own message is gone: %v", err)
			}
		})
	}
}

// The settings file is in the maildir too, and is not read or written
// through a link that leads out of it.
func TestTheStoreFollowsNoSymlinkOutOfTheMaildir(t *testing.T) {
	base, outside := outsideOfMaildir(t)
	p := NewProvider(base, "ada@example.com")
	putMessages(t, p, "Engines")
	link(t, filepath.Join(outside, "settings.json"), filepath.Join(base, "alps_store.json"))
	before := snapshot(t, outside)

	store, err := p.GetStore()
	if err != nil {
		t.Fatal(err)
	}
	var settings map[string]string
	if err := store.Get("base.settings", &settings); err == nil && settings["theme"] == "outside" {
		t.Error("the settings were read from the file outside the maildir")
	}
	store.Put("base.settings", map[string]string{"theme": "dark"})
	if now := snapshot(t, outside); now != before {
		t.Errorf("saving the settings changed what is outside the maildir:\n%s", now)
	}
}

// The maildir itself may be reached through a link, as a configured path can
// be: that link is the administrator's, and is followed.
func TestAMaildirReachedThroughALinkIsServed(t *testing.T) {
	dir := t.TempDir()
	real := filepath.Join(dir, "real")
	putMessages(t, NewProvider(real, "ada@example.com"), "Engines")
	link(t, real, filepath.Join(dir, "configured"))

	p := NewProvider(filepath.Join(dir, "configured"), "ada@example.com")
	msgs, _, err := p.ListMessages("INBOX", "desc", 0, 50)
	if err != nil || len(msgs) != 1 || msgs[0].Envelope.Subject != "Engines" {
		t.Fatalf("the maildir behind the configured link lists %+v, %v", msgs, err)
	}
	if _, err := p.GetMessageMetadata("INBOX", msgs[0].ID); err != nil {
		t.Errorf("its message does not open: %v", err)
	}
	if err := p.CreateMailbox("Archive"); err != nil {
		t.Errorf("a folder is not made in it: %v", err)
	}
}

// subjects is what the messages say they are.
func subjects(msgs ...provider.Message) string {
	var out []string
	for _, m := range msgs {
		if m.Envelope != nil {
			out = append(out, m.Envelope.Subject)
		}
	}
	return strings.Join(out, ", ")
}

func link(t *testing.T, target, name string) {
	t.Helper()
	if err := os.Symlink(target, name); err != nil {
		t.Fatal(err)
	}
}

// putMessagesID is the ID of the message of the subject in INBOX.
func putMessagesID(t *testing.T, p *Provider, subject string) provider.MessageID {
	t.Helper()
	msgs, _, err := p.ListMessages("INBOX", "desc", 0, 50)
	if err != nil {
		t.Fatal(err)
	}
	for _, m := range msgs {
		if m.Envelope.Subject == subject {
			return m.ID
		}
	}
	t.Fatalf("no message %q in INBOX", subject)
	return nil
}
