package provider

import (
	"github.com/emersion/go-message"
	"github.com/stretchr/testify/mock"
)

// MockProvider is a mock implementation of the MailProvider interface.
type MockProvider struct {
	mock.Mock
	Type               string
	ParseMessageIDFunc func(string) (MessageID, error)
}

func (m *MockProvider) Close() error {
	args := m.Called()
	return args.Error(0)
}

func (m *MockProvider) GetStore() (Store, error) {
	args := m.Called()
	store, _ := args.Get(0).(Store)
	return store, args.Error(1)
}

func (m *MockProvider) ListMailboxes() ([]Mailbox, error) {
	args := m.Called()
	var mboxes []Mailbox
	if val := args.Get(0); val != nil {
		mboxes = val.([]Mailbox)
	}
	return mboxes, args.Error(1)
}

func (m *MockProvider) GetMailboxStatus(name string) (*MailboxStatus, error) {
	args := m.Called(name)
	var status *MailboxStatus
	if val := args.Get(0); val != nil {
		status = val.(*MailboxStatus)
	}
	return status, args.Error(1)
}

func (m *MockProvider) FindMailboxByType(mboxType MailboxType) (*Mailbox, error) {
	args := m.Called(mboxType)
	var mbox *Mailbox
	if val := args.Get(0); val != nil {
		mbox = val.(*Mailbox)
	}
	return mbox, args.Error(1)
}

func (m *MockProvider) CreateMailbox(name string) error {
	args := m.Called(name)
	return args.Error(0)
}

func (m *MockProvider) RenameMailbox(oldName, newName string) error {
	args := m.Called(oldName, newName)
	return args.Error(0)
}

func (m *MockProvider) DeleteMailbox(name string) error {
	args := m.Called(name)
	return args.Error(0)
}

func (m *MockProvider) EmptyMailbox(name string) error {
	args := m.Called(name)
	return args.Error(0)
}

func (m *MockProvider) SubscribeMailbox(name string) error {
	args := m.Called(name)
	return args.Error(0)
}

func (m *MockProvider) UnsubscribeMailbox(name string) error {
	args := m.Called(name)
	return args.Error(0)
}

func (m *MockProvider) ListMessages(mailbox string, sortOrder string, page, pageSize int) ([]Message, int, error) {
	args := m.Called(mailbox, sortOrder, page, pageSize)
	var msgs []Message
	if val := args.Get(0); val != nil {
		msgs = val.([]Message)
	}
	return msgs, args.Int(1), args.Error(2)
}

func (m *MockProvider) SearchMessages(mailbox, query string, sortOrder string, page, pageSize int) ([]Message, int, error) {
	args := m.Called(mailbox, query, sortOrder, page, pageSize)
	var msgs []Message
	if val := args.Get(0); val != nil {
		msgs = val.([]Message)
	}
	return msgs, args.Int(1), args.Error(2)
}

func (m *MockProvider) ParseMessageID(id string) (MessageID, error) {
	if m.ParseMessageIDFunc != nil {
		return m.ParseMessageIDFunc(id)
	}
	return MockMessageID{ID: id}, nil
}

func (m *MockProvider) GetMessageMetadata(mailbox string, id MessageID) (*Message, error) {
	args := m.Called(mailbox, id)
	var msg *Message
	if val := args.Get(0); val != nil {
		msg = val.(*Message)
	}
	return msg, args.Error(1)
}

func (m *MockProvider) GetMessagePart(mailbox string, id MessageID, partPath []int) (*Message, *message.Entity, error) {
	args := m.Called(mailbox, id, partPath)
	var msg *Message
	var entity *message.Entity
	if val := args.Get(0); val != nil {
		msg = val.(*Message)
	}
	if val := args.Get(1); val != nil {
		entity = val.(*message.Entity)
	}
	return msg, entity, args.Error(2)
}

func (m *MockProvider) GetMessagePartRaw(mailbox string, id MessageID, partPath []int, limit int64) (*Message, []byte, []byte, error) {
	args := m.Called(mailbox, id, partPath, limit)
	var msg *Message
	if val := args.Get(0); val != nil {
		msg = val.(*Message)
	}
	var b1, b2 []byte
	if val := args.Get(1); val != nil {
		b1 = val.([]byte)
	}
	if val := args.Get(2); val != nil {
		b2 = val.([]byte)
	}
	return msg, b1, b2, args.Error(3)
}

func (m *MockProvider) GetMessagePartWithData(mailbox string, id MessageID, partPath []int) (*Message, *message.Entity, []byte, []byte, error) {
	args := m.Called(mailbox, id, partPath)
	var msg *Message
	var entity *message.Entity
	if val := args.Get(0); val != nil {
		msg = val.(*Message)
	}
	if val := args.Get(1); val != nil {
		entity = val.(*message.Entity)
	}
	var b1, b2 []byte
	if val := args.Get(2); val != nil {
		b1 = val.([]byte)
	}
	if val := args.Get(3); val != nil {
		b2 = val.([]byte)
	}
	return msg, entity, b1, b2, args.Error(4)
}

func (m *MockProvider) SetMessagesFlags(mailbox string, ids []MessageID, op FlagOperation) error {
	args := m.Called(mailbox, ids, op)
	return args.Error(0)
}

func (m *MockProvider) MarkAnswered(mailbox string, id MessageID) error {
	args := m.Called(mailbox, id)
	return args.Error(0)
}

func (m *MockProvider) AppendMessage(mailbox string, msg OutgoingMessageWriter, mboxType MailboxType) (*Mailbox, MessageID, uint32, error) {
	args := m.Called(mailbox, msg, mboxType)
	var mbox *Mailbox
	if val := args.Get(0); val != nil {
		mbox = val.(*Mailbox)
	}
	var msgID MessageID
	if val := args.Get(1); val != nil {
		msgID = val.(MessageID)
	}
	return mbox, msgID, args.Get(2).(uint32), args.Error(3)
}

func (m *MockProvider) DeleteMessages(mailbox string, ids []MessageID) error {
	args := m.Called(mailbox, ids)
	return args.Error(0)
}

func (m *MockProvider) MoveMessages(sourceMailbox, destMailbox string, ids []MessageID) (map[MessageID]MessageID, error) {
	args := m.Called(sourceMailbox, destMailbox, ids)
	var mmap map[MessageID]MessageID
	if val := args.Get(0); val != nil {
		mmap = val.(map[MessageID]MessageID)
	}
	return mmap, args.Error(1)
}

func (m *MockProvider) CopyMessages(sourceMailbox, destMailbox string, ids []MessageID) (map[MessageID]MessageID, error) {
	args := m.Called(sourceMailbox, destMailbox, ids)
	var mmap map[MessageID]MessageID
	if val := args.Get(0); val != nil {
		mmap = val.(map[MessageID]MessageID)
	}
	return mmap, args.Error(1)
}

// MockMessageID is a mock implementation of MessageID
type MockMessageID struct {
	ID string
}

func (m MockMessageID) String() string {
	return m.ID
}

func (m MockMessageID) Provider() string {
	return "mock"
}
