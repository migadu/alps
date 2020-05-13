package alpsbase

import (
	"fmt"

	"git.sr.ht/~emersion/alps"
	"github.com/emersion/go-message"
)

// ErrViewUnsupported is returned by Viewer.ViewMessagePart when the message
// part isn't supported.
var ErrViewUnsupported = fmt.Errorf("cannot generate message view: unsupported part")

// Viewer is a message part viewer.
type Viewer interface {
	// ViewMessagePart renders a message part. The returned value is displayed
	// in a template. ErrViewUnsupported is returned if the message part isn't
	// supported.
	ViewMessagePart(*alps.Context, *IMAPMessage, *message.Entity) (interface{}, error)
}

var viewers []Viewer

// RegisterViewer registers a message part viewer.
func RegisterViewer(viewer Viewer) {
	viewers = append(viewers, viewer)
}

func viewMessagePart(ctx *alps.Context, msg *IMAPMessage, part *message.Entity) (interface{}, error) {
	for _, viewer := range viewers {
		v, err := viewer.ViewMessagePart(ctx, msg, part)
		if err == ErrViewUnsupported {
			continue
		}
		return v, err
	}
	return nil, ErrViewUnsupported
}
