package alpsbase

import (
	"errors"
	"github.com/emersion/go-smtp"
	"github.com/migadu/alps"
	"github.com/migadu/go-imap"
	"net/http"
)

var errMessageTooLarge = errors.New("message_too_large")

func messageSizeRefused(err error) bool {
	if errors.Is(err, errMessageTooLarge) {
		return true
	}
	var imapError *imap.Error
	if errors.As(err, &imapError) && imapError.Code == imap.ResponseCodeTooBig {
		return true
	}
	var smtpError *smtp.SMTPError
	return errors.As(err, &smtpError) && smtpError.Code == 552
}

func respondMessageTooLarge(ctx *alps.Context, err error) error {
	ctx.Logger().Printf("message size refused: %v", err)
	return ctx.JSON(http.StatusRequestEntityTooLarge, map[string]string{"error": "message_too_large", "code": "message_too_large"})
}
