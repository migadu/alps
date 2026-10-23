package managesieve

import (
	"errors"
	"fmt"
	"io"
	"strings"
	"testing"
	"time"
)

func quotedScriptLine(script string) string {
	return `"` + strings.NewReplacer(`\`, `\\`, `"`, `\"`).Replace(script) + "\"\r\n"
}

// A quoted script and the same literal have the same decoded limit. Its
// wire form can need two bytes for every quote or backslash, plus framing.
func TestGetScriptAcceptsQuotedContentAtTheBodyLimit(t *testing.T) {
	for _, tc := range []struct{ name, script string }{
		{"plain", strings.Repeat("x", maxLiteralBytes)},
		{"backslash comment", "/*" + strings.Repeat(`\`, maxLiteralBytes-4) + "*/"},
		{"quote comment", "/*" + strings.Repeat(`"`, maxLiteralBytes-4) + "*/"},
		{"UTF8", strings.Repeat("é", maxLiteralBytes/2)},
		{"maximum escaped wire form", strings.Repeat(`\`, maxLiteralBytes)},
	} {
		t.Run(tc.name, func(t *testing.T) {
			c, cleanup := newTestClient(t, quotedScriptLine(tc.script)+"OK\r\n")
			defer cleanup()
			got, err := c.GetScript("limits")
			if err != nil || got != tc.script {
				t.Fatalf("decoded bytes=%d err=%v, want %d bytes", len(got), err, len(tc.script))
			}
		})
	}
}

// Raising the wire-line bound must not raise the decoded or accumulated
// body bound. A refused body closes the connection, which is out of step.
func TestGetScriptRefusesDecodedQuotedContentPastTheLimit(t *testing.T) {
	half := strings.Repeat("x", maxLiteralBytes/2)
	full := strings.Repeat("x", maxLiteralBytes)
	for _, tc := range []struct{ name, response string }{
		{"quoted one byte over", quotedScriptLine(full+"x") + "OK\r\n"},
		{"quoted UTF8 over", quotedScriptLine(strings.Repeat("é", maxLiteralBytes/2+1)) + "OK\r\n"},
		{"quoted accumulated", quotedScriptLine(half) + quotedScriptLine(half) + quotedScriptLine("x") + "OK\r\n"},
		{"literal then quoted", fmt.Sprintf("{%d}\r\n%s\r\n", len(full), full) + quotedScriptLine("x") + "OK\r\n"},
		{"quoted then literal", quotedScriptLine(full[:len(full)-1]) + "{2}\r\nxx\r\nOK\r\n"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			c, cleanup := newTestClient(t, tc.response)
			defer cleanup()
			got, err := c.GetScript("limits")
			if err == nil || !strings.Contains(err.Error(), "script exceeds") {
				t.Fatalf("decoded bytes=%d err=%v, want decoded script limit", len(got), err)
			}
			c.conn.SetReadDeadline(time.Now().Add(50 * time.Millisecond))
			if _, err := c.conn.Read(make([]byte, 1)); !errors.Is(err, io.ErrClosedPipe) {
				t.Fatalf("connection left open: %v", err)
			}
		})
	}
}
