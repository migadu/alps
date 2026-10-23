package alpscarddav

import (
	"github.com/emersion/go-vcard"
	"net/http"
	"testing"
)

func TestCoalescedEmailEditsKeepTheEditedIdentity(t *testing.T) {
	h := newHarness(t)
	p := testBook + "grace.vcf"
	h.dav.save(p, withEmailsAndPhones())
	c := h.opened(p)
	save := func(props []map[string]any) {
		t.Helper()
		r := h.do("POST", "/contacts/"+pathParam(p)+"/edit", map[string]any{"name": c.Name, "etag": c.ETag, "emails": props, "phones": c.Phones})
		h.expect(r, http.StatusOK)
		var saved struct {
			ETag string `json:"etag"`
		}
		h.decode(r, &saved)
		c.ETag = saved.ETag
	}
	// The 500ms debounce can combine removing the work address and editing home.
	save([]map[string]any{{"value": "changed@home.example", "type": "home", "source_index": 1}})
	got := h.dav.get(t, p).Card[vcard.FieldEmail]
	if len(got) != 1 || got[0].Group != "item1" || got[0].Params.Get("PREF") != "1" {
		t.Fatalf("edited home inherited the removed work address: %s", groupedFieldsOf(h.dav.get(t, p).Card, vcard.FieldEmail))
	}
	// The next autosave addresses the successful snapshot's new position.
	save([]map[string]any{{"value": "again@home.example", "type": "home", "source_index": 0}})
	got = h.dav.get(t, p).Card[vcard.FieldEmail]
	if got[0].Group != "item1" || got[0].Value != "again@home.example" {
		t.Fatalf("later edit lost identity: %#v", got[0])
	}
	// A new entry replacing the old one must not inherit its group or preference.
	save([]map[string]any{{"value": "brand-new@example.test", "type": "work", "source_index": -1}})
	got = h.dav.get(t, p).Card[vcard.FieldEmail]
	if len(got) != 1 || got[0].Group != "" || got[0].Params.Get("PREF") != "" {
		t.Fatalf("new address inherited removed metadata: %#v", got)
	}
}

func TestIndexedPhonesDistinguishDuplicateValues(t *testing.T) {
	h := newHarness(t)
	p := testBook + "grace.vcf"
	card := withEmailsAndPhones()
	card[vcard.FieldTelephone] = []*vcard.Field{
		{Value: "+1 555 0100", Group: "item2", Params: vcard.Params{"TYPE": {"WORK", "VOICE"}}},
		{Value: "+1 555 0100", Group: "item3", Params: vcard.Params{"TYPE": {"HOME", "VOICE"}, "PREF": {"1"}}},
	}
	h.dav.save(p, card)
	c := h.opened(p)
	h.expect(h.do("POST", "/contacts/"+pathParam(p)+"/edit", map[string]any{"name": c.Name, "etag": c.ETag, "emails": c.Emails, "phones": []map[string]any{
		{"value": "+1 555 0100", "type": "home", "source_index": 1}, {"value": "+1 555 0199", "type": "work", "source_index": 0},
	}}), http.StatusOK)
	got := h.dav.get(t, p).Card[vcard.FieldTelephone]
	if len(got) != 2 || got[0].Group != "item3" || got[0].Params.Get("PREF") != "1" || got[1].Group != "item2" {
		t.Fatalf("phone identity changed: %s", groupedFieldsOf(h.dav.get(t, p).Card, vcard.FieldTelephone))
	}
}

func TestInvalidFieldIndicesWriteNothing(t *testing.T) {
	for _, tc := range []struct {
		name    string
		indices []any
		etag    bool
	}{
		{"out of range", []any{8}, true}, {"negative", []any{-2}, true}, {"duplicate", []any{0, 0}, true}, {"mixed legacy", []any{0, nil}, true}, {"missing version", []any{1}, false},
	} {
		t.Run(tc.name, func(t *testing.T) {
			h := newHarness(t)
			p := testBook + "grace.vcf"
			h.dav.save(p, withEmailsAndPhones())
			c := h.opened(p)
			original := h.dav.get(t, p).ETag
			var props []map[string]any
			for _, index := range tc.indices {
				entry := map[string]any{"value": "changed@example.test", "type": "home"}
				if index != nil {
					entry["source_index"] = index
				}
				props = append(props, entry)
			}
			req := map[string]any{"name": c.Name, "emails": props}
			if tc.etag {
				req["etag"] = c.ETag
			}
			h.expect(h.do("POST", "/contacts/"+pathParam(p)+"/edit", req), http.StatusBadRequest)
			if h.dav.get(t, p).ETag != original {
				t.Fatal("invalid identity request changed the card")
			}
		})
	}
}
