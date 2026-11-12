package alpscarddav

import (
	"github.com/migadu/alps"
	"testing"
)

func TestDAVURLRejectsUnusableEndpoints(t *testing.T) {
	for _, raw := range []string{"dav.example.com:8443", "localhost:5232", "127.0.0.1:5232", "ftp://dav.example", "caldavs://dav.example", "https:opaque", "https:///path"} {
		t.Run(raw, func(t *testing.T) {
			if u, err := parseCardDAVURL(raw); err == nil {
				t.Fatalf("accepted unusable endpoint %s: %v", raw, u)
			}
			srv := &alps.Server{Options: &alps.Options{Plugins: map[string]alps.PluginConfig{"carddav": {Server: raw}}}}
			if _, err := newPlugin(srv); err == nil {
				t.Fatal("startup accepted unusable endpoint")
			}
		})
	}
	for _, raw := range []string{"https://dav.example/path", "http://dav.example:5232", "carddavs://dav.example", "carddav+insecure://dav.example", "http+insecure://dav.example"} {
		if u, err := parseCardDAVURL(raw); err != nil || (u.Scheme != "https" && u.Scheme != "http") {
			t.Errorf("valid endpoint %s: %v, %v", raw, u, err)
		}
	}
}
