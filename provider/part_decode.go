package provider

import (
	"bytes"

	"github.com/emersion/go-message"
)

// DecodePart keeps go-message's unknown-charset result, whose body callers may
// carry without converting its charset. The library can mask an earlier unknown
// transfer encoding with that result: such a body is not decoded content.
func DecodePart(header message.Header, body []byte) (*message.Entity, error) {
	part, err := message.New(header, bytes.NewReader(body))
	if message.IsUnknownCharset(err) {
		transfer := header.Copy()
		mediaType, params, _ := transfer.ContentType()
		delete(params, "charset")
		transfer.SetContentType(mediaType, params)
		if _, transferErr := message.New(transfer, bytes.NewReader(body)); transferErr != nil {
			return nil, transferErr
		}
	}
	return part, err
}
