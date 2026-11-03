package alpsbase

import (
	"errors"
	"strings"
	"unicode"

	"github.com/emersion/go-message/mail"
)

var errInvalidReplyTo = errors.New("invalid_reply_to")

// A Reply-To is optional, but when present it names exactly one mailbox.
// Control characters cannot belong to a value typed into this one-line setting.
func replyToAddress(value string) (*mail.Address, error) {
	if len(value) > 1024 {
		return nil, errInvalidReplyTo
	}
	for _, r := range value {
		if unicode.IsControl(r) {
			return nil, errInvalidReplyTo
		}
	}
	value = strings.TrimSpace(value)
	if value == "" {
		return nil, nil
	}
	address, err := mail.ParseAddress(value)
	if err != nil {
		return nil, errInvalidReplyTo
	}
	return address, nil
}
