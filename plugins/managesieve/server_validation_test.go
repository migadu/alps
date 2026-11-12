package managesieve

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"testing"
)

func TestServerSupportedExtensionCanBeSavedAndValidated(t *testing.T) {
	account := &sieveAccount{}
	client, base := signedIn(t, account.listen(t))
	script := "require [\"include\"];\ninclude \"common\";\n"
	saveFilters(t, client, base, script)
	scripts, active := account.held()
	if scripts[active] != script {
		t.Fatal("script not saved and activated")
	}
	checkScriptHTTP(t, client, base, script, http.StatusOK, "")
	account.mu.Lock()
	defer account.mu.Unlock()
	if account.checked != 1 {
		t.Fatal("validation did not ask server with CHECKSCRIPT")
	}
}
func checkScriptHTTP(t *testing.T, client *http.Client, base, script string, status int, diagnostic string) {
	t.Helper()
	data, _ := json.Marshal(ScriptPayload{Content: script})
	req, _ := http.NewRequest("POST", base+"/managesieve/validate", bytes.NewReader(data))
	req.Header.Set("Origin", base)
	req.Header.Set("Content-Type", "application/json")
	res, err := client.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	if res.StatusCode != status || !strings.Contains(string(body), diagnostic) {
		t.Fatalf("status %d: %s", res.StatusCode, body)
	}
}
func TestServerScriptRefusalIsAValidationDiagnostic(t *testing.T) {
	account := &sieveAccount{validationErr: "line 2: unknown action"}
	client, base := signedIn(t, account.listen(t))
	checkScriptHTTP(t, client, base, "require [\"include\"];\nbad;", http.StatusBadRequest, "line 2: unknown action")
}

func TestCheckScriptSendsTheFullLiteral(t *testing.T) {
	content := "require [\"include\"];\ninclude \"common\";\n"
	got := commandSent(t, func(c *MSClient) {
		if err := c.CheckScript(content); err != nil {
			t.Error(err)
		}
	})
	want := fmt.Sprintf("CHECKSCRIPT {%d+}\r\n%s\r\n", len(content), content)
	if got != want {
		t.Fatalf("sent %q, want %q", got, want)
	}
}
func TestUploadRefusalKeepsThePreviousScriptActive(t *testing.T) {
	account := &sieveAccount{validationErr: "line 2: rejected action"}
	account.store("active", "keep;")
	account.active = "active"
	client, base := signedIn(t, account.listen(t))
	data, _ := json.Marshal(ScriptPayload{Content: "require [\"include\"];\nbad;"})
	req, _ := http.NewRequest("PUT", base+"/managesieve/script", bytes.NewReader(data))
	req.Header.Set("Origin", base)
	req.Header.Set("Content-Type", "application/json")
	res, err := client.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	if res.StatusCode != http.StatusBadRequest || !strings.Contains(string(body), "line 2: rejected action") {
		t.Fatalf("status %d: %s", res.StatusCode, body)
	}
	scripts, active := account.held()
	if active != "active" || scripts[active] != "keep;" {
		t.Fatal("rejected upload changed active script")
	}
}
