//go:build unix

package password

import (
	"errors"
	"os"
	"os/exec"
	"syscall"
)

const commandSupported = true

func configureCommandCancellation(cmd *exec.Cmd) {
	// A wrapper's children inherit its private process group. Cancel the group
	// so they cannot keep running after a request is cancelled or times out.
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
	cmd.Cancel = func() error {
		err := syscall.Kill(-cmd.Process.Pid, syscall.SIGKILL)
		if errors.Is(err, syscall.ESRCH) {
			return os.ErrProcessDone
		}
		return err
	}
}
