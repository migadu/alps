package imap

import (
	"log"

	"github.com/emersion/go-imap/v2/imapclient"
	"github.com/migadu/alps/provider"
)

// markSubscriptions marks the folders of a plain LIST from the answer to
// lsub, an LSUB "" "*" (RFC 3501 §6.3.9) sent with it: the folders LSUB lists
// are subscribed, and the others are not. A plain LIST says nothing about
// subscriptions, and every folder counted as subscribed, so on a server
// without LIST-EXTENDED a folder unsubscribed here or in another client was
// listed as subscribed again.
//
// When LSUB fails, every folder stays subscribed, as before. Counting none
// would hide no more in the sidebar, which ignores a listing with nothing
// subscribed, but it would cost the sidebar every folder's unread count, read
// only for subscribed folders, and a rename would no longer carry a folder's
// subscription over to its new name.
func (p *IMAPProvider) markSubscriptions(mailboxes []provider.Mailbox, lsub *imapclient.ListCommand) {
	listed, err := lsub.Collect()
	if err != nil {
		// Not the user's to see, and not a reason to fail the listing.
		if p.debug {
			log.Printf("alps/provider: LSUB failed, counting every folder subscribed: %v", err)
		}
		return
	}
	subscribed := make(map[string]bool, len(listed))
	for _, data := range listed {
		subscribed[data.Mailbox] = true
	}
	for i := range mailboxes {
		mailboxes[i].Subscribed = subscribed[mailboxes[i].Name]
	}
}
