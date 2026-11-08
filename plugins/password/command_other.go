//go:build !unix

package password

import "os/exec"

// Refuse the command backend at configuration time when process group
// cancellation is unavailable. The HTTP backend is still supported.
const commandSupported = false

func configureCommandCancellation(cmd *exec.Cmd) {}
