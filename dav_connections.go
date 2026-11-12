package alps

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/emersion/go-webdav/caldav"
	"github.com/emersion/go-webdav/carddav"
	"github.com/migadu/alps/provider"
)

var (
	ErrDAVInvalidServer       = errors.New("dav_invalid_server")
	ErrDAVCredentialsRequired = errors.New("dav_credentials_required")
	ErrDAVPasswordRequired    = errors.New("dav_password_required")
	ErrDAVValidationFailed    = errors.New("dav_auth_failed")
	// ErrDAVCorruptSavedRecord proves that a stored record was read but could
	// not be decoded or accepted. Storage and network failures do not prove a
	// personal connection exists and must not offer destructive recovery.
	ErrDAVCorruptSavedRecord = errors.New("corrupt saved DAV connection")
)

const davConnectionTimeout = 10 * time.Second

// DAVSettings contains only information safe to return to the settings page.
type DAVSettings struct {
	Server             string `json:"server"`
	DefaultServer      string `json:"default_server"`
	UseMailCredentials bool   `json:"use_mail_credentials"`
	Username           string `json:"username"`
	PasswordConfigured bool   `json:"password_configured"`
	Configured         bool   `json:"configured"`
	PersonalConfigured bool   `json:"personal_configured"`
	CanSave            bool   `json:"can_save"`
}

type DAVConnectionInput struct {
	Server             string `json:"server"`
	UseMailCredentials bool   `json:"use_mail_credentials"`
	Username           string `json:"username"`
	Password           string `json:"password,omitempty"`
}

// ResolvedDAVConnection is one account's effective connection. CacheKey changes
// with the endpoint, credentials or owning mail account, without exposing them.
type ResolvedDAVConnection struct {
	Server   string `json:"server"`
	Username string `json:"username"`
	Password string `json:"-"`
	CacheKey string `json:"-"`
	// restricted marks an endpoint the user chose, on a server that has not
	// opted in to private personal servers: it is reached over HTTPS only,
	// and only at public addresses. Administrator defaults are never
	// restricted, whichever credentials they are used with.
	restricted bool
}

type davConnectionRecord struct {
	Version            int    `json:"version"`
	Server             string `json:"server"`
	UseMailCredentials bool   `json:"use_mail_credentials"`
	Username           string `json:"username,omitempty"`
	PasswordEnc        string `json:"password_enc,omitempty"`
	PasswordServer     string `json:"password_server,omitempty"`
}

// The metadata around a ciphertext is writable by the mail account. Bind the
// secret's intended use inside Fernet as well, so changing metadata cannot
// make ALPS forward a retained DAV password to another endpoint or account.
type davCredentialPayload struct {
	Version  int    `json:"version"`
	Owner    string `json:"owner"`
	Service  string `json:"service"`
	Server   string `json:"server"`
	Username string `json:"username"`
	Password string `json:"password"`
}

// davOwner names the mail account a DAV credential belongs to. Mail logins
// are compared without regard to case (see SessionManager), so signing in as
// Ada@example.com must unlock what ada@example.com saved.
func (s *Session) davOwner() string {
	return strings.ToLower(s.Username())
}

func (s *Session) encryptDAVPassword(service, server, username, password string) (string, error) {
	payload, err := json.Marshal(davCredentialPayload{Version: 1, Owner: s.davOwner(), Service: service, Server: server, Username: username, Password: password})
	if err != nil {
		return "", err
	}
	return s.EncryptPassword(string(payload))
}

func (s *Session) decryptDAVPassword(service, server, username, ciphertext string) (string, error) {
	plaintext, err := s.DecryptPassword(ciphertext)
	if err != nil {
		return "", err
	}
	var payload davCredentialPayload
	if err := json.Unmarshal([]byte(plaintext), &payload); err != nil {
		return "", errors.New("invalid saved DAV credential")
	}
	if payload.Version != 1 || !strings.EqualFold(payload.Owner, s.Username()) || payload.Service != service || payload.Server != server || payload.Username != username || payload.Password == "" {
		return "", errors.New("saved DAV credential does not match this connection")
	}
	return payload.Password, nil
}

func davStoreKey(service string) (string, error) {
	if service != provider.ServiceCalDAV && service != provider.ServiceCardDAV {
		return "", ErrDAVInvalidServer
	}
	return "dav.connection." + service, nil
}

// parsePersonalDAVURL parses an endpoint a user supplied. It requires an
// explicit HTTPS scheme; unencrypted HTTP needs both the explicit +insecure
// scheme and the administrator's opt-in (server.dav_allow_private_servers).
// Credentials never belong in the endpoint itself.
func parsePersonalDAVURL(service, raw string, allowInsecure bool) (*url.URL, error) {
	if _, err := davStoreKey(service); err != nil {
		return nil, err
	}
	u, err := url.Parse(raw)
	if err != nil {
		return nil, ErrDAVInvalidServer
	}
	switch u.Scheme {
	case "https", service + "s":
		u.Scheme = "https"
	case "http+insecure", service + "+insecure":
		if !allowInsecure {
			return nil, ErrDAVInvalidServer
		}
		u.Scheme = "http"
	default:
		return nil, ErrDAVInvalidServer
	}
	if err := checkDAVURL(u); err != nil {
		return nil, err
	}
	return u, nil
}

// davAllowPrivate reports whether the administrator lets personal DAV
// servers use plain HTTP and loopback or private addresses.
func (s *Session) davAllowPrivate() bool {
	return s.manager.davAllowPrivate
}

func checkDAVURL(u *url.URL) error {
	if u == nil || (u.Scheme != "https" && u.Scheme != "http") || u.Host == "" || u.Hostname() == "" || u.User != nil || u.RawQuery != "" || u.ForceQuery || u.Fragment != "" || u.Opaque != "" {
		return ErrDAVInvalidServer
	}
	return nil
}

func publicDAVServer(raw string) string {
	u, err := ParseServerURL(raw)
	if err != nil || u.Opaque != "" {
		return ""
	}
	u.User, u.RawQuery, u.Fragment, u.ForceQuery = nil, "", "", false
	if u.Scheme == "" {
		return strings.TrimPrefix(u.String(), "//")
	}
	return u.String()
}

func (s *Session) readDAVConnection(service string) (*davConnectionRecord, error) {
	key, err := davStoreKey(service)
	if err != nil {
		return nil, err
	}
	var record davConnectionRecord
	err = provider.GetFresh(s.Store(), key, &record)
	if errors.Is(err, provider.ErrNoStoreEntry) {
		return nil, nil
	}
	if err != nil {
		var syntaxErr *json.SyntaxError
		var typeErr *json.UnmarshalTypeError
		if errors.As(err, &syntaxErr) || errors.As(err, &typeErr) {
			return nil, fmt.Errorf("%w: %w", ErrDAVCorruptSavedRecord, err)
		}
		return nil, fmt.Errorf("read DAV connection: %w", err)
	}
	if record.Version != 1 || (!record.UseMailCredentials && (record.Username == "" || record.PasswordEnc == "" || record.PasswordServer == "")) || (record.UseMailCredentials && (record.Username != "" || record.PasswordEnc != "" || record.PasswordServer != "")) {
		return nil, fmt.Errorf("%w: invalid record fields or version", ErrDAVCorruptSavedRecord)
	}
	if record.Server != "" {
		if _, err := parsePersonalDAVURL(service, record.Server, s.davAllowPrivate()); err != nil {
			return nil, fmt.Errorf("%w: invalid endpoint", ErrDAVCorruptSavedRecord)
		}
	}
	return &record, nil
}

func (s *Session) DAVConnectionSettings(service, defaultServer string) (DAVSettings, error) {
	record, err := s.readDAVConnection(service)
	if err != nil {
		return DAVSettings{}, err
	}
	settings := DAVSettings{DefaultServer: publicDAVServer(defaultServer), UseMailCredentials: true, Username: s.Username(), CanSave: s.manager.loginKey != nil, Configured: defaultServer != ""}
	if record != nil {
		settings.PersonalConfigured = true
		settings.Server = record.Server
		settings.UseMailCredentials = record.UseMailCredentials
		if !record.UseMailCredentials {
			settings.Username = record.Username
		}
		settings.PasswordConfigured = s.davSavedPasswordUsable(service, defaultServer, record)
		settings.Configured = record.Server != "" || defaultServer != ""
	}
	return settings, nil
}

// davSavedPasswordUsable reports whether a blank password in the settings form
// can stand for the saved one: it must still decrypt with the current login
// key, and belong to the endpoint the connection now resolves to. After a key
// rotation or a change of the administrator's default the page must ask for
// the password again instead of promising to keep one it cannot read.
func (s *Session) davSavedPasswordUsable(service, defaultServer string, record *davConnectionRecord) bool {
	if record.UseMailCredentials || record.PasswordEnc == "" {
		return false
	}
	server := record.Server
	if server == "" {
		server = defaultServer
	}
	// A default without a scheme is found by DNS discovery, which a settings
	// read must not wait for; the binding inside the ciphertext is still
	// checked, and saving compares against the discovered endpoint.
	if strings.Contains(server, "://") {
		endpoint, err := normalDAVURL(server)
		if err != nil || endpoint.String() != record.PasswordServer {
			return false
		}
	}
	_, err := s.decryptDAVPassword(service, record.PasswordServer, record.Username, record.PasswordEnc)
	return err == nil
}

// ResolveDAVConnection reads past session caches so changes in another browser
// take effect on the next DAV request. A broken saved secret never falls back
// to sending the mail password to the personal server.
func (s *Session) ResolveDAVConnection(service, fallbackServer string) (ResolvedDAVConnection, error) {
	record, err := s.readDAVConnection(service)
	if err != nil {
		return ResolvedDAVConnection{}, err
	}
	connection := ResolvedDAVConnection{Server: fallbackServer, Username: s.Username(), Password: s.Password()}
	if record != nil {
		if record.Server != "" {
			connection.Server = record.Server
			connection.restricted = !s.davAllowPrivate()
		}
		if !record.UseMailCredentials {
			endpoint, err := normalDAVURL(connection.Server)
			if err != nil || endpoint.String() != record.PasswordServer {
				return ResolvedDAVConnection{}, errors.New("saved DAV credentials belong to another endpoint")
			}
			connection.Username = record.Username
			connection.Password, err = s.decryptDAVPassword(service, endpoint.String(), record.Username, record.PasswordEnc)
			if err != nil {
				return ResolvedDAVConnection{}, fmt.Errorf("read DAV password: %w", err)
			}
		}
	}
	sum := sha256.Sum256([]byte(service + "\x00" + s.davOwner() + "\x00" + connection.Server + "\x00" + connection.Username + "\x00" + connection.Password))
	connection.CacheKey = hex.EncodeToString(sum[:])
	return connection, nil
}

// SaveDAVConnection checks discovery with the proposed credentials before
// replacing the saved connection. A blank password preserves a secret only
// while its endpoint and username remain the same.
func (s *Session) SaveDAVConnection(ctx context.Context, service, defaultServer string, input DAVConnectionInput) (DAVSettings, error) {
	key, err := davStoreKey(service)
	if err != nil {
		return DAVSettings{}, err
	}
	input.Server = strings.TrimSpace(input.Server)
	input.Username = strings.TrimSpace(input.Username)
	if len(input.Server) > 2048 {
		return DAVSettings{}, ErrDAVInvalidServer
	}
	if len(input.Username) > 1024 || len(input.Password) > 4096 || strings.Contains(input.Username, ":") {
		return DAVSettings{}, ErrDAVCredentialsRequired
	}
	if input.Server != "" {
		if _, err := parsePersonalDAVURL(service, input.Server, s.davAllowPrivate()); err != nil {
			return DAVSettings{}, err
		}
	}
	server := input.Server
	if server == "" {
		server = defaultServer
	}
	if server == "" {
		return DAVSettings{}, ErrDAVInvalidServer
	}
	validationContext, cancel := context.WithTimeout(ctx, davConnectionTimeout)
	defer cancel()
	endpoint, err := validationDAVURL(validationContext, service, server)
	if err != nil {
		return DAVSettings{}, err
	}
	connection := ResolvedDAVConnection{Server: endpoint.String(), Username: s.Username(), Password: s.Password(), restricted: input.Server != "" && !s.davAllowPrivate()}
	record := davConnectionRecord{Version: 1, Server: input.Server, UseMailCredentials: input.UseMailCredentials}
	if !input.UseMailCredentials {
		if s.manager.loginKey == nil {
			return DAVSettings{}, ErrLoginKeyRequired
		}
		if input.Username == "" {
			return DAVSettings{}, ErrDAVCredentialsRequired
		}
		connection.Username, connection.Password = input.Username, input.Password
		if connection.Password == "" {
			old, err := s.readDAVConnection(service)
			if err != nil {
				return DAVSettings{}, err
			}
			if old == nil || old.UseMailCredentials || old.Username != input.Username || old.PasswordServer != endpoint.String() {
				return DAVSettings{}, ErrDAVPasswordRequired
			}
			connection.Password, err = s.decryptDAVPassword(service, endpoint.String(), input.Username, old.PasswordEnc)
			if err != nil {
				// The saved secret cannot be read any more (a rotated login
				// key, say): only a newly entered password can replace it.
				return DAVSettings{}, ErrDAVPasswordRequired
			}
		}
		record.Username = input.Username
		record.PasswordServer = endpoint.String()
		record.PasswordEnc, err = s.encryptDAVPassword(service, endpoint.String(), input.Username, connection.Password)
		if err != nil {
			return DAVSettings{}, err
		}
	}
	if err := validateDAVConnection(validationContext, service, connection); err != nil {
		return DAVSettings{}, err
	}
	if err := s.Store().Put(key, record); err != nil {
		return DAVSettings{}, fmt.Errorf("save DAV connection: %w", err)
	}
	return s.DAVConnectionSettings(service, defaultServer)
}

func (s *Session) DeleteDAVConnection(service, defaultServer string) (DAVSettings, error) {
	key, err := davStoreKey(service)
	if err != nil {
		return DAVSettings{}, err
	}
	if err := s.Store().Put(key, nil); err != nil {
		return DAVSettings{}, err
	}
	return s.DAVConnectionSettings(service, defaultServer)
}

type davAuthTransport struct {
	server             *url.URL
	username, password string
	transport          http.RoundTripper
}

// davPort is the port a URL connects to, with the scheme's default made
// explicit so that https://host and https://host:443 are one origin.
func davPort(u *url.URL) string {
	if port := u.Port(); port != "" {
		return port
	}
	switch u.Scheme {
	case "https":
		return "443"
	case "http":
		return "80"
	}
	return ""
}

func sameDAVOrigin(a, b *url.URL) bool {
	return a.Scheme == b.Scheme && strings.EqualFold(a.Hostname(), b.Hostname()) && davPort(a) == davPort(b)
}

// davPublicTransport serves endpoints that users chose. It refuses, at dial
// time and so after DNS resolution and on every redirect, any address that
// is not public, and it ignores proxy settings: through a proxy the guard
// would only ever see the proxy's address.
var davPublicTransport = func() *http.Transport {
	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.Proxy = nil
	transport.DialContext = (&net.Dialer{Timeout: davConnectionTimeout, KeepAlive: 30 * time.Second, Control: SafeDialControl}).DialContext
	return transport
}()

func (t *davAuthTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	if !sameDAVOrigin(t.server, req.URL) || req.URL.User != nil {
		return nil, errors.New("DAV request left the configured origin")
	}
	copy := req.Clone(req.Context())
	copy.SetBasicAuth(t.username, t.password)
	return t.transport.RoundTrip(copy)
}

// DAVHTTPClient confines both redirects and DAV-discovered resource URLs to
// the configured origin before adding credentials.
func DAVHTTPClient(connection ResolvedDAVConnection) (*http.Client, error) {
	u, err := normalDAVURL(connection.Server)
	if err != nil {
		return nil, err
	}
	var transport http.RoundTripper = http.DefaultTransport
	if connection.restricted {
		if u.Scheme != "https" {
			return nil, ErrDAVInvalidServer
		}
		transport = davPublicTransport
	}
	return &http.Client{
		Timeout:   davConnectionTimeout,
		Transport: &davAuthTransport{server: u, username: connection.Username, password: connection.Password, transport: transport},
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 10 || !sameDAVOrigin(u, req.URL) {
				return errors.New("DAV redirect left the configured origin")
			}
			return nil
		},
	}, nil
}

func normalDAVURL(raw string) (*url.URL, error) {
	u, err := url.Parse(raw)
	if err != nil {
		return nil, ErrDAVInvalidServer
	}
	switch u.Scheme {
	case "caldavs", "carddavs":
		u.Scheme = "https"
	case "http+insecure", "caldav+insecure", "carddav+insecure":
		u.Scheme = "http"
	}
	if err := checkDAVURL(u); err != nil {
		return nil, err
	}
	return u, nil
}

func validationDAVURL(ctx context.Context, service, server string) (*url.URL, error) {
	// Existing administrator defaults may use DNS discovery. Personal endpoint
	// overrides always carry an explicit scheme and never take this branch.
	if !strings.Contains(server, "://") {
		var err error
		if service == provider.ServiceCalDAV {
			server, err = caldav.DiscoverContextURL(ctx, server)
		} else {
			server, err = carddav.DiscoverContextURL(ctx, server)
		}
		if err != nil {
			return nil, ErrDAVValidationFailed
		}
	}
	return normalDAVURL(server)
}

func validateDAVConnection(ctx context.Context, service string, connection ResolvedDAVConnection) error {
	httpClient, err := DAVHTTPClient(connection)
	if err != nil {
		return ErrDAVInvalidServer
	}
	u, _ := normalDAVURL(connection.Server)
	if service == provider.ServiceCalDAV {
		client, err := caldav.NewClient(httpClient, u.String())
		if err != nil {
			return ErrDAVValidationFailed
		}
		principal, err := client.FindCurrentUserPrincipal(ctx)
		if err != nil || principal == "" {
			return ErrDAVValidationFailed
		}
		home, err := client.FindCalendarHomeSet(ctx, principal)
		if err != nil || home == "" {
			return ErrDAVValidationFailed
		}
	} else {
		client, err := carddav.NewClient(httpClient, u.String())
		if err != nil {
			return ErrDAVValidationFailed
		}
		principal, err := client.FindCurrentUserPrincipal(ctx)
		if err != nil || principal == "" {
			return ErrDAVValidationFailed
		}
		home, err := client.FindAddressBookHomeSet(ctx, principal)
		if err != nil || home == "" {
			return ErrDAVValidationFailed
		}
	}
	return nil
}
