package alpsbase

import (
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

// maxVerdictUIDs bounds one verdicts request; the frontend asks in chunks.
const maxVerdictUIDs = 200

type authVerdictJSON struct {
	HasBimiPotential bool
	HasBimiFailed    bool
}

// handleAuthVerdicts answers the authentication verdicts of messages a listing
// carried none for: the earlier messages of a thread, which the list leaves
// out because a server reads the header from each stored message. The
// frontend asks when a thread is expanded.
//
// GET /mailboxes/{mbox}/verdicts?uids=1,2 answers {"Verdicts": {"1": {...}},
// "Scope": "..."}. A UID the mailbox does not hold is left out, and a provider
// that cannot read verdicts answers none. The same UID under a different Scope
// is a different message.
func handleAuthVerdicts(ctx *alps.Context) error {
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
	if len(uids) > maxVerdictUIDs {
		return alps.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("at most %d uids per request", maxVerdictUIDs))
	}

	verdicts := map[string]authVerdictJSON{}
	scope := ""
	if len(uids) > 0 {
		err = ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
			vp, ok := p.(provider.AuthVerdictProvider)
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
			got, gotScope, err := vp.AuthVerdicts(mboxName, ids)
			if err != nil {
				return err
			}
			scope = gotScope
			for id, v := range got {
				verdicts[id] = authVerdictJSON{HasBimiPotential: v.BimiPotential, HasBimiFailed: v.BimiFailed}
			}
			return nil
		})
		if err != nil {
			return err
		}
	}
	return ctx.JSON(http.StatusOK, map[string]interface{}{"Verdicts": verdicts, "Scope": scope})
}
