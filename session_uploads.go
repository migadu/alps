package alps

import (
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"sync"
)

// heldUploads is the set of uploads whose files are held (see upload): each
// is in it from when its request stores it until the last hold on it goes.
// The zero value is an empty set.
type heldUploads struct {
	mu      sync.Mutex
	uploads map[*upload]struct{}
}

func (h *heldUploads) add(u *upload) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.uploads == nil {
		h.uploads = make(map[*upload]struct{})
	}
	h.uploads[u] = struct{}{}
	u.heldIn = h
}

func (h *heldUploads) remove(u *upload) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.uploads, u)
}

// heldUploadFiles answers the paths of the temporary files that hold the bytes
// of the uploads still held: those a session keeps for a composer, and those a
// request has taken from it to send or save a message, which go back to the
// session if that fails. The temp-file sweep keeps them however old they are,
// since a session can keep an upload for as long as it lasts.
func (sm *SessionManager) heldUploadFiles() map[string]bool {
	sm.uploads.mu.Lock()
	forms := make([]*multipart.Form, 0, len(sm.uploads.uploads))
	for u := range sm.uploads.uploads {
		forms = append(forms, u.form)
	}
	sm.uploads.mu.Unlock()

	files := make(map[string]bool)
	for _, form := range forms {
		for _, fhs := range form.File {
			for _, fh := range fhs {
				if path := uploadFilePath(fh); path != "" {
					files[path] = true
				}
			}
		}
	}
	return files
}

// uploadFilePath answers the path of the temporary file that holds fh's
// bytes, or "" when they are kept in memory or the file is gone. A FileHeader
// does not say it, but its Open answers the file, or a section of it when the
// request's files share one.
func uploadFilePath(fh *multipart.FileHeader) string {
	f, err := fh.Open()
	if err != nil {
		return ""
	}
	defer f.Close()
	var r io.ReaderAt = f
	if section, ok := f.(interface {
		Outer() (io.ReaderAt, int64, int64)
	}); ok {
		r, _, _ = section.Outer()
	}
	if file, ok := r.(*os.File); ok {
		return filepath.Clean(file.Name())
	}
	return ""
}
