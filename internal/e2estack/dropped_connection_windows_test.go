package main

import (
	"context"
	"errors"
	"fmt"
	"net"
	"os"
	"syscall"
	"testing"
)

func TestDroppedConnectionWindowsErrors(t *testing.T) {
	for _, tc := range []struct {
		name  string
		cause error
		want  bool
	}{
		{"WSAECONNRESET", syscall.WSAECONNRESET, true},
		{"ERROR_NETNAME_DELETED", syscall.ERROR_NETNAME_DELETED, true},
		// syscall does not export these Winsock constants. Their native
		// values are WSAETIMEDOUT (10060) and WSAECONNREFUSED (10061).
		{"WSAETIMEDOUT", syscall.Errno(10060), false},
		{"WSAECONNREFUSED", syscall.Errno(10061), false},
		{"ERROR_OPERATION_ABORTED", syscall.ERROR_OPERATION_ABORTED, false},
		{"read deadline", os.ErrDeadlineExceeded, false},
		{"context deadline", context.DeadlineExceeded, false},
		{"context cancellation", context.Canceled, false},
		{"protocol NO", errors.New(`NO "NOOP not supported"`), false},
		{"protocol BYE", errors.New(`BYE "session ended"`), false},
		{"protocol parsing", errors.New("unclosed ManageSieve response code"), false},
	} {
		t.Run(tc.name, func(t *testing.T) {
			for _, form := range []struct {
				name string
				err  error
			}{
				{"raw", tc.cause},
				{"wrapped", fmt.Errorf("sieve read: %w", tc.cause)},
				{"network syscall", &net.OpError{
					Op: "read", Net: "tcp",
					Err: os.NewSyscallError("wsarecv", tc.cause),
				}},
			} {
				t.Run(form.name, func(t *testing.T) {
					if got := droppedConnection(form.err); got != tc.want {
						t.Errorf("droppedConnection = %v, want %v", got, tc.want)
					}
				})
			}
		})
	}
}
