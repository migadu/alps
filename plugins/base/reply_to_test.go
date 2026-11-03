package alpsbase

import (
	"bytes"
	"net/http"
	"net/url"
	"strings"
	"testing"
)

func TestHTTP_ReplyToRejectsInvalidAddressesWithoutChangingSettings(t *testing.T) {
	s := newTestServer(t)
	s.login()
	for _, bad := range []string{"not an address", "a@example.com, b@example.com", "a@example.com\r\nBcc: other@example.com", strings.Repeat("x", 1025) + "@example.com"} {
		r := s.do("PUT", "/settings", map[string]any{"reply_to": bad})
		s.expect(r, http.StatusBadRequest)
		var answer map[string]any
		r.json(t, &answer)
		if answer["error"] != "invalid_reply_to" {
			t.Fatalf("unexpected validation code: %v", answer)
		}
		s.expect(s.do("POST", "/messages", url.Values{"to": {"valid@example.com"}, "text": {"hi"}, "reply_to": {bad}, "save_as_draft": {"1"}}), http.StatusBadRequest)
	}
	// Unrelated settings still save; a rejected value did not poison the record.
	s.expect(s.do("PUT", "/settings", map[string]any{"signature": "Kept"}), http.StatusOK)
}

func TestReplyToUsesAnEncodedAddressHeader(t *testing.T) {
	for _, value := range []string{"Ćirić <reply@example.com>", `"Lovelace, Ada" <reply@example.com>`, "reply@example.com"} {
		msg := outgoing()
		msg.ReplyTo = value
		header, _, raw := render(t, msg)
		addresses, err := header.AddressList("Reply-To")
		if err != nil || len(addresses) != 1 || addresses[0].Address != "reply@example.com" {
			t.Fatalf("Reply-To = %v, %v", addresses, err)
		}
		if strings.Contains(raw, "Ćirić") {
			t.Fatal("raw UTF-8 display name in the message")
		}
		if strings.Contains(value, "Ćirić") && addresses[0].Name != "Ćirić" {
			t.Fatalf("lost display name: %+v", addresses[0])
		}
	}
	for _, bad := range []string{"not an address", "a@example.com, b@example.com", "a@example.com\r\nBcc: other@example.com"} {
		msg := outgoing()
		msg.ReplyTo = bad
		if _, err := msg.WriteTo(&bytes.Buffer{}); err == nil {
			t.Errorf("wrote invalid Reply-To %q", bad)
		}
	}
}

func TestHTTP_ReplyToAcceptsANameAndCanBeCleared(t *testing.T) {
	s := newTestServer(t)
	s.login()
	for _, value := range []string{"Ćirić <reply@example.com>", `"Lovelace, Ada" <reply@example.com>`, "reply@example.com", ""} {
		s.expect(s.do("PUT", "/settings", map[string]any{"reply_to": value}), http.StatusOK)
	}
}
