package unified

import (
	"io"
	"fmt"
	"sync"
	"time"
	"errors"
	"strings"
	"context"
	"github.com/emersion/go-message"
	"github.com/migadu/alps/provider"
)

const retryLimit = 3
const retryWait = 1 * time.Second

var ErrAccountUnavailable = errors.New("account not available")

func isNetworkError(err error) bool {
	if err == nil {
		return false
	}
	if errors.Is(err, io.EOF) || errors.Is(err, io.ErrUnexpectedEOF) {
		return true
	}
	errStr := err.Error()
	return strings.Contains(errStr, "use of closed network connection") ||
		strings.Contains(errStr, "connection reset") ||
		strings.Contains(errStr, "broken pipe")
}

func closeProviderAfter(p provider.MailProvider, done <-chan error) {
	if p == nil {
		return
	}
	go func() {
		<-done
		p.Close()
	}()
}

// This type acts as the backend mail provider, and must implement provider.MailProvider
// It handles reconnecting to the actual provider as needed
type backend struct {
	config *backendConfig
	store provider.Store
	plock sync.Mutex
	factory provider.AuthenticatedProviderFactory
	handler provider.MailProvider
	delim string
	unified map[string]string
}

func newBackend(cfg *backendConfig, s provider.Store, f provider.AuthenticatedProviderFactory) (*backend, error) {

	b := &backend{
		config: cfg,
		store: s,
		factory: f,
		handler: nil,
		delim: ".",
		unified: make(map[string]string),
	}

	// TODO: maybe don't fail completely here?
	err := b.connect()
	if err != nil {
		return nil, err
	}
	return b, nil
}

func (b *backend) connect() error {

	p, err := b.factory(b.config.Username, b.config.Password)
	if err != nil {
		return err
	}
	if b.store != nil {
		p.SetStore(b.store)
	}
	b.handler = p
	return nil
}

// Store the actual backend name for a unified mailbox
func (b *backend) setUnifiedName(uName, name string) {

	b.unified[uName] = name
}

// Get the actual backend name for a unified mailbox
func (b *backend) getUnifiedName(uName string) string {

	return b.unified[uName]
}

// Perform an operation with the actual backend using a default context
func (b *backend) doWithProvider(f func(provider.MailProvider) error) error {

	return b.doWithProviderContext(context.Background(), f)
}

// Perform an operation with the actual backend
// Reconnect to the provider if needed
func (b *backend) doWithProviderContext(ctx context.Context, f func(provider.MailProvider) error) error {

	b.plock.Lock()
	defer b.plock.Unlock()

	count := 0
	for {
		if b.handler == nil {
			err := b.connect()
			if err != nil {
				return fmt.Errorf("failed to connect to %s: %w", b.config.Name, errors.Join(ErrAccountUnavailable, err))
			}
		}

		done := make(chan error, 1)

		go func(p provider.MailProvider) {
			defer func() {
				if r := recover(); r != nil {
					done <- fmt.Errorf("panic in IMAP operation: %v", r)
				}
			}()
			done <- f(p)
		}(b.handler)

		var err error
		select {
		case <-ctx.Done():
			closeProviderAfter(b.handler, done)
			b.handler = nil
			return fmt.Errorf("context cancelled: %w", ctx.Err())
		case err = <-done:
		}

		if err != nil && isNetworkError(err) {
			b.handler.Close()
			b.handler = nil
			count = count + 1
			if count <= retryLimit {
				time.Sleep(retryWait)
				continue
			}
		}

		return err
	}
}

// provider.MailProvider interface methods
// These basically just marshal the arguments and return results through a call to doWithProvider

func (b *backend) Close() error {

	if b.handler == nil { return nil }
	err := b.handler.Close()
	b.handler = nil
	return err
}

func (b *backend) ListMailboxes() ([]provider.Mailbox, error) {

	var result []provider.Mailbox = nil
	err := b.doWithProvider(func(p provider.MailProvider) error {
		var perr error
		result, perr = p.ListMailboxes()
		return perr
	})
	return result, err
}

func (b *backend) GetMailboxStatus(mailbox string) (*provider.MailboxStatus, error) {

	var status *provider.MailboxStatus = nil
	err := b.doWithProvider(func(p provider.MailProvider) error {
		var perr error
		status, perr = p.GetMailboxStatus(mailbox)
		return perr
	})
	return status, err
}

func (b *backend) FindMailboxByType(mboxType provider.MailboxType) (*provider.Mailbox, error) {

	return nil, nil
}

func (b *backend) CreateMailbox(mailbox string) error {

	return b.doWithProvider(func(p provider.MailProvider) error {
		return p.CreateMailbox(mailbox)
	})
}

func (b *backend) DeleteMailbox(mailbox string) error {

	return b.doWithProvider(func(p provider.MailProvider) error {
		return p.DeleteMailbox(mailbox)
	})
}

func (b *backend) EmptyMailbox(mailbox string) (int, error) {

	var count int
	err := b.doWithProvider(func(p provider.MailProvider) error {
		var perr error
		count, perr = p.EmptyMailbox(mailbox)
		return perr
	})
	return count, err
}

func (b *backend) RenameMailbox(oldName, newName string) error {

	return b.doWithProvider(func(p provider.MailProvider) error {
		return p.RenameMailbox(oldName, newName)
	})
}

func (b *backend) SubscribeMailbox(mailbox string) error {

	return b.doWithProvider(func(p provider.MailProvider) error {
		return p.SubscribeMailbox(mailbox)
	})
}

func (b *backend) UnsubscribeMailbox(mailbox string) error {

	return b.doWithProvider(func(p provider.MailProvider) error {
		return p.UnsubscribeMailbox(mailbox)
	})
}

func (b *backend) ListMessages(mailbox string, sortOrder string, page, pageSize int) ([]provider.Message, provider.PageInfo, error) {

	var list []provider.Message = nil
	var info provider.PageInfo
	err := b.doWithProvider(func(p provider.MailProvider) error {
		var perr error
		list, info, perr = p.ListMessages(mailbox, sortOrder, page, pageSize)
		return perr
	})
	return list, info, err
}

func (b *backend) SearchMessageIDs(mailbox, query string) ([]provider.MessageID, error) {

	var list []provider.MessageID = nil
	err := b.doWithProvider(func(p provider.MailProvider) error {
		var perr error
		list, perr = p.SearchMessageIDs(mailbox, query)
		return perr
	})
	return list, err
}

func (b *backend) SearchMessages(mailbox, query string, sortOrder string, page, pageSize int) ([]provider.Message, provider.PageInfo, error) {

	var list []provider.Message = nil
	var info provider.PageInfo
	err := b.doWithProvider(func(p provider.MailProvider) error {
		var perr error
		list, info, perr = p.SearchMessages(mailbox, query, sortOrder, page, pageSize)
		return perr
	})
	return list, info, err
}

func (b *backend) GetMessageMetadata(mailbox string, id provider.MessageID) (*provider.Message, error) {

	var msg *provider.Message = nil
	err := b.doWithProvider(func(p provider.MailProvider) error {
		var perr error
		msg, perr = p.GetMessageMetadata(mailbox, id)
		return perr
	})
	return msg, err
}

func (b *backend) GetMessagePart(mailbox string, id provider.MessageID, partPath []int) (*provider.Message, *message.Entity, error) {

	var m *provider.Message = nil
	var e *message.Entity = nil
	err := b.doWithProvider(func(p provider.MailProvider) error {
		var perr error
		m, e, perr = p.GetMessagePart(mailbox, id, partPath)
		return perr
	})
	return m, e, err
}

func (b *backend) GetMessagePartRaw(mailbox string, id provider.MessageID, partPath []int, limit int64) (*provider.Message, []byte, []byte, error) {

	var m *provider.Message = nil
	var b1 []byte = nil
	var b2 []byte = nil
	err := b.doWithProvider(func(p provider.MailProvider) error {
		var perr error
		m, b1, b2, perr = p.GetMessagePartRaw(mailbox, id, partPath, limit)
		return perr
	})
	return m, b1, b2, err
}

func (b *backend) GetMessagePartWithData(mailbox string, id provider.MessageID, partPath []int) (*provider.Message, *message.Entity, []byte, []byte, error) {

	var m *provider.Message = nil
	var e *message.Entity = nil
	var b1 []byte = nil
	var b2 []byte = nil
	err := b.doWithProvider(func(p provider.MailProvider) error {
		var perr error
		m, e, b1, b2, perr = p.GetMessagePartWithData(mailbox, id, partPath)
		return perr
	})
	return m, e, b1, b2, err
}

func (b *backend) SetMessagesFlags(mailbox string, ids []provider.MessageID, op provider.FlagOperation) error {

	return b.doWithProvider(func(p provider.MailProvider) error {
		return p.SetMessagesFlags(mailbox, ids, op)
	})
}

func (b *backend) MarkAnswered(mailbox string, id provider.MessageID) error {

	return b.doWithProvider(func(p provider.MailProvider) error {
		return p.MarkAnswered(mailbox, id)
	})
}

func (b *backend) AppendMessage(mailbox string, msg provider.OutgoingMessageWriter, mboxType provider.MailboxType) (*provider.Mailbox, provider.MessageID, uint32, error) {

	var m *provider.Mailbox = nil
	var id provider.MessageID = nil
	var n uint32 = 0
	err := b.doWithProvider(func(p provider.MailProvider) error {
		var perr error
		m, id, n, perr = p.AppendMessage(mailbox, msg, mboxType)
		return perr
	})
	return m, id, n, err
}

func (b *backend) DeleteMessages(mailbox string, ids []provider.MessageID) error {

	return b.doWithProvider(func(p provider.MailProvider) error {
		return p.DeleteMessages(mailbox, ids)
	})
}

func (b *backend) MoveMessages(oldMailbox, newMailbox string, ids []provider.MessageID) (map[provider.MessageID]provider.MessageID, error) {

	var m map[provider.MessageID]provider.MessageID = nil
	err := b.doWithProvider(func(p provider.MailProvider) error {
		var perr error
		m, perr = p.MoveMessages(oldMailbox, newMailbox, ids)
		return perr
	})
	return m, err
}

func (b *backend) CopyMessages(oldMailbox, newMailbox string, ids []provider.MessageID) (map[provider.MessageID]provider.MessageID, error) {

	var m map[provider.MessageID]provider.MessageID = nil
	err := b.doWithProvider(func(p provider.MailProvider) error {
		var perr error
		m, perr = p.CopyMessages(oldMailbox, newMailbox, ids)
		return perr
	})
	return m, err
}

