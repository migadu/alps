package imap

import (
	"bufio"
	"crypto/tls"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"log"
	"net"
	"strconv"
	"strings"
	"time"
	"unicode/utf16"
	"unicode/utf8"

	"github.com/migadu/alps/provider"
)

// subscriptionsTTL is how long subscriptions read with LSUB are taken as they
// were read. Reading them again costs a sign-in, so a listing within it uses
// what was read; what alps subscribes or unsubscribes itself is noted in it at
// once (see noteSubscribed), and only another client's change waits for it.
const subscriptionsTTL = 5 * time.Minute

// The bounds of an LSUB exchange beyond its time: a line, a literal, and the
// folders it may name. A server's answer is read into memory, and one that
// never ends is refused rather than kept.
const (
	maxLsubLine    = 64 << 10
	maxLsubLiteral = 64 << 10
	maxLsubFolders = 100000
)

// markSubscriptions marks the folders of a plain LIST from LSUB (RFC 3501
// §6.3.9): the folders it lists are subscribed, and the others are not. A
// plain LIST says nothing about subscriptions, and every folder counted as
// subscribed, so on a server without LIST-EXTENDED a folder unsubscribed here
// or in another client was listed as subscribed again.
//
// When the subscriptions cannot be read, every folder stays subscribed, as
// before. Counting none would hide no more in the sidebar, which ignores a
// listing with nothing subscribed, but it would cost the sidebar every
// folder's unread count, read only for subscribed folders, and a rename would
// no longer carry a folder's subscription over to its new name.
func (p *IMAPProvider) markSubscriptions(mailboxes []provider.Mailbox) {
	subscribed := p.subscriptions()
	if subscribed == nil {
		return
	}
	for i := range mailboxes {
		mailboxes[i].Subscribed = subscribed[mailboxes[i].Name]
	}
}

// subscriptions returns the subscribed folders, read with LSUB at most once
// per subscriptionsTTL, or nil when they are not known. The map is not
// changed once returned: noteSubscribed replaces it.
func (p *IMAPProvider) subscriptions() map[string]bool {
	if p.lsub == nil {
		return nil
	}
	// One read at a time: two listings at once sign in once.
	p.lsubLock.Lock()
	defer p.lsubLock.Unlock()

	p.cacheLock.RLock()
	subscribed, readAt := p.subscribed, p.subscribedAt
	p.cacheLock.RUnlock()
	if !readAt.IsZero() && time.Since(readAt) < subscriptionsTTL {
		return subscribed
	}

	subscribed, err := p.lsub.read()
	if err != nil {
		// Not the user's to see, and not a reason to fail the listing: the
		// folders count as subscribed, as before, until the next read.
		if p.debug {
			log.Printf("alps/provider: subscriptions not read with LSUB, counting every folder subscribed: %v", err)
		}
		subscribed = nil
	}
	p.cacheLock.Lock()
	p.subscribed, p.subscribedAt = subscribed, time.Now()
	p.cacheLock.Unlock()
	return subscribed
}

// noteSubscribed records a subscription alps changed itself, and the server
// took, in the subscriptions read with LSUB, so that the next listing shows
// it without signing in again to read them.
func (p *IMAPProvider) noteSubscribed(name string, subscribed bool) {
	// INBOX is case-insensitive in commands, and LIST/LSUB normalize it.
	if strings.EqualFold(name, "INBOX") {
		name = "INBOX"
	}
	p.cacheLock.Lock()
	defer p.cacheLock.Unlock()
	if p.subscribed == nil {
		return
	}
	next := make(map[string]bool, len(p.subscribed)+1)
	for k, v := range p.subscribed {
		next[k] = v
	}
	if subscribed {
		next[name] = true
	} else {
		delete(next, name)
	}
	p.subscribed = next
}

// lsubLogin is how to sign in again, on a connection of alps's own, to ask
// the server its subscriptions: the same server, TLS and timeout as the
// session's connection, and the same LOGIN.
//
// The session's connection cannot ask: the IMAP client alps uses has no LSUB,
// and an LSUB answer arriving on its connection would end it as a response it
// does not know.
type lsubLogin struct {
	address  string
	tls      bool
	insecure bool
	timeout  time.Duration
	guard    TargetGuard
	username string
	password string
}

// read signs in, asks LSUB "" "*", and signs out. The whole exchange is
// bounded by the timeout the session's connection has.
func (l *lsubLogin) read() (map[string]bool, error) {
	timeout := l.timeout
	if timeout == 0 {
		timeout = 30 * time.Second // as connect
	}
	deadline := time.Now().Add(timeout)
	host, _, err := net.SplitHostPort(l.address)
	if err != nil {
		return nil, err
	}
	dialer := &net.Dialer{Timeout: timeout, Deadline: deadline, Control: controlFor(l.guard)}
	tlsConfig := &tls.Config{ServerName: host, NextProtos: []string{"imap"}}

	var conn net.Conn
	if l.tls {
		conn, err = tls.DialWithDialer(dialer, "tcp", l.address, tlsConfig)
	} else {
		conn, err = dialer.Dial("tcp", l.address)
	}
	if err != nil {
		return nil, fmt.Errorf("connect: %w", err)
	}
	defer conn.Close()
	if err := conn.SetDeadline(deadline); err != nil {
		return nil, err
	}
	s := &lsubSession{conn: conn, r: bufio.NewReader(conn)}

	greeting, _, err := s.readResponse()
	if err != nil {
		return nil, fmt.Errorf("greeting: %w", err)
	}
	status := strings.ToUpper(firstWord(strings.TrimPrefix(greeting, "* ")))
	if !strings.HasPrefix(greeting, "* ") || (status != "OK" && status != "PREAUTH") {
		return nil, fmt.Errorf("greeting: %q", greeting)
	}

	if !l.tls && !l.insecure {
		// STARTTLS, as the session's connection did; PREAUTH leaves no way
		// to it, and the credentials are not sent in the clear.
		if status == "PREAUTH" {
			return nil, errors.New("PREAUTH before STARTTLS")
		}
		if err := s.command("STARTTLS"); err != nil {
			return nil, err
		}
		// Anything the server sent after its OK would be read as if it came
		// over TLS.
		if s.r.Buffered() > 0 {
			return nil, errors.New("STARTTLS: data before the TLS handshake")
		}
		tlsConn := tls.Client(conn, tlsConfig)
		if err := tlsConn.Handshake(); err != nil {
			return nil, fmt.Errorf("STARTTLS: %w", err)
		}
		s.conn, s.r = tlsConn, bufio.NewReader(tlsConn)
	}

	if status != "PREAUTH" {
		if err := s.command("LOGIN", l.username, l.password); err != nil {
			return nil, err
		}
	}

	subscribed := map[string]bool{}
	s.untagged = func(text string, literals []string) error {
		if !strings.EqualFold(firstWord(text), "LSUB") {
			return nil
		}
		name, err := lsubName(text[len("LSUB"):], literals)
		if err != nil {
			return err
		}
		if len(subscribed) >= maxLsubFolders {
			return errors.New("LSUB: too many folders")
		}
		subscribed[name] = true
		return nil
	}
	if err := s.command("LSUB", "", "*"); err != nil {
		return nil, err
	}
	s.untagged = nil
	s.command("LOGOUT") // what it answers changes nothing
	return subscribed, nil
}

// lsubSession is one IMAP connection, spoken to a command at a time.
type lsubSession struct {
	conn net.Conn
	r    *bufio.Reader
	tags int
	// untagged is handed each untagged response but BYE, without its "* ".
	untagged func(text string, literals []string) error
}

// command sends a command whose arguments are strings, and reads its answer
// up to the tagged one, which is an error unless it is OK.
func (s *lsubSession) command(name string, args ...string) error {
	s.tags++
	tag := "L" + strconv.Itoa(s.tags)
	line := tag + " " + name
	for _, arg := range args {
		line += " "
		if quotable(arg) {
			line += `"` + strings.NewReplacer(`\`, `\\`, `"`, `\"`).Replace(arg) + `"`
			continue
		}
		// A synchronizing literal (RFC 3501 §4.3): the server says "+"
		// before it takes the octets.
		if _, err := io.WriteString(s.conn, line+"{"+strconv.Itoa(len(arg))+"}\r\n"); err != nil {
			return err
		}
		if err := s.awaitContinuation(tag); err != nil {
			return fmt.Errorf("%s: %w", name, err)
		}
		line = arg
	}
	if _, err := io.WriteString(s.conn, line+"\r\n"); err != nil {
		return err
	}
	for {
		text, literals, err := s.readResponse()
		if err != nil {
			return fmt.Errorf("%s: %w", name, err)
		}
		if done, err := s.answer(tag, name, text, literals); done || err != nil {
			return err
		}
	}
}

// awaitContinuation reads up to the server's "+", which asks for a literal's
// octets.
func (s *lsubSession) awaitContinuation(tag string) error {
	for {
		text, literals, err := s.readResponse()
		if err != nil {
			return err
		}
		if strings.HasPrefix(text, "+") {
			return nil
		}
		if done, err := s.answer(tag, "", text, literals); done {
			if err == nil {
				err = errors.New("answered before the literal was sent")
			}
			return err
		}
	}
}

// answer takes one response to the command tagged tag: whether it ended the
// command, and the error it ended it with.
func (s *lsubSession) answer(tag, name, text string, literals []string) (bool, error) {
	if rest, ok := strings.CutPrefix(text, "* "); ok {
		if strings.EqualFold(firstWord(rest), "BYE") {
			return true, fmt.Errorf("the server closed the connection: %q", rest)
		}
		if s.untagged != nil {
			if err := s.untagged(rest, literals); err != nil {
				return true, err
			}
		}
		return false, nil
	}
	rest, ok := strings.CutPrefix(text, tag+" ")
	if !ok {
		return false, nil
	}
	if !strings.EqualFold(firstWord(rest), "OK") {
		return true, fmt.Errorf("refused: %q", rest)
	}
	return true, nil
}

// readResponse reads one response: its line, with each literal it carries
// taken out and a NUL, which no line holds, left in its place.
func (s *lsubSession) readResponse() (string, []string, error) {
	var text strings.Builder
	var literals []string
	for {
		line, err := s.readLine()
		if err != nil {
			return "", nil, err
		}
		if text.Len() == 0 && len(literals) == 0 {
			// Only LSUB's mailbox name can be a literal here. Greetings,
			// tagged replies and continuations carry resp-text, where a
			// final "{number}" is just text (RFC 3501 section 9).
			rest, ok := strings.CutPrefix(line, "* ")
			if !ok || !strings.EqualFold(firstWord(rest), "LSUB") {
				return line, nil, nil
			}
		}
		size, rest, ok := literalAtEnd(line)
		if !ok {
			if text.Len()+len(line) > maxLsubLine {
				return "", nil, errors.New("a response too long to read")
			}
			text.WriteString(line)
			return text.String(), literals, nil
		}
		// LSUB has one mailbox name, hence at most one literal. Refusing
		// a second also bounds the aggregate allocation of a malformed
		// response, rather than only each literal on its own.
		if len(literals) != 0 || size > maxLsubLiteral || text.Len()+len(rest)+1 > maxLsubLine {
			return "", nil, errors.New("a response too long to read")
		}
		literal := make([]byte, size)
		if _, err := io.ReadFull(s.r, literal); err != nil {
			return "", nil, err
		}
		text.WriteString(rest)
		text.WriteByte(0)
		literals = append(literals, string(literal))
	}
}

// readLine reads a line without its CRLF, refusing one past maxLsubLine.
func (s *lsubSession) readLine() (string, error) {
	var line []byte
	for {
		chunk, err := s.r.ReadSlice('\n')
		if len(line)+len(chunk) > maxLsubLine {
			return "", errors.New("a line too long to read")
		}
		line = append(line, chunk...)
		if err == bufio.ErrBufferFull {
			continue
		}
		if err != nil {
			return "", err
		}
		return strings.TrimSuffix(strings.TrimSuffix(string(line), "\n"), "\r"), nil
	}
}

// literalAtEnd reads the "{size}" a line ends with when a literal follows it,
// and returns the line before it.
func literalAtEnd(line string) (int, string, bool) {
	if !strings.HasSuffix(line, "}") {
		return 0, "", false
	}
	open := strings.LastIndexByte(line, '{')
	if open < 0 {
		return 0, "", false
	}
	size, err := strconv.Atoi(line[open+1 : len(line)-1])
	if err != nil || size < 0 {
		return 0, "", false
	}
	return size, line[:open], true
}

// quotable reports whether s can be sent as a quoted string: TEXT-CHARs only
// (RFC 3501 §9). Anything else goes as a literal.
func quotable(s string) bool {
	for i := 0; i < len(s); i++ {
		if c := s[i]; c == 0 || c == '\r' || c == '\n' || c >= 0x80 {
			return false
		}
	}
	return true
}

func firstWord(s string) string {
	word, _, _ := strings.Cut(s, " ")
	return word
}

// lsubName reads the folder an LSUB response names, from what follows the
// word LSUB: a flag list, the delimiter, quoted or NIL, and the name, as an
// atom, a quoted string or a literal (RFC 3501 §7.2.3).
func lsubName(text string, literals []string) (string, error) {
	r := &responseReader{text: text, literals: literals}
	if !r.sp() || !r.flags() || !r.sp() {
		return "", fmt.Errorf("LSUB: unreadable %q", text)
	}
	if !r.word("NIL") {
		if _, ok := r.quoted(); !ok {
			return "", fmt.Errorf("LSUB: unreadable delimiter in %q", text)
		}
	}
	if !r.sp() {
		return "", fmt.Errorf("LSUB: no name in %q", text)
	}
	name, ok := r.astring()
	if !ok || name == "" || r.i != len(r.text) || len(r.literals) != 0 {
		return "", fmt.Errorf("LSUB: unreadable name in %q", text)
	}
	return decodeMailboxName(name)
}

// responseReader reads the parts of a response line as readResponse gives it.
type responseReader struct {
	text     string
	literals []string
	i        int
}

func (r *responseReader) sp() bool {
	if r.i < len(r.text) && r.text[r.i] == ' ' {
		r.i++
		return true
	}
	return false
}

// flags skips a parenthesized list of flags.
func (r *responseReader) flags() bool {
	if r.i >= len(r.text) || r.text[r.i] != '(' {
		return false
	}
	end := strings.IndexByte(r.text[r.i:], ')')
	if end < 0 {
		return false
	}
	r.i += end + 1
	return true
}

func (r *responseReader) word(w string) bool {
	if len(r.text)-r.i >= len(w) && strings.EqualFold(r.text[r.i:r.i+len(w)], w) &&
		(r.i+len(w) == len(r.text) || r.text[r.i+len(w)] == ' ') {
		r.i += len(w)
		return true
	}
	return false
}

func (r *responseReader) quoted() (string, bool) {
	if r.i >= len(r.text) || r.text[r.i] != '"' {
		return "", false
	}
	var b strings.Builder
	for r.i++; r.i < len(r.text); r.i++ {
		switch c := r.text[r.i]; c {
		case '\\':
			if r.i++; r.i >= len(r.text) {
				return "", false
			}
			b.WriteByte(r.text[r.i])
		case '"':
			r.i++
			return b.String(), true
		default:
			b.WriteByte(c)
		}
	}
	return "", false
}

// astring reads an atom, a quoted string or a literal.
func (r *responseReader) astring() (string, bool) {
	if r.i >= len(r.text) {
		return "", false
	}
	switch r.text[r.i] {
	case '"':
		return r.quoted()
	case 0:
		r.i++
		if len(r.literals) == 0 {
			return "", false
		}
		literal := r.literals[0]
		r.literals = r.literals[1:]
		return literal, true
	}
	start := r.i
	for r.i < len(r.text) && r.text[r.i] != ' ' && r.text[r.i] != 0 {
		switch r.text[r.i] {
		case '(', ')', '{', '"', '\\', '%', '*':
			return "", false
		}
		r.i++
	}
	return r.text[start:r.i], true
}

// decodeMailboxName gives a folder's name as the session's connection gives
// LIST's: INBOX in any case is INBOX, and anything else is decoded from
// modified UTF-7 (RFC 3501 §5.1.3), with raw UTF-8 taken as it is. It refuses
// what that would, so that a name is never read one way here and another
// there. The client library's decoder is internal to it, so this is its
// equal.
func decodeMailboxName(name string) (string, error) {
	if strings.EqualFold(name, "INBOX") {
		return "INBOX", nil
	}
	if !utf8.ValidString(name) {
		return "", errors.New("a folder name that is not UTF-8")
	}
	var b strings.Builder
	shifted := false // the last part was a base64 one
	for i := 0; i < len(name); i++ {
		c := name[i]
		if c < 0x20 || (c > 0x7e && c < utf8.RuneSelf) {
			return "", fmt.Errorf("invalid modified UTF-7 in %q", name)
		}
		if c != '&' {
			b.WriteByte(c)
			shifted = false
			continue
		}
		end := strings.IndexByte(name[i+1:], '-')
		if end < 0 {
			return "", fmt.Errorf("invalid modified UTF-7 in %q", name)
		}
		encoded := name[i+1 : i+1+end]
		i += end + 1
		if encoded == "" {
			b.WriteByte('&')
			shifted = false
			continue
		}
		decoded, ok := decodeUTF7Base64(encoded)
		if !ok || shifted {
			return "", fmt.Errorf("invalid modified UTF-7 in %q", name)
		}
		b.WriteString(decoded)
		shifted = true
	}
	return b.String(), nil
}

var utf7Base64 = base64.NewEncoding("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+,").WithPadding(base64.NoPadding)

// decodeUTF7Base64 decodes the base64 part of a modified UTF-7 name: UTF-16BE,
// with none of the characters that stand for themselves.
func decodeUTF7Base64(encoded string) (string, bool) {
	if strings.ContainsAny(encoded, "=\r\n") {
		return "", false
	}
	raw, err := utf7Base64.DecodeString(encoded)
	if err != nil || len(raw)%2 == 1 {
		return "", false
	}
	units := make([]uint16, len(raw)/2)
	for i := range units {
		units[i] = uint16(raw[2*i])<<8 | uint16(raw[2*i+1])
	}
	var b strings.Builder
	for i := 0; i < len(units); i++ {
		r := rune(units[i])
		if utf16.IsSurrogate(r) {
			if i+1 == len(units) {
				return "", false
			}
			i++
			if r = utf16.DecodeRune(r, rune(units[i])); r == utf8.RuneError {
				return "", false
			}
		} else if r >= 0x20 && r <= 0x7e {
			return "", false
		}
		b.WriteRune(r)
	}
	return b.String(), true
}
