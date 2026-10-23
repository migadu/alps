package provider

import (
	"io"
	"strings"

	"github.com/emersion/go-message"
	"github.com/emersion/go-message/textproto"
)

// NewPartEntity is message.New, reporting a transfer encoding it cannot undo
// even when the part's charset is unknown too.
//
// message.New records an unknown transfer encoding first, then overwrites
// that error with an unknown charset's. A caller that accepts an unknown
// charset, and takes the text as it is stored, then accepted a body whose
// transfer encoding was never undone. Here an unknown charset is reported
// only when the transfer encoding could be undone.
func NewPartEntity(h message.Header, body io.Reader) (*message.Entity, error) {
	entity, err := message.New(h, body)
	if err != nil && message.IsUnknownCharset(err) {
		var transferOnly textproto.Header
		if enc := h.Get("Content-Transfer-Encoding"); enc != "" {
			transferOnly.Set("Content-Transfer-Encoding", enc)
		}
		if _, encErr := message.New(message.Header{Header: transferOnly}, strings.NewReader("")); encErr != nil {
			return entity, encErr
		}
	}
	return entity, err
}
