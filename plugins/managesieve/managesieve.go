package managesieve

import (
	"bufio"
	"bytes"
	"crypto/tls"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"net"
	"strconv"
	"strings"
	"time"

	"github.com/emersion/go-sasl"
)

// MSClient is a minimal ManageSieve client.
type MSClient struct {
	conn         net.Conn
	r            *bufio.Reader
	capabilities map[string]string
	debugWriter  io.Writer
}

// Dial connects to a ManageSieve server and reads initial capabilities.
func Dial(addr string) (*MSClient, error) {
	conn, err := net.DialTimeout("tcp", addr, 15*time.Second)
	if err != nil {
		return nil, err
	}
	c := &MSClient{
		conn:         conn,
		r:            bufio.NewReader(conn),
		capabilities: make(map[string]string),
	}
	if err := c.readResponse(); err != nil {
		c.conn.Close()
		return nil, err
	}
	return c, nil
}

// Discover performs DNS SRV discovery for a domain.
func Discover(domain string) (string, error) {
	_, addrs, err := net.LookupSRV("sieve", "tcp", domain)
	if err != nil {
		return "", err
	}
	if len(addrs) == 0 {
		return "", fmt.Errorf("no SRV records found for _sieve._tcp.%s", domain)
	}
	target := strings.TrimSuffix(addrs[0].Target, ".")
	return fmt.Sprintf("%s:%d", target, addrs[0].Port), nil
}

func (c *MSClient) Close() error {
	c.sendCommand("LOGOUT")
	return c.conn.Close()
}

// SetDebug sets the io.Writer where protocol logs will be written.
func (c *MSClient) SetDebug(w io.Writer) {
	c.debugWriter = w
}

// StartTLS upgrades the connection to TLS.
func (c *MSClient) StartTLS(config *tls.Config) error {
	if _, ok := c.capabilities["STARTTLS"]; !ok {
		return errors.New("server does not support STARTTLS")
	}
	if err := c.sendCommand("STARTTLS"); err != nil {
		return err
	}
	if err := c.readResponse(); err != nil {
		return err
	}
	tlsConn := tls.Client(c.conn, config)
	if err := tlsConn.Handshake(); err != nil {
		return err
	}
	c.conn = tlsConn
	c.r = bufio.NewReader(c.conn)
	// Read new capabilities after STARTTLS (RFC 5804 requires server to send them automatically)
	if err := c.readResponse(); err != nil {
		return err
	}
	return nil
}

// Authenticate plain SASL authentication.
func (c *MSClient) Authenticate(saslClient sasl.Client) error {
	mech, ir, err := saslClient.Start()
	if err != nil {
		return err
	}

	cmd := fmt.Sprintf("AUTHENTICATE %q", mech)
	logCmd := cmd
	if len(ir) > 0 {
		cmd += fmt.Sprintf(" %q", base64.StdEncoding.EncodeToString(ir))
		logCmd += " [REDACTED]"
	}

	if err := c.sendCommandWithLog(cmd, logCmd); err != nil {
		return err
	}

	for {
		line, err := c.readLine()
		if err != nil {
			return err
		}

		if strings.HasPrefix(line, "OK") {
			return nil
		}
		if strings.HasPrefix(line, "NO") || strings.HasPrefix(line, "BYE") {
			return fmt.Errorf("authentication failed: %s", line)
		}

		parts, err := c.parseStringList(line)
		if err != nil {
			return err
		}
		if len(parts) == 0 {
			continue
		}

		if len(parts) > 1 {
			c.capabilities[strings.ToUpper(parts[0])] = parts[1]
			continue
		}

		// Single string: could be a challenge or a single-word capability
		challenge, errDecode := base64.StdEncoding.DecodeString(parts[0])
		if errDecode != nil {
			c.capabilities[strings.ToUpper(parts[0])] = ""
			continue
		}

		resp, err := saslClient.Next(challenge)
		if err != nil {
			if err == sasl.ErrUnexpectedServerChallenge || strings.Contains(err.Error(), "unexpected server challenge") {
				c.capabilities[strings.ToUpper(parts[0])] = ""
				continue
			}
			return err
		}

		if err := c.sendCommandWithLog(fmt.Sprintf("%q", base64.StdEncoding.EncodeToString(resp)), `"[REDACTED]"`); err != nil {
			return err
		}
	}
}

// Script describes a single server-side Sieve script.
type Script struct {
	Name   string
	Active bool
}

// ListScripts returns all scripts on the server (RFC 5804 LISTSCRIPTS),
// marking which one (if any) is currently active.
func (c *MSClient) ListScripts() ([]Script, error) {
	if err := c.sendCommand("LISTSCRIPTS"); err != nil {
		return nil, err
	}

	var scripts []Script
	for {
		line, err := c.readLine()
		if err != nil {
			return nil, err
		}

		if strings.HasPrefix(line, "OK") {
			return scripts, nil
		}
		if strings.HasPrefix(line, "NO") || strings.HasPrefix(line, "BYE") {
			return nil, fmt.Errorf("LISTSCRIPTS error: %s", line)
		}

		// Each line is a script name (quoted string or literal) optionally
		// followed by the ACTIVE flag: "catchall" ACTIVE
		parts, err := c.parseStringList(line)
		if err != nil {
			return nil, err
		}
		if len(parts) == 0 {
			continue
		}
		s := Script{Name: parts[0]}
		for _, p := range parts[1:] {
			if strings.EqualFold(p, "ACTIVE") {
				s.Active = true
			}
		}
		scripts = append(scripts, s)
	}
}

// PutScript stores a script under name (RFC 5804 PUTSCRIPT). The line break
// after the literal is written here, always: sendCommand adds one only to a
// command that does not end in one already, and a script that ends in a line
// break, or an empty one, left the command unended.
func (c *MSClient) PutScript(name, content string) error {
	cmd := fmt.Sprintf("PUTSCRIPT %q {%d+}\r\n%s\r\n", name, len(content), content)
	if err := c.sendCommand(cmd); err != nil {
		return err
	}
	return c.readResponse()
}

func (c *MSClient) SetActive(name string) error {
	cmd := fmt.Sprintf("SETACTIVE %q", name)
	if name == "" {
		cmd = "SETACTIVE \"\""
	}
	if err := c.sendCommand(cmd); err != nil {
		return err
	}
	return c.readResponse()
}

// DeleteScript removes a script (RFC 5804 DELETESCRIPT). The server refuses to
// delete the active script, so deactivate it with SetActive("") first.
func (c *MSClient) DeleteScript(name string) error {
	if err := c.sendCommand(fmt.Sprintf("DELETESCRIPT %q", name)); err != nil {
		return err
	}
	return c.readResponse()
}

func (c *MSClient) GetScript(name string) (string, error) {
	if err := c.sendCommand(fmt.Sprintf("GETSCRIPT %q", name)); err != nil {
		return "", err
	}

	var content bytes.Buffer
	var foundScript bool

	for {
		line, err := c.readLine()
		if err != nil {
			return "", err
		}

		if strings.HasPrefix(line, "OK") {
			if !foundScript {
				return "", errors.New("script not found")
			}
			return content.String(), nil
		}
		if strings.HasPrefix(line, "NO") || strings.HasPrefix(line, "BYE") {
			return "", fmt.Errorf("GETSCRIPT error: %s", line)
		}

		if strings.HasPrefix(line, "{") {
			size, err := parseLiteralSize(line)
			if err != nil {
				return "", err
			}
			if content.Len()+size > maxLiteralBytes {
				return "", fmt.Errorf("script exceeds the %d-byte limit", maxLiteralBytes)
			}
			lit := make([]byte, size)
			c.conn.SetReadDeadline(time.Now().Add(30 * time.Second))
			if _, err := io.ReadFull(c.r, lit); err != nil {
				return "", err
			}
			if c.debugWriter != nil {
				c.debugWriter.Write([]byte("S: [script content]\n"))
			}
			content.Write(lit)
			foundScript = true
		} else if strings.HasPrefix(line, "\"") {
			script, _, ok := readQuoted(line)
			if !ok {
				return "", fmt.Errorf("GETSCRIPT answered with an unclosed string: %q", line)
			}
			content.WriteString(script)
			foundScript = true
		}
	}
}

// readResponse reads ManageSieve responses.
// It parses capability lines and stops at OK, NO, or BYE.
func (c *MSClient) readResponse() error {
	c.capabilities = make(map[string]string)

	for {
		line, err := c.readLine()
		if err != nil {
			return err
		}

		if strings.HasPrefix(line, "OK") {
			return nil
		}
		if strings.HasPrefix(line, "NO") || strings.HasPrefix(line, "BYE") {
			return fmt.Errorf("server error: %s", line)
		}

		// Parse capability line: "CAPABILITY" "VALUE"
		// or "SIEVE" "fileinto reject"
		parts, err := c.parseStringList(line)
		if err != nil {
			return err
		}
		if len(parts) >= 1 {
			key := strings.ToUpper(parts[0])
			val := ""
			if len(parts) > 1 {
				val = parts[1]
			}
			c.capabilities[key] = val
		}
	}
}

func (c *MSClient) sendCommand(cmd string) error {
	return c.sendCommandWithLog(cmd, cmd)
}

func (c *MSClient) sendCommandWithLog(cmd, logCmd string) error {
	if !strings.HasSuffix(cmd, "\r\n") {
		cmd += "\r\n"
	}
	if !strings.HasSuffix(logCmd, "\r\n") {
		logCmd += "\r\n"
	}
	if c.debugWriter != nil {
		c.debugWriter.Write([]byte("C: " + logCmd))
	}
	c.conn.SetWriteDeadline(time.Now().Add(15 * time.Second))
	_, err := c.conn.Write([]byte(cmd))
	return err
}

// readLine reads one line of a response, without its line break. A line
// longer than maxLineBytes is a protocol error, and it closes the connection:
// the rest of the line is still to come, and nothing read after it would be
// in step with the server.
func (c *MSClient) readLine() (string, error) {
	c.conn.SetReadDeadline(time.Now().Add(15 * time.Second))
	var line []byte
	for {
		chunk, err := c.r.ReadSlice('\n')
		if len(line)+len(chunk) > maxLineBytes {
			c.conn.Close()
			return "", fmt.Errorf("server sent a line longer than %d bytes", maxLineBytes)
		}
		line = append(line, chunk...)
		if err == bufio.ErrBufferFull {
			continue
		}
		if err != nil {
			return "", err
		}
		break
	}
	if c.debugWriter != nil {
		c.debugWriter.Write([]byte("S: " + string(line)))
	}
	return strings.TrimSuffix(strings.TrimSuffix(string(line), "\n"), "\r"), nil
}

// maxLiteralBytes is the largest literal the client reads, and the largest
// script GetScript puts together from the literals it is sent. The sizes come
// from the server and are read into memory whole, so they are bounded: by the
// largest script alps takes from the page, as a larger one could not be saved
// back.
const maxLiteralBytes = maxScriptBytes

// maxLineBytes is the longest line the client reads, its line break included.
// The longest a server has reason to send is a script as a quoted string,
// which is held to the bound of one sent as a literal.
const maxLineBytes = maxLiteralBytes

// parseLiteralSize reads the size from a literal's header, "{size}" or
// "{size+}", which ends the line. A header that is not one, or a size past
// maxLiteralBytes, is an error: without the bounds, a negative size or one
// past what can be allocated panicked, and any other was allocated whole
// before a byte of it arrived.
func parseLiteralSize(header string) (int, error) {
	digits, ok := strings.CutPrefix(header, "{")
	if ok {
		digits, ok = strings.CutSuffix(digits, "}")
	}
	digits = strings.TrimSuffix(digits, "+")
	if !ok || digits == "" || strings.Trim(digits, "0123456789") != "" {
		return 0, fmt.Errorf("malformed literal header %q", header)
	}
	size, err := strconv.Atoi(digits)
	if err != nil || size > maxLiteralBytes {
		return 0, fmt.Errorf("literal of %s bytes exceeds the %d-byte limit", digits, maxLiteralBytes)
	}
	return size, nil
}

// readQuoted reads the quoted string that s starts with (RFC 5804 §4): what
// is between its quotes, with each escape undone, and what follows it on the
// line. The grammar escapes only a quote and a backslash, each with a
// backslash; whatever else a backslash comes before is taken as it is. ok is
// false for a string that is not closed on the line.
func readQuoted(s string) (value, rest string, ok bool) {
	var b strings.Builder
	for i := 1; i < len(s); i++ {
		switch s[i] {
		case '\\':
			if i++; i < len(s) {
				b.WriteByte(s[i])
			}
		case '"':
			return b.String(), s[i+1:], true
		default:
			b.WriteByte(s[i])
		}
	}
	return "", "", false
}

// parseStringList reads the strings on a response line. Its error is a
// literal that could not be read, which leaves the client out of step with
// the server: the callers end the exchange on one, rather than read on into
// the literal as if it were responses.
func (c *MSClient) parseStringList(line string) ([]string, error) {
	// A very rudimentary parser for "string" "string"
	var out []string

	line = strings.TrimSpace(line)
	for len(line) > 0 {
		if strings.HasPrefix(line, "\"") {
			value, rest, ok := readQuoted(line)
			if !ok {
				return out, nil
			}
			out = append(out, value)
			line = strings.TrimSpace(rest)
		} else if strings.HasPrefix(line, "{") {
			// Literal in capabilities? Rare but possible.
			// Format: {size}\r\n
			size, err := parseLiteralSize(line)
			if err != nil {
				return out, err
			}
			// we assume the rest of the line was empty, so we read size bytes
			lit := make([]byte, size)
			if _, err := io.ReadFull(c.r, lit); err != nil {
				return out, err
			}
			if c.debugWriter != nil {
				c.debugWriter.Write([]byte("S: [literal data]\n"))
			}
			out = append(out, string(lit))
			lineStr, _ := c.readLine()
			line = strings.TrimSpace(lineStr)
		} else {
			// Unquoted string? ManageSieve requires capabilities to be strings, but let's be safe
			idx := strings.Index(line, " ")
			if idx == -1 {
				out = append(out, line)
				break
			}
			out = append(out, line[:idx])
			line = strings.TrimSpace(line[idx:])
		}
	}
	return out, nil
}
