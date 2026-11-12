package alpsbase

import (
	"bytes"
	"github.com/migadu/alps"
	"io"
	"mime/multipart"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

type timedOutUpload struct{}

func (timedOutUpload) Read([]byte) (int, error) {
	return 0, &net.OpError{Op: "read", Net: "tcp", Err: os.ErrDeadlineExceeded}
}

func TestUploadDistinguishesReadTimeoutAndStorageFailure(t *testing.T) {
	for _, kind := range []string{"timeout", "storage", "malformed"} {
		t.Run(kind, func(t *testing.T) {
			s, logged := newTestServerWithLog(t)
			session, err := s.server.Sessions.Put(testUser, testPassword)
			if err != nil {
				t.Fatal(err)
			}
			defer session.Close()
			var body bytes.Buffer
			writer := multipart.NewWriter(&body)
			part, err := writer.CreateFormFile("attachments", "file.bin")
			if err != nil {
				t.Fatal(err)
			}
			if _, err := io.WriteString(part, strings.Repeat("x", 128<<10)); err != nil {
				t.Fatal(err)
			}
			writer.Close()
			contentType := writer.FormDataContentType()
			var reader io.Reader = bytes.NewReader(body.Bytes())
			status, code := http.StatusBadRequest, "Invalid request"
			switch kind {
			case "timeout":
				reader = io.MultiReader(bytes.NewReader(body.Bytes()[:300]), timedOutUpload{})
				status, code = http.StatusRequestTimeout, "upload_timed_out"
			case "storage":
				t.Setenv("TMPDIR", filepath.Join(t.TempDir(), "missing"))
				status, code = http.StatusInternalServerError, "upload_storage_failed"
			case "malformed":
				reader = strings.NewReader("malformed multipart")
			}
			request := httptest.NewRequest(http.MethodPost, "/attachments", reader)
			request.Header.Set("Content-Type", contentType)
			response := httptest.NewRecorder()
			ctx := alps.NewContext(response, request, s.server)
			ctx.Session = session
			if err := handleComposeAttachment(ctx); err != nil {
				t.Fatal(err)
			}
			if response.Code != status || !strings.Contains(response.Body.String(), code) {
				t.Errorf("%s: status=%d body=%s", kind, response.Code, response.Body.String())
			}
			if kind != "malformed" && !strings.Contains(logged(), "upload multipart") {
				t.Errorf("%s failure was not logged: %s", kind, logged())
			}
			if strings.Contains(response.Body.String(), "missing") {
				t.Fatal("storage path leaked to client")
			}
		})
	}
}
