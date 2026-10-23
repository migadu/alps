package alpscaldav

import (
	"testing"

	"github.com/migadu/alps/internal/itip"
)

// bareLogin is the user name the user signs in with where it is not an
// address.
const bareLogin = "ada"

// organizesAs checks that meetings saved with a guest name address as their
// organizer, are mailed from address, and are listed as the user's own. Two,
// because the second is organized from what the first left cached.
func organizesAs(t *testing.T, h *harness, mails *mailRecorder, address string) {
	t.Helper()
	for i, summary := range []string{"Review", "Retrospective"} {
		saved := h.saveMeeting("", meetingBody(summary, Person{Email: "grace@example.org"}))
		if org := itip.Organizer(itip.Master(h.dav.get(t, saved.Path).Data)); org == nil || org.Address != address {
			t.Errorf("%s: organizer %+v, want %s", summary, org, address)
		}
		sent := mails.messages()
		if len(sent) != i+1 || sent[i].from != address {
			var froms []string
			for _, m := range sent {
				froms = append(froms, m.from)
			}
			t.Fatalf("%s: sent from %q, want %d from %s", summary, froms, i+1, address)
		}
		_, _, header := calendarPart(t, sent[i])
		if from, _ := header.AddressList("From"); len(from) != 1 || from[0].Address != address {
			t.Errorf("%s: From %v, want %s", summary, from, address)
		}
		if ev := h.listed(saved.Path); ev.Role != "organizer" {
			t.Errorf("%s: listed as %q", summary, ev.Role)
		}
	}
}

// A login is not always an email address: some IMAP servers sign users in
// with a plain user name, and the multi provider takes one under its
// default_domain. The meeting's organizer, and the sender of its
// invitations, was the login all the same: ORGANIZER:mailto:ada, which no
// guest's answer can reach and no other client takes for the user. The
// address is the login with that domain, worked out at sign-in.
func TestABareLoginOrganizesFromItsAddress(t *testing.T) {
	mails, smtpURL := startMailRecorder(t)
	h := startHarness(t, harnessOptions{smtp: smtpURL, login: bareLogin, defaultDomain: "example.com"})
	organizesAs(t, h, mails, "ada@example.com")
}

// With no domain to complete the login with, the calendar server says which
// addresses are the user's, in the principal's calendar-user-address-set, and
// the first of them is the one the user organizes from.
func TestABareLoginOrganizesFromTheCalendarServersAddress(t *testing.T) {
	mails, smtpURL := startMailRecorder(t)
	front := &davFront{addresses: []string{"ada@example.com", "countess@example.com"}}
	h := startHarness(t, harnessOptions{smtp: smtpURL, login: bareLogin, wrap: front.wrap})
	organizesAs(t, h, mails, "ada@example.com")
}
