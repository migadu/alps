//go:build windows || plan9

package alps

import (
	"errors"
	"io"
)

func newSyslogWriter() (io.WriteCloser, error) {
	return nil, errors.New("syslog is not supported on this platform")
}
