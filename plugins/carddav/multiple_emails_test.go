package alpscarddav

import (
	"net/http"
	"strings"
	"testing"

	"github.com/emersion/go-vcard"
)

func rogerWithMultipleEmails() vcard.Card {
	card := vcard.Card{}
	card.SetValue(vcard.FieldVersion, "4.0")
	card.SetValue(vcard.FieldUID, "urn:uuid:roger")
	card.SetValue(vcard.FieldFormattedName, "Roger Rabbit")

	// Home Email: roger@gmail.com
	// Other Email: roger@outlook.com
	fHome := &vcard.Field{
		Value:  "roger@gmail.com",
		Params: vcard.Params{"TYPE": []string{"HOME"}},
	}
	fOther := &vcard.Field{
		Value:  "roger@outlook.com",
		Params: vcard.Params{"TYPE": []string{"OTHER"}},
	}
	card[vcard.FieldEmail] = []*vcard.Field{fHome, fOther}

	// Work Phone and Mobile Phone
	fWorkPhone := &vcard.Field{
		Value:  "555-555-1111",
		Params: vcard.Params{"TYPE": []string{"WORK"}},
	}
	fCellPhone := &vcard.Field{
		Value:  "555-555-2222",
		Params: vcard.Params{"TYPE": []string{"CELL"}},
	}
	card[vcard.FieldTelephone] = []*vcard.Field{fWorkPhone, fCellPhone}

	card.SetValue(vcard.FieldNote, "very animated character")
	return card
}

type contactJSONResponse struct {
	UID    string `json:"uid"`
	Name   string `json:"name"`
	Email  string `json:"email"`
	Emails []struct {
		Value string `json:"value"`
		Type  string `json:"type"`
	} `json:"emails"`
	Phone  string `json:"phone"`
	Phones []struct {
		Value string `json:"value"`
		Type  string `json:"type"`
	} `json:"phones"`
	Note string `json:"note"`
	ETag string `json:"etag"`
	Path string `json:"path"`
}

func TestMultipleEmailsRetrieved(t *testing.T) {
	h := newHarness(t)
	objectPath := testBook + "roger.vcf"
	h.dav.save(objectPath, rogerWithMultipleEmails())

	// 1. Check GET /contacts/{path}
	r := h.do("GET", "/contacts/"+pathParam(objectPath), nil)
	h.expect(r, http.StatusOK)

	var contact contactJSONResponse
	h.decode(r, &contact)

	if contact.Name != "Roger Rabbit" {
		t.Fatalf("contact.Name = %q, want %q", contact.Name, "Roger Rabbit")
	}

	if len(contact.Emails) != 2 {
		t.Fatalf("expected 2 emails in contact.Emails, got %d (raw body: %s)", len(contact.Emails), r.body)
	}

	emailsFound := make(map[string]string)
	for _, em := range contact.Emails {
		emailsFound[em.Value] = strings.ToLower(em.Type)
	}
	if tHome, ok := emailsFound["roger@gmail.com"]; !ok || tHome != "home" {
		t.Errorf("expected roger@gmail.com with type 'home', got %q (ok=%v)", tHome, ok)
	}
	if tOther, ok := emailsFound["roger@outlook.com"]; !ok || tOther != "other" {
		t.Errorf("expected roger@outlook.com with type 'other', got %q (ok=%v)", tOther, ok)
	}

	// 2. Check GET /contacts list
	listResp := h.do("GET", "/contacts", nil)
	h.expect(listResp, http.StatusOK)
	var listData struct {
		Contacts []contactJSONResponse `json:"contacts"`
	}
	h.decode(listResp, &listData)
	if len(listData.Contacts) != 1 {
		t.Fatalf("expected 1 contact in list, got %d", len(listData.Contacts))
	}
	if len(listData.Contacts[0].Emails) != 2 {
		t.Fatalf("expected 2 emails in listData.Contacts[0].Emails, got %d", len(listData.Contacts[0].Emails))
	}
}

func TestEditingContactPreservesMultipleEmails(t *testing.T) {
	h := newHarness(t)
	objectPath := testBook + "roger.vcf"
	h.dav.save(objectPath, rogerWithMultipleEmails())

	// Open the contact
	r := h.do("GET", "/contacts/"+pathParam(objectPath), nil)
	h.expect(r, http.StatusOK)
	var opened contactJSONResponse
	h.decode(r, &opened)

	// Save an update (e.g. changing note or name)
	editResp := h.do("POST", "/contacts/"+pathParam(objectPath)+"/edit", map[string]any{
		"path":  objectPath,
		"name":  "Roger Rabbit (Updated)",
		"email": "roger@gmail.com",
		"note":  "updated note",
		"etag":  opened.ETag,
	})
	h.expect(editResp, http.StatusOK)

	// Verify that the CardDAV server STILL has both email addresses and didn't wipe out roger@outlook.com!
	storedCard := h.dav.get(t, objectPath).Card
	emailFields := storedCard[vcard.FieldEmail]
	if len(emailFields) != 2 {
		t.Fatalf("secondary email was wiped out on CardDAV server! expected 2 emails, got %d", len(emailFields))
	}
}

func TestExplicitMultipleEmailsAndPhonesUpdate(t *testing.T) {
	h := newHarness(t)
	objectPath := testBook + "roger.vcf"
	h.dav.save(objectPath, rogerWithMultipleEmails())

	r := h.do("GET", "/contacts/"+pathParam(objectPath), nil)
	h.expect(r, http.StatusOK)
	var opened contactJSONResponse
	h.decode(r, &opened)

	// Update emails and phones with explicit lists
	editResp := h.do("POST", "/contacts/"+pathParam(objectPath)+"/edit", map[string]any{
		"path": objectPath,
		"name": "Roger Rabbit",
		"emails": []map[string]string{
			{"value": "roger.work@acme.corp", "type": "work"},
			{"value": "roger.home@acme.corp", "type": "home"},
			{"value": "roger.other@acme.corp", "type": "other"},
		},
		"phones": []map[string]string{
			{"value": "111-222-3333", "type": "mobile"},
		},
		"etag": opened.ETag,
	})
	h.expect(editResp, http.StatusOK)

	storedCard := h.dav.get(t, objectPath).Card
	if len(storedCard[vcard.FieldEmail]) != 3 {
		t.Fatalf("expected 3 emails on CardDAV server, got %d", len(storedCard[vcard.FieldEmail]))
	}
	if len(storedCard[vcard.FieldTelephone]) != 1 {
		t.Fatalf("expected 1 phone on CardDAV server, got %d", len(storedCard[vcard.FieldTelephone]))
	}
}

func TestDeduplicationMatchesSecondaryEmail(t *testing.T) {
	h := newHarness(t)
	objectPath := testBook + "roger.vcf"
	h.dav.save(objectPath, rogerWithMultipleEmails())

	// Attempt to create a new contact with roger@outlook.com (which is Roger's secondary email)
	createResp := h.do("POST", "/contacts/create", map[string]any{
		"name":  "Roger Clone",
		"email": "roger@outlook.com",
	})
	h.expect(createResp, http.StatusOK)

	var result struct {
		OK   string `json:"ok"`
		Path string `json:"path"`
	}
	h.decode(createResp, &result)

	if result.Path != objectPath {
		t.Fatalf("expected deduplication to match existing path %q, got %q", objectPath, result.Path)
	}
}


