package alpsbase

import (
	"testing"

	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

// These cache tests need a provider that can search every folder. Maildir
// refuses '*' itself, so make that capability explicit in this fixture.
type allFolderSearchFixture struct{ provider.MailProvider }

func (p allFolderSearchFixture) HasESearchCapability() bool { return true }
func (p allFolderSearchFixture) SearchMessages(mailbox, query, order string, page, size int) ([]provider.Message, provider.PageInfo, error) {
	if mailbox != "*" {
		return p.MailProvider.SearchMessages(mailbox, query, order, page, size)
	}
	folders, err := p.ListMailboxes()
	if err != nil {
		return nil, provider.PageInfo{}, err
	}
	var messages []provider.Message
	for _, folder := range folders {
		matches, _, err := p.MailProvider.SearchMessages(folder.Name, query, order, 0, 10000)
		if err != nil {
			return nil, provider.PageInfo{}, err
		}
		messages = append(messages, matches...)
	}
	info := provider.PageInfo{Total: len(messages)}
	start := page * size
	if start >= len(messages) {
		return nil, info, nil
	}
	end := start + size
	if end > len(messages) {
		end = len(messages)
	}
	return messages[start:end], info, nil
}
func newAllFolderSearchTestServer(t *testing.T) *testServer {
	return newTestServerWrapping(t, "smtp://127.0.0.1:1", alps.NewLogger(), func(p provider.MailProvider) provider.MailProvider { return allFolderSearchFixture{p} })
}
