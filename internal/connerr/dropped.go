// Package connerr classifies connection errors shared by protocol clients.
package connerr

import (
	"errors"
	"io"
	"net"
	"syscall"
)

// IsDropped reports whether err describes a closed or reset connection.
// It does not classify timeouts, cancellation, or protocol responses as drops.
func IsDropped(err error) bool {
	return errors.Is(err, io.EOF) || errors.Is(err, io.ErrUnexpectedEOF) ||
		errors.Is(err, net.ErrClosed) || errors.Is(err, syscall.ECONNRESET) ||
		errors.Is(err, syscall.EPIPE) || platformDropped(err)
}
