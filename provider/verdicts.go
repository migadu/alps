package provider

import "sync"

// maxVerdictsPerMailbox bounds the verdicts a VerdictCache keeps for one
// mailbox; past it the mailbox's start over.
const maxVerdictsPerMailbox = 10000

// VerdictCache keeps the authentication verdicts a session has read, by
// mailbox, under the scope they were read in (see AuthVerdictProvider). A
// message's headers never change, so a verdict holds for as long as its
// mailbox's scope does.
//
// It is the session's rather than a connection's: every connection the
// session opens is given it (see VerdictSharer), so that a verdict read on one
// answers on the next, after the mail server dropped the first, and on any
// other the session holds beside it. The zero value is an empty cache, and a
// nil one keeps nothing.
type VerdictCache struct {
	mu        sync.Mutex
	mailboxes map[string]*scopedVerdicts
}

// scopedVerdicts are one mailbox's verdicts, read under scope.
type scopedVerdicts struct {
	scope string
	byID  map[string]AuthVerdict
}

// Get returns the verdict kept for the message id in mailbox, as long as it
// was read under scope: under another, the same ID is another message.
func (c *VerdictCache) Get(mailbox, scope, id string) (AuthVerdict, bool) {
	if c == nil {
		return AuthVerdict{}, false
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	kept := c.mailboxes[mailbox]
	if kept == nil || kept.scope != scope {
		return AuthVerdict{}, false
	}
	v, ok := kept.byID[id]
	return v, ok
}

// Put keeps v, read under scope, as the verdict of the message id in mailbox.
// A verdict read under another scope than the mailbox's kept ones replaces
// them all, since they name other messages.
func (c *VerdictCache) Put(mailbox, scope, id string, v AuthVerdict) {
	if c == nil {
		return
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.mailboxes == nil {
		c.mailboxes = make(map[string]*scopedVerdicts)
	}
	kept := c.mailboxes[mailbox]
	if kept == nil || kept.scope != scope || len(kept.byID) >= maxVerdictsPerMailbox {
		kept = &scopedVerdicts{scope: scope, byID: make(map[string]AuthVerdict)}
		c.mailboxes[mailbox] = kept
	}
	kept.byID[id] = v
}

// VerdictSharer is implemented by a provider that keeps the verdicts it reads,
// and can keep them in a cache it shares with the session's other
// connections.
type VerdictSharer interface {
	// ShareVerdicts has the provider keep its verdicts in c from now on. It is
	// called before the provider is first used.
	ShareVerdicts(c *VerdictCache)
}
