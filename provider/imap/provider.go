package imap

import (
	"bufio"
	"bytes"
	"fmt"
	"io"
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
	client    *imapclient.Client
	store     provider.Store
	debug     bool
	dateCache map[string]map[uint32]time.Time
	cacheLock sync.RWMutex
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

// EmptyMailbox empties a mailbox by deleting all its messages
func (p *IMAPProvider) EmptyMailbox(name string) error {
	if err := p.ensureMailboxSelected(name); err != nil {
		return err
	}

	mbox := p.client.Mailbox()
	if mbox == nil || mbox.NumMessages == 0 {
		return nil
	}

	var seqSet imap.SeqSet
	seqSet.AddRange(1, mbox.NumMessages)

	err := p.client.Store(seqSet, &imap.StoreFlags{
		Op:     imap.StoreFlagsAdd,
		Silent: true,
		Flags:  []imap.Flag{imap.FlagDeleted},
	}, nil).Close()
	if err != nil {
		return err
	}

	return p.client.Expunge().Close()
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
		if _, err := p.client.Select(mboxName, nil).Wait(); err != nil {
			return fmt.Errorf("failed to select mailbox: %v", err)
		}
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
		return nil, fmt.Errorf("UID THREAD failed: %v", err)
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

// ListMessages returns a paginated list of messages
func (p *IMAPProvider) ListMessages(mailbox string, sortOrder string, page, pageSize int) ([]provider.Message, int, error) {
	// A NOOP will ensure we notice any new message
	noop := p.client.Noop()
	if err := p.ensureMailboxSelected(mailbox); err != nil {
		return nil, 0, err
	}
	if err := noop.Wait(); err != nil {
		return nil, 0, err
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
		groups, err := p.fetchThreadGroups(&imap.SearchCriteria{})
		if err != nil {
			return nil, 0, err
		}

		// Sort groups based on criteria and sortOrder
		if err := p.sortGroups(mailbox, groups, sortOrder); err != nil {
			return nil, 0, fmt.Errorf("failed to sort thread groups: %v", err)
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
			return nil, 0, fmt.Errorf("failed to fetch representative messages: %v", err)
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
			return nil, total, nil
		}
	} else {
		to = total - page*pageSize
		from = to - pageSize + 1
		if from <= 0 {
			from = 1
		}
		if to <= 0 {
			return nil, total, nil
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
		return nil, 0, fmt.Errorf("failed to fetch message list: %v", err)
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

	return msgs, total, nil
}

// SearchMessages searches messages in a mailbox
func (p *IMAPProvider) SearchMessages(mailbox, query string, sortOrder string, page, pageSize int) ([]provider.Message, int, error) {
	if mailbox == "*" {
		if p.HasESearchCapability() {
			return p.searchESearchMessages(query, sortOrder, page, pageSize)
		}
		// Fallback to INBOX if ESEARCH/MULTISEARCH is not supported
		mailbox = "INBOX"
	}

	if err := p.ensureMailboxSelected(mailbox); err != nil {
		return nil, 0, err
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
		groups, err := p.fetchThreadGroups(searchCriteria)
		if err != nil {
			return nil, 0, err
		}

		// Sort groups based on criteria and sortOrder
		if err := p.sortGroups(mailbox, groups, sortOrder); err != nil {
			return nil, 0, fmt.Errorf("failed to sort thread groups: %v", err)
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
			return nil, 0, fmt.Errorf("failed to fetch representative messages: %v", err)
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

	var nums []uint32
	if !p.client.Caps().Has(imap.CapSort) {
		data, err := p.client.Search(searchCriteria, nil).Wait()
		if err != nil {
			return nil, 0, fmt.Errorf("SEARCH failed: %v", err)
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
			return nil, 0, fmt.Errorf("SORT failed: %v", err)
		}
		nums = sortData.SeqNums
	}

	total := len(nums)

	from := page * pageSize
	to := from + pageSize
	if from >= len(nums) {
		return nil, total, nil
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
		return nil, 0, fmt.Errorf("failed to fetch message list: %v", err)
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

	return validMsgs, total, nil
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
			return nil, fmt.Errorf("message not found")
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
			return nil, nil, nil, fmt.Errorf("server didn't return message")
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
			return nil, nil, nil, nil, fmt.Errorf("server didn't return message")
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

	bodySection := &imap.FetchItemBodySection{
		Specifier:    imap.PartSpecifierHeader,
		HeaderFields: []string{"Authentication-Results"},
		Peek:         true,
	}
	b := msg.FindBodySection(bodySection)
	if b != nil {
		if p.debug {
			fmt.Printf("BIMI debug: Auth-Results for %d: %q\n", msg.UID, string(b))
		}
		lowerStr := strings.ToLower(string(b))
		if strings.Contains(lowerStr, "dmarc=pass") || strings.Contains(lowerStr, "bimi=pass") {
			converted.BimiPotential = true
		} else if strings.Contains(lowerStr, "dmarc=fail") || strings.Contains(lowerStr, "dkim=fail") || strings.Contains(lowerStr, "spf=fail") || strings.Contains(lowerStr, "dkim=hardfail") || strings.Contains(lowerStr, "spf=hardfail") {
			converted.BimiFailed = true
		}
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
					var uidSet imap.UIDSet
					for _, u := range targetUIDs {
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

					imapMsgs, fetchErr := p.client.Fetch(uidSet, &fetchOptions).Collect()
					if fetchErr == nil {
						msgMap := make(map[uint32]*imapclient.FetchMessageBuffer)
						for _, msg := range imapMsgs {
							msgMap[uint32(msg.UID)] = msg
						}

						sort.Slice(targetUIDs, func(i, j int) bool {
							return targetUIDs[i] < targetUIDs[j]
						})

						var resultMsgs []provider.Message
						for _, uid := range targetUIDs {
							fetchMsg, ok := msgMap[uid]
							if !ok {
								continue
							}
							resultMsgs = append(resultMsgs, p.convertIMAPMessage(fetchMsg, mailbox))
						}
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

func (p *IMAPProvider) HasESearchCapability() bool {
	if p.client == nil {
		return false
	}
	return p.client.Caps().Has(imap.CapMultiSearch)
}

func (p *IMAPProvider) searchESearchMessages(query string, sortOrder string, page, pageSize int) ([]provider.Message, int, error) {
	if p.client == nil {
		return nil, 0, fmt.Errorf("IMAP client not initialized")
	}

	searchCriteria := prepareIMAPSearch(query)

	// 1. Use ESEARCH (RFC 7377) to search all subscribed mailboxes
	source := &imap.SearchSource{Subscribed: true}

	// 2. Perform ESEARCH
	results, err := p.client.MultiSearch(source, searchCriteria, nil).Wait()
	if err != nil {
		return nil, 0, fmt.Errorf("ESEARCH failed: %v", err)
	}

	var allMsgs []provider.Message
	for _, data := range results {
		uids := data.AllUIDs()
		if len(uids) == 0 {
			continue
		}

		// 3. Batch-fetch for this mailbox
		if err := p.ensureMailboxSelected(data.Mailbox); err != nil {
			continue
		}

		var uidSet imap.UIDSet
		for _, uid := range uids {
			uidSet.AddNum(imap.UID(uid))
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
			Flags:         true,
			Envelope:      true,
			UID:           true,
			RFC822Size:    true,
			BodyStructure: &imap.FetchItemBodyStructure{Extended: true},
			BodySection: []*imap.FetchItemBodySection{
				bodySection, referencesBodySection,
			},
		}

		imapMsgs, err := p.client.Fetch(uidSet, &fetchOptions).Collect()
		if err != nil {
			return nil, 0, fmt.Errorf("failed to fetch messages for %s: %v", data.Mailbox, err)
		}

		for _, msg := range imapMsgs {
			allMsgs = append(allMsgs, p.convertIMAPMessage(msg, data.Mailbox))
		}
	}

	// 4. Sort globally by envelope date descending (or ascending if requested)
	sort.Slice(allMsgs, func(i, j int) bool {
		var dateI, dateJ time.Time
		if allMsgs[i].Envelope != nil {
			dateI = allMsgs[i].Envelope.Date
		}
		if allMsgs[j].Envelope != nil {
			dateJ = allMsgs[j].Envelope.Date
		}
		if sortOrder == "asc" {
			return dateI.Before(dateJ)
		}
		return dateI.After(dateJ)
	})

	// 5. Paginate
	total := len(allMsgs)
	from := page * pageSize
	to := from + pageSize
	if from >= len(allMsgs) {
		return nil, total, nil
	}
	if to > len(allMsgs) {
		to = len(allMsgs)
	}

	return allMsgs[from:to], total, nil
}
