package alpscarddav

import "testing"

func TestRequireObjectPath(t *testing.T) {
	const book = "/dav/addressbooks/user/default/"

	ok := []struct{ in, want string }{
		{"/dav/addressbooks/user/default/abc.vcf", "/dav/addressbooks/user/default/abc.vcf"},
		{"dav/addressbooks/user/default/abc.vcf", "/dav/addressbooks/user/default/abc.vcf"},
		{"/dav/addressbooks/user/default/sub/abc.vcf", "/dav/addressbooks/user/default/sub/abc.vcf"},
	}
	for _, c := range ok {
		got, err := requireObjectPath(c.in, book)
		if err != nil {
			t.Errorf("%q should be accepted: %v", c.in, err)
		} else if got != c.want {
			t.Errorf("%q → %q, want %q", c.in, got, c.want)
		}
	}

	bad := []string{
		"",
		// The collection itself: RemoveAll on this deletes every contact in it.
		"/dav/addressbooks/user/default/",
		"/dav/addressbooks/user/default",
		// Dot segments that climb out, including ones that come back to a
		// sibling collection and would pass a naive prefix test.
		"/dav/addressbooks/user/default/../other/abc.vcf",
		"/dav/addressbooks/user/other/abc.vcf",
		"/dav/addressbooks/user/default/../../../etc/passwd",
		// A sibling that merely shares the prefix string.
		"/dav/addressbooks/user/default-backup/abc.vcf",
	}
	for _, in := range bad {
		if got, err := requireObjectPath(in, book); err == nil {
			t.Errorf("%q should be refused, got %q", in, got)
		}
	}

	// No collection resolved: refuse rather than fall open.
	if _, err := requireObjectPath("/anything.vcf", ""); err == nil {
		t.Error("an unresolved address book should refuse, not allow")
	}
}
