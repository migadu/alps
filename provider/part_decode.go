package provider

import (
	"bytes"

	"github.com/emersion/go-message"
)

// DecodePart decodes buffered content with the same charset and transfer-encoding
// checks as NewPartEntity. Unknown charsets keep the transfer-decoded body.
func DecodePart(header message.Header, body []byte) (*message.Entity, error) {
	return NewPartEntity(header, bytes.NewReader(body))
}
