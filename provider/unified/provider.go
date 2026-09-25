package unified

import (
	"log"
	"fmt"
	"bytes"
	"strings"
	"strconv"
	"errors"
	"github.com/emersion/go-message"
	"github.com/migadu/alps/provider"
	"github.com/migadu/alps/provider/imap"
)

const internalDelimiter = '#'
var internalDelimiterString = string(internalDelimiter)

var ErrInvalidMailbox = errors.New("Invalid mailbox name")

const providerName = "unified"

type ProviderConfig struct {
	path         string
	debug        bool
	debugBackend bool
}

type Provider struct {
	debug        bool
	store        provider.Store
	backendOrder []string
	backendMap   map[string]*backend
	unifiedOrder []string
	unifiedMap   map[string]*unifiedMailbox
}

func (p *Provider) isUnified(name string) bool {

	name = normalizeUnifiedName(name)
	if name == "" {
		return false
	}
	_, ok := p.unifiedMap[name]
	return ok
}

// map a backend and mailbox name to an internal mailbox name
func (p *Provider) mapBackendToInternalDetails(b *backend, mailbox string) (string, *unifiedMailbox) {

	bName := "@" + b.config.Name
	if mailbox == "" {
		return bName, nil
	}
	parts := strings.Split(mailbox, b.delim)
	uName := normalizeUnifiedName(parts[0])
	if uName != "" {
		umb, ok := p.unifiedMap[mailbox]
		if ok {
			if len(parts) == 1 {
				return uName + internalDelimiterString +  bName, umb
			} else {
				return uName + internalDelimiterString +  bName + internalDelimiterString + strings.Join(parts[1:], internalDelimiterString), umb
			}
		}
	}
	return bName + internalDelimiterString + strings.Join(parts, internalDelimiterString), nil
}

// Same as above, dropping the details from the result
func (p *Provider) mapBackendToInternal(b *backend, mailbox string) string {

	result, _ := p.mapBackendToInternalDetails(b, mailbox)
	return result
}

type mappingFlag int
var allowNone    mappingFlag = 0
var allowBackend mappingFlag = 1
var allowUnified mappingFlag = 2
var allowAny = allowBackend | allowUnified

// map a virtual mailbox name to an account and mailbox name
// In general, there are 4 possible forms of the response. If flags does not include allowAccount, then
// form 2 will not be returned. If flags does not include allowUnified, then form 4 will not be returned.
//
//    1. nil,     "",           ErrInvalidMailbox     For any errors
//    2. account, "",           nil                   For the top level of an account
//    3. account, mailbox       nil                   For a mailbox in an account
//    4. nil,     UNIFIED_NAME, nil                   For the top level of a unified mailbox
func (p *Provider) mapInternalToBackend(mailbox string, flags mappingFlag) (*backend, string, error) {

	parts := strings.Split(mailbox, internalDelimiterString)
	n := len(parts)

	key := parts[0]

	// handle the @BACKEND_NAME ... case
	b, ok := p.backendMap[key]
	if ok {
		if n == 1 {
			if flags & allowBackend == allowBackend {
				return b, "", nil
			}
			// caller requested no top level backend mailboxes
			return nil, "", ErrInvalidMailbox
		}
		return b, strings.Join(parts[1:], b.delim), nil
	}

	// handle the UNIFIED_NAME ... case
	_, ok = p.unifiedMap[key]
	if !ok {
		return nil, "", ErrInvalidMailbox
	}
	if n == 1 {
		if flags & allowUnified == allowUnified {
			return nil, key, nil
		}
		// caller requested no top level unified mailboxes
		return nil, "", ErrInvalidMailbox
	}
	// The second part should be the backend name
	b, ok = p.backendMap[parts[1]]
	if !ok {
		return nil, "", ErrInvalidMailbox
	}
	// map the standardized unified name back to the actual name we got from the backend
	uName := b.getUnifiedName(key)
	if uName == "" {
		return nil, "", ErrInvalidMailbox
	}
	if n == 2 {
		return b, uName, nil
	} else {
		return b, uName + b.delim + strings.Join(parts[2:], b.delim), nil
	}
}

// GetStore returns the per-user store for this provider
func (p *Provider) GetStore() (provider.Store, error) {

	return p.store, nil
}

func (p *Provider) SetStore(s provider.Store) {

	p.store = s
}

// Close closes all the child providers
func (p *Provider) Close() error {
	var errs []error
	for _, key := range p.backendOrder {
		tmp := p.backendMap[key].Close()
		if tmp != nil {
			errs = append(errs, tmp)
		}
	}
	if len(errs) > 0 {
		return errors.Join(errs...)
	}
	return nil
}

// List all the mailboxes from all the backend providers
// For unified mailboxes "UNIFIED_NAME [ SUFFIX_WITH_BACKEND_DELIM ] convert the name to
//    UNIFIED_NAME VIRTUAL_DELIM @BACKEND_NAME [ SUFFIX_WITH_VIRTUAL_DELIM ]
// For other mailboxes convert NAME_WITH_BACKEND_DELIM to
//    @BACKEND_NAME VIRTUAL_DELIM NAME_WITH_VIRTUAL_DELIM
// Also include @BACKEND_NAME top level folders for each back end
func (p *Provider) ListMailboxes() ([]provider.Mailbox, error) {

	var mailboxes []provider.Mailbox

	umap := make(map[string]int)

	// Add the top level unified mailboxes
	for _, name := range p.unifiedOrder {
		umb := p.unifiedMap[name]
		umb.clear()
		mbox := provider.Mailbox{
			Name: name,
			Delimiter: internalDelimiter,
			Attributes: nil,
			Total: 0,
			Unseen: 0,
			Subscribed: false,
		}
		mailboxes = append(mailboxes, mbox)
		umap[name] = len(mailboxes) - 1
	}

	for _, key := range p.backendOrder {
		b := p.backendMap[key]

		// Add the top level backend mailbox
		bbox := provider.Mailbox{
			Name: key,
			Delimiter: internalDelimiter,
			Attributes: nil,
			Total: 0,
			Unseen: 0,
			Subscribed: false,
		}
		mailboxes = append(mailboxes, bbox)

		// get the backend list
		tmp, err := b.ListMailboxes()
		if err != nil {
			continue
		}

		// map the backend names to internal names
		for _, mbox := range tmp {
			vName, umb := p.mapBackendToInternalDetails(b, mbox.Name)
			if umb != nil {
				// save the actual name of a special mailbox
				b.setUnifiedName(umb.name, mbox.Name)
				umb.addSource(b, mbox.Name)
				index, ok := umap[umb.name]
				if ok {
					u := &mailboxes[index]
					if mbox.Total >= 0 && mbox.Unseen >= 0 {
						u.Total += mbox.Total
						u.Unseen += mbox.Unseen
					}
				}
			}
			mbox.Name = vName
			mbox.Delimiter = internalDelimiter
			mailboxes = append(mailboxes, mbox)
		}
	}
	if p.debug {
		for i, x := range mailboxes {
			log.Printf("provider/%s: mailbox %d = %s, total = %d, unseen = %d, attr = (%s)\n", providerName, i, x.Name, x.Total, x.Unseen, strings.Join(x.Attributes, ", "))
		}
	}
	return mailboxes, nil
}

// GetMailboxStatus returns status for a specific mailbox
func (p *Provider) GetMailboxStatus(vMailbox string) (*provider.MailboxStatus, error) {

	// Map to the backend
	b, bMailbox, err := p.mapInternalToBackend(vMailbox, allowAny)
	if err != nil {
		return nil, err
	}

	// handled the unified view case
	if b == nil {
		// nil, name, nil case only happens when p.unifiedMap[name] exists
		// TODO: need to add some tests to ensure this remains true
		return p.unifiedMap[bMailbox].getStatus()
	}

	// handle the top level backend case
	if bMailbox == "" {
		return &provider.MailboxStatus{
			Name:        vMailbox,
			NumMessages: 0,
			NumUnseen:   0,
			UIDValidity: 0,
		}, nil
	}

	/* pass request to account provider */
	status, err := b.GetMailboxStatus(bMailbox)
	if err != nil {
		return nil, err
	}
	status.Name = p.mapBackendToInternal(b, status.Name)
	return status, nil
}

// There can be multiple, so at the top level, this just always returns nil
func (p *Provider) FindMailboxByType(mboxType provider.MailboxType) (*provider.Mailbox, error) {

	return nil, nil
}

func (p *Provider) CreateMailbox(vMailbox string) error {

	// Map to the backend - must exist
	b, bMailbox, err := p.mapInternalToBackend(vMailbox, allowNone)
	if err != nil {
		return err
	}
	return b.CreateMailbox(bMailbox)
}

func (p *Provider) DeleteMailbox(vMailbox string) error {

	// Map to the backend - must exist
	b, bMailbox, err := p.mapInternalToBackend(vMailbox, allowNone)
	if err != nil {
		return err
	}
	return b.DeleteMailbox(bMailbox)
}

func (p *Provider) EmptyMailbox(vMailbox string) (int, error) {

	// Map to the backend - must exist
	// TODO: this could be expanded to also accept unified mailboxes, which would empty all their children
	b, bMailbox, err := p.mapInternalToBackend(vMailbox, allowNone)
	if err != nil {
		return 0, err
	}
	return b.EmptyMailbox(bMailbox)
}

func (p *Provider) RenameMailbox(oldVirtualMailbox, newVirtualMailbox string) error {

	// Map each name to the backend - must exist
	oldB, oldBackendMailbox, err := p.mapInternalToBackend(oldVirtualMailbox, allowNone)
	if err != nil {
		return err
	}
	newB, newBackendMailbox, err := p.mapInternalToBackend(newVirtualMailbox, allowNone)
	if err != nil {
		return err
	}

	// TODO: handle renaming between accounts
	if newB != oldB {
		return fmt.Errorf("cannot rename across accounts")
	}
	return oldB.RenameMailbox(oldBackendMailbox, newBackendMailbox)
}

func (p *Provider) SubscribeMailbox(vMailbox string) error {

	// Map to the backend - exclude top level backend names
	b, bMailbox, err := p.mapInternalToBackend(vMailbox, allowUnified)
	if err != nil {
		return err
	}

	// handle the unified view case
	if b == nil {
		return p.unifiedMap[bMailbox].subscribe()
	}

	// forward to the backend
	return b.SubscribeMailbox(bMailbox)
}

func (p *Provider) UnsubscribeMailbox(vMailbox string) error {

	// Map to the backend - exclude top level backend names
	b, bMailbox, err := p.mapInternalToBackend(vMailbox, allowUnified)
	if err != nil {
		return err
	}

	// handle the unified view case
	if b == nil {
		return p.unifiedMap[bMailbox].unsubscribe()
	}

	// forward to the backend
	return b.UnsubscribeMailbox(bMailbox)
}

func (p *Provider) ListMessages(vMailbox string, sortOrder string, page, pageSize int) ([]provider.Message, provider.PageInfo, error) {

	// Map to the backend
	b, bMailbox, err := p.mapInternalToBackend(vMailbox, allowAny)
	if err != nil {
		return nil, provider.PageInfo{}, err
	}

	// Handle the top level backend case
	if bMailbox == "" {
		return nil, provider.PageInfo{}, nil
	}

	// handle the unified view case
	if b == nil {
		return p.unifiedMap[bMailbox].listMessages(sortOrder, page, pageSize)
	}

	// Get the list from the backend
	list, info, err := b.ListMessages(bMailbox, sortOrder, page, pageSize)
	if err != nil {
		return nil, provider.PageInfo{}, err
	}

	// Remap the mailbox names in the returned list
	n := len(list)
	for i := 0; i < n; i ++ {
		list[i].Mailbox = p.mapBackendToInternal(b, list[i].Mailbox)
	}
	return list, info, nil
}

func (p *Provider) SearchMessageIDs(vMailbox, query string) ([]provider.MessageID, error) {

	// Map to the backend
	b, bMailbox, err := p.mapInternalToBackend(vMailbox, allowAny)
	if err != nil {
		return nil, err
	}

	// Handle the top level backend case
	if bMailbox == "" {
		return nil, nil
	}

	// handle the unified view case
	if b == nil {
		return p.unifiedMap[bMailbox].searchMessageIDs(query)
	}

	return b.SearchMessageIDs(bMailbox, query)
}


func (p *Provider) SearchMessages(vMailbox, query string, sortOrder string, page, pageSize int) ([]provider.Message, provider.PageInfo, error) {

	// Map to the backend
	b, bMailbox, err := p.mapInternalToBackend(vMailbox, allowAny)
	if err != nil {
		return nil, provider.PageInfo{}, err
	}

	// Handle the top level backend case
	if bMailbox == "" {
		return nil, provider.PageInfo{}, nil
	}

	// handle the unified view case
	if b == nil {
		return p.unifiedMap[bMailbox].searchMessages(query, sortOrder, page, pageSize)
	}

	// Get the list from the backend
	list, info, err := b.SearchMessages(bMailbox, query, sortOrder, page, pageSize)
	if err != nil {
		return nil, provider.PageInfo{}, err
	}

	// Remap the mailbox names in the returned list
	n := len(list)
	for i := 0; i < n; i ++ {
		list[i].Mailbox = p.mapBackendToInternal(b, list[i].Mailbox)
	}
	return list, info, nil
}

func (p *Provider) ParseMessageID(id string) (provider.MessageID, error) {

	uid, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		return nil, fmt.Errorf("invalid Unified UID format: %v", err)
	}
	return imap.IMAPUID(uid), nil
}

func (p *Provider) GetMessageMetadata(vMailbox string, id provider.MessageID) (*provider.Message, error) {

	// Map to the backend - must exist
	b, bMailbox, err := p.mapInternalToBackend(vMailbox, allowNone)
	if err != nil {
		return nil, err
	}

	// forward to the backend
	msg, err := b.GetMessageMetadata(bMailbox, id)
	if err != nil {
		return nil, err
	}

	// Remap the mailbox name in the result
	msg.Mailbox = p.mapBackendToInternal(b, msg.Mailbox)
	return msg, nil
}

func (p *Provider) GetMessagePart(vMailbox string, id provider.MessageID, partPath []int) (*provider.Message, *message.Entity, error) {

	// Map to the backend - must exist
	b, bMailbox, err := p.mapInternalToBackend(vMailbox, allowNone)
	if err != nil {
		return nil, nil, err
	}

	// forward to the backend
	msg, ent, err := b.GetMessagePart(bMailbox, id, partPath)
	if err != nil {
		return nil, nil, err
	}

	// Remap the mailbox name in the result
	msg.Mailbox = p.mapBackendToInternal(b, msg.Mailbox)
	return msg, ent, nil
}

func (p *Provider) GetMessagePartRaw(vMailbox string, id provider.MessageID, partPath []int, limit int64) (*provider.Message, []byte, []byte, error) {

	// Map to the backend - must exist
	b, bMailbox, err := p.mapInternalToBackend(vMailbox, allowNone)
	if err != nil {
		return nil, nil, nil, err
	}

	// forward to the backend
	msg, b1, b2, err := b.GetMessagePartRaw(bMailbox, id, partPath, limit)
	if err != nil {
		return nil, nil, nil, err
	}

	// Remap the mailbox name in the result
	msg.Mailbox = p.mapBackendToInternal(b, msg.Mailbox)
	return msg, b1, b2, nil
}

func (p *Provider) GetMessagePartWithData(vMailbox string, id provider.MessageID, partPath []int) (*provider.Message, *message.Entity, []byte, []byte, error) {

	// Map to the backend - must exist
	b, bMailbox, err := p.mapInternalToBackend(vMailbox, allowNone)
	if err != nil {
		return nil, nil, nil, nil, err
	}

	// forward to the backend
	msg, e, b1, b2, err := b.GetMessagePartWithData(bMailbox, id, partPath)
	if err != nil {
		return nil, nil, nil, nil, err
	}

	// Remap the mailbox name in the result
	msg.Mailbox = p.mapBackendToInternal(b, msg.Mailbox)
	return msg, e, b1, b2, nil
}

func (p *Provider) SetMessagesFlags(vMailbox string, ids []provider.MessageID, op provider.FlagOperation) error {

	// Map to the backend - must exist
	b, bMailbox, err := p.mapInternalToBackend(vMailbox, allowNone)
	if err != nil {
		return err
	}

	// forward to the backend
	return b.SetMessagesFlags(bMailbox, ids, op)
}

func (p *Provider) MarkAnswered(vMailbox string, id provider.MessageID) error {

	// Map to the backend - must exist
	b, bMailbox, err := p.mapInternalToBackend(vMailbox, allowNone)
	if err != nil {
		return err
	}

	// forward to the backend
	return b.MarkAnswered(bMailbox, id)
}

func (p *Provider) AppendMessage(vMailbox string, msg provider.OutgoingMessageWriter, mboxType provider.MailboxType) (*provider.Mailbox, provider.MessageID, uint32, error) {

	// Map to the backend - must exist
	b, bMailbox, err := p.mapInternalToBackend(vMailbox, allowNone)
	if err != nil {
		return nil, nil, 0, err
	}

	// forward to the backend
	mbox, mid, count, err := b.AppendMessage(bMailbox, msg, mboxType)
	if err != nil {
		return nil, nil, 0, err
	}

	// Remap the mailbox name and delimiter in the result
	mbox.Name = p.mapBackendToInternal(b, mbox.Name)
	mbox.Delimiter = internalDelimiter
	return mbox, mid, count, nil
}

func (p *Provider) DeleteMessages(vMailbox string, ids []provider.MessageID) error {

	// Map to the backend - must exist
	b, bMailbox, err := p.mapInternalToBackend(vMailbox, allowNone)
	if err != nil {
		return err
	}

	// forward to the backend
	return b.DeleteMessages(bMailbox, ids)
}

func (p *Provider) MoveMessages(srcInternalMailbox, dstInternalMailbox string, ids []provider.MessageID) (map[provider.MessageID]provider.MessageID, error) {

	// Map each name to the backend - must exist
	src, srcBackendMailbox, err := p.mapInternalToBackend(srcInternalMailbox, allowNone)
	if err != nil {
		return nil, err
	}

	dst, dstBackendMailbox, err := p.mapInternalToBackend(dstInternalMailbox, allowNone)
	if err != nil {
		return nil, err
	}

	// if both backends are the same, forward the operation to it
	if dst == src {
		return src.MoveMessages(srcBackendMailbox, dstBackendMailbox, ids)
	}

	// otherwise, we need to do a copy and delete
	result := make(map[provider.MessageID]provider.MessageID)
	for _, srcID := range ids {
		_, b1, b2, err := src.GetMessagePartRaw(srcBackendMailbox, srcID, nil, 0)
		if err != nil {
			return nil, err
		}
		b := make([]byte, 0, len(b1) + len(b2))
		b = append(b, b1...)
		b = append(b, b2...)
		buf := bytes.NewBuffer(b)
		_, dstID, _, err := dst.AppendMessage(dstBackendMailbox, buf, provider.MailboxTypeUser)
		if err != nil {
			return nil, err
		}
		result[srcID] = dstID
	}
	err = src.DeleteMessages(srcBackendMailbox, ids)
	if err != nil {
		return nil, err
	}
	return result, nil
}

// CopyMessages copies messages to another mailbox
func (p *Provider) CopyMessages(srcInternalMailbox, dstInternalMailbox string, ids []provider.MessageID) (map[provider.MessageID]provider.MessageID, error) {

	// Map each name to the backend - must exist
	src, srcBackendMailbox, err := p.mapInternalToBackend(srcInternalMailbox, allowNone)
	if err != nil {
		return nil, err
	}
	dst, dstBackendMailbox, err := p.mapInternalToBackend(dstInternalMailbox, allowNone)
	if err != nil {
		return nil, err
	}

	// if both backends are the same, forward the operation to it
	if dst == src {
		return src.CopyMessages(srcBackendMailbox, dstBackendMailbox, ids)
	}

	// otherwise, we need to do a fetch and append for each message
	result := make(map[provider.MessageID]provider.MessageID)
	for _, srcID := range ids {
		_, b1, b2, err := src.GetMessagePartRaw(srcBackendMailbox, srcID, nil, 0)
		if err != nil {
			return nil, err
		}
		b := make([]byte, 0, len(b1) + len(b2))
		b = append(b, b1...)
		b = append(b, b2...)
		buf := bytes.NewBuffer(b)
		_, dstID, _, err := dst.AppendMessage(dstBackendMailbox, buf, provider.MailboxTypeUser)
		if err != nil {
			return nil, err
		}
		result[srcID] = dstID
	}
	return result, nil
}

func (p *Provider) HasThreadCapability() bool {

	return true
}

func (p *Provider) HasESearchCapability() bool {

	return false
}

func newProvider(path string, debug bool, factory provider.AuthenticatedProviderFactory) (provider.MailProvider, error) {

	store, err := newFileStore(path)
	if err != nil {
		return nil, err
	}

	blist := []string{}
	bmap := make(map[string]*backend)

	for i, c := range store.accounts() {
		if err := c.check(); err != nil {
			log.Printf("provider/%s: invalid account config: %s", providerName, err)
			continue
		}
		key := "@" + c.Name
		if _, ok := bmap[key]; ok {
			log.Printf("provider/%s: account %d has duplicate name %s", providerName, i, c.Name)
			continue
		}
		a, err := newBackend(c, store, factory)
		if err != nil {
			log.Printf("provider/%s: connect failed for %s: %s", providerName, c.Name, err)
			continue
		}
		blist = append(blist, key)
		bmap[key] = a
	}

	ulist := []string{}
	umap := make(map[string]*unifiedMailbox)
	for _, name := range store.unified() {
		name = normalizeUnifiedName(name)
		if name != "" {
			if _, ok := umap[name]; !ok {
				umap[name] = newUnifiedMailbox(name)
				ulist = append(ulist, name)
			}
		}
	}

	return &Provider{
		debug: debug,
		store: store,
		backendOrder: blist,
		backendMap: bmap,
		unifiedOrder: ulist,
		unifiedMap: umap,
	}, nil
}
