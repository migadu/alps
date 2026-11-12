package debuglog

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"strings"
	"testing"
)

func TestHTTPTraceRedactsHeadersAndHonorsLogLevel(t *testing.T) {
	for _, level := range []slog.Level{slog.LevelDebug, slog.LevelInfo} {
		var output bytes.Buffer
		logger := slog.New(slog.NewJSONHandler(&output, &slog.HandlerOptions{Level: level}))
		w := NewHTTPWriter(logger, "dav")
		data := []byte("GET / HTTP/1.1\r\nAuthorization: secret\r\nproxy-authorization: other\r\nCookie: private\r\nSet-Cookie: response-secret\r\n\r\nbody")
		if n, err := w.Write(data); n != len(data) || err != nil {
			t.Fatalf("Write = %d %v", n, err)
		}
		if level == slog.LevelInfo {
			if output.Len() != 0 {
				t.Errorf("debug trace ignored level: %s", &output)
			}
			continue
		}
		var row struct{ Protocol, Data string }
		if err := json.Unmarshal(output.Bytes(), &row); err != nil {
			t.Fatal(err)
		}
		if row.Protocol != "dav" || !strings.Contains(row.Data, "body") || strings.Count(row.Data, "[REDACTED]") != 4 {
			t.Errorf("trace = %+v", row)
		}
		for _, secret := range []string{"secret", "other", "private"} {
			if strings.Contains(row.Data, secret) {
				t.Errorf("trace leaks %s: %s", secret, row.Data)
			}
		}
	}
}
