package imap

import (
	"log"

	"github.com/emersion/go-imap/v2/imapclient"
	"github.com/migadu/alps/provider"
)

// readSubscriptions drains LSUB as soon as it is sent. Its replies may arrive
// before LIST completes; leaving them queued would block the shared decoder
// before it can read LIST's answer. A nil result leaves every folder subscribed.
func (p *IMAPProvider) readSubscriptions(lsub *imapclient.ListCommand) <-chan map[string]bool {
	result := make(chan map[string]bool, 1)
	go func() {
		defer close(result)
		listed, err := lsub.Collect()
		if err != nil {
			if p.debug {
				log.Printf("alps/provider: LSUB failed, counting every folder subscribed: %v", err)
			}
			return
		}
		subscribed := make(map[string]bool, len(listed))
		for _, data := range listed {
			subscribed[data.Mailbox] = true
		}
		result <- subscribed
	}()
	return result
}

// markSubscriptions marks the folders of a plain LIST from the LSUB sent
// with it: the folders LSUB lists are subscribed, and the others are not.
// A refused LSUB leaves every folder subscribed so the sidebar keeps their
// unread counts and a rename can carry the subscription to the new name.
func (p *IMAPProvider) markSubscriptions(mailboxes []provider.Mailbox, subscribed map[string]bool) {
	if subscribed == nil {
		return
	}
	for i := range mailboxes {
		mailboxes[i].Subscribed = subscribed[mailboxes[i].Name]
	}
}
