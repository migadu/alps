package multi

import (
	"context"
	"errors"
	"net"
	"strings"
	"testing"
	"time"
)

func TestDynamicRoutingDistinguishesDNSFailureFromRestriction(t *testing.T) {
	saved := net.DefaultResolver
	net.DefaultResolver = &net.Resolver{PreferGo: true, Dial: func(context.Context, string, string) (net.Conn, error) {
		return nil, errors.New("fixture nameserver unavailable")
	}}
	t.Cleanup(func() { net.DefaultResolver = saved })
	for _, tc := range []struct{ template, message string }{
		{"imaps://mail.%d", "cannot resolve server address"},
		{"imaps://127.0.0.1", "access to restricted server address"},
	} {
		f := (&Options{Template: tc.template, TemplateDomains: []string{"*"}}).CreateFactory(time.Second, false)
		_, err := f("tom@tmpl.test", "pass")
		if err == nil || !strings.Contains(err.Error(), tc.message) {
			t.Errorf("%q: %v, want %q", tc.template, err, tc.message)
		}
		if tc.template == "imaps://mail.%d" {
			var dns *net.DNSError
			if !errors.As(err, &dns) || strings.Contains(err.Error(), "forbidden") {
				t.Errorf("DNS cause lost or misclassified: %v", err)
			}
		}
	}
}
