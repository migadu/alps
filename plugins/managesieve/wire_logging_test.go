package managesieve

import (
	"encoding/base64"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/migadu/alps"
	"github.com/migadu/alps/provider/maildir"
)

func TestManageSieveWireLogsFollowConfiguredLoggerAndRotation(t *testing.T) {
	base := t.TempDir()
	passwordFile := filepath.Join(base, "passwd")
	if err := os.WriteFile(passwordFile, []byte(testUser+":{PLAIN}"+testPassword+"\n"), 0600); err != nil {
		t.Fatal(err)
	}
	store := maildir.NewProvider(filepath.Join(base, testUser), testUser)
	if err := store.CreateMailbox("INBOX"); err != nil {
		t.Fatal(err)
	}
	options, err := (&maildir.Config{Path: filepath.Join(base, "%u"), AuthPasswdFile: passwordFile}).ToOptions()
	if err != nil {
		t.Fatal(err)
	}
	logPath := filepath.Join(base, "alps.log")
	logger := alps.NewLoggerWithOptions(alps.LoggerOptions{Output: logPath, Format: "json", Level: "debug"})
	server, err := alps.New(logger, &alps.Options{Provider: options, SMTP: alps.SMTPOptions{Server: "smtps://smtp.example.test"}, EnabledPlugins: []string{"base"}, Debug: true})
	if err != nil {
		t.Fatal(err)
	}
	defer server.Close()
	session, err := server.Sessions.Put(testUser, testPassword)
	if err != nil {
		t.Fatal(err)
	}
	endpoint, err := parseSieveURL("managesieve+insecure://" + fakeSieve(t, "fileinto", "wire-active", "keep;"))
	if err != nil {
		t.Fatal(err)
	}
	p := &plugin{srv: server, url: endpoint.url, insecure: endpoint.insecure}
	exchange := func() {
		t.Helper()
		client, err := p.connectClient(&alps.Context{Server: server, Session: session})
		if err != nil {
			t.Fatal(err)
		}
		defer client.Close()
		if _, err := client.ListScripts(); err != nil {
			t.Fatal(err)
		}
	}
	check := func() {
		t.Helper()
		data, err := os.ReadFile(logPath)
		if err != nil {
			t.Fatal(err)
		}
		text := string(data)
		if !strings.Contains(text, "LISTSCRIPTS") || !strings.Contains(text, "wire-active") || !strings.Contains(text, "[REDACTED]") {
			t.Errorf("missing configured ManageSieve traces: %s", text)
		}
		credential := base64.StdEncoding.EncodeToString([]byte("\x00" + testUser + "\x00" + testPassword))
		if strings.Contains(text, testPassword) || strings.Contains(text, credential) {
			t.Errorf("SASL password leaked: %s", text)
		}
	}
	exchange()
	check()
	if err := os.Rename(logPath, logPath+".old"); err != nil {
		t.Fatal(err)
	}
	if ok, err := logger.Reopen(); !ok || err != nil {
		t.Fatalf("reopen: %v %v", ok, err)
	}
	exchange()
	check()
}
