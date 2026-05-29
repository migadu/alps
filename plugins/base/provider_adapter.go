package alpsbase

import (
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

// getMessagePartWithDataWithProvider gets a message part with data using the provider
func getMessagePartWithDataWithProvider(p provider.MailProvider, mailbox string, uid provider.MessageID, partPath []int) (*IMAPMessage, []byte, []byte, error) {
	msg, _, headerData, bodyData, err := p.GetMessagePartWithData(mailbox, uid, partPath)
	if err != nil {
		return nil, nil, nil, err
	}
	imapMsg := providerMessageToIMAP(*msg)
	return &imapMsg, headerData, bodyData, nil
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

// getMessageThreadWithProvider gets a message thread using the provider
func getMessageThreadWithProvider(p provider.MailProvider, mailbox string, uid provider.MessageID) ([]IMAPMessage, error) {
	type threadCapable interface {
		GetMessageThread(mailbox string, targetUID provider.MessageID) ([]provider.Message, error)
	}

	var msgs []provider.Message
	var err error
	if tc, ok := p.(threadCapable); ok {
		msgs, err = tc.GetMessageThread(mailbox, uid)
	} else {
		var singleMsg *provider.Message
		singleMsg, err = p.GetMessageMetadata(mailbox, uid)
		if err == nil {
			msgs = []provider.Message{*singleMsg}
		}
	}

	if err != nil {
		return nil, err
	}

	result := make([]IMAPMessage, len(msgs))
	for i, m := range msgs {
		result[i] = providerMessageToIMAP(m)
	}
	return result, nil
}
