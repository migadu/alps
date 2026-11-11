package alpscarddav

import (
	"bytes"
	"fmt"
	"io"
	"mime"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"regexp"
	"strings"

	"github.com/emersion/go-webdav/carddav"
)

var errNoAddressBook = fmt.Errorf("carddav: no address book found")

type authRoundTripper struct {
	server http.RoundTripper
	debug  bool
}

func (rt *authRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	if rt.debug {
		b, _ := httputil.DumpRequestOut(req, true)
		bStr := string(b)
		bStr = regexp.MustCompile(`(?mi)^Authorization: .*`).ReplaceAllString(bStr, "Authorization: [REDACTED]\r")
		os.Stdout.Write(append([]byte("C: \n"), []byte(bStr)...))
		os.Stdout.Write([]byte("\n"))
	}

	resp, err := rt.server.RoundTrip(req)

	if rt.debug && err == nil {
		b, _ := httputil.DumpResponse(resp, true)
		os.Stdout.Write(append([]byte("S: \n"), b...))
		os.Stdout.Write([]byte("\n"))
	}

	if err == nil {
		if err := keepListEscapesIn(resp); err != nil {
			return nil, err
		}
	}
	return resp, err
}

// keepListEscapesIn passes a response that may hold vCards, a card or a
// multistatus, through keepListEscapes before go-webdav's client decodes it.
func keepListEscapesIn(resp *http.Response) error {
	mediaType, _, _ := mime.ParseMediaType(resp.Header.Get("Content-Type"))
	if !strings.Contains(mediaType, "vcard") && !strings.Contains(mediaType, "xml") {
		return nil
	}
	body, err := io.ReadAll(resp.Body)
	resp.Body.Close()
	if err != nil {
		return err
	}
	body = keepListEscapes(body)
	resp.Body = io.NopCloser(bytes.NewReader(body))
	resp.ContentLength = int64(len(body))
	resp.Header.Del("Content-Length")
	return nil
}

func newClient(u *url.URL, client *http.Client) (*carddav.Client, error) {
	return carddav.NewClient(client, u.String())
}
