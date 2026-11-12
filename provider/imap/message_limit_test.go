package imap

import "testing"

func TestMessageSizeLimitReadsAdvertisedAppendLimit(t *testing.T) {
	for _, tc := range []struct {
		caps  string
		limit int64
	}{{"IMAP4rev1", 0}, {"IMAP4rev1 APPENDLIMIT", 0}, {"IMAP4rev1 APPENDLIMIT=26214400", 26214400}} {
		t.Run(tc.caps, func(t *testing.T) {
			p := scriptedProvider(t, &scriptedIMAP{caps: tc.caps})
			if got := p.MessageSizeLimit(); got != tc.limit {
				t.Fatalf("APPENDLIMIT read as %d, want%d", got, tc.limit)
			}
		})
	}
}
