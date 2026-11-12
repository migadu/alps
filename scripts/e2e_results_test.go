package scripts_test

import (
	"bytes"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func TestE2ESetupPreservesLastFailedRecord(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("Bash harness")
	}
	source, err := os.ReadFile("e2e.sh")
	if err != nil {
		t.Fatal(err)
	}
	stop := bytes.Index(source, []byte("\n# The build is the one step"))
	if stop < 0 {
		t.Fatal("setup boundary missing")
	}
	for _, tc := range []struct {
		name, logs, results string
		missing             bool
	}{
		{name: "default results"},
		{name: "relative log directory", logs: "logs"},
		{name: "custom nested results", results: "../logs/custom-results"},
		{name: "custom external results", results: "external-results"},
		{name: "missing previous run", missing: true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			root := t.TempDir()
			bin := filepath.Join(root, "bin")
			for _, dir := range []string{bin, filepath.Join(root, "scripts"), filepath.Join(root, "frontend"), filepath.Join(root, "sora/cmd/sora")} {
				if err := os.MkdirAll(dir, 0700); err != nil {
					t.Fatal(err)
				}
			}
			os.WriteFile(filepath.Join(root, "sora/cmd/sora/main.go"), nil, 0600)
			for _, tool := range []string{"go", "npm", "psql", "curl", "lsof"} {
				status := "0"
				if tool == "lsof" {
					status = "1"
				}
				if err := os.WriteFile(filepath.Join(bin, tool), []byte("#!/bin/sh\nexit "+status+"\n"), 0700); err != nil {
					t.Fatal(err)
				}
			}
			script := filepath.Join(root, "scripts/e2e.sh")
			if err := os.WriteFile(script, source[:stop], 0700); err != nil {
				t.Fatal(err)
			}
			logs := filepath.Join(root, "logs")
			logEnv := logs
			if tc.logs != "" {
				logEnv = tc.logs
			}
			results := filepath.Join(logs, "test-results")
			if tc.results != "" {
				results = filepath.Clean(filepath.Join(root, "frontend", tc.results))
			}
			os.MkdirAll(results, 0700)
			os.MkdirAll(logs, 0700)
			record := []byte("{\"status\":\"failed\",\"failedTests\":[\"sample-failure-id\"]}\n")
			if !tc.missing {
				if err := os.WriteFile(filepath.Join(results, ".last-run.json"), record, 0600); err != nil {
					t.Fatal(err)
				}
			}
			stale := filepath.Join(logs, "old-build.log")
			os.WriteFile(stale, []byte("old"), 0600)
			cmd := exec.Command("bash", script, "--last-failed")
			cmd.Dir = root
			cmd.Env = append(os.Environ(), "PATH="+bin+string(os.PathListSeparator)+os.Getenv("PATH"), "SORA_DIR="+filepath.Join(root, "sora"), "E2E_PORT=29800", "E2E_STATE="+filepath.Join(root, "state"), "E2E_LOGS="+logEnv, "E2E_KEEP_STATE=1", "E2E_RESULTS="+tc.results)
			output, err := cmd.CombinedOutput()
			if tc.missing {
				if err == nil || !strings.Contains(string(output), "--last-failed") {
					t.Fatalf("missing previous record should fail clearly: %v\n%s", err, output)
				}
				return
			}
			if err != nil {
				t.Fatalf("setup: %v\n%s", err, output)
			}
			got, err := os.ReadFile(filepath.Join(results, ".last-run.json"))
			if err != nil || !bytes.Equal(got, record) {
				t.Errorf("last-failed record lost during cleanup: %q %v", got, err)
			}
			if _, err := os.Stat(stale); !os.IsNotExist(err) {
				t.Errorf("old logs were not cleaned: %v", err)
			}
		})
	}
}
