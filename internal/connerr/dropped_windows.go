package connerr

import (
	"errors"
	"syscall"
)

func platformDropped(err error) bool {
	// Windows network I/O returns native codes, distinct from ECONNRESET.
	return errors.Is(err, syscall.WSAECONNRESET) || errors.Is(err, syscall.ERROR_NETNAME_DELETED)
}
