package imap

import (
	"slices"
	"strings"
	"testing"
)

func TestExtendedListRequestsAdvertisedSpecialUse(t *testing.T) {
	for _, extension := range []string{"LIST-EXTENDED", "LIST-STATUS"} {
		for _, special := range []bool{false, true} {
			caps := "IMAP4rev1 " + extension
			if special {
				caps += " SPECIAL-USE"
			}
			t.Run(caps, func(t *testing.T) {
				s := &scriptedIMAP{caps: caps, takesReturn: true, specialUse: true}
				p := scriptedProvider(t, s)
				folders, err := p.ListMailboxes()
				if err != nil {
					t.Fatal(err)
				}
				if len(folders) != 1 || folders[0].Name != "Sent Messages" || slices.Contains(folders[0].Attributes, `\Sent`) != special {
					t.Fatalf("special-use attributes lost: %+v", folders)
				}
				if got := strings.Contains(s.listCommands()[0], "SPECIAL-USE"); got != special {
					t.Errorf("LIST commands = %q", s.listCommands())
				}
			})
		}
	}
}
