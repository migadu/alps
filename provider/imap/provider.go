package imap

import (
	"bufio"
	"bytes"
	"errors"
	"fmt"
	"io"
	"log"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapclient"
	"github.com/emersion/go-message"
	"github.com/emersion/go-message/textproto"
	"github.com/migadu/alps/provider"
)

const (
	// MaxMessagesForThreading represents the threshold for disabling the IMAP THREAD and SORT
	// algorithms. Threading massive mailboxes (> 10k messages) causes severe O(N) performance
	// degradation on the IMAP server (high CPU/RAM usage), massive network payloads (1MB+),
	// and backend bottlenecks, essentially acting as an accidental DoS.
	MaxMessagesForThreading = 10000
)

func isMailboxMassive(mbox *imapclient.SelectedMailbox) bool {
	return mbox != nil && mbox.NumMessages > MaxMessagesForThreading
}

type IMAPProvider struct {
	client      *imapclient.Client
	store       provider.Store
	debug       bool
	authservIDs []string

	// selectedUIDValidity is the UIDVALIDITY the selected mailbox was
	// selected with; ensureMailboxSelected is the only place that selects.
	selectedUIDValidity uint32
	verdictLock         sync.Mutex
	verdicts            map[string]*mailboxVerdicts
	dateCache           map[string]map[uint32]time.Time
	// threadFallbacks names the mailboxes already reported as listing flat,
	// so a server that refuses THREAD is logged once per session per mailbox.
	threadFallbacks map[string]bool
	cacheLock       sync.RWMutex
}

func NewIMAPProvider(client *imapclient.Client, debug bool) *IMAPProvider {
	if client == nil {
		return &IMAPProvider{client: nil, store: nil, debug: debug}
	}
	store, _ := newStore(client)
	return &IMAPProvider{
		client:    client,
		store:     store,
		debug:     debug,
		dateCache: make(map[string]map[uint32]time.Time),
	}
}

// GetStore returns the per-user store for this provider
func (p *IMAPProvider) GetStore() (provider.Store, error) {
	if p.store == nil {
		return nil, provider.ErrNoStoreEntry // Or a suitable error
	}
	return p.store, nil
}

// Close closes the IMAP connection
func (p *IMAPProvider) Close() error {
	if p.client != nil {
		if err := p.client.Logout().Wait(); err != nil {
			// ignore logout errors, we just want to flush
		}
		return p.client.Close()
	}
	return nil
}

// ListMailboxes returns all mailboxes
func (p *IMAPProvider) ListMailboxes() ([]provider.Mailbox, error) {
	var options imap.ListOptions
	options.ReturnSubscribed = true
	if p.client.Caps().Has(imap.CapListStatus) {
		options.ReturnStatus = &imap.StatusOptions{
			NumMessages: true,
			UIDValidity: true,
			NumUnseen:   true,
		}
	}

	var mailboxes []provider.Mailbox
	list := p.client.List("", "*", &options)
	for {
		data := list.Next()
		if data == nil {
			break
		}

		// Check if mailbox has \Subscribed attribute
		subscribed := false
		for _, attr := range data.Attrs {
			if string(attr) == "\\Subscribed" {
				subscribed = true
				break
			}
		}

		mbox := provider.Mailbox{
			Name:       data.Mailbox,
			Delimiter:  data.Delim,
			Attributes: make([]string, len(data.Attrs)),
			Total:      -1,
			Unseen:     -1,
			Subscribed: subscribed,
		}
		for i, attr := range data.Attrs {
			mbox.Attributes[i] = string(attr)
		}
		if data.Status != nil {
			mbox.Unseen = int(*data.Status.NumUnseen)
			mbox.Total = int(*data.Status.NumMessages)
		}
		mailboxes = append(mailboxes, mbox)
	}
	if err := list.Close(); err != nil {
		return nil, fmt.Errorf("failed to list mailboxes: %v", err)
	}

	sort.Slice(mailboxes, func(i, j int) bool {
		if mailboxes[i].Name == "INBOX" {
			return true
		}
		if mailboxes[j].Name == "INBOX" {
			return false
		}
		return mailboxes[i].Name < mailboxes[j].Name
	})
	return mailboxes, nil
}

// GetMailboxStatus returns status for a specific mailbox
func (p *IMAPProvider) GetMailboxStatus(name string) (*provider.MailboxStatus, error) {
	status, err := p.client.Status(name, &imap.StatusOptions{
		NumMessages: true,
		UIDValidity: true,
		NumUnseen:   true,
	}).Wait()
	if err != nil {
		return nil, fmt.Errorf("failed to get mailbox status: %v", err)
	}
	return &provider.MailboxStatus{
		Name:        status.Mailbox,
		NumMessages: *status.NumMessages,
		NumUnseen:   *status.NumUnseen,
		UIDValidity: status.UIDValidity,
	}, nil
}

// FindMailboxByType finds a mailbox by its type (Sent, Drafts, etc.)
func (p *IMAPProvider) FindMailboxByType(mboxType provider.MailboxType) (*provider.Mailbox, error) {
	var attr imap.MailboxAttr
	var fallbackNames []string

	switch mboxType {
	case provider.MailboxTypeSent:
		attr = imap.MailboxAttrSent
		fallbackNames = []string{"Sent"}
	case provider.MailboxTypeDrafts:
		attr = imap.MailboxAttrDrafts
		fallbackNames = []string{"Draft", "Drafts"}
	case provider.MailboxTypeTrash:
		attr = imap.MailboxAttrTrash
		fallbackNames = []string{"Trash", "Deleted"}
	case provider.MailboxTypeJunk:
		attr = imap.MailboxAttrJunk
		fallbackNames = []string{"Junk", "Spam"}
	case provider.MailboxTypeArchive:
		attr = imap.MailboxAttrArchive
		fallbackNames = []string{"Archive"}
	}

	list := p.client.List("", "%", nil)

	var attrMatched bool
	var best *imap.ListData
	for {
		mbox := list.Next()
		if mbox == nil {
			break
		}

		for _, a := range mbox.Attrs {
			if attr == a {
				best = mbox
				attrMatched = true
				break
			}
		}
		if attrMatched {
			break
		}

		for _, fallback := range fallbackNames {
			if strings.EqualFold(fallback, mbox.Mailbox) {
				best = mbox
				break
			}
		}
	}
	if err := list.Close(); err != nil {
		return nil, fmt.Errorf("failed to get mailbox with attribute %q: %v", attr, err)
	}

	if best == nil {
		return nil, nil
	}

	result := &provider.Mailbox{
		Name:       best.Mailbox,
		Delimiter:  best.Delim,
		Attributes: make([]string, len(best.Attrs)),
		Total:      -1,
		Unseen:     -1,
	}
	for i, attr := range best.Attrs {
		result.Attributes[i] = string(attr)
	}
	return result, nil
}

// CreateMailbox creates a new mailbox
func (p *IMAPProvider) CreateMailbox(name string) error {
	cmd := p.client.Create(name, nil)
	return cmd.Wait()
}

// DeleteMailbox deletes a mailbox
func (p *IMAPProvider) DeleteMailbox(name string) error {
	cmd := p.client.Delete(name)
	return cmd.Wait()
}

// EmptyMailbox deletes every message in a mailbox, and returns how many there
// were when it started.
//
// The count comes from a SELECT issued HERE, never from the client's cached
// view of the mailbox. `ensureMailboxSelected` is a no-op when the mailbox is
// already the selected one, and the NumMessages it then leaves behind is
// whatever the last command on this connection happened to observe. A stale
// zero made this method return nil without touching a thing — and nil is what
// the route reports to the user as "Mailbox emptied", over a folder still full
// of mail. A re-SELECT of the mailbox already selected is one cheap round trip,
// and it is the only way to know the answer is current.
func (p *IMAPProvider) EmptyMailbox(name string) (int, error) {
	data, err := p.client.Select(name, nil).Wait()
	if err != nil {
		return 0, fmt.Errorf("failed to select mailbox: %v", err)
	}
	p.selectedUIDValidity = data.UIDValidity

	if data.NumMessages == 0 {
		return 0, nil
	}

	var seqSet imap.SeqSet
	seqSet.AddRange(1, data.NumMessages)

	err = p.client.Store(seqSet, &imap.StoreFlags{
		Op:     imap.StoreFlagsAdd,
		Silent: true,
		Flags:  []imap.Flag{imap.FlagDeleted},
	}, nil).Close()
	if err != nil {
		return 0, err
	}

	if err := p.client.Expunge().Close(); err != nil {
		return 0, err
	}
	return int(data.NumMessages), nil
}

// RenameMailbox renames a mailbox
func (p *IMAPProvider) RenameMailbox(oldName, newName string) error {
	cmd := p.client.Rename(oldName, newName, nil)
	return cmd.Wait()
}

// SubscribeMailbox subscribes to a mailbox
func (p *IMAPProvider) SubscribeMailbox(name string) error {
	cmd := p.client.Subscribe(name)
	return cmd.Wait()
}

// UnsubscribeMailbox unsubscribes from a mailbox
func (p *IMAPProvider) UnsubscribeMailbox(name string) error {
	cmd := p.client.Unsubscribe(name)
	return cmd.Wait()
}

// ensureMailboxSelected ensures the mailbox is selected
func (p *IMAPProvider) ensureMailboxSelected(mboxName string) error {
	if mbox := p.client.Mailbox(); mbox == nil || mbox.Name != mboxName {
		data, err := p.client.Select(mboxName, nil).Wait()
		if err != nil {
			return fmt.Errorf("failed to select mailbox: %v", err)
		}
		p.selectedUIDValidity = data.UIDValidity
	}
	return nil
}

type ThreadGroup struct {
	RepUID uint32
	UIDs   []uint32
}

func (p *IMAPProvider) sortGroups(mailbox string, groups []ThreadGroup, sortOrder string) error {
	if len(groups) == 0 {
		return nil
	}

	var s struct {
		MessageSortCriteria string `json:"message_sort_criteria"`
	}
	sortCriteria := "date" // Default to date
	if p.store != nil {
		if err := p.store.Get("base.settings", &s); err == nil && s.MessageSortCriteria != "" {
			sortCriteria = s.MessageSortCriteria
		}
	}

	if sortCriteria == "date" {
		// 1. Sort all groups by RepUID first (filing date / sequential proxy)
		if sortOrder == "asc" {
			sort.Slice(groups, func(i, j int) bool {
				return groups[i].RepUID < groups[j].RepUID
			})
		} else {
			sort.Slice(groups, func(i, j int) bool {
				return groups[i].RepUID > groups[j].RepUID
			})
		}

		// 2. Define the sliding window of the newest messages by UID.
		// For descending, newest are at the beginning. For ascending, they are at the end.
		windowSize := 1000
		if len(groups) < windowSize {
			windowSize = len(groups)
		}

		var windowGroups []ThreadGroup
		if sortOrder == "asc" {
			windowStart := len(groups) - windowSize
			windowGroups = groups[windowStart:]
		} else {
			windowGroups = groups[:windowSize]
		}

		// A server with SORT orders the window by date itself. RFC 5256's DATE
		// key is the Date header, else the internal date: the fallback the
		// envelope fetch below applies. That fetch, one envelope per thread,
		// took most of a second for a large inbox.
		if p.client.Caps().Has(imap.CapSort) && p.sortWindowByDate(windowGroups, sortOrder) {
			return nil
		}

		// 3. Initialize cache
		p.cacheLock.Lock()
		if p.dateCache == nil {
			p.dateCache = make(map[string]map[uint32]time.Time)
		}
		mboxCache := p.dateCache[mailbox]
		if mboxCache == nil {
			mboxCache = make(map[uint32]time.Time)
			p.dateCache[mailbox] = mboxCache
		} else if len(mboxCache) > 10000 {
			mboxCache = make(map[uint32]time.Time)
			p.dateCache[mailbox] = mboxCache
		}
		p.cacheLock.Unlock()

		// 4. Batch-fetch only for uncached UIDs in the window
		var uidsToFetch []uint32
		p.cacheLock.RLock()
		for _, g := range windowGroups {
			if _, cached := mboxCache[g.RepUID]; !cached {
				uidsToFetch = append(uidsToFetch, g.RepUID)
			}
		}
		p.cacheLock.RUnlock()

		if len(uidsToFetch) > 0 {
			var repUIDSet imap.UIDSet
			for _, uid := range uidsToFetch {
				repUIDSet.AddNum(imap.UID(uid))
			}

			fetchOptions := imap.FetchOptions{
				Envelope:     true,
				InternalDate: true,
			}
			imapMsgs, err := p.client.Fetch(repUIDSet, &fetchOptions).Collect()
			if err != nil {
				return err
			}

			p.cacheLock.Lock()
			for _, msg := range imapMsgs {
				date := time.Time{}
				if msg.Envelope != nil {
					date = msg.Envelope.Date
				}
				if date.IsZero() {
					date = msg.InternalDate
				}
				mboxCache[uint32(msg.UID)] = date
			}
			p.cacheLock.Unlock()
		}

		// 5. Sort the window in-place chronologically by actual date
		p.cacheLock.RLock()
		if sortOrder == "asc" {
			sort.Slice(windowGroups, func(i, j int) bool {
				d1 := mboxCache[windowGroups[i].RepUID]
				d2 := mboxCache[windowGroups[j].RepUID]
				if d1.Equal(d2) {
					return windowGroups[i].RepUID < windowGroups[j].RepUID
				}
				return d1.Before(d2)
			})
		} else {
			sort.Slice(windowGroups, func(i, j int) bool {
				d1 := mboxCache[windowGroups[i].RepUID]
				d2 := mboxCache[windowGroups[j].RepUID]
				if d1.Equal(d2) {
					return windowGroups[i].RepUID > windowGroups[j].RepUID
				}
				return d1.After(d2)
			})
		}
		p.cacheLock.RUnlock()
	} else {
		// Default to UID (Filing Date) sorting for all groups
		if sortOrder == "asc" {
			sort.Slice(groups, func(i, j int) bool {
				return groups[i].RepUID < groups[j].RepUID
			})
		} else {
			sort.Slice(groups, func(i, j int) bool {
				return groups[i].RepUID > groups[j].RepUID
			})
		}
	}

	return nil
}

// sortWindowByDate orders groups by their representative message's date with
// the server's SORT, newest first unless sortOrder is "asc", and reports
// whether the server answered. Messages with the same date keep the server's
// order, which RFC 5256 breaks by sequence number; a group the server did not
// return goes last.
func (p *IMAPProvider) sortWindowByDate(groups []ThreadGroup, sortOrder string) bool {
	var reps imap.UIDSet
	for _, g := range groups {
		reps.AddNum(imap.UID(g.RepUID))
	}
	data, err := p.client.UIDSort(&imapclient.SortOptions{
		SearchCriteria: &imap.SearchCriteria{UID: []imap.UIDSet{reps}},
		SortCriteria:   []imap.SortCriterion{{Key: imap.SortKeyDate, Reverse: sortOrder != "asc"}},
	}).Wait()
	if err != nil {
		if p.debug {
			fmt.Printf("thread sort: SORT failed, fetching envelopes instead: %v\n", err)
		}
		return false
	}
	position := make(map[uint32]int, len(data.UIDs))
	for i, uid := range data.UIDs {
		position[uint32(uid)] = i
	}
	sort.SliceStable(groups, func(i, j int) bool {
		pi, iok := position[groups[i].RepUID]
		pj, jok := position[groups[j].RepUID]
		if iok != jok {
			return iok
		}
		return pi < pj
	})
	return true
}

func (p *IMAPProvider) fetchThreadGroups(criteria *imap.SearchCriteria) ([]ThreadGroup, error) {
	var algo imap.ThreadAlgorithm
	if p.client.Caps().Has(imap.Cap("THREAD=REFS")) {
		algo = imap.ThreadAlgorithm("REFS")
	} else if p.client.Caps().Has(imap.Cap("THREAD=REFERENCES")) {
		algo = imap.ThreadReferences
	} else if p.client.Caps().Has(imap.Cap("THREAD=ORDEREDSUBJECT")) {
		algo = imap.ThreadOrderedSubject
	}

	if algo == "" {
		return nil, fmt.Errorf("threading not supported by server")
	}

	options := imapclient.ThreadOptions{
		Algorithm:      algo,
		SearchCriteria: criteria,
	}
	threadTrees, err := p.client.UIDThread(&options).Wait()
	if err != nil {
		return nil, fmt.Errorf("UID THREAD failed: %w", err)
	}

	var groups []ThreadGroup

	var collect func(*imap.ThreadData) []uint32
	collect = func(t *imap.ThreadData) []uint32 {
		var uids []uint32
		uids = append(uids, t.Chain...)
		for i := range t.SubThreads {
			uids = append(uids, collect(&t.SubThreads[i])...)
		}
		return uids
	}

	for i := range threadTrees {
		uids := collect(&threadTrees[i])
		if len(uids) == 0 {
			continue
		}

		// Find representative UID (max UID in the thread)
		var repUID uint32
		for _, uid := range uids {
			if uid > repUID {
				repUID = uid
			}
		}

		groups = append(groups, ThreadGroup{
			RepUID: repUID,
			UIDs:   uids,
		})
	}

	return groups, nil
}

// refusedByServer reports whether err is the server declining a command with a
// tagged NO or BAD, rather than the connection or the client giving out.
//
// Only a refusal is worth answering differently. Anything else — a dead
// socket, a malformed response — will fail the next command on this connection
// too, and the caller is better served by the original error than by a second
// one from a fallback that never had a chance.
func refusedByServer(err error) bool {
	var imapErr *imap.Error
	if !errors.As(err, &imapErr) {
		return false
	}
	return imapErr.Type == imap.StatusResponseTypeNo || imapErr.Type == imap.StatusResponseTypeBad
}

// noteThreadFallback records that a mailbox is being listed flat, and reports
// whether this is the first time for this session. A server that refuses
// THREAD refuses it for every page, so the operator wants to hear once, not on
// each click.
func (p *IMAPProvider) noteThreadFallback(mailbox string) bool {
	p.cacheLock.Lock()
	defer p.cacheLock.Unlock()
	if p.threadFallbacks == nil {
		p.threadFallbacks = make(map[string]bool)
	}
	if p.threadFallbacks[mailbox] {
		return false
	}
	p.threadFallbacks[mailbox] = true
	return true
}

// threadedPage paints one page of a THREADed message list: group the mailbox
// into conversations, order the groups, then fetch and convert just the page's
// messages. ListMessages and SearchMessages share it — they differ only in the
// criteria they thread over.
//
// Its error is RECOVERABLE by design. Nothing here touches session state, so a
// caller that gets one can simply carry on down its own unthreaded path, which
// is what both of them do.
func (p *IMAPProvider) threadedPage(mailbox string, criteria *imap.SearchCriteria, sortOrder string, page, pageSize int) ([]provider.Message, int, error) {
	groups, err := p.fetchThreadGroups(criteria)
	if err != nil {
		return nil, 0, err
	}

	// Sort groups based on criteria and sortOrder
	if err := p.sortGroups(mailbox, groups, sortOrder); err != nil {
		return nil, 0, fmt.Errorf("failed to sort thread groups: %w", err)
	}

	total := len(groups)
	from := page * pageSize
	to := from + pageSize
	if from >= total {
		return nil, total, nil
	}
	if to > total {
		to = total
	}
	paginatedGroups := groups[from:to]

	var allUIDs []uint32
	for _, g := range paginatedGroups {
		allUIDs = append(allUIDs, g.UIDs...)
	}

	var uidSet imap.UIDSet
	for _, uid := range allUIDs {
		uidSet.AddNum(imap.UID(uid))
	}

	fetchOptions := imap.FetchOptions{
		Flags:         true,
		Envelope:      true,
		UID:           true,
		RFC822Size:    true,
		BodyStructure: &imap.FetchItemBodyStructure{Extended: true},
	}

	imapMsgs, err := p.client.Fetch(uidSet, &fetchOptions).Collect()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to fetch representative messages: %w", err)
	}

	msgMap := make(map[uint32]*imapclient.FetchMessageBuffer)
	for _, msg := range imapMsgs {
		msgMap[uint32(msg.UID)] = msg
	}

	msgs := make([]provider.Message, 0, len(paginatedGroups))
	for _, g := range paginatedGroups {
		fetchMsg, ok := msgMap[g.RepUID]
		if !ok {
			continue
		}
		converted := p.convertIMAPMessage(fetchMsg, mailbox)
		converted.ThreadCount = len(g.UIDs)
		converted.ThreadUIDs = make([]string, len(g.UIDs))
		for idx, u := range g.UIDs {
			converted.ThreadUIDs[idx] = strconv.FormatUint(uint64(u), 10)
		}

		// Sort sub-messages in ascending order (chronological) and assign them
		sort.Slice(g.UIDs, func(i, j int) bool {
			return g.UIDs[i] < g.UIDs[j]
		})

		var subMessages []provider.Message
		for _, uid := range g.UIDs {
			if uid == g.RepUID {
				continue
			}
			subFetchMsg, ok := msgMap[uid]
			if !ok {
				continue
			}
			subMessages = append(subMessages, p.convertIMAPMessage(subFetchMsg, mailbox))
		}
		converted.SubMessages = subMessages

		msgs = append(msgs, converted)
	}

	return msgs, total, nil
}

// ListMessages returns a paginated list of messages
func (p *IMAPProvider) ListMessages(mailbox string, sortOrder string, page, pageSize int) ([]provider.Message, provider.PageInfo, error) {
	// A NOOP will ensure we notice any new message
	noop := p.client.Noop()
	if err := p.ensureMailboxSelected(mailbox); err != nil {
		return nil, provider.PageInfo{}, err
	}
	if err := noop.Wait(); err != nil {
		return nil, provider.PageInfo{}, err
	}

	var s struct {
		UI struct {
			EnableThreading *bool `json:"enableThreading"`
		} `json:"ui"`
	}
	enableThreading := true
	if p.store != nil {
		if err := p.store.Get("base.settings", &s); err == nil && s.UI.EnableThreading != nil {
			enableThreading = *s.UI.EnableThreading
		}
	}

	mbox := p.client.Mailbox()
	if isMailboxMassive(mbox) {
		enableThreading = false
	}

	if enableThreading && p.HasThreadCapability() {
		msgs, total, err := p.threadedPage(mailbox, &imap.SearchCriteria{}, sortOrder, page, pageSize)
		if err == nil {
			return msgs, provider.PageInfo{Total: total, Threaded: true}, nil
		}
		if !p.fallBackToFlat(mailbox, err) {
			return nil, provider.PageInfo{}, err
		}
	}

	mbox = p.client.Mailbox()
	total := int(mbox.NumMessages)

	var from, to int
	if sortOrder == "asc" {
		from = page*pageSize + 1
		to = from + pageSize - 1
		if to > total {
			to = total
		}
		if from > total {
			return nil, provider.PageInfo{Total: total}, nil
		}
	} else {
		to = total - page*pageSize
		from = to - pageSize + 1
		if from <= 0 {
			from = 1
		}
		if to <= 0 {
			return nil, provider.PageInfo{Total: total}, nil
		}
	}

	var seqSet imap.SeqSet
	seqSet.AddRange(uint32(from), uint32(to))
	options := imap.FetchOptions{
		Flags:         true,
		Envelope:      true,
		UID:           true,
		RFC822Size:    true,
		BodyStructure: &imap.FetchItemBodyStructure{Extended: true},
	}
	imapMsgs, err := p.client.Fetch(seqSet, &options).Collect()
	if err != nil {
		return nil, provider.PageInfo{}, fmt.Errorf("failed to fetch message list: %v", err)
	}

	msgs := make([]provider.Message, 0, len(imapMsgs))
	for _, msg := range imapMsgs {
		converted := p.convertIMAPMessage(msg, mailbox)
		converted.ThreadUIDs = []string{converted.ID.String()}
		msgs = append(msgs, converted)
	}

	// Reverse list of messages if descending
	if sortOrder == "desc" || sortOrder == "" {
		for i := len(msgs)/2 - 1; i >= 0; i-- {
			opp := len(msgs) - 1 - i
			msgs[i], msgs[opp] = msgs[opp], msgs[i]
		}
	}

	return msgs, provider.PageInfo{Total: total}, nil
}

// SearchMessageIDs answers every UID in the mailbox the query matches, and
// nothing about those messages: what an action on a whole folder is applied to.
// One SEARCH, so the answer is the mailbox as it stands, not the page of a
// listing the client happens to hold.
func (p *IMAPProvider) SearchMessageIDs(mailbox, query string) ([]provider.MessageID, error) {
	if p.client == nil {
		return nil, fmt.Errorf("IMAP client not initialized")
	}
	if err := p.ensureMailboxSelected(mailbox); err != nil {
		return nil, err
	}

	criteria := prepareIMAPSearch(query)
	if criteria == nil {
		// No query is the whole mailbox, as an unfiltered listing is.
		criteria = &imap.SearchCriteria{}
	}

	data, err := p.client.UIDSearch(criteria, nil).Wait()
	if err != nil {
		return nil, fmt.Errorf("failed to search %q: %v", mailbox, err)
	}

	uids := data.AllUIDs()
	ids := make([]provider.MessageID, 0, len(uids))
	for _, uid := range uids {
		ids = append(ids, IMAPUID(uid))
	}
	return ids, nil
}

// SearchMessages searches messages in a mailbox
func (p *IMAPProvider) SearchMessages(mailbox, query string, sortOrder string, page, pageSize int) ([]provider.Message, provider.PageInfo, error) {
	if mailbox == "*" {
		if p.HasESearchCapability() {
			return p.searchESearchMessages(query, sortOrder, page, pageSize)
		}
		// Fallback to INBOX if ESEARCH/MULTISEARCH is not supported
		mailbox = "INBOX"
	}

	if err := p.ensureMailboxSelected(mailbox); err != nil {
		return nil, provider.PageInfo{}, err
	}

	mbox := p.client.Mailbox()
	if isMailboxMassive(mbox) && query == "" {
		// Fast path for massive mailboxes without a search query.
		// Avoid the massive IMAP SORT response by falling back to sequential listing.
		return p.ListMessages(mailbox, sortOrder, page, pageSize)
	}

	searchCriteria := prepareIMAPSearch(query)

	var s struct {
		UI struct {
			EnableThreading *bool `json:"enableThreading"`
		} `json:"ui"`
	}
	enableThreading := true
	if p.store != nil {
		if err := p.store.Get("base.settings", &s); err == nil && s.UI.EnableThreading != nil {
			enableThreading = *s.UI.EnableThreading
		}
	}

	mbox = p.client.Mailbox()
	if isMailboxMassive(mbox) {
		enableThreading = false
	}

	if enableThreading && p.HasThreadCapability() {
		msgs, total, err := p.threadedPage(mailbox, searchCriteria, sortOrder, page, pageSize)
		if err == nil {
			return msgs, provider.PageInfo{Total: total, Threaded: true}, nil
		}
		if !p.fallBackToFlat(mailbox, err) {
			return nil, provider.PageInfo{}, err
		}
		// A server can refuse THREAD over a folder it will happily list — it is
		// the most expensive thing a client asks for, so it is the first thing
		// a server throttles (ours answers `NO [LIMIT] ... slow down`). That is
		// a reason to show the folder UNTHREADED, not to fail the page: a flat
		// list is the whole folder, just without the grouping. Same call the
		// SORT fallback in sortGroups makes.
		if p.debug {
			fmt.Printf("threaded list: THREAD failed, listing flat instead: %v\n", err)
		}
	}

	var nums []uint32
	if !p.client.Caps().Has(imap.CapSort) {
		data, err := p.client.Search(searchCriteria, nil).Wait()
		if err != nil {
			return nil, provider.PageInfo{}, fmt.Errorf("SEARCH failed: %v", err)
		}
		if data != nil {
			nums = data.AllSeqNums()
		}
		if sortOrder == "desc" || sortOrder == "" {
			for i := len(nums)/2 - 1; i >= 0; i-- {
				opp := len(nums) - 1 - i
				nums[i], nums[opp] = nums[opp], nums[i]
			}
		}
	} else {
		sortOptions := &imapclient.SortOptions{
			SearchCriteria: searchCriteria,
			SortCriteria: []imap.SortCriterion{
				{Key: imap.SortKeyDate, Reverse: sortOrder == "desc" || sortOrder == ""},
			},
		}
		var err error
		sortData, err := p.client.Sort(sortOptions).Wait()
		if err != nil {
			return nil, provider.PageInfo{}, fmt.Errorf("SORT failed: %v", err)
		}
		nums = sortData.SeqNums
	}

	total := len(nums)

	from := page * pageSize
	to := from + pageSize
	if from >= len(nums) {
		return nil, provider.PageInfo{Total: total}, nil
	}
	if to > len(nums) {
		to = len(nums)
	}
	nums = nums[from:to]

	indexes := make(map[uint32]int)
	for i, num := range nums {
		indexes[num] = i
	}

	seqSet := imap.SeqSetNum(nums...)
	options := imap.FetchOptions{
		Envelope:      true,
		Flags:         true,
		UID:           true,
		RFC822Size:    true,
		BodyStructure: &imap.FetchItemBodyStructure{Extended: true},
	}
	results, err := p.client.Fetch(seqSet, &options).Collect()
	if err != nil {
		return nil, provider.PageInfo{}, fmt.Errorf("failed to fetch message list: %v", err)
	}

	msgs := make([]provider.Message, len(nums))
	for _, msg := range results {
		i, ok := indexes[msg.SeqNum]
		if !ok {
			continue
		}
		msgs[i] = p.convertIMAPMessage(msg, mailbox)
	}

	var validMsgs []provider.Message
	for _, msg := range msgs {
		if msg.ID != nil {
			validMsgs = append(validMsgs, msg)
		}
	}

	return validMsgs, provider.PageInfo{Total: total}, nil
}

// GetMessageMetadata fetches a message's metadata without downloading any body parts
func (p *IMAPProvider) GetMessageMetadata(mailbox string, id provider.MessageID) (*provider.Message, error) {
	if err := p.ensureMailboxSelected(mailbox); err != nil {
		return nil, err
	}

	uid := id.(IMAPUID)
	bodySection := &imap.FetchItemBodySection{
		Specifier:    imap.PartSpecifierHeader,
		HeaderFields: []string{"Authentication-Results"},
		Peek:         true,
	}
	referencesBodySection := &imap.FetchItemBodySection{
		Specifier:    imap.PartSpecifierHeader,
		HeaderFields: []string{"References"},
		Peek:         true,
	}
	options := imap.FetchOptions{
		Envelope:      true,
		UID:           true,
		BodyStructure: &imap.FetchItemBodyStructure{Extended: true},
		Flags:         true,
		RFC822Size:    true,
		BodySection:   []*imap.FetchItemBodySection{bodySection, referencesBodySection},
	}

	msgs, err := p.client.Fetch(imap.UIDSetNum(imap.UID(uid)), &options).Collect()
	if err != nil {
		return nil, fmt.Errorf("failed to fetch message metadata: %v", err)
	} else if len(msgs) == 0 {
		// Try syncing state with NOOP and fetching again
		if err := p.client.Noop().Wait(); err == nil {
			msgs, err = p.client.Fetch(imap.UIDSetNum(imap.UID(uid)), &options).Collect()
			if err != nil {
				return nil, fmt.Errorf("failed to fetch message metadata after NOOP: %v", err)
			}
		}
		if len(msgs) == 0 {
			return nil, fmt.Errorf("UID %d: %w", uid, provider.ErrMessageNotFound)
		}
	}

	converted := p.convertIMAPMessage(msgs[0], mailbox)
	return &converted, nil
}

// GetMessagePart fetches a message part
func (p *IMAPProvider) GetMessagePart(mailbox string, id provider.MessageID, partPath []int) (*provider.Message, *message.Entity, error) {
	uid := id.(IMAPUID)
	msg, part, _, _, err := p.getMessagePartWithData(mailbox, imap.UID(uid), partPath)
	if err != nil {
		return nil, nil, err
	}
	converted := p.convertIMAPMessage(msg, mailbox)
	return &converted, part, nil
}

// GetMessagePartRaw fetches a message part's raw bytes
func (p *IMAPProvider) GetMessagePartRaw(mailbox string, id provider.MessageID, partPath []int, limit int64) (*provider.Message, []byte, []byte, error) {
	uid := id.(IMAPUID)
	msg, headerBuf, bodyBuf, err := p.getMessagePartRaw(mailbox, imap.UID(uid), partPath, limit)
	if err != nil {
		return nil, nil, nil, err
	}
	converted := p.convertIMAPMessage(msg, mailbox)
	return &converted, headerBuf, bodyBuf, nil
}

// GetMessagePartWithData fetches a message part with both entity and raw data
func (p *IMAPProvider) GetMessagePartWithData(mailbox string, id provider.MessageID, partPath []int) (*provider.Message, *message.Entity, []byte, []byte, error) {
	uid := id.(IMAPUID)
	msg, part, headerBuf, bodyBuf, err := p.getMessagePartWithData(mailbox, imap.UID(uid), partPath)
	if err != nil {
		return nil, nil, nil, nil, err
	}
	converted := p.convertIMAPMessage(msg, mailbox)
	return &converted, part, headerBuf, bodyBuf, nil
}

func (p *IMAPProvider) getMessagePartRaw(mailbox string, uid imap.UID, partPath []int, limit int64) (*imapclient.FetchMessageBuffer, []byte, []byte, error) {
	if err := p.ensureMailboxSelected(mailbox); err != nil {
		return nil, nil, nil, err
	}

	headerItem := &imap.FetchItemBodySection{
		Peek: true,
		Part: partPath,
	}
	if len(partPath) > 0 {
		headerItem.Specifier = imap.PartSpecifierMIME
	} else {
		headerItem.Specifier = imap.PartSpecifierHeader
	}

	bodyItem := &imap.FetchItemBodySection{
		Part: partPath,
	}
	if len(partPath) > 0 {
		bodyItem.Specifier = imap.PartSpecifierNone
	} else {
		bodyItem.Specifier = imap.PartSpecifierText
	}
	if limit > 0 {
		bodyItem.Partial = &imap.SectionPartial{Offset: 0, Size: limit}
	}

	options := imap.FetchOptions{
		Envelope:      true,
		UID:           true,
		BodyStructure: &imap.FetchItemBodyStructure{Extended: true},
		Flags:         true,
		RFC822Size:    true,
		BodySection:   []*imap.FetchItemBodySection{headerItem, bodyItem},
	}

	msgs, err := p.client.Fetch(imap.UIDSetNum(uid), &options).Collect()
	if err != nil {
		return nil, nil, nil, fmt.Errorf("failed to fetch message: %v", err)
	} else if len(msgs) == 0 {
		// Try syncing state with NOOP and fetching again
		if err := p.client.Noop().Wait(); err == nil {
			msgs, err = p.client.Fetch(imap.UIDSetNum(uid), &options).Collect()
			if err != nil {
				return nil, nil, nil, fmt.Errorf("failed to fetch message after NOOP: %v", err)
			}
		}
		if len(msgs) == 0 {
			return nil, nil, nil, fmt.Errorf("UID %d: %w", uid, provider.ErrMessageNotFound)
		}
	}
	msg := msgs[0]

	headerBuf := msg.FindBodySection(headerItem)
	bodyBuf := msg.FindBodySection(bodyItem)
	if headerBuf == nil || bodyBuf == nil {
		return nil, nil, nil, fmt.Errorf("server didn't return header and body")
	}

	return msg, headerBuf, bodyBuf, nil
}

func (p *IMAPProvider) getMessagePartWithData(mailbox string, uid imap.UID, partPath []int) (*imapclient.FetchMessageBuffer, *message.Entity, []byte, []byte, error) {
	if err := p.ensureMailboxSelected(mailbox); err != nil {
		return nil, nil, nil, nil, err
	}

	headerItem := &imap.FetchItemBodySection{
		Peek: true,
		Part: partPath,
	}
	if len(partPath) > 0 {
		headerItem.Specifier = imap.PartSpecifierMIME
	} else {
		headerItem.Specifier = imap.PartSpecifierHeader
	}

	bodyItem := &imap.FetchItemBodySection{
		Part: partPath,
	}
	if len(partPath) > 0 {
		bodyItem.Specifier = imap.PartSpecifierNone
	} else {
		bodyItem.Specifier = imap.PartSpecifierText
	}

	options := imap.FetchOptions{
		Envelope:      true,
		UID:           true,
		BodyStructure: &imap.FetchItemBodyStructure{Extended: true},
		Flags:         true,
		RFC822Size:    true,
		BodySection:   []*imap.FetchItemBodySection{headerItem, bodyItem},
	}

	msgs, err := p.client.Fetch(imap.UIDSetNum(uid), &options).Collect()
	if err != nil {
		return nil, nil, nil, nil, fmt.Errorf("failed to fetch message: %v", err)
	} else if len(msgs) == 0 {
		// Try syncing state with NOOP and fetching again
		if err := p.client.Noop().Wait(); err == nil {
			msgs, err = p.client.Fetch(imap.UIDSetNum(uid), &options).Collect()
			if err != nil {
				return nil, nil, nil, nil, fmt.Errorf("failed to fetch message after NOOP: %v", err)
			}
		}
		if len(msgs) == 0 {
			return nil, nil, nil, nil, fmt.Errorf("UID %d: %w", uid, provider.ErrMessageNotFound)
		}
	}
	msg := msgs[0]

	headerBuf := msg.FindBodySection(headerItem)
	bodyBuf := msg.FindBodySection(bodyItem)
	if headerBuf == nil || bodyBuf == nil {
		return nil, nil, nil, nil, fmt.Errorf("server didn't return header and body")
	}

	h, err := textproto.ReadHeader(bufio.NewReader(bytes.NewReader(headerBuf)))
	if err != nil {
		return nil, nil, nil, nil, fmt.Errorf("failed to read part header: %v", err)
	}

	part, err := message.New(message.Header{Header: h}, bytes.NewReader(bodyBuf))
	if err != nil {
		return nil, nil, nil, nil, fmt.Errorf("failed to create message reader: %v", err)
	}

	return msg, part, headerBuf, bodyBuf, nil
}

// SetMessagesFlags sets flags for multiple messages
func (p *IMAPProvider) SetMessagesFlags(mailbox string, ids []provider.MessageID, op provider.FlagOperation) error {
	if len(ids) == 0 {
		return nil
	}
	if err := p.ensureMailboxSelected(mailbox); err != nil {
		return err
	}

	var uidSet imap.UIDSet
	for _, id := range ids {
		uid := id.(IMAPUID)
		uidSet.AddNum(imap.UID(uid))
	}

	var imapOp imap.StoreFlagsOp
	switch op.Op {
	case provider.FlagOpSet:
		imapOp = imap.StoreFlagsSet
	case provider.FlagOpAdd:
		imapOp = imap.StoreFlagsAdd
	case provider.FlagOpRemove:
		imapOp = imap.StoreFlagsDel
	}

	flags := make([]imap.Flag, len(op.Flags))
	for i, flag := range op.Flags {
		flags[i] = imap.Flag(flag)
	}

	return p.client.Store(uidSet, &imap.StoreFlags{
		Op:     imapOp,
		Silent: op.Silent,
		Flags:  flags,
	}, nil).Close()
}

// MarkAnswered marks a message as answered
func (p *IMAPProvider) MarkAnswered(mailbox string, id provider.MessageID) error {
	uid := id.(IMAPUID)
	if err := p.ensureMailboxSelected(mailbox); err != nil {
		return err
	}

	return p.client.Store(imap.UIDSetNum(imap.UID(uid)), &imap.StoreFlags{
		Op:     imap.StoreFlagsAdd,
		Silent: true,
		Flags:  []imap.Flag{imap.FlagAnswered},
	}, nil).Close()
}

// AppendMessage appends a message to a mailbox and returns the UID
func (p *IMAPProvider) AppendMessage(mailbox string, msg provider.OutgoingMessageWriter, mboxType provider.MailboxType) (*provider.Mailbox, provider.MessageID, uint32, error) {
	mbox, err := p.FindMailboxByType(mboxType)
	if err != nil {
		return nil, nil, 0, err
	}
	if mbox == nil {
		return nil, nil, 0, fmt.Errorf("unable to resolve mailbox")
	}

	// IMAP needs to know in advance the final size of the message
	var buf bytes.Buffer
	if _, err := msg.WriteTo(&buf); err != nil {
		return nil, nil, 0, err
	}
	size := uint32(buf.Len())

	flags := []imap.Flag{imap.FlagSeen}
	if mboxType == provider.MailboxTypeDrafts {
		flags = append(flags, imap.FlagDraft)
	}
	options := imap.AppendOptions{Flags: flags}
	appendCmd := p.client.Append(mbox.Name, int64(buf.Len()), &options)
	if _, err := io.Copy(appendCmd, &buf); err != nil {
		appendCmd.Close()
		return nil, nil, 0, err
	}
	if err := appendCmd.Close(); err != nil {
		return nil, nil, 0, err
	}

	appendData, err := appendCmd.Wait()
	if err != nil {
		return nil, nil, 0, err
	}

	// Try to get UID from APPENDUID response
	var uid provider.MessageID
	if appendData != nil && appendData.UID != 0 {
		uid = IMAPUID(appendData.UID)
	}

	// Force synchronization of mailbox state if the destination mailbox is currently selected
	if currentMbox := p.client.Mailbox(); currentMbox != nil && currentMbox.Name == mbox.Name {
		p.client.Noop().Wait()
	}

	return mbox, uid, size, nil
}

// DeleteMessages deletes multiple messages
func (p *IMAPProvider) DeleteMessages(mailbox string, ids []provider.MessageID) error {
	if len(ids) == 0 {
		return nil
	}
	if err := p.ensureMailboxSelected(mailbox); err != nil {
		return err
	}

	var uidSet imap.UIDSet
	for _, id := range ids {
		uid := id.(IMAPUID)
		uidSet.AddNum(imap.UID(uid))
	}

	err := p.client.Store(uidSet, &imap.StoreFlags{
		Op:     imap.StoreFlagsAdd,
		Silent: true,
		Flags:  []imap.Flag{imap.FlagDeleted},
	}, nil).Close()
	if err != nil {
		return err
	}

	err = p.client.Expunge().Close()
	if err != nil {
		return err
	}

	// Force synchronization of mailbox state if the current mailbox is selected
	if mbox := p.client.Mailbox(); mbox != nil && mbox.Name == mailbox {
		p.client.Noop().Wait()
	}
	return nil
}

// MoveMessages moves multiple messages between mailboxes
func (p *IMAPProvider) MoveMessages(sourceMailbox, destMailbox string, ids []provider.MessageID) (map[provider.MessageID]provider.MessageID, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	if err := p.ensureMailboxSelected(sourceMailbox); err != nil {
		return nil, err
	}

	var uidSet imap.UIDSet
	for _, id := range ids {
		uid := id.(IMAPUID)
		uidSet.AddNum(imap.UID(uid))
	}

	if p.client.Caps().Has(imap.CapMove) {
		moveCmd := p.client.Move(uidSet, destMailbox)
		moveData, err := moveCmd.Wait()
		if err != nil {
			return nil, err
		}

		uidMapping := make(map[provider.MessageID]provider.MessageID)
		if moveData != nil && moveData.SourceUIDs != nil && moveData.DestUIDs != nil {
			if srcUidSet, ok1 := moveData.SourceUIDs.(imap.UIDSet); ok1 {
				if dstUidSet, ok2 := moveData.DestUIDs.(imap.UIDSet); ok2 {
					srcNums, _ := srcUidSet.Nums()
					dstNums, _ := dstUidSet.Nums()
					if len(srcNums) == len(dstNums) {
						for i := range srcNums {
							uidMapping[IMAPUID(srcNums[i])] = IMAPUID(dstNums[i])
						}
					}
				}
			}
		}

		// Robust fallback: Some IMAP servers (or specific mailboxes) might copy but not expunge immediately on MOVE.
		// We explicitly verify if the source messages are still present and delete them if necessary.
		searchCmd := p.client.UIDSearch(&imap.SearchCriteria{UID: []imap.UIDSet{uidSet}}, nil)
		searchData, err := searchCmd.Wait()
		if err == nil && searchData != nil && len(searchData.AllUIDs()) > 0 {
			var remainingIDs []provider.MessageID
			for _, uid := range searchData.AllUIDs() {
				remainingIDs = append(remainingIDs, IMAPUID(uid))
			}
			_ = p.DeleteMessages(sourceMailbox, remainingIDs)
		}

		return uidMapping, nil
	}

	// Fallback: copy then delete
	uidMapping, err := p.CopyMessages(sourceMailbox, destMailbox, ids)
	if err != nil {
		return nil, err
	}

	err = p.DeleteMessages(sourceMailbox, ids)
	return uidMapping, err
}

// CopyMessages copies messages to another mailbox
func (p *IMAPProvider) CopyMessages(sourceMailbox, destMailbox string, ids []provider.MessageID) (map[provider.MessageID]provider.MessageID, error) {
	if err := p.ensureMailboxSelected(sourceMailbox); err != nil {
		return nil, err
	}

	var uidSet imap.UIDSet
	for _, id := range ids {
		uid := id.(IMAPUID)
		uidSet.AddNum(imap.UID(uid))
	}

	copyCmd := p.client.Copy(uidSet, destMailbox)
	copyData, err := copyCmd.Wait()
	if err != nil {
		return nil, err
	}

	uidMapping := make(map[provider.MessageID]provider.MessageID)
	if copyData != nil && len(copyData.SourceUIDs) > 0 && len(copyData.DestUIDs) > 0 {
		srcNums, _ := copyData.SourceUIDs.Nums()
		dstNums, _ := copyData.DestUIDs.Nums()
		if len(srcNums) == len(dstNums) {
			for i := range srcNums {
				uidMapping[IMAPUID(srcNums[i])] = IMAPUID(dstNums[i])
			}
		}
	}

	return uidMapping, nil
}

// authResultsSection fetches the Authentication-Results fields.
func authResultsSection() *imap.FetchItemBodySection {
	return &imap.FetchItemBodySection{
		Specifier:    imap.PartSpecifierHeader,
		HeaderFields: []string{"Authentication-Results"},
		Peek:         true,
	}
}

// mailboxVerdicts caches one mailbox's verdicts for the session. A message's
// headers never change under one UIDVALIDITY, so an entry holds until the
// mailbox's UIDVALIDITY does.
type mailboxVerdicts struct {
	uidValidity uint32
	byUID       map[imap.UID]provider.AuthVerdict
}

// maxCachedVerdicts bounds one mailbox's cache; past it the cache starts over.
const maxCachedVerdicts = 10000

// AuthVerdicts returns the verdicts of the messages among ids in mailbox:
// from the session cache where it has them, and from one fetch of the rest's
// Authentication-Results fields. A server usually reads a header field from
// each stored message, so each message is read once per session. Listings
// carry no verdicts for the same reason: for older mail a server answered
// that header a third of a second per message.
//
// The scope is the mailbox's UIDVALIDITY: the same UID under another scope
// is another message.
func (p *IMAPProvider) AuthVerdicts(mailbox string, ids []provider.MessageID) (map[string]provider.AuthVerdict, string, error) {
	if err := p.ensureMailboxSelected(mailbox); err != nil {
		return nil, "", err
	}
	scope := strconv.FormatUint(uint64(p.selectedUIDValidity), 10)

	p.verdictLock.Lock()
	if p.verdicts == nil {
		p.verdicts = make(map[string]*mailboxVerdicts)
	}
	cache := p.verdicts[mailbox]
	if cache == nil || cache.uidValidity != p.selectedUIDValidity || len(cache.byUID) > maxCachedVerdicts {
		cache = &mailboxVerdicts{uidValidity: p.selectedUIDValidity, byUID: make(map[imap.UID]provider.AuthVerdict)}
		p.verdicts[mailbox] = cache
	}
	verdicts := make(map[string]provider.AuthVerdict, len(ids))
	var missing imap.UIDSet
	for _, id := range ids {
		uid, ok := id.(IMAPUID)
		if !ok {
			continue
		}
		if v, ok := cache.byUID[imap.UID(uid)]; ok {
			verdicts[uid.String()] = v
		} else {
			missing.AddNum(imap.UID(uid))
		}
	}
	p.verdictLock.Unlock()
	if len(missing) == 0 {
		return verdicts, scope, nil
	}

	fetched, err := p.client.Fetch(missing, &imap.FetchOptions{
		UID:         true,
		BodySection: []*imap.FetchItemBodySection{authResultsSection()},
	}).Collect()
	if err != nil {
		return verdicts, scope, err
	}
	p.verdictLock.Lock()
	defer p.verdictLock.Unlock()
	for _, f := range fetched {
		var v provider.AuthVerdict
		if b := f.FindBodySection(authResultsSection()); b != nil {
			v.BimiPotential, v.BimiFailed = authVerdict(b, p.authservIDs)
		}
		cache.byUID[f.UID] = v
		verdicts[IMAPUID(f.UID).String()] = v
	}
	return verdicts, scope, nil
}

// WithAuthservIDs sets the authserv-ids of the receiving mail servers whose
// Authentication-Results fields are trusted as the verdict (see authVerdict).
// They are matched in any case; blank ones are dropped.
func (p *IMAPProvider) WithAuthservIDs(ids []string) *IMAPProvider {
	p.authservIDs = nil
	for _, id := range ids {
		if id = strings.ToLower(strings.TrimSpace(id)); id != "" {
			p.authservIDs = append(p.authservIDs, id)
		}
	}
	return p
}

// authVerdict reads the receiving server's verdict from a block of
// Authentication-Results fields. A receiver prepends its own field, so any
// field below it arrived with the message and says whatever the sender wrote.
// Matching "dmarc=pass" anywhere in the block let a forged field below the
// real one, a comment, or a header.from value that merely contains the words
// mark a spoof as passing, and that verdict decides whether a brand logo is
// drawn.
//
// With trusted authserv-ids, the verdict is the topmost field one of them
// wrote, and a message none of them stamped has none. Without them it is the
// topmost field, which is the sender's own when the receiving server adds no
// field at all.
//
// potential is a dmarc (or bimi) pass; failed is a failing dmarc, dkim or spf
// result, and a pass wins over it.
func authVerdict(raw []byte, trusted []string) (potential, failed bool) {
	value, ok := receiverField(raw, trusted)
	if !ok {
		return false, false
	}
	resinfos := strings.Split(value, ";")
	for _, resinfo := range resinfos[1:] {
		fields := strings.Fields(strings.ToLower(resinfo))
		if len(fields) == 0 {
			continue
		}
		method, result, ok := strings.Cut(fields[0], "=")
		if !ok {
			continue
		}
		switch {
		case (method == "dmarc" || method == "bimi") && result == "pass":
			potential = true
		case method == "dmarc" && result == "fail",
			(method == "dkim" || method == "spf") && (result == "fail" || result == "hardfail"):
			failed = true
		}
	}
	if potential {
		failed = false
	}
	return potential, failed
}

// receiverField returns the value of the topmost Authentication-Results field
// whose authserv-id is trusted, or of the topmost field when none are.
func receiverField(raw []byte, trusted []string) (string, bool) {
	for _, value := range headerValues(raw) {
		if len(trusted) == 0 {
			return value, true
		}
		id, _, _ := strings.Cut(value, ";")
		fields := strings.Fields(strings.ToLower(id))
		if len(fields) == 0 {
			continue
		}
		for _, t := range trusted {
			if fields[0] == t {
				return value, true
			}
		}
	}
	return "", false
}

// headerValues returns the unfolded values of the fields in a header block,
// such as a HEADER.FIELDS fetch returns, in order.
func headerValues(raw []byte) []string {
	var values []string
	for _, line := range strings.Split(strings.ReplaceAll(string(raw), "\r\n", "\n"), "\n") {
		switch {
		case line == "":
			return values
		case line[0] == ' ' || line[0] == '\t':
			if len(values) > 0 {
				values[len(values)-1] += " " + line
			}
		default:
			if _, value, ok := strings.Cut(line, ":"); ok {
				values = append(values, value)
			}
		}
	}
	return values
}

// Helper function to convert IMAP message to alps.Message
func (p *IMAPProvider) convertIMAPMessage(msg *imapclient.FetchMessageBuffer, mailbox string) provider.Message {
	size := uint32(0)
	if msg.RFC822Size != 0 {
		size = uint32(msg.RFC822Size)
	}

	converted := provider.Message{
		ID:      IMAPUID(msg.UID),
		SeqNum:  msg.SeqNum,
		Mailbox: mailbox,
		Size:    size,
	}

	if msg.Flags != nil {
		converted.Flags = make([]provider.Flag, len(msg.Flags))
		for i, flag := range msg.Flags {
			converted.Flags[i] = provider.Flag(flag)
		}
	}

	if msg.Envelope != nil {
		converted.Envelope = convertIMAPEnvelope(msg.Envelope)
	}

	if msg.BodyStructure != nil {
		converted.BodyStructure = &IMAPBodyStructure{msg.BodyStructure}
	}

	if b := msg.FindBodySection(authResultsSection()); b != nil {
		if p.debug {
			fmt.Printf("BIMI debug: Auth-Results for %d: %q\n", msg.UID, string(b))
		}
		converted.BimiPotential, converted.BimiFailed = authVerdict(b, p.authservIDs)
	}

	refSection := &imap.FetchItemBodySection{
		Specifier:    imap.PartSpecifierHeader,
		HeaderFields: []string{"References"},
		Peek:         true,
	}
	refBytes := msg.FindBodySection(refSection)
	if refBytes != nil {
		h, err := textproto.ReadHeader(bufio.NewReader(bytes.NewReader(refBytes)))
		if err == nil {
			converted.References = provider.ParseReferences(h.Get("References"))
		}
	}

	return converted
}

func convertIMAPEnvelope(env *imap.Envelope) *provider.Envelope {
	if env == nil {
		return nil
	}

	// InReplyTo is []string in go-imap v2, join them
	inReplyTo := ""
	if len(env.InReplyTo) > 0 {
		inReplyTo = env.InReplyTo[0]
	}

	return &provider.Envelope{
		Date:      env.Date,
		Subject:   env.Subject,
		From:      convertIMAPAddresses(env.From),
		Sender:    convertIMAPAddresses(env.Sender),
		ReplyTo:   convertIMAPAddresses(env.ReplyTo),
		To:        convertIMAPAddresses(env.To),
		Cc:        convertIMAPAddresses(env.Cc),
		Bcc:       convertIMAPAddresses(env.Bcc),
		InReplyTo: inReplyTo,
		MessageID: env.MessageID,
	}
}

func convertIMAPAddresses(addrs []imap.Address) []provider.Address {
	result := make([]provider.Address, len(addrs))
	for i, addr := range addrs {
		result[i] = provider.Address{
			Name:    addr.Name,
			Mailbox: addr.Mailbox,
			Host:    addr.Host,
		}
	}
	return result
}

// IMAPUID implements MessageID for IMAP
type IMAPUID imap.UID

func (uid IMAPUID) String() string {
	return strconv.FormatUint(uint64(uid), 10)
}

func (uid IMAPUID) Provider() string {
	return "imap"
}

func (p *IMAPProvider) ParseMessageID(id string) (provider.MessageID, error) {
	uid, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		return nil, fmt.Errorf("invalid IMAP UID format: %v", err)
	}
	return IMAPUID(uid), nil
}

// IMAPBodyStructure wraps imap.BodyStructure to implement BodyStructure
type IMAPBodyStructure struct {
	imap.BodyStructure
}

func (bs *IMAPBodyStructure) MediaType() string {
	return bs.BodyStructure.MediaType()
}

func (bs *IMAPBodyStructure) Walk(f func(path []int, part provider.BodyStructure) bool) {
	bs.BodyStructure.Walk(func(path []int, part imap.BodyStructure) bool {
		return f(path, &IMAPBodyStructure{part})
	})
}

func (p *IMAPProvider) HasThreadCapability() bool {
	if p.client == nil {
		return false
	}
	return p.client.Caps().Has(imap.Cap("THREAD=REFS")) ||
		p.client.Caps().Has(imap.Cap("THREAD=REFERENCES")) ||
		p.client.Caps().Has(imap.Cap("THREAD=ORDEREDSUBJECT"))
}

func (p *IMAPProvider) GetMessageThread(mailbox string, targetUID provider.MessageID) ([]provider.Message, error) {
	if err := p.ensureMailboxSelected(mailbox); err != nil {
		return nil, err
	}

	var algo imap.ThreadAlgorithm
	if p.client != nil && p.client.Caps() != nil {
		if p.client.Caps().Has(imap.Cap("THREAD=REFS")) {
			algo = imap.ThreadAlgorithm("REFS")
		} else if p.client.Caps().Has(imap.Cap("THREAD=REFERENCES")) {
			algo = imap.ThreadReferences
		} else if p.client.Caps().Has(imap.Cap("THREAD=ORDEREDSUBJECT")) {
			algo = imap.ThreadOrderedSubject
		}
	}
	if isMailboxMassive(p.client.Mailbox()) {
		// ListMessages does not thread a mailbox this big, and neither does this.
		algo = ""
	}

	if algo != "" {
		options := imapclient.ThreadOptions{
			Algorithm:      algo,
			SearchCriteria: &imap.SearchCriteria{},
		}
		threadTrees, err := p.client.UIDThread(&options).Wait()
		if err == nil {
			var collect func(*imap.ThreadData) []uint32
			collect = func(t *imap.ThreadData) []uint32 {
				var uids []uint32
				uids = append(uids, t.Chain...)
				for i := range t.SubThreads {
					uids = append(uids, collect(&t.SubThreads[i])...)
				}
				return uids
			}

			targetUIDNum, parseErr := strconv.ParseUint(targetUID.String(), 10, 32)
			if parseErr == nil {
				var targetUIDs []uint32
				for i := range threadTrees {
					uids := collect(&threadTrees[i])
					found := false
					for _, u := range uids {
						if u == uint32(targetUIDNum) {
							found = true
							break
						}
					}
					if found {
						targetUIDs = uids
						break
					}
				}

				if len(targetUIDs) > 0 {
					if resultMsgs, fetchErr := p.fetchThreadMembers(mailbox, targetUIDs); fetchErr == nil {
						return resultMsgs, nil
					}
				}
			}
		}
	}

	singleMsg, err := p.GetMessageMetadata(mailbox, targetUID)
	if err != nil {
		return nil, err
	}
	return []provider.Message{*singleMsg}, nil
}

// GetThreadMembers reads the messages a conversation is made of, for a caller
// that already knows which UIDs those are.
//
// Finding them is the expensive half. `UID THREAD` is answered for the WHOLE
// mailbox — its cost is the mailbox's size, not the conversation's — and a
// listing has already asked it: every row it draws carries its own thread's
// UIDs (see ListMessages). Without this, opening any message re-threaded the
// mailbox to rediscover a tree the client was already holding, and a message
// with no conversation at all paid it too.
func (p *IMAPProvider) GetThreadMembers(mailbox string, uids []provider.MessageID) ([]provider.Message, error) {
	nums := make([]uint32, 0, len(uids))
	for _, uid := range uids {
		n, err := strconv.ParseUint(uid.String(), 10, 32)
		if err != nil {
			return nil, fmt.Errorf("thread member %q is not a UID: %w", uid.String(), err)
		}
		nums = append(nums, uint32(n))
	}
	if len(nums) == 0 {
		return nil, fmt.Errorf("no thread members named")
	}
	if err := p.ensureMailboxSelected(mailbox); err != nil {
		return nil, err
	}
	return p.fetchThreadMembers(mailbox, nums)
}

// fetchThreadMembers reads the named UIDs, oldest first. The mailbox must
// already be selected.
func (p *IMAPProvider) fetchThreadMembers(mailbox string, uids []uint32) ([]provider.Message, error) {
	var uidSet imap.UIDSet
	for _, u := range uids {
		uidSet.AddNum(imap.UID(u))
	}

	bodySection := &imap.FetchItemBodySection{
		Specifier:    imap.PartSpecifierHeader,
		HeaderFields: []string{"Authentication-Results"},
		Peek:         true,
	}
	referencesBodySection := &imap.FetchItemBodySection{
		Specifier:    imap.PartSpecifierHeader,
		HeaderFields: []string{"References"},
		Peek:         true,
	}
	fetchOptions := imap.FetchOptions{
		Envelope:      true,
		Flags:         true,
		InternalDate:  true,
		RFC822Size:    true,
		BodyStructure: &imap.FetchItemBodyStructure{Extended: true},
		BodySection: []*imap.FetchItemBodySection{
			bodySection, referencesBodySection,
		},
	}

	imapMsgs, err := p.client.Fetch(uidSet, &fetchOptions).Collect()
	if err != nil {
		return nil, err
	}

	msgMap := make(map[uint32]*imapclient.FetchMessageBuffer)
	for _, msg := range imapMsgs {
		msgMap[uint32(msg.UID)] = msg
	}

	ordered := append([]uint32(nil), uids...)
	sort.Slice(ordered, func(i, j int) bool { return ordered[i] < ordered[j] })

	var resultMsgs []provider.Message
	for _, uid := range ordered {
		fetchMsg, ok := msgMap[uid]
		if !ok {
			// Expunged since the listing named it, or never ours.
			continue
		}
		resultMsgs = append(resultMsgs, p.convertIMAPMessage(fetchMsg, mailbox))
	}
	if len(resultMsgs) == 0 {
		return nil, fmt.Errorf("none of the %d named messages are in %s", len(uids), mailbox)
	}
	return resultMsgs, nil
}

func (p *IMAPProvider) HasESearchCapability() bool {
	if p.client == nil {
		return false
	}
	return p.client.Caps().Has(imap.CapMultiSearch)
}

// searchCandidate is one match from a cross-mailbox search, carrying just
// enough to order the whole result set before any body is fetched.
type searchCandidate struct {
	mailbox string
	uid     uint32
	date    time.Time
}

// candidateBefore orders two matches from a cross-mailbox search.
//
// Date alone is not a total order: bulk mail arrives sharing a timestamp to
// the second, and every page of a search is produced by a fresh sort. Two
// requests that disagreed about how to order tied messages would cut the page
// boundary in different places, and a reader paging through would see one
// message twice and another not at all. Mailbox and UID settle the tie, and
// together they identify a message uniquely.
func candidateBefore(a, b searchCandidate, sortOrder string) bool {
	if !a.date.Equal(b.date) {
		if sortOrder == "asc" {
			return a.date.Before(b.date)
		}
		return a.date.After(b.date)
	}
	if a.mailbox != b.mailbox {
		return a.mailbox < b.mailbox
	}
	return a.uid < b.uid
}

func (p *IMAPProvider) searchESearchMessages(query string, sortOrder string, page, pageSize int) ([]provider.Message, provider.PageInfo, error) {
	if p.client == nil {
		return nil, provider.PageInfo{}, fmt.Errorf("IMAP client not initialized")
	}

	searchCriteria := prepareIMAPSearch(query)

	// 1. Use ESEARCH (RFC 7377) to search all subscribed mailboxes
	source := &imap.SearchSource{Subscribed: true}

	// 2. Perform ESEARCH
	results, err := p.client.MultiSearch(source, searchCriteria, nil).Wait()
	if err != nil {
		return nil, provider.PageInfo{}, fmt.Errorf("ESEARCH failed: %v", err)
	}

	var candidates []searchCandidate
	for _, data := range results {
		uids := data.AllUIDs()
		if len(uids) == 0 {
			continue
		}

		if err := p.ensureMailboxSelected(data.Mailbox); err != nil {
			continue
		}

		var uidSet imap.UIDSet
		for _, uid := range uids {
			uidSet.AddNum(imap.UID(uid))
		}

		// Phase 1: Lightweight fetch of Envelope and InternalDate to determine order without loading bodies
		envelopeFetchOptions := imap.FetchOptions{
			Envelope:     true,
			InternalDate: true,
			UID:          true,
		}

		imapMsgs, err := p.client.Fetch(uidSet, &envelopeFetchOptions).Collect()
		if err != nil {
			return nil, provider.PageInfo{}, fmt.Errorf("failed to fetch envelopes for %s: %v", data.Mailbox, err)
		}

		for _, msg := range imapMsgs {
			var date time.Time
			if msg.Envelope != nil {
				date = msg.Envelope.Date
			}
			if date.IsZero() {
				date = msg.InternalDate
			}
			candidates = append(candidates, searchCandidate{
				mailbox: data.Mailbox,
				uid:     uint32(msg.UID),
				date:    date,
			})
		}
	}

	// Sort globally by date descending (or ascending if requested).
	//
	// Date alone is not a total order: bulk mail arrives sharing a timestamp
	// to the second, and every page of this search is produced by a fresh
	// sort. Two requests that disagreed about how to order the tied messages
	// would cut the page boundary in different places, so a reader paging
	// through would see one message twice and another not at all. Mailbox and
	// UID settle the tie, and they identify a message uniquely.
	sort.Slice(candidates, func(i, j int) bool {
		return candidateBefore(candidates[i], candidates[j], sortOrder)
	})

	total := len(candidates)
	from := page * pageSize
	to := from + pageSize
	if from >= total {
		return nil, provider.PageInfo{Total: total}, nil
	}
	if to > total {
		to = total
	}

	paginated := candidates[from:to]
	if len(paginated) == 0 {
		return nil, provider.PageInfo{Total: total}, nil
	}

	// Phase 2: Full fetch ONLY for the paginated slice
	type pageItem struct {
		candidate searchCandidate
		origIndex int
	}
	byMailbox := make(map[string][]pageItem)
	for idx, c := range paginated {
		byMailbox[c.mailbox] = append(byMailbox[c.mailbox], pageItem{candidate: c, origIndex: idx})
	}

	bodySection := &imap.FetchItemBodySection{
		Specifier:    imap.PartSpecifierHeader,
		HeaderFields: []string{"Authentication-Results"},
		Peek:         true,
	}
	referencesBodySection := &imap.FetchItemBodySection{
		Specifier:    imap.PartSpecifierHeader,
		HeaderFields: []string{"References"},
		Peek:         true,
	}
	fullFetchOptions := imap.FetchOptions{
		Flags:         true,
		Envelope:      true,
		UID:           true,
		RFC822Size:    true,
		BodyStructure: &imap.FetchItemBodyStructure{Extended: true},
		BodySection: []*imap.FetchItemBodySection{
			bodySection, referencesBodySection,
		},
	}

	pageMsgs := make([]provider.Message, len(paginated))
	for mboxName, items := range byMailbox {
		if err := p.ensureMailboxSelected(mboxName); err != nil {
			continue
		}

		var uidSet imap.UIDSet
		for _, item := range items {
			uidSet.AddNum(imap.UID(item.candidate.uid))
		}

		imapMsgs, err := p.client.Fetch(uidSet, &fullFetchOptions).Collect()
		if err != nil {
			return nil, provider.PageInfo{}, fmt.Errorf("failed to fetch messages for %s: %v", mboxName, err)
		}

		msgMap := make(map[uint32]*imapclient.FetchMessageBuffer, len(imapMsgs))
		for _, msg := range imapMsgs {
			msgMap[uint32(msg.UID)] = msg
		}

		for _, item := range items {
			if fetchMsg, ok := msgMap[item.candidate.uid]; ok {
				pageMsgs[item.origIndex] = p.convertIMAPMessage(fetchMsg, mboxName)
			}
		}
	}

	var finalMsgs []provider.Message
	for _, m := range pageMsgs {
		if m.ID != nil {
			finalMsgs = append(finalMsgs, m)
		}
	}

	return finalMsgs, provider.PageInfo{Total: total}, nil
}

// fallBackToFlat decides what to do when a threaded page could not be built,
// and reports whether the caller should list the folder flat instead.
//
// THREAD is answered over the whole mailbox, so its cost is the mailbox's
// size, which makes it the first command a loaded server throttles — ours
// answers `NO [LIMIT] ... slow down`. Losing the grouping is not a reason to
// lose the folder, so a refusal falls back. Anything else is the connection
// or the client failing, and the caller sees that error rather than a second
// one from a fallback that would fail the same way.
func (p *IMAPProvider) fallBackToFlat(mailbox string, err error) bool {
	if !refusedByServer(err) {
		return false
	}
	if p.noteThreadFallback(mailbox) {
		log.Printf("alps/provider: IMAP server refused THREAD for %q, listing it without grouping: %v", mailbox, err)
	}
	if p.debug {
		fmt.Printf("threaded list: THREAD refused, listing flat instead: %v\n", err)
	}
	return true
}
