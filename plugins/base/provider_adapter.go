package alpsbase

import (
	"sort"
	"time"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapclient"
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

// getMessageMetadataWithProvider gets a message's metadata using the provider
func getMessageMetadataWithProvider(p provider.MailProvider, mailbox string, uid provider.MessageID) (*IMAPMessage, error) {
	msg, err := p.GetMessageMetadata(mailbox, uid)
	if err != nil {
		return nil, err
	}

	imapMsg := providerMessageToIMAP(*msg)
	return &imapMsg, nil
}

// deleteMessagesWithProvider deletes multiple messages using the provider
func deleteMessagesWithProvider(p provider.MailProvider, mailbox string, uids []provider.MessageID) error {
	return p.DeleteMessages(mailbox, uids)
}

// markMessageAnsweredWithProvider marks a message as answered using the provider
func markMessageAnsweredWithProvider(p provider.MailProvider, mailbox string, uid provider.MessageID) error {
	return p.MarkAnswered(mailbox, uid)
}

// appendMessageWithProvider appends a message using the provider
func appendMessageWithProvider(p provider.MailProvider, msg *OutgoingMessage, mboxType provider.MailboxType) (*MailboxInfo, provider.MessageID, uint32, error) {
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

// getConversationWithProvider returns a message's conversation, oldest first:
// its thread in mailbox, and the messages of it filed in Sent. Threading sees
// one mailbox at a time, and the replies a user sends are not in the mailbox
// of the messages they answer. A failed look in Sent is logged, and the thread
// is returned as it is.
func getConversationWithProvider(p provider.MailProvider, mailbox string, uid provider.MessageID, known conversationHints, logf func(format string, args ...interface{})) ([]IMAPMessage, error) {
	thread, err := messageThreadWithProvider(p, mailbox, uid, known.memberUIDs)
	if err != nil {
		return nil, err
	}

	msgs := thread
	if sent, err := sentOfConversation(p, mailbox, thread, known.sentMailbox); err != nil {
		logf("looking in Sent for the conversation of %s/%s: %v", mailbox, uid, err)
	} else {
		msgs = mergeConversation(thread, sent)
	}

	result := make([]IMAPMessage, len(msgs))
	for i, m := range msgs {
		result[i] = providerMessageToIMAP(m)
	}
	return result, nil
}

// conversationHints is what the CALLER already knows, so the provider is not
// asked to rediscover it. Both fields are optional; an empty one means "find
// out", which is what every caller did before they were passed.
type conversationHints struct {
	// The conversation's UIDs in this mailbox, as a listing already established
	// them. Saves a THREAD over the whole mailbox — see GetThreadMembers.
	memberUIDs []provider.MessageID
	// The Sent mailbox's name, from the mailbox list the session has cached.
	// Saves a LIST on every conversation read.
	sentMailbox string
}

// messageThreadWithProvider gets a message's thread in its mailbox. `known`
// names the members when the caller already has them, in which case they are
// read directly instead of threaded for.
func messageThreadWithProvider(p provider.MailProvider, mailbox string, uid provider.MessageID, known []provider.MessageID) ([]provider.Message, error) {
	type memberCapable interface {
		GetThreadMembers(mailbox string, uids []provider.MessageID) ([]provider.Message, error)
	}
	if mc, ok := p.(memberCapable); ok && len(known) > 0 {
		// The hint is only a hint: it comes from a cached listing, so a message
		// expunged since can make the read come back short or fail. Threading
		// from scratch is the answer to that, not an error to the reader.
		if msgs, err := mc.GetThreadMembers(mailbox, known); err == nil && len(msgs) == len(known) {
			return msgs, nil
		}
	}
	type threadCapable interface {
		GetMessageThread(mailbox string, targetUID provider.MessageID) ([]provider.Message, error)
	}
	if tc, ok := p.(threadCapable); ok {
		return tc.GetMessageThread(mailbox, uid)
	}
	msg, err := p.GetMessageMetadata(mailbox, uid)
	if err != nil {
		return nil, err
	}
	return []provider.Message{*msg}, nil
}

// sentOfConversation finds the messages of a thread's conversation in Sent,
// unless the thread is in Sent already.
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
	return finder.FindByReferences(sentName, ids)
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
