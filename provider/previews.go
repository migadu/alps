package provider

import "sync"

// maxPreviewsPerMailbox bounds the previews a PreviewCache keeps for one
// mailbox; past it the mailbox's start over.
const maxPreviewsPerMailbox = 5000

// PreviewCache keeps the message previews a session has read, by mailbox,
// under the scope they were read in (see PreviewProvider). A message's preview
// does not change, so it holds for as long as its mailbox's scope does.
//
// Like VerdictCache, it is the session's rather than a connection's, so a
// preview read on the background connection answers the next listing on the
// session's own. The zero value is an empty cache, and a nil one keeps
// nothing.
type PreviewCache struct {
	mu        sync.Mutex
	mailboxes map[string]*scopedPreviews
}

// scopedPreviews are one mailbox's previews, read under scope.
type scopedPreviews struct {
	scope string
	byID  map[string]string
}

// Get returns the preview kept for the message id in mailbox, as long as it was
// read under scope: under another, the same ID is another message.
func (c *PreviewCache) Get(mailbox, scope, id string) (string, bool) {
	if c == nil {
		return "", false
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	kept := c.mailboxes[mailbox]
	if kept == nil || kept.scope != scope {
		return "", false
	}
	text, ok := kept.byID[id]
	return text, ok
}

// Put keeps text, read under scope, as the preview of the message id in
// mailbox. A preview read under another scope than the mailbox's kept ones
// replaces them all, since they name other messages.
func (c *PreviewCache) Put(mailbox, scope, id, text string) {
	if c == nil {
		return
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.mailboxes == nil {
		c.mailboxes = make(map[string]*scopedPreviews)
	}
	kept := c.mailboxes[mailbox]
	if kept == nil || kept.scope != scope || len(kept.byID) >= maxPreviewsPerMailbox {
		kept = &scopedPreviews{scope: scope, byID: make(map[string]string)}
		c.mailboxes[mailbox] = kept
	}
	kept.byID[id] = text
}

// PreviewSharer is implemented by a provider that keeps the previews it reads,
// and can keep them in a cache it shares with the session's other connections.
type PreviewSharer interface {
	// SharePreviews has the provider keep its previews in c from now on. It is
	// called before the provider is first used.
	SharePreviews(c *PreviewCache)
}
