package providertest

import (
	"github.com/emersion/go-message"
	"github.com/migadu/alps/provider"
	"github.com/stretchr/testify/mock"
	"time"
)

type MockOptions struct{}

func (o *MockOptions) Type() string {

	return "mock"
}

func (o *MockOptions) CreateFactory(timeout time.Duration, debug bool) provider.AuthenticatedProviderFactory {
	return func(username, password string) (provider.MailProvider, error) {
		return &MockProvider{}, nil
	}
}

// MockProvider is a mock implementation of the provider.MailProvider interface.
type MockProvider struct {
	mock.Mock
	Type               string
	ParseMessageIDFunc func(string) (provider.MessageID, error)
}

func (m *MockProvider) Close() error {
	args := m.Called()
	return args.Error(0)
}

func (m *MockProvider) GetStore() (provider.Store, error) {
	args := m.Called()
	store, _ := args.Get(0).(provider.Store)
	return store, args.Error(1)
}

func (m *MockProvider) ListMailboxes() ([]provider.Mailbox, error) {
	args := m.Called()
	var mboxes []provider.Mailbox
	if val := args.Get(0); val != nil {
		mboxes = val.([]provider.Mailbox)
	}
	return mboxes, args.Error(1)
}

func (m *MockProvider) GetMailboxStatus(name string) (*provider.MailboxStatus, error) {
	args := m.Called(name)
	var status *provider.MailboxStatus
	if val := args.Get(0); val != nil {
		status = val.(*provider.MailboxStatus)
	}
	return status, args.Error(1)
}

func (m *MockProvider) FindMailboxByType(mboxType provider.MailboxType) (*provider.Mailbox, error) {
	args := m.Called(mboxType)
	var mbox *provider.Mailbox
	if val := args.Get(0); val != nil {
		mbox = val.(*provider.Mailbox)
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

func (m *MockProvider) EmptyMailbox(name string) (int, error) {
	args := m.Called(name)
	return args.Int(0), args.Error(1)
}

func (m *MockProvider) SubscribeMailbox(name string) error {
	args := m.Called(name)
	return args.Error(0)
}

func (m *MockProvider) UnsubscribeMailbox(name string) error {
	args := m.Called(name)
	return args.Error(0)
}

func (m *MockProvider) ListMessages(mailbox string, sortOrder string, page, pageSize int) ([]provider.Message, provider.PageInfo, error) {
	args := m.Called(mailbox, sortOrder, page, pageSize)
	var msgs []provider.Message
	if val := args.Get(0); val != nil {
		msgs = val.([]provider.Message)
	}
	return msgs, mockPageInfo(args, 1), args.Error(2)
}

func (m *MockProvider) SearchMessageIDs(mailbox, query string) ([]provider.MessageID, error) {
	args := m.Called(mailbox, query)
	var ids []provider.MessageID
	if val := args.Get(0); val != nil {
		ids = val.([]provider.MessageID)
	}
	return ids, args.Error(1)
}

func (m *MockProvider) SearchMessages(mailbox, query string, sortOrder string, page, pageSize int) ([]provider.Message, provider.PageInfo, error) {
	args := m.Called(mailbox, query, sortOrder, page, pageSize)
	var msgs []provider.Message
	if val := args.Get(0); val != nil {
		msgs = val.([]provider.Message)
	}
	return msgs, mockPageInfo(args, 1), args.Error(2)
}

// mockPageInfo lets a test set the page either way round: a provider.PageInfo when it
// cares whether the page was threaded, or a bare total when it does not.
func mockPageInfo(args mock.Arguments, idx int) provider.PageInfo {
	switch v := args.Get(idx).(type) {
	case provider.PageInfo:
		return v
	case int:
		return provider.PageInfo{Total: v}
	default:
		return provider.PageInfo{}
	}
}

func (m *MockProvider) ParseMessageID(id string) (provider.MessageID, error) {
	if m.ParseMessageIDFunc != nil {
		return m.ParseMessageIDFunc(id)
	}
	return MockMessageID{ID: id}, nil
}

func (m *MockProvider) GetMessageMetadata(mailbox string, id provider.MessageID) (*provider.Message, error) {
	args := m.Called(mailbox, id)
	var msg *provider.Message
	if val := args.Get(0); val != nil {
		msg = val.(*provider.Message)
	}
	return msg, args.Error(1)
}

func (m *MockProvider) GetMessagePart(mailbox string, id provider.MessageID, partPath []int) (*provider.Message, *message.Entity, error) {
	args := m.Called(mailbox, id, partPath)
	var msg *provider.Message
	var entity *message.Entity
	if val := args.Get(0); val != nil {
		msg = val.(*provider.Message)
	}
	if val := args.Get(1); val != nil {
		entity = val.(*message.Entity)
	}
	return msg, entity, args.Error(2)
}

func (m *MockProvider) GetMessagePartRaw(mailbox string, id provider.MessageID, partPath []int, limit int64) (*provider.Message, []byte, []byte, error) {
	args := m.Called(mailbox, id, partPath, limit)
	var msg *provider.Message
	if val := args.Get(0); val != nil {
		msg = val.(*provider.Message)
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

func (m *MockProvider) GetMessagePartWithData(mailbox string, id provider.MessageID, partPath []int) (*provider.Message, *message.Entity, []byte, []byte, error) {
	args := m.Called(mailbox, id, partPath)
	var msg *provider.Message
	var entity *message.Entity
	if val := args.Get(0); val != nil {
		msg = val.(*provider.Message)
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

func (m *MockProvider) SetMessagesFlags(mailbox string, ids []provider.MessageID, op provider.FlagOperation) error {
	args := m.Called(mailbox, ids, op)
	return args.Error(0)
}

func (m *MockProvider) MarkAnswered(mailbox string, id provider.MessageID) error {
	args := m.Called(mailbox, id)
	return args.Error(0)
}

func (m *MockProvider) AppendMessage(mailbox string, msg provider.OutgoingMessageWriter, mboxType provider.MailboxType) (*provider.Mailbox, provider.MessageID, uint32, error) {
	args := m.Called(mailbox, msg, mboxType)
	var mbox *provider.Mailbox
	if val := args.Get(0); val != nil {
		mbox = val.(*provider.Mailbox)
	}
	var msgID provider.MessageID
	if val := args.Get(1); val != nil {
		msgID = val.(provider.MessageID)
	}
	return mbox, msgID, args.Get(2).(uint32), args.Error(3)
}

func (m *MockProvider) DeleteMessages(mailbox string, ids []provider.MessageID) error {
	args := m.Called(mailbox, ids)
	return args.Error(0)
}

func (m *MockProvider) MoveMessages(sourceMailbox, destMailbox string, ids []provider.MessageID) (map[provider.MessageID]provider.MessageID, error) {
	args := m.Called(sourceMailbox, destMailbox, ids)
	var mmap map[provider.MessageID]provider.MessageID
	if val := args.Get(0); val != nil {
		mmap = val.(map[provider.MessageID]provider.MessageID)
	}
	return mmap, args.Error(1)
}

func (m *MockProvider) CopyMessages(sourceMailbox, destMailbox string, ids []provider.MessageID) (map[provider.MessageID]provider.MessageID, error) {
	args := m.Called(sourceMailbox, destMailbox, ids)
	var mmap map[provider.MessageID]provider.MessageID
	if val := args.Get(0); val != nil {
		mmap = val.(map[provider.MessageID]provider.MessageID)
	}
	return mmap, args.Error(1)
}

// MockMessageID is a mock implementation of provider.MessageID
type MockMessageID struct {
	ID string
}

func (m MockMessageID) String() string {
	return m.ID
}

func (m MockMessageID) Provider() string {
	return "mock"
}
