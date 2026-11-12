package imap

import (
	"bytes"
	"log/slog"
	"strings"
	"testing"
)

func TestProviderDebugMessagesUseConfiguredHandlerAndLevel(t *testing.T) {
	previous := slog.Default()
	defer slog.SetDefault(previous)
	for _, level := range []slog.Level{slog.LevelDebug, slog.LevelInfo} {
		t.Run(level.String(), func(t *testing.T) {
			var output bytes.Buffer
			slog.SetDefault(slog.New(slog.NewJSONHandler(&output, &slog.HandlerOptions{Level: level})))
			p := &IMAPProvider{debug: true}
			p.convertIMAPMessage(authResultsFetch("mx.example.test; bimi=pass"), "INBOX")
			got := output.String()
			if level == slog.LevelDebug {
				if !strings.Contains(got, `"level":"DEBUG"`) || !strings.Contains(got, `"msg":"BIMI: Authentication-Results"`) {
					t.Errorf("debug log did not reach configured JSON handler: %q", got)
				}
			} else if got != "" {
				t.Errorf("info level leaked debug log: %q", got)
			}
		})
	}
}
