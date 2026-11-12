package alps

import (
	"errors"
	"fmt"
	"testing"

	"github.com/migadu/alps/provider/providertest"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// closeRecordingPlugin implements Plugin itself, not through GoPlugin, whose
// Close does nothing, so that its Close can count its calls and fail.
type closeRecordingPlugin struct {
	name   string
	err    error
	closed int
}

func (p *closeRecordingPlugin) Name() string     { return p.name }
func (p *closeRecordingPlugin) SetRoutes(*Group) {}
func (p *closeRecordingPlugin) Close() error     { p.closed++; return p.err }

// errorRecordingLogger keeps the lines logged at error level.
type errorRecordingLogger struct {
	NilLogger
	errors []string
}

func (l *errorRecordingLogger) Errorf(format string, v ...interface{}) {
	l.errors = append(l.errors, fmt.Sprintf(format, v...))
}

// newServerWithPlugins starts a server, through New as cmd/alps does, whose
// only loader returns plugins.
func newServerWithPlugins(t *testing.T, logger Logger, plugins ...Plugin) *Server {
	t.Helper()
	saved := pluginLoaders
	pluginLoaders = []PluginLoaderFunc{func(*Server) ([]Plugin, error) {
		return plugins, nil
	}}
	t.Cleanup(func() { pluginLoaders = saved })

	s, err := New(logger, &Options{
		Provider: &providertest.MockOptions{},
		SMTP:     SMTPOptions{Server: "smtps://smtp.example.com"},
	})
	require.NoError(t, err)
	return s
}

// TestServerCloseClosesEachPlugin: plugins load once, at start-up, and are let
// go only at shutdown, so Server.Close is where a plugin that holds a
// connection or a goroutine gets to release it. A plugin whose Close fails is
// logged by name, and the plugins after it are closed all the same.
func TestServerCloseClosesEachPlugin(t *testing.T) {
	failing := &closeRecordingPlugin{name: "failing", err: errors.New("connection already gone")}
	other := &closeRecordingPlugin{name: "other"}
	logger := &errorRecordingLogger{}
	s := newServerWithPlugins(t, logger, failing, other)
	require.Equal(t, []string{"failing", "other"}, s.LoadedPluginNames())

	s.Close()

	assert.Equal(t, 1, failing.closed, "the plugin whose Close fails is closed")
	assert.Equal(t, 1, other.closed, "the plugin after it is closed too")
	assert.Equal(t, []string{`Closing plugin "failing": connection already gone`}, logger.errors)
}

// TestServerCloseClosesAPluginOnce: Server.Close may run twice, and every step
// before the plugins is safe to repeat. A plugin's Close need not be, so the
// second Server.Close leaves the plugins alone.
func TestServerCloseClosesAPluginOnce(t *testing.T) {
	p := &closeRecordingPlugin{name: "once"}
	s := newServerWithPlugins(t, &NilLogger{}, p)

	s.Close()
	s.Close()

	assert.Equal(t, 1, p.closed)
}
