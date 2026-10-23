package alpsbase

import (
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/emersion/go-imap/v2/imapclient"
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

func TestHTTP_EmptyingTrashKeepsColonSiblingParts(t *testing.T) {
	s := newTestServer(t)
	s.login()
	cache := s.signedInSession().Cache()
	for _, folder := range []string{"Trash", "Trash:Sub"} {
		cache.Set("message:"+folder+":7:[1]:raw", CachedMessagePart{Message: &provider.Message{}, Mailbox: folder})
	}
	s.expect(s.do("POST", "/mailboxes/Trash/empty", nil), http.StatusOK)
	if _, ok := cache.Get("message:Trash:Sub:7:[1]:raw"); !ok {
		t.Error("emptying Trash dropped a different folder's cached part")
	}
	if _, ok := cache.Get("message:Trash:7:[1]:raw"); ok {
		t.Error("emptying Trash kept its own cached part")
	}
}

// The keys of Work:Sub begin with Work's prefix: its pages are under
// messages:Work:, its conversations under thread:Work: and the messages read
// from it under message:Work:. Dropping Work's listings, or everything read
// from Work, took Work:Sub's with them by the prefix, and they were read again
// for nothing. Each records its folder, and Work:Sub's stay.
func TestDroppingAFolderLeavesAFolderNamedLikeItAlone(t *testing.T) {
	keys := func(folder string) []string {
		return []string{"messages:" + folder + ":page0", threadCacheKey(folder, "7"), "message:" + folder + ":7:[]", "message:" + folder + ":7:[1]:raw"}
	}
	fill := func(cache *alps.Cache, folder string) {
		cache.Set("messages:"+folder+":page0", CachedMessages{Mailbox: folder})
		cache.Set(threadCacheKey(folder, "7"), []IMAPMessage{{FetchMessageBuffer: &imapclient.FetchMessageBuffer{}, AlpsUID: "7", Mailbox: folder}})
		cache.Set("message:"+folder+":7:[]", CachedMessagePart{Message: &provider.Message{}, Mailbox: folder})
		cache.Set("message:"+folder+":7:[1]:raw", CachedMessagePart{Message: &provider.Message{}, Mailbox: folder})
	}

	for _, drop := range []struct {
		name     string
		do       func(*alps.Cache, string)
		messages bool // whether it drops the messages read, as well as the listings
	}{
		{"its listings", dropMailboxListings, false},
		{"everything read from it", dropRenumberedMailbox, true},
	} {
		t.Run("dropping "+drop.name, func(t *testing.T) {
			cache := alps.NewCache(time.Minute)
			defer cache.Close()
			fill(cache, "Work")
			fill(cache, "Work:Sub")

			drop.do(cache, "Work")

			for _, key := range keys("Work:Sub") {
				if _, ok := cache.Get(key); !ok {
					t.Errorf("%s of Work:Sub was dropped with Work's", key)
				}
			}
			for _, key := range keys("Work") {
				if _, ok := cache.Get(key); ok && (!strings.HasPrefix(key, "message:") || drop.messages) {
					t.Errorf("%s of Work was kept", key)
				}
			}
		})
	}
}
