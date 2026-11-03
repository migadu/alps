package imap

import (
	"errors"
	"fmt"
	"slices"
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps/provider"
)

// storageQuota reads the provider's storage quota, failing the test on an
// error.
func storageQuota(t *testing.T, p *IMAPProvider) *provider.StorageQuota {
	t.Helper()
	has, err := p.HasQuotas()
	if err != nil || !has {
		t.Fatalf("HasQuotas() = %v, %v; want true", has, err)
	}
	quota, err := p.StorageQuota()
	if err != nil {
		t.Fatalf("StorageQuota() failed: %v", err)
	}
	return quota
}

// A server with QUOTA answers the Inbox's quota root, and the root's STORAGE
// in units of 1024 octets. The quota is answered in bytes.
func TestStorageQuotaIsAnsweredInBytes(t *testing.T) {
	srv := &scriptedIMAP{
		caps: "IMAP4rev1 QUOTA QUOTA=RES-STORAGE",
		quota: []string{
			`* QUOTAROOT INBOX "User quota"`,
			`* QUOTA "User quota" (STORAGE 512 10240)`,
		},
	}
	got := storageQuota(t, scriptedProvider(t, srv))
	want := &provider.StorageQuota{Used: 512 * 1024, Limit: 10240 * 1024}
	if got == nil || *got != *want {
		t.Fatalf("StorageQuota() = %+v, want %+v", got, want)
	}
	srv.mu.Lock()
	asked := slices.Clone(srv.quotas)
	srv.mu.Unlock()
	if !slices.Equal(asked, []string{"INBOX"}) {
		t.Errorf("GETQUOTAROOT was sent for %q, want the Inbox once", asked)
	}
}

func TestStorageQuotaKeepsAZeroLimit(t *testing.T) {
	for _, used := range []int64{0, 10} {
		t.Run(fmt.Sprint(used), func(t *testing.T) {
			srv := &scriptedIMAP{caps: "IMAP4rev1 QUOTA", quota: []string{
				`* QUOTAROOT INBOX room closed`,
				`* QUOTA room (STORAGE 95 100)`,
				fmt.Sprintf(`* QUOTA closed (STORAGE %d 0)`, used),
			}}
			got := storageQuota(t, scriptedProvider(t, srv))
			if got == nil || got.Limit != 0 || got.Used != used*1024 {
				t.Fatalf("quota %+v, want zero limit with usage %d", got, used*1024)
			}
		})
	}
}

// A server without QUOTA keeps no quotas, which is said without asking it
// anything: GETQUOTAROOT would only be refused.
func TestStorageQuotaWithoutQuotaIsNotAsked(t *testing.T) {
	srv := &scriptedIMAP{caps: "IMAP4rev1"}
	p := scriptedProvider(t, srv)
	has, err := p.HasQuotas()
	if err != nil || has {
		t.Fatalf("HasQuotas() = %v, %v; want false", has, err)
	}
	if srv.received("GETQUOTAROOT") {
		t.Error("GETQUOTAROOT was sent to a server without QUOTA")
	}
}

// A quota root without a STORAGE resource limits something else, here the
// number of messages, and an Inbox under no quota root is limited by none.
// Neither is a storage limit, and neither is an error.
func TestStorageQuotaWithoutStorageIsNone(t *testing.T) {
	for name, lines := range map[string][]string{
		"messages only": {`* QUOTAROOT INBOX "User quota"`, `* QUOTA "User quota" (MESSAGE 42 1000)`},
		"no root":       {`* QUOTAROOT INBOX`},
	} {
		t.Run(name, func(t *testing.T) {
			srv := &scriptedIMAP{caps: "IMAP4rev1 QUOTA", quota: lines}
			if got := storageQuota(t, scriptedProvider(t, srv)); got != nil {
				t.Errorf("StorageQuota() = %+v, want none", got)
			}
		})
	}
}

// Under several roots, the fullest is answered, as a share of its limit: it
// is the one closest to refusing mail. A resource is read whatever its case.
func TestStorageQuotaIsTheFullestRoot(t *testing.T) {
	srv := &scriptedIMAP{
		caps: "IMAP4rev1 QUOTA",
		quota: []string{
			`* QUOTAROOT INBOX user domain`,
			`* QUOTA user (STORAGE 9000 10000 MESSAGE 1 100)`,
			`* QUOTA domain (storage 9500 10000)`,
		},
	}
	got := storageQuota(t, scriptedProvider(t, srv))
	want := &provider.StorageQuota{Used: 9500 * 1024, Limit: 10000 * 1024}
	if got == nil || *got != *want {
		t.Fatalf("StorageQuota() = %+v, want %+v", got, want)
	}
}

// A refusal is the server's answer, and stays one under the wrapping: the
// caller maps it as it maps any other the server gives, rather than as a
// failure of the connection.
func TestStorageQuotaRefusalIsTheServers(t *testing.T) {
	srv := &scriptedIMAP{caps: "IMAP4rev1 QUOTA", refuseQuota: true}
	p := scriptedProvider(t, srv)
	quota, err := p.StorageQuota()
	if err == nil {
		t.Fatalf("StorageQuota() = %+v, want the refusal", quota)
	}
	var refused *imap.Error
	if !errors.As(err, &refused) || refused.Code != imap.ResponseCodeNoPerm {
		t.Fatalf("StorageQuota() failed with %v, want the server's NO [NOPERM]", err)
	}
	// The connection is fine after it.
	if _, err := p.ListMailboxes(); err != nil {
		t.Errorf("the folder list failed after the refusal: %v", err)
	}
}
