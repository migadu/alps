package alps

import (
	"io"
	"os"
	"path/filepath"
	"sync"
)

// Upload files remain protected while any attachment or send request holds
// them, including files shared by several parts of one multipart form.
var temporaryUploads = struct {
	sync.Mutex
	paths map[string]int
}{paths: make(map[string]int)}

func (u *upload) protectTemporaryFiles() {
	temporaryUploads.Lock()
	defer temporaryUploads.Unlock()
	seen := make(map[string]bool)
	for _, files := range u.form.File {
		for _, header := range files {
			f, err := header.Open()
			if err != nil {
				continue
			}
			file, ok := f.(*os.File)
			if !ok {
				// Shared disk parts and memory parts use a SectionReader.
				if section, shared := f.(interface {
					Outer() (io.ReaderAt, int64, int64)
				}); shared {
					outer, _, _ := section.Outer()
					file, _ = outer.(*os.File)
				}
			}
			if file != nil {
				if path, err := filepath.Abs(file.Name()); err == nil && !seen[path] {
					seen[path] = true
					u.tempPaths = append(u.tempPaths, path)
					temporaryUploads.paths[path]++
				}
			}
			f.Close()
		}
	}
}
