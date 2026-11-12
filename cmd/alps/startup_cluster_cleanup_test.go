package main

import (
	"fmt"
	"io"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"

	"github.com/hashicorp/memberlist"
)

type startupEvents struct{ joined, left chan string }

func (e startupEvents) NotifyJoin(n *memberlist.Node) {
	select {
	case e.joined <- n.Name:
	default:
	}
}
func (e startupEvents) NotifyLeave(n *memberlist.Node) {
	select {
	case e.left <- n.Name:
	default:
	}
}
func (startupEvents) NotifyUpdate(*memberlist.Node) {}

func TestStartupFailureLeavesClusterBeforeExiting(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("separate-process cluster fixture")
	}
	binary := filepath.Join(t.TempDir(), "alps")
	if out, err := exec.Command("go", "build", "-o", binary, ".").CombinedOutput(); err != nil {
		t.Fatalf("build: %v\n%s", err, out)
	}
	t.Run("invalid clustered TLS", func(t *testing.T) {
		testStartupFailureLeavesCluster(t, binary, "127.0.0.1:0", `[tls]
enabled=true
provider="letsencrypt"
[tls.letsencrypt]
storage_provider="file"
`, "storage_provider")
	})
	t.Run("listener failure", func(t *testing.T) {
		occupied, err := net.Listen("tcp", "127.0.0.1:0")
		if err != nil {
			t.Fatal(err)
		}
		defer occupied.Close()
		testStartupFailureLeavesCluster(t, binary, occupied.Addr().String(), "", "address already in use")
	})
}

func testStartupFailureLeavesCluster(t *testing.T, binary, serverAddr, tlsBlock, wantError string) {
	t.Helper()
	events := startupEvents{make(chan string, 10), make(chan string, 10)}
	seedCfg := memberlist.DefaultLocalConfig()
	seedCfg.Name = "z-seed"
	seedCfg.BindAddr = "127.0.0.1"
	seedCfg.BindPort = 0
	seedCfg.AdvertisePort = 0
	seedCfg.Events = events
	seedCfg.LogOutput = io.Discard
	seed, err := memberlist.Create(seedCfg)
	if err != nil {
		t.Fatal(err)
	}
	defer seed.Shutdown()
	probe, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	childAddr := probe.Addr().String()
	probe.Close()
	dir := t.TempDir()
	logPath := filepath.Join(dir, "alps.log")
	cfg := fmt.Sprintf(`[server]
addr=%q
[logging]
output=%q
[smtp]
server="smtps://smtp.example.test"
[provider.imap]
server="imaps://imap.example.test"
[cluster]
enabled=true
allow_insecure=true
node_id="a-failing-startup"
bind=%q
peers=[%q]
%s
`, serverAddr, filepath.ToSlash(logPath), childAddr, seed.LocalNode().Address(), tlsBlock)
	configPath := filepath.Join(dir, "config.toml")
	if err := os.WriteFile(configPath, []byte(cfg), 0600); err != nil {
		t.Fatal(err)
	}
	cmd := exec.Command(binary, "-config", configPath)
	cmd.Env = append(os.Environ(), "CLUSTER_SECRET_KEY=")
	if out, err := cmd.CombinedOutput(); err == nil {
		t.Fatalf("invalid clustered TLS unexpectedly started: %s", out)
	}
	data, _ := os.ReadFile(logPath)
	if !strings.Contains(string(data), wantError) {
		t.Fatalf("did not reach intended startup failure: %s", data)
	}
	if !strings.Contains(string(data), "cluster started") {
		return
	} // Early validation is also safe.
	for deadline := time.After(1500 * time.Millisecond); ; {
		select {
		case name := <-events.left:
			if name == "a-failing-startup" {
				return
			}
		case <-deadline:
			t.Fatal("failed startup exited without gracefully leaving its joined cluster")
		}
	}
}
