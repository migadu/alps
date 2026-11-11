package imap

import (
	"errors"
	"fmt"
	"log"
	"slices"
	"strings"

	"github.com/migadu/alps/provider"
	"github.com/migadu/go-imap"
	"github.com/migadu/go-imap/imapclient"
)

// SharesFolders reports whether the mail server keeps access lists, which it
// does where it lists ACL (RFC 4314 §2). Capabilities that could not be read
// say nothing either way: that is an error, not a server without them.
func (p *IMAPProvider) SharesFolders() (bool, error) {
	if p.client == nil {
		return false, nil
	}
	caps := p.client.Caps()
	if caps == nil {
		return false, p.lostIf(errors.New("imap: the server's capabilities could not be read"))
	}
	return caps.Has(imap.CapACL), nil
}

// readNamespaces answers what NAMESPACE (RFC 2342) says, asked once per
// connection: the namespaces do not change while it is open. A server
// without NAMESPACE, or one that refuses it, has every folder in the user's
// own namespace, as alps always took it to.
func (p *IMAPProvider) readNamespaces() (*imap.NamespaceData, error) {
	p.cacheLock.RLock()
	ns, read := p.namespaces, p.namespacesRead
	p.cacheLock.RUnlock()
	if read {
		return ns, nil
	}
	if caps := p.client.Caps(); caps != nil && caps.Has(imap.CapNamespace) {
		data, err := p.client.Namespace().Wait()
		var refused *imap.Error
		switch {
		case errors.As(err, &refused):
			log.Printf("alps/provider: IMAP server refused NAMESPACE, taking every folder to be the user's own: %v", err)
		case err != nil:
			return nil, p.lostIf(fmt.Errorf("imap: NAMESPACE failed: %w", err))
		default:
			ns = data
		}
	}
	p.cacheLock.Lock()
	p.namespaces, p.namespacesRead = ns, true
	p.cacheLock.Unlock()
	return ns, nil
}

// namespaceOf answers which namespace a folder called name is in, and that
// namespace's prefix: the namespace with the longest prefix the name starts
// with. The user's own namespaces take part, and win a tie: a server may keep
// the user's folders under "INBOX." and shared ones under no prefix at all, as
// Cyrus does, and every name starts with the empty prefix. INBOX is always the
// user's own (RFC 2342 §4). The kind is "" for the user's own namespace.
func namespaceOf(ns *imap.NamespaceData, name string) (kind, prefix string) {
	if ns == nil || strings.EqualFold(name, "INBOX") {
		return "", ""
	}
	longest := -1
	consider := func(k string, descriptors []imap.NamespaceDescriptor) {
		for _, d := range descriptors {
			if inNamespace(name, d) && len(d.Prefix) > longest {
				longest, kind, prefix = len(d.Prefix), k, d.Prefix
			}
		}
	}
	consider("", ns.Personal)
	consider(provider.NamespaceOther, ns.Other)
	consider(provider.NamespaceShared, ns.Shared)
	if kind == "" {
		prefix = ""
	}
	return kind, prefix
}

// inNamespace reports whether a folder called name is in the namespace d: its
// name starts with the prefix, or it is the prefix without the delimiter that
// ends it, which is the namespace's own root ("Shared" for "Shared/").
func inNamespace(name string, d imap.NamespaceDescriptor) bool {
	if strings.HasPrefix(name, d.Prefix) {
		return true
	}
	if d.Delim == 0 {
		return false
	}
	root, ok := strings.CutSuffix(d.Prefix, string(d.Delim))
	return ok && root != "" && name == root
}

// withOtherNamespaces completes a listing of every folder with other people's
// folders, and says of each listed folder whose it is and what the user may do
// in it.
//
// LIST "" "*" lists every namespace on some servers and only the user's own
// on others, which leave the rest to be listed under its prefix (RFC 2342
// §5). So a namespace the listing reached nowhere into is listed under its
// prefix, with the listing's own options: one LIST more, and only on a server
// that has such a namespace and leaves it out.
//
// Where the server keeps access lists, each folder of another namespace is
// asked its rights (MYRIGHTS), all of them together: the user may only read
// in one, or do anything but share it. The user's own folders are not asked:
// their owner may do what the server lets anyone do.
func (p *IMAPProvider) withOtherNamespaces(mailboxes []provider.Mailbox, options *imap.ListOptions) ([]provider.Mailbox, error) {
	ns, err := p.readNamespaces()
	if err != nil || ns == nil {
		return mailboxes, err
	}
	listed := make(map[string]bool, len(mailboxes))
	for _, mbox := range mailboxes {
		listed[mbox.Name] = true
	}
	added := false
	for _, d := range slices.Concat(ns.Other, ns.Shared) {
		if d.Prefix == "" || slices.ContainsFunc(mailboxes, func(mbox provider.Mailbox) bool {
			return strings.HasPrefix(mbox.Name, d.Prefix)
		}) {
			continue
		}
		more, err := p.listMailboxes(d.Prefix+"*", options)
		if err != nil {
			var refused *imap.Error
			if errors.As(err, &refused) {
				// The user's own folders are still a listing.
				log.Printf("alps/provider: IMAP server refused to list the namespace %q: %v", d.Prefix, err)
				continue
			}
			return nil, err
		}
		for _, mbox := range more {
			if !listed[mbox.Name] {
				listed[mbox.Name] = true
				mailboxes = append(mailboxes, mbox)
				added = true
			}
		}
	}
	if added {
		sortMailboxes(mailboxes)
	}

	acl, err := p.SharesFolders()
	if err != nil {
		return nil, err
	}
	var asked []int
	var rights []*imapclient.MyRightsCommand
	for i := range mailboxes {
		mbox := &mailboxes[i]
		mbox.Namespace, mbox.NamespacePrefix = namespaceOf(ns, mbox.Name)
		if !acl || !selectable(mbox) {
			continue
		}
		if mbox.Namespace == "" {
			// A folder of the user's own is seen by other people in the
			// namespace of other users' folders: without one, nobody it
			// were shared with could reach it.
			mbox.Shareable = len(ns.Other) > 0
			continue
		}
		asked = append(asked, i)
		rights = append(rights, p.client.MyRights(mbox.Name))
	}
	var lost error
	for n, cmd := range rights {
		mbox := &mailboxes[asked[n]]
		data, err := cmd.Wait()
		var refused *imap.Error
		switch {
		case errors.As(err, &refused):
			// Rights it would not say are no rights to act on: the folder is
			// listed, and nothing is offered in it that could be refused.
			none := ""
			mbox.Rights = &none
		case err != nil:
			lost = err
		default:
			held := string(data.Rights)
			mbox.Rights = &held
			mbox.Shareable = strings.ContainsRune(held, rune(imap.RightAdminister))
		}
	}
	if lost != nil {
		return nil, p.lostIf(fmt.Errorf("imap: MYRIGHTS failed: %w", lost))
	}
	return mailboxes, nil
}

// selectable reports whether a listed folder can hold mail: not a \Noselect
// or \NonExistent placeholder.
func selectable(mbox *provider.Mailbox) bool {
	for _, attr := range mbox.Attributes {
		if strings.EqualFold(attr, string(imap.MailboxAttrNoSelect)) || strings.EqualFold(attr, string(imap.MailboxAttrNonExistent)) {
			return false
		}
	}
	return true
}
