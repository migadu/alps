package alpsbase

import (
	"fmt"
	"sort"
	"time"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapclient"
	"github.com/emersion/go-message"
	"github.com/migadu/alps/provider"
	imapprovider "github.com/migadu/alps/provider/imap"
)

// Adapter functions to convert between alps provider types and plugin types

// providerMailboxToInfo converts provider.Mailbox to MailboxInfo
func providerMailboxToInfo(mbox provider.Mailbox) MailboxInfo {
	listData := &imap.ListData{
		Mailbox: mbox.Name,
		Delim:   mbox.Delimiter,
		Attrs:   make([]imap.MailboxAttr, len(mbox.Attributes)),
	}
	for i, attr := range mbox.Attributes {
		listData.Attrs[i] = imap.MailboxAttr(attr)
	}

	if mbox.Total >= 0 && mbox.Unseen >= 0 {
		numMessages := uint32(mbox.Total)
		numUnseen := uint32(mbox.Unseen)
		listData.Status = &imap.StatusData{
			NumMessages: &numMessages,
			NumUnseen:   &numUnseen,
			UIDValidity: mbox.UIDValidity,
			UIDNext:     imap.UID(mbox.UIDNext),
		}
	}

	return MailboxInfo{
		ListData:   listData,
		Active:     false,
		Total:      mbox.Total,
		Unseen:     mbox.Unseen,
		Subscribed: mbox.Subscribed,
	}
}

// providerStatusToMailboxStatus converts provider.MailboxStatus to MailboxStatus
func providerStatusToMailboxStatus(status *provider.MailboxStatus) *MailboxStatus {
	if status == nil {
		return nil
	}
	return &MailboxStatus{
		StatusData: &imap.StatusData{
			Mailbox:     status.Name,
			NumMessages: &status.NumMessages,
			NumUnseen:   &status.NumUnseen,
			UIDValidity: status.UIDValidity,
			UIDNext:     imap.UID(status.UIDNext),
		},
	}
}

// providerMessageToIMAP converts provider.Message to IMAPMessage
func providerMessageToIMAP(msg provider.Message) IMAPMessage {
	// Create a FetchMessageBuffer-like structure
	fetchMsg := &imapclient.FetchMessageBuffer{
		SeqNum: msg.SeqNum,
	}
	if msg.ID != nil {
		// Just set a dummy UID so it's not empty, actual ID goes to imapMsg.UID below
		fetchMsg.UID = 1
	}

	// Convert flags
	if msg.Flags != nil {
		fetchMsg.Flags = make([]imap.Flag, len(msg.Flags))
		for i, flag := range msg.Flags {
			fetchMsg.Flags[i] = imap.Flag(flag)
		}
	}

	// Convert envelope
	if msg.Envelope != nil {
		fetchMsg.Envelope = providerEnvelopeToIMAP(msg.Envelope)
	}

	// Convert body structure
	if msg.BodyStructure != nil {
		if imapBS, ok := msg.BodyStructure.(*imapprovider.IMAPBodyStructure); ok {
			fetchMsg.BodyStructure = imapBS.BodyStructure
		}
	}

	// Set size
	size := int64(msg.Size)
	fetchMsg.RFC822Size = size

	var subMsgs []IMAPMessage
	if len(msg.SubMessages) > 0 {
		subMsgs = make([]IMAPMessage, len(msg.SubMessages))
		for i, sub := range msg.SubMessages {
			subMsgs[i] = providerMessageToIMAP(sub)
		}
	}

	imapMsg := IMAPMessage{
		FetchMessageBuffer: fetchMsg,
		Mailbox:            msg.Mailbox,
		HasBimiPotential:   msg.BimiPotential,
		HasBimiFailed:      msg.BimiFailed,
		References:         msg.References,
		ThreadCount:        msg.ThreadCount,
		ThreadUIDs:         msg.ThreadUIDs,
		SubMessages:        subMsgs,
	}
	if msg.ID != nil {
		imapMsg.AlpsUID = msg.ID.String()
	}
	imapMsg.HasAttachments = len(imapMsg.Attachments()) > 0

	return imapMsg
}

// providerEnvelopeToIMAP converts provider.Envelope to imap.Envelope
func providerEnvelopeToIMAP(env *provider.Envelope) *imap.Envelope {
	if env == nil {
		return nil
	}

	imapEnv := &imap.Envelope{
		Date:      env.Date,
		Subject:   env.Subject,
		MessageID: env.MessageID,
	}

	// Convert addresses
	imapEnv.From = providerAddressesToIMAP(env.From)
	imapEnv.Sender = providerAddressesToIMAP(env.Sender)
	imapEnv.ReplyTo = providerAddressesToIMAP(env.ReplyTo)
	imapEnv.To = providerAddressesToIMAP(env.To)
	imapEnv.Cc = providerAddressesToIMAP(env.Cc)
	imapEnv.Bcc = providerAddressesToIMAP(env.Bcc)

	// Handle InReplyTo (it's []string in go-imap v2)
	if env.InReplyTo != "" {
		imapEnv.InReplyTo = []string{env.InReplyTo}
	}

	return imapEnv
}

// providerAddressesToIMAP converts []provider.Address to []imap.Address
func providerAddressesToIMAP(addrs []provider.Address) []imap.Address {
	result := make([]imap.Address, len(addrs))
	for i, addr := range addrs {
		result[i] = imap.Address{
			Name:    addr.Name,
			Mailbox: addr.Mailbox,
			Host:    addr.Host,
		}
	}
	return result
}

// Wrapper functions that use provider instead of direct IMAP calls

// listMailboxesWithProvider lists mailboxes using the provider
func listMailboxesWithProvider(p provider.MailProvider) ([]MailboxInfo, error) {
	mailboxes, err := p.ListMailboxes()
	if err != nil {
		return nil, err
	}

	result := make([]MailboxInfo, len(mailboxes))
	for i, mbox := range mailboxes {
		result[i] = providerMailboxToInfo(mbox)
	}
	return result, nil
}

// getMailboxStatusWithProvider gets mailbox status using the provider
func getMailboxStatusWithProvider(p provider.MailProvider, name string) (*MailboxStatus, error) {
	status, err := p.GetMailboxStatus(name)
	if err != nil {
		return nil, err
	}
	return providerStatusToMailboxStatus(status), nil
}

// getMailboxStatusesWithProvider gets the status of each of names, in one round
// trip where the provider can ask for them together. Where errs holds an
// error, that mailbox's status could not be read.
func getMailboxStatusesWithProvider(p provider.MailProvider, names []string) ([]*MailboxStatus, []error) {
	statuses := make([]*MailboxStatus, len(names))
	errs := make([]error, len(names))
	if batcher, ok := p.(provider.MailboxStatusBatcher); ok {
		got, gotErrs := batcher.GetMailboxStatuses(names)
		for i := range names {
			if gotErrs[i] != nil {
				errs[i] = gotErrs[i]
				continue
			}
			statuses[i] = providerStatusToMailboxStatus(got[i])
		}
		return statuses, errs
	}
	for i, name := range names {
		statuses[i], errs[i] = getMailboxStatusWithProvider(p, name)
	}
	return statuses, errs
}

// readerPartWithProvider reads the part of a message the reader shows, with
// the verdict and References it shows beside it: in one read where the
// provider can, else as the part and then the message's metadata.
func readerPartWithProvider(p provider.MailProvider, mailbox string, uid provider.MessageID, partPath []int) (*provider.Message, []byte, []byte, error) {
	type readerPartReader interface {
		GetMessagePartForReader(mailbox string, id provider.MessageID, partPath []int) (*provider.Message, []byte, []byte, error)
	}
	if r, ok := p.(readerPartReader); ok {
		return r.GetMessagePartForReader(mailbox, uid, partPath)
	}
	msg, _, headerData, bodyData, err := p.GetMessagePartWithData(mailbox, uid, partPath)
	if err != nil {
		return nil, nil, nil, err
	}
	meta, err := p.GetMessageMetadata(mailbox, uid)
	if err != nil {
		return nil, nil, nil, err
	}
	msg.BimiPotential, msg.BimiFailed = meta.BimiPotential, meta.BimiFailed
	if len(msg.References) == 0 {
		msg.References = meta.References
	}
	return msg, headerData, bodyData, nil
}

// deleteMessagesWithProvider deletes multiple messages using the provider
func deleteMessagesWithProvider(p provider.MailProvider, mailbox string, uids []provider.MessageID) error {
	return p.DeleteMessages(mailbox, uids)
}

// messagePartsWithProvider reads the parts of one message at paths, in that
// order: with one read where the provider can, else one read per part.
func messagePartsWithProvider(p provider.MailProvider, mailbox string, uid provider.MessageID, paths [][]int) ([]*message.Entity, error) {
	type partsReader interface {
		GetMessageParts(mailbox string, id provider.MessageID, paths [][]int) ([]*message.Entity, error)
	}
	if r, ok := p.(partsReader); ok {
		return r.GetMessageParts(mailbox, uid, paths)
	}
	parts := make([]*message.Entity, len(paths))
	for i, path := range paths {
		_, entity, _, _, err := p.GetMessagePartWithData(mailbox, uid, path)
		if err != nil {
			return nil, fmt.Errorf("part %s: %w", formatPartPath(path), err)
		}
		parts[i] = entity
	}
	return parts, nil
}

// markMessageAnsweredWithProvider marks a message as answered using the provider
func markMessageAnsweredWithProvider(p provider.MailProvider, mailbox string, uid provider.MessageID) error {
	return p.MarkAnswered(mailbox, uid)
}

// appendMessageWithProvider appends a message using the provider: a message
// as sent (an *OutgoingMessage), or as Drafts stores it (see asDraft).
func appendMessageWithProvider(p provider.MailProvider, msg provider.OutgoingMessageWriter, mboxType provider.MailboxType) (*MailboxInfo, provider.MessageID, uint32, error) {
	mbox, uid, size, err := p.AppendMessage("", msg, mboxType)
	if err != nil {
		return nil, nil, 0, err
	}
	result := providerMailboxToInfo(*mbox)
	return &result, uid, size, nil
}

// createMailboxWithProvider creates a mailbox using the provider
func createMailboxWithProvider(p provider.MailProvider, name string) error {
	return p.CreateMailbox(name)
}

// renameMailboxWithProvider renames a mailbox using the provider
func renameMailboxWithProvider(p provider.MailProvider, oldName, newName string) error {
	return p.RenameMailbox(oldName, newName)
}

// subscribeMailboxWithProvider subscribes to a mailbox using the provider
func subscribeMailboxWithProvider(p provider.MailProvider, name string) error {
	return p.SubscribeMailbox(name)
}

// unsubscribeMailboxWithProvider unsubscribes from a mailbox using the provider
func unsubscribeMailboxWithProvider(p provider.MailProvider, name string) error {
	return p.UnsubscribeMailbox(name)
}

// deleteMailboxWithProvider deletes a mailbox using the provider
func deleteMailboxWithProvider(p provider.MailProvider, name string) error {
	return p.DeleteMailbox(name)
}

// setMessageFlagsWithProvider sets message flags using the provider
func setMessageFlagsWithProvider(p provider.MailProvider, mailbox string, uids []provider.MessageID, op provider.FlagOp, flags []provider.Flag) error {
	flagOp := provider.FlagOperation{
		Op:     op,
		Silent: true,
		Flags:  flags,
	}
	return p.SetMessagesFlags(mailbox, uids, flagOp)
}

// moveMessagesWithProvider moves multiple messages using the provider
func moveMessagesWithProvider(p provider.MailProvider, srcMailbox, dstMailbox string, uids []provider.MessageID) (map[provider.MessageID]provider.MessageID, error) {
	return p.MoveMessages(srcMailbox, dstMailbox, uids)
}

// copyMessagesWithProvider copies multiple messages using the provider
func copyMessagesWithProvider(p provider.MailProvider, srcMailbox, dstMailbox string, uids []provider.MessageID) (map[provider.MessageID]provider.MessageID, error) {
	return p.CopyMessages(srcMailbox, dstMailbox, uids)
}

// messageThreadWithProvider gets a message's thread in its mailbox. `known`
// names the members when the caller already has them, in which case they are
// read directly instead of threaded for. Every member names its folder (see
// namedIn).
func messageThreadWithProvider(p provider.MailProvider, mailbox string, uid provider.MessageID, known []provider.MessageID) ([]provider.Message, error) {
	type memberCapable interface {
		GetThreadMembers(mailbox string, uids []provider.MessageID) ([]provider.Message, error)
	}
	if mc, ok := p.(memberCapable); ok && len(known) > 0 {
		// The hint is only a hint: it comes from a cached listing, so a message
		// expunged since can make the read come back short or fail. Threading
		// from scratch is the answer to that, not an error to the reader.
		if msgs, err := mc.GetThreadMembers(mailbox, known); err == nil && len(msgs) == len(known) {
			return namedIn(msgs, mailbox), nil
		}
	}
	type threadCapable interface {
		GetMessageThread(mailbox string, targetUID provider.MessageID) ([]provider.Message, error)
	}
	if tc, ok := p.(threadCapable); ok {
		msgs, err := tc.GetMessageThread(mailbox, uid)
		return namedIn(msgs, mailbox), err
	}
	msg, err := p.GetMessageMetadata(mailbox, uid)
	if err != nil {
		return nil, err
	}
	return namedIn([]provider.Message{*msg}, mailbox), nil
}

// namedIn names mailbox as the folder of the messages that name none, which a
// provider need not do.
//
// A conversation holds the messages of two folders, the one it is opened from
// and Sent, under ids that name a message only within their own. A member
// that named no folder was taken for one of the folder the conversation was
// opened from, a reply from Sent among them, and the cache could only guess
// that folder from the key it kept the conversation under: Work's begins the
// keys of Work:Sub too. Named where they are read, members are told apart by
// their names alone.
func namedIn(msgs []provider.Message, mailbox string) []provider.Message {
	for i := range msgs {
		if msgs[i].Mailbox == "" {
			msgs[i].Mailbox = mailbox
		}
	}
	return msgs
}

// sentOfConversation finds the messages of a thread's conversation in Sent,
// unless the thread is in Sent already. Every one names Sent (see namedIn).
func sentOfConversation(p provider.MailProvider, mailbox string, thread []provider.Message, sentName string) ([]provider.Message, error) {
	finder, ok := p.(provider.ReferenceFinder)
	if !ok {
		return nil, nil
	}
	ids := provider.ConversationIDs(thread)
	if len(ids) == 0 {
		return nil, nil
	}
	if sentName == "" {
		// Asks the server which mailbox Sent is, with a LIST of its own.
		sent, err := p.FindMailboxByType(provider.MailboxTypeSent)
		if err != nil || sent == nil {
			return nil, err
		}
		sentName = sent.Name
	}
	if sentName == mailbox {
		return nil, nil
	}
	sent, err := finder.FindByReferences(sentName, ids)
	return namedIn(sent, sentName), err
}

// mergeConversation adds the sent messages a thread lacks, and orders them all
// by date. A message in both, such as one sent to oneself, is shown once, from
// the thread.
func mergeConversation(thread, sent []provider.Message) []provider.Message {
	have := make(map[string]bool)
	for _, m := range thread {
		for _, id := range ownMessageIDs(m) {
			have[id] = true
		}
	}
	merged := append([]provider.Message(nil), thread...)
	for _, m := range sent {
		if ids := ownMessageIDs(m); len(ids) > 0 && have[ids[0]] {
			continue
		}
		merged = append(merged, m)
	}
	sort.SliceStable(merged, func(i, j int) bool {
		return messageDate(merged[i]).Before(messageDate(merged[j]))
	})
	return merged
}

func ownMessageIDs(m provider.Message) []string {
	if m.Envelope == nil {
		return nil
	}
	return provider.MessageIDs(m.Envelope.MessageID)
}

func messageDate(m provider.Message) time.Time {
	if m.Envelope == nil {
		return time.Time{}
	}
	return m.Envelope.Date
}
