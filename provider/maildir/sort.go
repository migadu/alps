package maildir

import (
	"bufio"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/emersion/go-message"
	"github.com/emersion/go-message/mail"
	"github.com/emersion/go-message/textproto"
)

// sortSearchMessages follows the account's date/filing-order preference.
func (p *Provider) sortSearchMessages(messages []*mailFile, order string) {
	settings := struct {
		Criteria string `json:"message_sort_criteria"`
	}{}
	store, err := p.GetStore()
	if err == nil {
		_ = store.Get("base.settings", &settings)
	}
	dates := make(map[string]time.Time, len(messages))
	if settings.Criteria != "uid" {
		for _, m := range messages {
			dates[m.Key()] = messageDate(m)
		}
	}
	sort.Slice(messages, func(i, j int) bool {
		a, b := messages[i].Key(), messages[j].Key()
		if !dates[a].Equal(dates[b]) {
			if order == "asc" {
				return dates[a].Before(dates[b])
			}
			return dates[a].After(dates[b])
		}
		if order == "asc" {
			return a < b
		}
		return a > b
	})
}

// messageDate uses Date when valid, otherwise the Maildir key's delivery time.
func messageDate(m *mailFile) time.Time {
	if f, err := m.Open(); err == nil {
		h, err := textproto.ReadHeader(bufio.NewReader(f))
		f.Close()
		if err == nil {
			header := mail.Header{Header: message.Header{Header: h}}
			if date, err := header.Date(); err == nil && !date.IsZero() {
				return date
			}
		}
	}
	stamp, _, _ := strings.Cut(m.Key(), ".")
	seconds, _ := strconv.ParseInt(stamp, 10, 64)
	return time.Unix(seconds, 0)
}
