package managesieve

import (
	"fmt"
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
	"strings"
	"sync"
	"testing"
)

type fallbackLogger struct {
	alps.Logger
	mu       sync.Mutex
	refusals int
}

func (l *fallbackLogger) Printf(format string, args ...interface{}) {
	if strings.Contains(fmt.Sprintf(format, args...), "provider named an unusable server") {
		l.mu.Lock()
		l.refusals++
		l.mu.Unlock()
	}
}
func TestInvalidRouteLogsOnceAndCachesNilFallback(t *testing.T) {
	logger := &fallbackLogger{Logger: alps.NewLogger()}
	options := &alps.Options{Provider: routerStub{service: provider.ServiceManageSieve, user: "routed@example.com", url: "://broken"}}
	options.SMTP.Server = "smtp+insecure://localhost"
	srv, err := alps.New(logger, options)
	if err != nil {
		t.Fatal(err)
	}
	defer srv.Close()
	p := &plugin{srv: srv}
	var calls sync.WaitGroup
	for i := 0; i < 8; i++ {
		calls.Add(1)
		go func() {
			defer calls.Done()
			if u := p.endpointFor("routed@example.com").url; u != nil {
				t.Errorf("fallback = %v, want nil", u)
			}
		}()
	}
	calls.Wait()
	logger.mu.Lock()
	defer logger.mu.Unlock()
	if logger.refusals != 1 {
		t.Errorf("logged unusable endpoint %d times, want once", logger.refusals)
	}
}
