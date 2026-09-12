package alpsbase

import (
	"bytes"
	"errors"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"
)

// The point of MaxBytesReader here is that the read FAILS rather than the body
// being written to a temp file and refused afterwards. ReadForm's argument is an
// in-memory threshold, so without the cap a body of any size lands on disk
// first.
func TestMaxBytesReader_StopsAnOversizeMultipartRead(t *testing.T) {
	const limit = 1 << 16 // 64 KiB

	var body bytes.Buffer
	w := multipart.NewWriter(&body)
	part, err := w.CreateFormFile("attachments", "big.bin")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := part.Write(make([]byte, limit*4)); err != nil {
		t.Fatal(err)
	}
	if err := w.Close(); err != nil {
		t.Fatal(err)
	}

	req := httptest.NewRequest("POST", "/attachments", bytes.NewReader(body.Bytes()))
	req.Header.Set("Content-Type", w.FormDataContentType())
	rec := httptest.NewRecorder()
	req.Body = http.MaxBytesReader(rec, req.Body, limit)

	reader, err := req.MultipartReader()
	if err != nil {
		t.Fatalf("MultipartReader: %v", err)
	}
	// 32 KiB in memory, exactly as the handler uses.
	_, err = reader.ReadForm(32 << 10)
	if err == nil {
		t.Fatal("expected the oversize body to be refused")
	}

	var maxErr *http.MaxBytesError
	if !errors.As(err, &maxErr) {
		t.Fatalf("expected a *http.MaxBytesError so the handler can answer 413, got %T: %v", err, err)
	}
}

// A body inside the cap must still parse normally — the guard must not make
// ordinary uploads fail.
func TestMaxBytesReader_AllowsABodyInsideTheCap(t *testing.T) {
	const limit = 1 << 20

	var body bytes.Buffer
	w := multipart.NewWriter(&body)
	part, _ := w.CreateFormFile("attachments", "small.bin")
	if _, err := part.Write(make([]byte, 4096)); err != nil {
		t.Fatal(err)
	}
	w.Close()

	req := httptest.NewRequest("POST", "/attachments", bytes.NewReader(body.Bytes()))
	req.Header.Set("Content-Type", w.FormDataContentType())
	rec := httptest.NewRecorder()
	req.Body = http.MaxBytesReader(rec, req.Body, limit)

	reader, err := req.MultipartReader()
	if err != nil {
		t.Fatal(err)
	}
	form, err := reader.ReadForm(32 << 10)
	if err != nil {
		t.Fatalf("a body inside the cap should parse: %v", err)
	}
	defer form.RemoveAll()

	files := form.File["attachments"]
	if len(files) != 1 || files[0].Size != 4096 {
		t.Fatalf("expected one 4096-byte file, got %d files", len(files))
	}
	f, err := files[0].Open()
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	if n, _ := io.Copy(io.Discard, f); n != 4096 {
		t.Fatalf("expected to read 4096 bytes back, got %d", n)
	}
}
