package imap

import (
	"bytes"
	"fmt"
	"github.com/migadu/go-imap/imapclient"
	"log"
	"net"
	"strings"
	"sync"
	"testing"
)

func TestTransientStoreWarningIsConcurrent(t *testing.T) {
	server, conn := net.Pipe()
	defer server.Close()
	client := imapclient.New(conn, nil)
	defer client.Close()
	go fmt.Fprint(server, "* PREAUTH [CAPABILITY IMAP4rev1] ready\r\n")
	if err := client.WaitGreeting(); err != nil {
		t.Fatal(err)
	}
	var output bytes.Buffer
	previous := log.Writer()
	log.SetOutput(&output)
	defer log.SetOutput(previous)
	var wg sync.WaitGroup
	start := make(chan struct{})
	for range 64 {
		wg.Go(func() {
			<-start
			if _, err := newStore(client); err != nil {
				t.Error(err)
			}
		})
	}
	close(start)
	wg.Wait()
	if got := strings.Count(output.String(), "using transient store instead"); got > 1 {
		t.Fatalf("warning logged %d times", got)
	}
}
