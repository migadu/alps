package maildir

import (
	"crypto/rand"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"runtime"
	"slices"
	"strings"
	"sync/atomic"
	"time"

	"github.com/emersion/go-maildir"
)

// alps never follows a symbolic link out of the user's maildir.
//
// Each operation opens the maildir as an os.Root, and every path below it, a
// folder, a folder's tmp, new and cur, a message's file and the settings
// file, is listed, opened, created, renamed and removed through that root.
// The root resolves a path one name at a time beneath itself, and refuses a
// link that leads out of the maildir wherever it is met. Each call is resolved
// on its own, so a directory swapped for such a link between one call and the
// next is refused too. A link that stays inside the maildir is followed.
//
// go-maildir opened every path as it was, following any link, so a folder, a
// cur directory or a message file linked to a directory outside had alps read
// the files there as the user's mail, and rename, move and remove them. The
// files are still go-maildir's, under the names it gives them; only the
// opening is done here.
//
// The maildir itself is opened by its configured path, which may lead through
// links of the administrator's.

// box is a mailbox's maildir beneath the root: dir is its path there, "." for
// INBOX. A box of a maildir not on disk yet, as an account nothing has been
// delivered to, has no root and holds nothing.
type box struct {
	root *os.Root
	dir  string
}

func (b box) path(elem ...string) string {
	return filepath.Join(append([]string{b.dir}, elem...)...)
}

func (b box) missing(sub string) error {
	return &fs.PathError{Op: "open", Path: b.path(sub), Err: fs.ErrNotExist}
}

// init makes the box's maildir, with its tmp, new and cur, keeping what is
// there already.
func (b box) init() error {
	if b.root == nil {
		return b.missing("")
	}
	dirs := []string{b.path("tmp"), b.path("new"), b.path("cur")}
	if b.dir != "." {
		dirs = append([]string{b.dir}, dirs...)
	}
	for _, dir := range dirs {
		if err := b.root.Mkdir(dir, 0o700); err != nil && !errors.Is(err, fs.ErrExist) {
			return err
		}
	}
	return nil
}

// names lists a directory of the box, leaving out what go-maildir leaves out:
// the names that begin with a dot.
func (b box) names(sub string) ([]string, error) {
	if b.root == nil {
		return nil, b.missing(sub)
	}
	f, err := b.root.Open(b.path(sub))
	if err != nil {
		return nil, err
	}
	defer f.Close()
	all, err := f.Readdirnames(-1)
	if err != nil {
		return nil, err
	}
	names := all[:0]
	for _, name := range all {
		if !strings.HasPrefix(name, ".") {
			names = append(names, name)
		}
	}
	return names, nil
}

// unseen moves what was delivered to new into cur, dropping any info a
// delivery gave it, as go-maildir's Unseen does.
func (b box) unseen() error {
	names, err := b.names("new")
	if err != nil {
		return err
	}
	for _, name := range names {
		key, _, _ := strings.Cut(name, separator)
		if err := b.root.Rename(b.path("new", name), b.path("cur", key+separator+"2,")); err != nil {
			return err
		}
	}
	return nil
}

// messages answers every message in cur, as go-maildir's Walk does: a name
// that is not a message's is reported, after the others.
func (b box) messages() ([]*mailFile, error) {
	names, err := b.names("cur")
	if err != nil {
		return nil, err
	}
	var msgs []*mailFile
	var malformed []error
	for _, name := range names {
		m, err := b.file(name)
		if err != nil {
			malformed = append(malformed, err)
			continue
		}
		msgs = append(msgs, m)
	}
	return msgs, errors.Join(malformed...)
}

func (b box) file(name string) (*mailFile, error) {
	key, flags, err := parseName(name)
	if err != nil {
		return nil, err
	}
	return &mailFile{box: b, name: name, key: key, flags: flags}, nil
}

// byKey finds the message of the key in cur: by the names go-maildir guesses
// first, and then among all of them, as its MessageByKey does. None answers
// fs.ErrNotExist.
func (b box) byKey(key string) (*mailFile, error) {
	if b.root == nil {
		return nil, b.missing("cur")
	}
	for _, guess := range nameGuesses(key) {
		if _, err := b.root.Lstat(b.path("cur", guess)); err == nil {
			return b.file(guess)
		}
	}
	names, err := b.names("cur")
	if err != nil {
		return nil, err
	}
	for _, name := range names {
		if strings.HasPrefix(name, key+separator) {
			return b.file(name)
		}
	}
	return nil, &fs.PathError{Op: "lookup", Path: b.path("cur", key), Err: fs.ErrNotExist}
}

// create starts a message in tmp under a new key, as go-maildir's Create
// does. Closing the writer moves it into cur, under a name that carries its
// flags.
func (b box) create(flags []maildir.Flag) (*mailFile, io.WriteCloser, error) {
	if b.root == nil {
		return nil, nil, b.missing("tmp")
	}
	key, err := newKey()
	if err != nil {
		return nil, nil, err
	}
	tmp := b.path("tmp", key)
	f, err := b.root.OpenFile(tmp, os.O_CREATE|os.O_WRONLY|os.O_EXCL, 0o666)
	if err != nil {
		return nil, nil, err
	}
	m := &mailFile{box: b, name: formatName(key, flags), key: key, flags: slices.Clone(flags)}
	return m, &tmpFile{File: f, root: b.root, tmp: tmp, dest: m.path()}, nil
}

// tmpFile is a message being written in tmp, moved into cur when closed.
type tmpFile struct {
	*os.File
	root      *os.Root
	tmp, dest string
}

func (t *tmpFile) Close() error {
	if err := t.File.Close(); err != nil {
		return err
	}
	return t.root.Rename(t.tmp, t.dest)
}

// mailFile is a message's file in a box's cur.
type mailFile struct {
	box   box
	name  string
	key   string
	flags []maildir.Flag
}

func (m *mailFile) Key() string           { return m.key }
func (m *mailFile) Flags() []maildir.Flag { return m.flags }
func (m *mailFile) path() string          { return m.box.path("cur", m.name) }

func (m *mailFile) Open() (io.ReadCloser, error) {
	return m.box.root.Open(m.path())
}

func (m *mailFile) Remove() error {
	return m.box.root.Remove(m.path())
}

// SetFlags renames the file to carry the flags, sorted and once each.
func (m *mailFile) SetFlags(flags []maildir.Flag) error {
	name := formatName(m.key, flags)
	_, flags, err := parseName(name)
	if err != nil {
		return err
	}
	if err := m.box.root.Rename(m.path(), m.box.path("cur", name)); err != nil {
		return err
	}
	m.name, m.flags = name, flags
	return nil
}

// MoveTo moves the file into the cur of target, a box beneath the same root,
// under the name it has.
func (m *mailFile) MoveTo(target box) error {
	if err := m.box.root.Rename(m.path(), target.path("cur", m.name)); err != nil {
		return err
	}
	m.box = target
	return nil
}

// separator divides a message's file name into its key and its info, as
// go-maildir divides it on this system.
var separator = func() string {
	if runtime.GOOS == "windows" {
		return ";"
	}
	return ":"
}()

// parseName reads a message's file name as go-maildir does, with its errors.
func parseName(name string) (string, []maildir.Flag, error) {
	split := strings.FieldsFunc(name, func(r rune) bool { return string(r) == separator })
	if len(split) < 2 {
		return "", nil, &maildir.MailfileError{Name: name}
	}
	key, info := split[0], split[1]
	switch {
	case len(info) < 2, info[1] != ',':
		return "", nil, &maildir.FlagError{Info: info}
	case info[0] == '1':
		return "", nil, &maildir.FlagError{Info: info, Experimental: true}
	case info[0] != '2':
		return "", nil, &maildir.FlagError{Info: info}
	}
	flags := []maildir.Flag(info[2:])
	slices.Sort(flags)
	return key, flags, nil
}

// formatName is a message's file name with the flags, sorted and once each,
// as go-maildir writes it.
func formatName(key string, flags []maildir.Flag) string {
	sorted := slices.Clone(flags)
	slices.Sort(sorted)
	info := "2,"
	for _, f := range sorted {
		if rune(info[len(info)-1]) != rune(f) {
			info += string(f)
		}
	}
	return key + separator + info
}

// nameGuesses are the names go-maildir tries for a key before it lists cur.
func nameGuesses(key string) []string {
	name := key + separator + "2,"
	var guesses []string
	for _, flags := range []string{"", "P", "R", "S", "D", "F", "FP", "FPS", "FR", "FRS", "FS", "PS", "RS"} {
		guesses = append(guesses, name+flags)
	}
	return guesses
}

var keyCounter int64 = 10000

// newKey is a key no other writer chooses, made as go-maildir makes one: the
// time, this process, a counter and random bytes, and the host.
func newKey() (string, error) {
	host, err := os.Hostname()
	if err != nil {
		return "", err
	}
	host = strings.ReplaceAll(host, "/", `\057`)
	host = strings.ReplaceAll(host, separator, `\072`)
	random := make([]byte, 10)
	if _, err := io.ReadFull(rand.Reader, random); err != nil {
		return "", err
	}
	return fmt.Sprintf("%d.%d%d%x.%s", time.Now().Unix(), os.Getpid(), atomic.AddInt64(&keyCounter, 1), random, host), nil
}
