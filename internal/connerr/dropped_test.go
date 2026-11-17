package connerr

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net"
	"os"
	"syscall"
	"testing"
)

func TestIsDropped(t *testing.T) {
	for _, tc := range []struct {
		name string
		err  error
		want bool
	}{
		{"EOF", io.EOF, true},
		{"unexpected EOF", io.ErrUnexpectedEOF, true},
		{"closed connection", net.ErrClosed, true},
		{"reset", syscall.ECONNRESET, true},
		{"broken pipe", syscall.EPIPE, true},
		{"read deadline", os.ErrDeadlineExceeded, false},
		{"context deadline", context.DeadlineExceeded, false},
		{"context cancellation", context.Canceled, false},
		{"timeout", syscall.ETIMEDOUT, false},
		{"connection refused", syscall.ECONNREFUSED, false},
		{"protocol response", errors.New(`NO "server busy"`), false},
		{"reset text", errors.New("connection reset by peer"), false},
	} {
		t.Run(tc.name, func(t *testing.T) {
			for _, form := range []struct {
				name string
				err  error
			}{
				{"raw", tc.err},
				{"wrapped", fmt.Errorf("read: %w", tc.err)},
				{"network syscall", &net.OpError{Op: "read", Net: "tcp", Err: os.NewSyscallError("read", tc.err)}},
				{"joined", errors.Join(errors.New("other error"), tc.err)},
			} {
				t.Run(form.name, func(t *testing.T) {
					if got := IsDropped(form.err); got != tc.want {
						t.Errorf("IsDropped = %v, want %v", got, tc.want)
					}
				})
			}
		})
	}
	if IsDropped(nil) {
		t.Error("IsDropped(nil) = true")
	}
}
