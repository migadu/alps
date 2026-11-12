package managesieve

import (
	"fmt"
	"strings"
	"testing"
)

func TestResponseStatusConsumesLiteralMessage(t *testing.T) {
	message := "line 2: compiler diagnostic\r\nNO \"this is literal content\""
	for _, status := range []string{"NO", "BYE"} {
		t.Run(status, func(t *testing.T) {
			c, cleanup := newTestClient(t, fmt.Sprintf("%s {%d}\r\n%s\r\nOK\r\n", status, len(message), message))
			defer cleanup()
			if err := c.readResponse(); err == nil || !strings.Contains(err.Error(), message) {
				t.Fatalf("diagnostic not consumed: %v", err)
			}
			if err := c.readResponse(); err != nil {
				t.Fatalf("literal left the next response out of step: %v", err)
			}
		})
	}
}

func TestPutScriptWarningLiteralDoesNotCorruptSetActive(t *testing.T) {
	message := "NO \"this line is warning text, not the next response\"\r\nA second warning"
	c, cleanup := newTestClient(t, fmt.Sprintf("OK (WARNINGS) {%d}\r\n%s\r\nOK \"activated\"\r\n", len(message), message))
	defer cleanup()
	if err := c.PutScript("main", "keep;"); err != nil {
		t.Fatal(err)
	}
	if err := c.SetActive("main"); err != nil {
		t.Fatalf("warning corrupted activation response: %v", err)
	}
}

func TestSuccessStatusRejectsOversizedLiteral(t *testing.T) {
	c, cleanup := newTestClient(t, fmt.Sprintf("OK (WARNINGS) {%d}\r\n", maxLiteralBytes+1))
	defer cleanup()
	if err := c.readResponse(); err == nil {
		t.Fatal("accepted oversized warning literal")
	}
}
