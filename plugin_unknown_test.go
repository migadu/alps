package alps

import (
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/migadu/alps/provider"
)

type pluginWarningLogger struct {
	NilLogger
	warnings []string
}

func (l *pluginWarningLogger) Warnf(format string, args ...interface{}) {
	l.warnings = append(l.warnings, fmt.Sprintf(format, args...))
}

type pluginWarningOptions struct{}

func (pluginWarningOptions) Type() string { return "plugin-warning-test" }
func (pluginWarningOptions) CreateFactory(time.Duration, bool) provider.AuthenticatedProviderFactory {
	return nil
}

func TestStartupWarnsForEnabledPluginThatDidNotLoad(t *testing.T) {
	old := pluginLoaders
	t.Cleanup(func() { pluginLoaders = old })
	base, gpg := GoPlugin{Name: "base"}, GoPlugin{Name: "gpg"}
	pluginLoaders = []PluginLoaderFunc{base.Loader(), gpg.Loader()}
	for _, tc := range []struct {
		name     string
		enabled  []string
		warnings int
	}{
		{"misspelled", []string{"carddv"}, 1},
		{"case mismatch", []string{"GPG"}, 1},
		{"known", []string{"gpg"}, 0},
		{"defaults", nil, 0},
		{"duplicate", []string{"missing", "missing"}, 1},
	} {
		t.Run(tc.name, func(t *testing.T) {
			logger := &pluginWarningLogger{}
			server, err := New(logger, &Options{Provider: pluginWarningOptions{}, SMTP: SMTPOptions{Server: "smtps://smtp.example.test"}, EnabledPlugins: tc.enabled})
			if err != nil {
				t.Fatal(err)
			}
			defer server.Close()
			if len(logger.warnings) != tc.warnings {
				t.Fatalf("warnings=%q want%d; loaded=%v", logger.warnings, tc.warnings, server.LoadedPluginNames())
			}
			for _, line := range logger.warnings {
				if !strings.Contains(line, tc.enabled[0]) {
					t.Errorf("warning did not identify configured name: %q", line)
				}
			}
		})
	}
}
