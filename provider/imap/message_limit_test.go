package imap

import "testing"

func TestMessageSizeLimitReadsAdvertisedAppendLimit(t *testing.T) {
	for _, tc := range []struct {
		caps  string
		limit int64
	}{{"IMAP4rev1", 0}, {"IMAP4rev1 APPENDLIMIT", 0}, {"IMAP4rev1 APPENDLIMIT=26214400", 26214400}} {
		t.Run(tc.caps, func(t *testing.T) {
			p := scriptedProvider(t, &scriptedIMAP{caps: tc.caps})
			if got, known := p.MessageSizeLimit(); got != tc.limit || known != (tc.limit > 0) {
				t.Fatalf("APPENDLIMIT read as %d, want%d", got, tc.limit)
			}
		})
	}
}

func TestMessageSizeLimitReadsMailboxSpecificDraftsAndSent(t *testing.T) {
	for _, value := range []string{"1024", "0", "NIL"} {
		server := &scriptedIMAP{caps: "IMAP4rev1 APPENDLIMIT", list: []string{`* LIST (\Drafts) "/" "Drafts"`, `* LIST (\Sent) "/" "Sent"`}, appendLimits: map[string]string{"Drafts": "2048", "Sent": value}}
		provider := scriptedProvider(t, server)
		wanted := int64(1024)
		if value == "0" {
			wanted = 0
		}
		if value == "NIL" {
			wanted = 2048
		}
		if got, known := provider.MessageSizeLimit(); got != wanted || !known {
			t.Fatalf("mailbox-specific%s: got%d want%d", value, got, wanted)
		}
	}
}

func TestMessageSizeLimitPreservesExplicitZero(t *testing.T) {
	provider := scriptedProvider(t, &scriptedIMAP{caps: "IMAP4rev1 APPENDLIMIT=0"})
	if size, known := provider.MessageSizeLimit(); size != 0 || !known {
		t.Fatalf("zero APPENDLIMIT became unknown: %d %t", size, known)
	}
}
