package alpsbase

import (
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/migadu/alps"
)

// eventStreamHeartbeat is how often an event stream says it is still there,
// with a comment line the browser passes over. A reverse proxy closes a
// response that has gone silent for long (nginx's proxy_read_timeout is a
// minute, many HAProxy setups allow 30 s), and the stream may go without news
// for hours.
var eventStreamHeartbeat = 20 * time.Second

// handleEvents is a page's event stream (Server-Sent Events): the mail
// server's news of the Inbox as it comes, for the page to check for new mail
// at once rather than at its next poll. See alps.Session.WatchInbox. Push is
// off by default ([server] push_new_mail), and the stream is not found then.
//
// It sends:
//
//   - watching: the session waits for the mail server's news from now on, of
//     the Inbox alone (data INBOX), or of the subscribed folders as well
//     (data SUBSCRIBED, [server] push_subscribed_folders with a mail server
//     that has NOTIFY). What arrived before went unheard, so the page checks
//     once.
//   - inbox, data INBOX: a message arrived in the Inbox or went from it. The
//     session's pages of the Inbox are dropped first, so that the check the
//     page makes reads them again. A flag changed elsewhere is no news (see
//     provider.Idler).
//   - folder, with the folder's name: the same for another folder, while the
//     folders are watched.
//   - unavailable, data INBOX: the mail server cannot tell of changes. The
//     stream ends, and the page polls as without push.
//
// It ends with the session (a sign-out, an expiry) and with the request.
func handleEvents(ctx *alps.Context) error {
	if !ctx.Server.Sessions.PushNewMail() {
		return alps.NewHTTPError(http.StatusNotFound, "new mail is not pushed")
	}
	w := ctx.Response
	rc := http.NewResponseController(w)
	// The server's read and write timeouts are deadlines for the whole
	// exchange, set for requests that end: the read deadline cancels the
	// request once it passes, the write deadline fails the next write. A
	// stream has neither. A writer in between that does not reach the
	// connection's (see http.ResponseController) leaves them in place, and
	// the stream is then cut at read_timeout_sec, and opened again by the
	// page: said once, for whoever runs the server.
	if errR, errW := rc.SetReadDeadline(time.Time{}), rc.SetWriteDeadline(time.Time{}); errR != nil || errW != nil {
		deadlinesKept.Do(func() {
			ctx.Server.Logger().Printf("Event stream: the HTTP server's timeouts cannot be lifted for it (%v, %v); it is cut and opened again at each of them", errR, errW)
		})
	}

	watch := ctx.Session.WatchInbox()
	defer watch.Stop()

	header := w.Header()
	header.Set("Content-Type", "text/event-stream")
	header.Set("Cache-Control", "no-cache")
	// nginx would buffer the answer of a proxied request, and the page would
	// hear nothing until its buffer filled.
	header.Set("X-Accel-Buffering", "no")
	w.WriteHeader(http.StatusOK)
	if err := rc.Flush(); err != nil {
		return nil
	}

	heartbeat := time.NewTicker(eventStreamHeartbeat)
	defer heartbeat.Stop()
	for {
		var frame string
		select {
		case <-ctx.Request.Context().Done():
			return nil
		case <-heartbeat.C:
			frame = ": still here\n\n"
		case ev, ok := <-watch.C:
			if !ok {
				return nil
			}
			switch ev {
			case alps.InboxWatched:
				frame = "event: watching\ndata: INBOX\n\n"
			case alps.FoldersWatched:
				frame = "event: watching\ndata: SUBSCRIBED\n\n"
			case alps.InboxChanged:
				forgetInbox(ctx.Session.Cache())
				frame = "event: inbox\ndata: INBOX\n\n"
			case alps.InboxUnwatchable:
				frame = "event: unavailable\ndata: INBOX\n\n"
			}
			// After any event: one that told of them may have found the
			// watch's buffer full (see alps.InboxWatch.Folders).
			for _, name := range watch.Folders() {
				// A line break would end the event's data. No mail server
				// names a folder so; one that did is left to the poll.
				if strings.ContainsAny(name, "\r\n") {
					continue
				}
				dropMailboxListings(ctx.Session.Cache(), name)
				frame += "event: folder\ndata: " + name + "\n\n"
			}
			if frame == "" {
				continue
			}
		}
		if _, err := io.WriteString(w, frame); err != nil {
			return nil
		}
		if err := rc.Flush(); err != nil {
			return nil
		}
	}
}

// deadlinesKept says once that the stream's deadlines could not be lifted.
var deadlinesKept sync.Once

// forgetInbox drops what the session holds of the Inbox that news of an
// arrival or a removal has made stale: its pages, and the conversations
// assembled from them (see dropMailboxListings). The next listing reads them
// again. The counts are kept: the check the page makes on the news reads
// them, and it is against them that it tells the change, and drops the
// folder list with it (see handleMailboxStatus). Without them every push
// read as a first check.
func forgetInbox(cache *alps.Cache) {
	dropMailboxListings(cache, "INBOX")
}
