package unified

import (
	"fmt"
	"strings"
	"github.com/migadu/alps/provider"
)

// Map all recognized lowercase special folder names to a normalized name
var unifiedNameMap = map[string]string{
	"inbox":"INBOX",
	"drafts":"drafts",
	"archives":"archives",
	"archive":"archives",
	"sent":"sent",
	"trash":"trash",
	"junk":"junk",
	"spam":"junk",
}

func normalizeUnifiedName(name string) string {

	name = strings.TrimSpace(name)
	name = strings.ToLower(name)
	return unifiedNameMap[name]
}

type unifiedEntry struct {
	source *backend
	mailbox string
}

// This type implements (or will implement) the algorithms needed to present a unified view from multiple sources
type unifiedMailbox struct {
	name string
	entryList []*unifiedEntry
	entryMap map[string]*unifiedEntry
}

func (u *unifiedMailbox) clear() {

	if u.entryList != nil {
		u.entryList = u.entryList[:0]
	}
	u.entryMap = make(map[string]*unifiedEntry)
}

// add a concrete backend mailbox to this view
func (u *unifiedMailbox) addSource(b *backend, mailbox string) error {

	key := fmt.Sprintf("@%s#%s", b.config.Name, mailbox)
	_, ok := u.entryMap[key]
	if ok {
		return fmt.Errorf("duplicate source %s", key)
	}
	e := &unifiedEntry{
		source: b,
		mailbox: mailbox,
	}
	u.entryList = append(u.entryList, e)
	u.entryMap[key] = e
	return nil
}

// for now, the unified view acts like an empty mailbox
func (u *unifiedMailbox) getStatus() (*provider.MailboxStatus, error) {

	status := &provider.MailboxStatus{
		Name:        u.name,
		NumMessages: 0,
		NumUnseen:   0,
		UIDValidity: 0,
	}
	return status, nil
}

func (u *unifiedMailbox) listMessages(sortOrder string, page, pageSize int) ([]provider.Message, provider.PageInfo, error) {

	return nil, provider.PageInfo{}, nil
}

func (u *unifiedMailbox) searchMessageIDs(query string) ([]provider.MessageID, error) {

	return nil, nil
}

func (u *unifiedMailbox) searchMessages(query string, sortOrder string, page, pageSize int) ([]provider.Message, provider.PageInfo, error) {

	return nil, provider.PageInfo{}, nil
}


func (u *unifiedMailbox) emptyAll() (int, error) {

	total := 0
	for _, e := range u.entryList {
		count, err := e.source.EmptyMailbox(e.mailbox)
		if err != nil {
			return total, err
		}
		total = total + count
	}
	return total, nil
}


func (u *unifiedMailbox) subscribe() error {

	return nil
}

func (u *unifiedMailbox) unsubscribe() error {

	return nil
}

func newUnifiedMailbox(name string) *unifiedMailbox {

	return &unifiedMailbox{
		name: name,
		entryList: nil,
		entryMap: make(map[string]*unifiedEntry),
	}
}
