package alpscaldav

import (
	"net/url"
	"testing"
)

func TestResolveDAVPath(t *testing.T) {
	cases := []struct {
		name     string
		basePath string
		href     string
		want     string
	}{
		{"root base, absolute href", "/", "/dav/calendars/u/c/", "/dav/calendars/u/c/"},
		{"non-root base does not double-prefix", "/dav/", "/dav/calendars/u/c/", "/dav/calendars/u/c/"},
		// path.Join cleans the trailing slash; the handler re-adds it afterward.
		{"relative href joins onto base", "/dav/", "sub/c/", "/dav/sub/c"},
		{"full URL href uses its path", "/dav/", "https://dav.example.com/dav/calendars/u/c/", "/dav/calendars/u/c/"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			base := &url.URL{Scheme: "https", Host: "dav.example.com", Path: tc.basePath}
			if got := resolveDAVPath(base, tc.href); got != tc.want {
				t.Errorf("resolveDAVPath(%q, %q) = %q, want %q", tc.basePath, tc.href, got, tc.want)
			}
		})
	}
}

func TestXMLEscape(t *testing.T) {
	cases := map[string]string{
		"Me & You":                 "Me &amp; You",
		"<script>alert(1)</script>": "&lt;script&gt;alert(1)&lt;/script&gt;",
		"plain":                    "plain",
		`a"b`:                      "a&#34;b",
	}
	for in, want := range cases {
		if got := xmlEscape(in); got != want {
			t.Errorf("xmlEscape(%q) = %q, want %q", in, got, want)
		}
	}
}
