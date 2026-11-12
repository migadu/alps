package managesieve

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"testing"
)

const includedScript = "require [\"include\"];\ninclude \"common\";\n"

func scriptRequest(t *testing.T, client *http.Client, base, method, script string) (int, string) {
	t.Helper()
	path := "/managesieve/script"
	if method == "POST" {
		path = "/managesieve/validate"
	}
	data, _ := json.Marshal(ScriptPayload{Content: script})
	req, _ := http.NewRequest(method, base+path, bytes.NewReader(data))
	req.Header.Set("Origin", base)
	req.Header.Set("Content-Type", "application/json")
	res, err := client.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	raw, _ := io.ReadAll(res.Body)
	var body struct{ Error string }
	if err := json.Unmarshal(raw, &body); err != nil {
		t.Fatalf("bad response %s: %v", raw, err)
	}
	return res.StatusCode, body.Error
}
func TestScriptRefusalDisplaysOnlyItsCompleteMessage(t *testing.T) {
	for _, method := range []string{"PUT", "POST"} {
		for _, literal := range []bool{false, true} {
			t.Run(method+map[bool]string{true: "/literal", false: "/quoted"}[literal], func(t *testing.T) {
				message := "line 2: error: unknown command 'bad'"
				if literal {
					message += "\r\nline 3: error: another diagnostic"
				}
				account := &sieveAccount{validationErr: message, validationLiteral: literal, validationCode: "WARNINGS"}
				client, base := signedIn(t, account.listen(t))
				status, got := scriptRequest(t, client, base, method, includedScript)
				if status != http.StatusBadRequest || got != "Invalid Sieve script: "+message {
					t.Fatalf("status=%d message=%q", status, got)
				}
			})
		}
	}
}
func TestScriptValidationFallsBackLocallyWithoutVersion(t *testing.T) {
	account := &sieveAccount{legacy: true}
	client, base := signedIn(t, account.listen(t))
	status, msg := scriptRequest(t, client, base, "POST", "keep;")
	if status != http.StatusOK {
		t.Fatalf("legacy validation status=%d: %s", status, msg)
	}
	status, msg = scriptRequest(t, client, base, "POST", "bad;")
	if status != http.StatusBadRequest || !strings.Contains(msg, "unsupported command: bad") {
		t.Fatalf("local diagnostic status=%d: %s", status, msg)
	}
	account.mu.Lock()
	defer account.mu.Unlock()
	if account.checked != 0 {
		t.Fatalf("sent CHECKSCRIPT %d times without VERSION", account.checked)
	}
}
func TestKnownScriptErrorsStayLocalAndOnlyAdvertisedUnknownExtensionsAreDeferred(t *testing.T) {
	account := &sieveAccount{}
	client, base := signedIn(t, account.listen(t))
	for _, script := range []string{"bad;", "require [\"not-advertised\"];"} {
		status, msg := scriptRequest(t, client, base, "PUT", script)
		if status != http.StatusBadRequest || !strings.HasPrefix(msg, "Invalid Sieve script:") {
			t.Fatalf("status=%d message=%q", status, msg)
		}
	}
	account.mu.Lock()
	uploads := account.uploaded
	account.mu.Unlock()
	if uploads != 0 {
		t.Fatalf("uploaded %d locally invalid scripts", uploads)
	}
	saveFilters(t, client, base, includedScript)
}
func TestTryLaterIsUnavailableRatherThanAnInvalidScript(t *testing.T) {
	for _, method := range []string{"PUT", "POST"} {
		t.Run(method, func(t *testing.T) {
			account := &sieveAccount{validationErr: "Service temporarily unavailable", validationCode: "TRYLATER"}
			client, base := signedIn(t, account.listen(t))
			status, message := scriptRequest(t, client, base, method, includedScript)
			if status != http.StatusInternalServerError || message != "sieve_unavailable" {
				t.Fatalf("status=%d message=%q", status, message)
			}
		})
	}
}
