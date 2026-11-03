package imap

import (
	"errors"
	"fmt"
	"math"
	"strings"

	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps/provider"
)

var _ provider.QuotaReader = (*IMAPProvider)(nil)

// quotaMailbox is the mailbox whose quota roots StorageQuota asks for. Every
// account has one, and it is where mail arrives: the quota that refuses mail
// refuses it there.
const quotaMailbox = "INBOX"

// HasQuotas: see provider.QuotaReader. A server keeps them where it lists
// QUOTA (RFC 9208 §3.1, as RFC 2087 had it). Capabilities that could not be
// read say nothing either way: that is an error, not a server without quotas.
func (p *IMAPProvider) HasQuotas() (bool, error) {
	if p.client == nil {
		return false, nil
	}
	caps := p.client.Caps()
	if caps == nil {
		return false, p.lostIf(errors.New("imap: the server's capabilities could not be read"))
	}
	return caps.Has(imap.CapQuota), nil
}

// StorageQuota: see provider.QuotaReader. One GETQUOTAROOT of the Inbox
// (RFC 9208 §4.3.2), which needs nothing selected: the server names the quota
// roots the Inbox is under, and answers each root's usage and limit, resource
// by resource. STORAGE is the one that limits how much the account's mail
// takes, counted in units of 1024 octets (§5.1).
//
// The Inbox may be under more than one root, an account's own and its
// domain's say, each with a limit of its own. The fullest of them, as a share
// of its limit, is answered: it is the one closest to refusing mail. A root
// with no STORAGE resource limits something else, the number of messages
// say, and is passed over. A STORAGE limit of 0 prohibits usage (RFC 9208
// section 3.1.2), and takes priority over every positive limit.
//
// An error the server answered stays an *imap.Error under the wrapping, for
// the caller to tell a refusal from a failure.
func (p *IMAPProvider) StorageQuota() (*provider.StorageQuota, error) {
	roots, err := p.client.GetQuotaRoot(quotaMailbox).Wait()
	if err != nil {
		return nil, p.lostIf(fmt.Errorf("imap: GETQUOTAROOT failed: %w", err))
	}
	var fullest *provider.StorageQuota
	for _, root := range roots {
		for name, storage := range root.Resources {
			// Resource names are atoms, which IMAP reads whatever their case.
			if !strings.EqualFold(string(name), string(imap.QuotaResourceStorage)) || storage.Limit < 0 {
				continue
			}
			quota := &provider.StorageQuota{Used: storageBytes(storage.Usage), Limit: storageBytes(storage.Limit)}
			if fullest == nil || fuller(quota, fullest) {
				fullest = quota
			}
		}
	}
	return fullest, nil
}

// fuller reports whether a takes more of its limit than b does of its own,
// or, taking as much, has the lower limit, with less room left in it.
func fuller(a, b *provider.StorageQuota) bool {
	if a.Limit == 0 || b.Limit == 0 {
		if a.Limit != b.Limit {
			return a.Limit == 0
		}
		return a.Used > b.Used
	}
	ra, rb := float64(a.Used)/float64(a.Limit), float64(b.Used)/float64(b.Limit)
	if ra != rb {
		return ra > rb
	}
	return a.Limit < b.Limit
}

// storageBytes is n units of STORAGE, of 1024 octets each, in bytes, held at
// the largest int64 rather than wrapped round past it.
func storageBytes(n int64) int64 {
	if n > math.MaxInt64/1024 {
		return math.MaxInt64
	}
	return n * 1024
}
