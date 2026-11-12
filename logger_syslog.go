//go:build !windows && !plan9

package alps

import (
	"io"
	"log/syslog"
)

func newSyslogWriter() (io.WriteCloser, error) {
	return syslog.New(syslog.LOG_INFO|syslog.LOG_DAEMON, "alps")
}
