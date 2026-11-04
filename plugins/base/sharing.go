package alpsbase

import (
	"errors"
	"net/http"
	"net/mail"
	"net/url"
	"strings"

	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

// Sharing a folder with other people, over the mail server's access lists
// (IMAP ACL, RFC 4314):
//
//	GET    /mailboxes/{mbox}/sharing               the user's own rights, and who else has access
//	PUT    /mailboxes/{mbox}/sharing/{identifier}  {"level"}: give someone that level, or change theirs
//	DELETE /mailboxes/{mbox}/sharing/{identifier}  take their access away
//
// The identifier is the other person's email address, which is how a mail
// server names its users in an access list.

// shareLevel is an amount of access a folder is shared with: a name for the
// page, and the rights it stands for, in RFC 4314's letters.
type shareLevel struct {
	name   string
	rights string
}

// shareLevels are the levels a folder can be shared at, the least first.
//
// To read is to see the folder in the list (l), open it and read what is in
// it (r), and keep one's own read and unread marks (s).
//
// To organise adds flagging (w), filing messages into the folder (i), and
// deleting them from it (t, e). Moving a message out, to an archive or to the
// Trash, deletes it from this folder, so there is no organising without both.
//
// Full access adds sending to the folder (p), and making, renaming and
// deleting its subfolders and the folder itself (k, x).
//
// None of them gives the administer right (a). Who has access stays the
// owner's to decide: a person a folder is shared with does not share it on.
var shareLevels = []shareLevel{
	{"read_only", "lrs"},
	{"read_write", "lrswite"},
	{"full", "lrswipkxte"},
}

// shareLevelNamed is the level called name.
func shareLevelNamed(name string) (shareLevel, bool) {
	for _, level := range shareLevels {
		if level.name == name {
			return level, true
		}
	}
	return shareLevel{}, false
}

// shareLevelOf names the level rights stand for, or "" for rights that are
// none of them, given by another client. The letters are compared as sets.
// The virtual c and d of RFC 2086, which a server lists beside the rights
// they stand for (RFC 4314 §2.1.1), are left out of the comparison.
func shareLevelOf(rights string) string {
	held := rightSet(rights)
	for _, level := range shareLevels {
		if held == rightSet(level.rights) {
			return level.name
		}
	}
	return ""
}

// rightSet is the rights in rights, each once, in RFC 4314's order, the
// virtual ones left out.
func rightSet(rights string) string {
	var set strings.Builder
	for _, r := range imap.RightSetAll {
		if strings.ContainsRune(rights, rune(r)) {
			set.WriteByte(byte(r))
		}
	}
	return set.String()
}

// sharingAnswer is what GET /mailboxes/{mbox}/sharing answers.
type sharingAnswer struct {
	// Rights are the user's own.
	Rights string `json:"rights"`
	// Entries are the other people with access. The user's own entry, which
	// some servers list for the owner, is left out.
	Entries []sharingEntry `json:"entries"`
}

type sharingEntry struct {
	Identifier string `json:"identifier"`
	Rights     string `json:"rights"`
	// Level is the level the rights stand for, or "" for others.
	Level string `json:"level"`
}

// errNotSharing answers a request to share a folder where the mail server
// keeps no access lists.
var errNotSharing = errors.New("the mail server shares no folders")

// sharerOf is the provider as a FolderSharer, or errNotSharing.
func sharerOf(p provider.MailProvider) (provider.FolderSharer, error) {
	sharer, ok := p.(provider.FolderSharer)
	if !ok {
		return nil, errNotSharing
	}
	shares, err := sharer.SharesFolders()
	if err != nil {
		return nil, err
	}
	if !shares {
		return nil, errNotSharing
	}
	return sharer, nil
}

// isSelf reports whether identifier names the signed-in user.
func isSelf(ctx *alps.Context, identifier string) bool {
	return strings.EqualFold(identifier, ctx.Session.Username()) || strings.EqualFold(identifier, ctx.Session.Address())
}

// shareIdentifier checks that identifier is one person's email address, and
// nothing more: no name, no angle brackets, no group. An access list also
// takes "anyone", which is every user of the server, and identifiers that
// start with "-", which take rights away (RFC 4314 §2); neither is a person.
func shareIdentifier(identifier string) bool {
	if identifier == "" || len(identifier) > 254 || strings.HasPrefix(identifier, "-") {
		return false
	}
	addr, err := mail.ParseAddress(identifier)
	return err == nil && addr.Name == "" && addr.Address == identifier
}

// sharingTarget reads the folder and the identifier a request names in its
// path. ok is false once the request has been answered.
func sharingTarget(ctx *alps.Context) (mailbox, identifier string, ok bool, err error) {
	mailbox, err = url.PathUnescape(ctx.Param("mbox"))
	if err != nil {
		return "", "", false, ctx.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid mailbox name"})
	}
	identifier, err = url.PathUnescape(ctx.Param("identifier"))
	if err != nil || !shareIdentifier(identifier) {
		return "", "", false, ctx.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_identifier"})
	}
	if isSelf(ctx, identifier) {
		return "", "", false, ctx.JSON(http.StatusBadRequest, map[string]string{"error": "self"})
	}
	return mailbox, identifier, true, nil
}

// refusedWith reports whether err is the server's NO with code.
func refusedWith(err error, code imap.ResponseCode) bool {
	var refused *imap.Error
	return errors.As(err, &refused) && refused.Type == imap.StatusResponseTypeNo && refused.Code == code
}

// respondSharingError answers a failed sharing request.
//
// The server's refusals are mapped as the folder verbs map theirs, with three
// more. An identifier the server does not know is told apart from a folder
// that is gone, which the server answers alike ([NONEXISTENT]), by asking the
// folder's rights: unknown is the answer that the folder is there. A BAD is
// the server refusing the identifier or the rights as such, and a NO without
// a code is its refusal without a reason: both are the request's to change,
// not a failure to retry. Everything else, a sign-in that is gone and a
// server that cannot be reached among it, is the server handler's.
func respondSharingError(ctx *alps.Context, op string, err error, unknown bool) error {
	if errors.Is(err, errNotSharing) {
		return ctx.JSON(http.StatusNotImplemented, map[string]string{"error": "not_supported"})
	}
	var authErr provider.AuthError
	var refused *imap.Error
	if errors.As(err, &authErr) || errors.Is(err, alps.ErrMailProviderUnavailable) || !errors.As(err, &refused) {
		return respondMailboxError(ctx, op, err)
	}
	if unknown {
		ctx.Server.Logger().Printf("%s failed: %v", op, err)
		return ctx.JSON(http.StatusNotFound, map[string]string{"error": "unknown_identifier"})
	}
	if refused.Type == imap.StatusResponseTypeBad || (refused.Type == imap.StatusResponseTypeNo && refused.Code == "") {
		ctx.Server.Logger().Printf("%s failed: %v", op, err)
		return ctx.JSON(http.StatusUnprocessableEntity, map[string]string{"error": "refused"})
	}
	return respondMailboxError(ctx, op, err)
}

// handleGetSharing answers the user's own rights on the folder and, where
// they may administer it, who else has access (see sharingAnswer).
func handleGetSharing(ctx *alps.Context) error {
	mailbox, err := url.PathUnescape(ctx.Param("mbox"))
	if err != nil {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid mailbox name"})
	}
	var access *provider.FolderAccess
	err = ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
		sharer, err := sharerOf(p)
		if err != nil {
			return err
		}
		access, err = sharer.FolderAccess(mailbox)
		return err
	})
	if err != nil {
		return respondSharingError(ctx, "read the sharing of "+mailbox, err, false)
	}
	answer := sharingAnswer{Rights: access.Rights, Entries: []sharingEntry{}}
	for _, entry := range access.Entries {
		if isSelf(ctx, entry.Identifier) {
			continue
		}
		answer.Entries = append(answer.Entries, sharingEntry{Identifier: entry.Identifier, Rights: entry.Rights, Level: shareLevelOf(entry.Rights)})
	}
	return ctx.JSON(http.StatusOK, answer)
}

// handleShareMailbox gives the person the identifier names the level the
// request asks for, in place of any they had.
func handleShareMailbox(ctx *alps.Context) error {
	mailbox, identifier, ok, err := sharingTarget(ctx)
	if !ok {
		return err
	}
	var req struct {
		Level string `json:"level"`
	}
	if err := ctx.BindJSON(&req); err != nil {
		return ctx.RespondBindError(err)
	}
	level, ok := shareLevelNamed(req.Level)
	if !ok {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_level"})
	}
	var unknown bool
	err = ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
		unknown = false
		sharer, err := sharerOf(p)
		if err != nil {
			return err
		}
		err = sharer.GrantFolderAccess(mailbox, identifier, level.rights)
		unknown = unknownIdentifier(sharer, mailbox, err)
		return err
	})
	if err != nil {
		return respondSharingError(ctx, "share "+mailbox, err, unknown)
	}
	return ctx.JSON(http.StatusOK, map[string]string{"ok": "true"})
}

// handleUnshareMailbox takes every right the person the identifier names has
// on the folder away.
func handleUnshareMailbox(ctx *alps.Context) error {
	mailbox, identifier, ok, err := sharingTarget(ctx)
	if !ok {
		return err
	}
	var unknown bool
	err = ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
		unknown = false
		sharer, err := sharerOf(p)
		if err != nil {
			return err
		}
		err = sharer.RevokeFolderAccess(mailbox, identifier)
		unknown = unknownIdentifier(sharer, mailbox, err)
		return err
	})
	if err != nil {
		return respondSharingError(ctx, "unshare "+mailbox, err, unknown)
	}
	return ctx.JSON(http.StatusOK, map[string]string{"ok": "true"})
}

// unknownIdentifier reports whether err, the server's answer to a change of
// mailbox's access list, refused an identifier it does not know rather than
// a folder that is not there: see respondSharingError.
func unknownIdentifier(sharer provider.FolderSharer, mailbox string, err error) bool {
	if !refusedWith(err, imap.ResponseCodeNonExistent) {
		return false
	}
	_, gone := sharer.FolderRights(mailbox)
	return gone == nil
}
