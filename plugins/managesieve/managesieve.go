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
		if err != nil || len(parts) == 0 {
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
		if err != nil || len(parts) == 0 {
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

func (c *MSClient) PutScript(name, content string) error {
	cmd := fmt.Sprintf("PUTSCRIPT %q {%d+}\r\n%s", name, len(content), content)
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
			content.WriteString(strings.Trim(line, "\""))
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
			continue // skip malformed capabilities
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

func (c *MSClient) readLine() (string, error) {
	c.conn.SetReadDeadline(time.Now().Add(15 * time.Second))
	line, err := c.r.ReadString('\n')
	if err == nil && c.debugWriter != nil {
		c.debugWriter.Write([]byte("S: " + line))
	}
	if err != nil {
		return "", err
	}
	return strings.TrimSuffix(strings.TrimSuffix(line, "\n"), "\r"), nil
}

func parseLiteralSize(line string) (int, error) {
	line = strings.TrimPrefix(line, "{")
	line = strings.TrimSuffix(line, "+")
	line = strings.TrimSuffix(line, "}")
	return strconv.Atoi(line)
}

func (c *MSClient) parseStringList(line string) ([]string, error) {
	// A very rudimentary parser for "string" "string"
	var out []string

	line = strings.TrimSpace(line)
	for len(line) > 0 {
		if strings.HasPrefix(line, "\"") {
			idx := strings.Index(line[1:], "\"")
			if idx == -1 {
				return out, nil
			}
			out = append(out, line[1:idx+1])
			line = strings.TrimSpace(line[idx+2:])
		} else if strings.HasPrefix(line, "{") {
			// Literal in capabilities? Rare but possible.
			// Format: {size}\r\n
			sizeStr := line[1:strings.Index(line, "}")]
			size, _ := strconv.Atoi(sizeStr)
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
