package alpscaldav

import (
	"github.com/migadu/alps"
	"testing"
)

func TestDAVURLRejectsUnusableEndpoints(t *testing.T) {
	for _, raw := range []string{"dav.example.com:8443", "localhost:5232", "127.0.0.1:5232", "ftp://dav.example", "carddavs://dav.example", "https:opaque", "https:///path"} {
		t.Run(raw, func(t *testing.T) {
			if u, err := parseCalDAVURL(raw); err == nil {
				t.Fatalf("accepted unusable endpoint %s: %v", raw, u)
			}
			srv := &alps.Server{Options: &alps.Options{Plugins: map[string]alps.PluginConfig{"caldav": {Server: raw}}}}
			if _, err := newPlugin(srv); err == nil {
				t.Fatal("startup accepted unusable endpoint")
			}
		})
	}
	for _, raw := range []string{"https://dav.example/path", "http://dav.example:5232", "caldavs://dav.example", "caldav+insecure://dav.example", "http+insecure://dav.example"} {
		if u, err := parseCalDAVURL(raw); err != nil || (u.Scheme != "https" && u.Scheme != "http") {
			t.Errorf("valid endpoint %s: %v, %v", raw, u, err)
		}
	}
}
