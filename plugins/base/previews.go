package alpsbase

import (
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

// maxPreviewUIDs bounds one previews request. A preview the server does not
// have to hand can cost it a download from object storage, one message after
// another, so the frontend asks for a few at a time and the background
// connection is never held long enough to time out.
const maxPreviewUIDs = 10

// handlePreviews answers the previews of messages a listing marked
// PreviewPending: the server had none to hand when the list was read. The
// frontend asks once the list has rendered.
//
// GET /mailboxes/{mbox}/previews?uids=1,2 answers {"Previews": {"1": "..."},
// "Scope": "...", "Supported": true}. A message the server gave no preview for
// is left out, and stays pending. Supported is false when the server offers no
// previews (on this connection), so the frontend stops asking. The same UID
// under a different Scope is a different message.
func handlePreviews(ctx *alps.Context) error {
	mboxName, err := url.PathUnescape(ctx.Param("mbox"))
	if err != nil {
		return alps.NewHTTPError(http.StatusBadRequest, err)
	}
	var uids []string
	for _, uid := range strings.Split(ctx.QueryParam("uids"), ",") {
		if uid = strings.TrimSpace(uid); uid != "" {
			uids = append(uids, uid)
		}
	}
	if len(uids) > maxPreviewUIDs {
		return alps.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("at most %d uids per request", maxPreviewUIDs))
	}

	previews := map[string]string{}
	scope := ""
	supported := false
	if len(uids) > 0 {
		// Nobody waits for a preview: the list is already on screen.
		err = ctx.Session.DoBackgroundMail(ctx.Request.Context(), func(p provider.MailProvider) error {
			pp, ok := p.(provider.PreviewProvider)
			if !ok {
				return nil
			}
			ids := make([]provider.MessageID, 0, len(uids))
			for _, uid := range uids {
				id, err := p.ParseMessageID(uid)
				if err != nil {
					return alps.NewHTTPError(http.StatusBadRequest, "invalid uid")
				}
				ids = append(ids, id)
			}
			got, gotScope, gotSupported, err := pp.Previews(mboxName, ids)
			scope, supported = gotScope, gotSupported
			for id, text := range got {
				previews[id] = text
			}
			// The previews that did arrive are answered even if the command then
			// failed: the rest stay pending and are asked for again.
			if err != nil && len(got) == 0 {
				return err
			}
			return nil
		})
		if err != nil {
			return err
		}
	}
	return ctx.JSON(http.StatusOK, map[string]interface{}{"Previews": previews, "Scope": scope, "Supported": supported})
}
