package alpscarddav

import (
	"net/http"
	"path"
	"strings"

	"github.com/migadu/alps"
)

// requireObjectPath checks that a client-supplied DAV path names an OBJECT
// inside `collection`, and returns it cleaned.
//
// The path arrives from the browser, is decoded twice on the way in, and used to
// go straight to GetAddressObject / RemoveAll. The DAV server's own ACLs are the
// real boundary — the client authenticates as the signed-in user — but this
// endpoint should not be a general instrument for addressing whatever that user
// can reach, for two reasons:
//
//   - `RemoveAll` removes a resource AND ITS CHILDREN. Point the "delete one
//     contact" route at the address-book collection itself and it deletes every
//     contact in it. Nothing here stopped that.
//   - Dot segments. `path.Clean` resolves `..` before the comparison, so a path
//     that climbs out of the collection and back down cannot masquerade as one
//     inside it.
//
// The collection itself is rejected: every caller of this is addressing one
// object.
func requireObjectPath(raw, collection string) (string, error) {
	if raw == "" {
		return "", alps.NewHTTPError(http.StatusBadRequest, "missing object path")
	}

	cleaned := path.Clean("/" + strings.TrimPrefix(raw, "/"))
	base := path.Clean("/"+strings.TrimPrefix(collection, "/")) + "/"

	if collection == "" {
		// No collection resolved: refuse rather than guess. A guard that falls
		// open when it cannot answer is worse than none, because it reads as
		// one.
		return "", alps.NewHTTPError(http.StatusInternalServerError, "address book not resolved")
	}
	if !strings.HasPrefix(cleaned+"/", base) || cleaned+"/" == base {
		return "", alps.NewHTTPError(http.StatusForbidden, "path is outside the address book")
	}
	return cleaned, nil
}
