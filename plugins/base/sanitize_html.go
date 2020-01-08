package koushinbase

import (
	"github.com/microcosm-cc/bluemonday"
)

func sanitizeHTML(b []byte) []byte {
	p := bluemonday.UGCPolicy()

	// TODO: be more strict
	p.AllowElements("style")
	p.AllowAttrs("style")

	p.AddTargetBlankToFullyQualifiedLinks(true)
	p.RequireNoFollowOnLinks(true)

	return p.SanitizeBytes(b)
}
