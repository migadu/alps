package main

import (
	"crypto/md5"
	"encoding/xml"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"
)

// fakeS3 is an in-memory, path-style object store covering the calls the IMAP
// server makes for message bodies: put, get, head, server-side copy and delete,
// plus the bucket-level probes its health check sends.
//
// It exists so a browser run needs a database and nothing else: a real object
// store is one more daemon to install, and a shared one would carry bodies
// from one run into the next.
type fakeS3 struct {
	mu      sync.Mutex
	objects map[string][]byte
}

func newFakeS3() *fakeS3 {
	return &fakeS3{objects: make(map[string][]byte)}
}

// objectKey strips the bucket from "/{bucket}/{key...}". A bucket-level
// request has no key and yields "".
func objectKey(p string) string {
	p = strings.TrimPrefix(p, "/")
	i := strings.IndexByte(p, '/')
	if i < 0 {
		return ""
	}
	return p[i+1:]
}

func (s *fakeS3) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	key := objectKey(r.URL.Path)
	if key == "" {
		s.serveBucket(w, r)
		return
	}

	switch r.Method {
	case http.MethodPut:
		if src := r.Header.Get("x-amz-copy-source"); src != "" {
			s.copyObject(w, src, key)
			return
		}
		body, err := io.ReadAll(r.Body)
		if err != nil {
			s3Error(w, http.StatusInternalServerError, "InternalError", key)
			return
		}
		s.mu.Lock()
		s.objects[key] = body
		s.mu.Unlock()
		w.Header().Set("ETag", etag(body))
		w.WriteHeader(http.StatusOK)

	case http.MethodGet, http.MethodHead:
		s.mu.Lock()
		data, ok := s.objects[key]
		s.mu.Unlock()
		if !ok {
			if r.Method == http.MethodHead {
				w.WriteHeader(http.StatusNotFound)
				return
			}
			s3Error(w, http.StatusNotFound, "NoSuchKey", key)
			return
		}
		w.Header().Set("Content-Length", strconv.Itoa(len(data)))
		w.Header().Set("ETag", etag(data))
		w.WriteHeader(http.StatusOK)
		if r.Method == http.MethodGet {
			_, _ = w.Write(data)
		}

	case http.MethodDelete:
		s.mu.Lock()
		delete(s.objects, key)
		s.mu.Unlock()
		w.WriteHeader(http.StatusNoContent)

	default:
		w.WriteHeader(http.StatusNotImplemented)
	}
}

// serveBucket answers the requests that name only the bucket. A HEAD is an
// existence probe; a GET is a listing, answered for the prefix asked.
func (s *fakeS3) serveBucket(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodHead:
		w.WriteHeader(http.StatusOK)
	case http.MethodGet:
		prefix := r.URL.Query().Get("prefix")
		type content struct {
			Key          string `xml:"Key"`
			Size         int    `xml:"Size"`
			ETag         string `xml:"ETag"`
			LastModified string `xml:"LastModified"`
		}
		result := struct {
			XMLName  xml.Name  `xml:"ListBucketResult"`
			Name     string    `xml:"Name"`
			Prefix   string    `xml:"Prefix"`
			KeyCount int       `xml:"KeyCount"`
			Contents []content `xml:"Contents"`
		}{Name: strings.Trim(r.URL.Path, "/"), Prefix: prefix}
		now := time.Now().UTC().Format(time.RFC3339)
		s.mu.Lock()
		for k, v := range s.objects {
			if strings.HasPrefix(k, prefix) {
				result.Contents = append(result.Contents, content{Key: k, Size: len(v), ETag: etag(v), LastModified: now})
			}
		}
		s.mu.Unlock()
		result.KeyCount = len(result.Contents)
		w.Header().Set("Content-Type", "application/xml")
		w.WriteHeader(http.StatusOK)
		_ = xml.NewEncoder(w).Encode(result)
	default:
		w.WriteHeader(http.StatusNotImplemented)
	}
}

func (s *fakeS3) copyObject(w http.ResponseWriter, src, dst string) {
	src, err := url.PathUnescape(src)
	if err != nil {
		s3Error(w, http.StatusBadRequest, "InvalidArgument", dst)
		return
	}
	srcKey := objectKey("/" + strings.TrimPrefix(src, "/"))

	s.mu.Lock()
	data, ok := s.objects[srcKey]
	if ok {
		s.objects[dst] = append([]byte(nil), data...)
	}
	s.mu.Unlock()
	if !ok {
		s3Error(w, http.StatusNotFound, "NoSuchKey", srcKey)
		return
	}
	w.Header().Set("Content-Type", "application/xml")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `<?xml version="1.0" encoding="UTF-8"?><CopyObjectResult><ETag>%s</ETag><LastModified>%s</LastModified></CopyObjectResult>`,
		etag(data), time.Now().UTC().Format(time.RFC3339))
}

func etag(b []byte) string {
	return fmt.Sprintf(`"%x"`, md5.Sum(b))
}

func s3Error(w http.ResponseWriter, status int, code, key string) {
	w.Header().Set("Content-Type", "application/xml")
	w.WriteHeader(status)
	fmt.Fprintf(w, `<?xml version="1.0" encoding="UTF-8"?><Error><Code>%s</Code><Key>%s</Key></Error>`, code, key)
}
