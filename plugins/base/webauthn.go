package alpsbase

import (
	"bytes"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/go-webauthn/webauthn/protocol"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

// CredentialDisplay is used to display credentials in the UI
type CredentialDisplay struct {
	ID      string
	Name    string
	AddedAt string
}

// WebAuthnSettingsData extends BaseRenderData with WebAuthn-specific fields
type WebAuthnSettingsData struct {
	Enabled             bool                `json:"enabled"`
	CredentialCount     int                 `json:"credentialCount"`
	Credentials         []CredentialDisplay `json:"credentials"`
	IsSecuritySettings  bool                `json:"isSecuritySettings"`
	TrustLinkedAccounts bool                `json:"trustLinkedAccounts"`
}

// handleSetupPage shows the WebAuthn enrollment page
func handleSetupPage(ctx *alps.Context) error {
	if ctx.Session == nil {
		return alps.NewHTTPError(http.StatusUnauthorized, "not logged in")
	}

	creds, err := loadCredentials(ctx.Session.Store())
	if err != nil {
		return fmt.Errorf("failed to load credentials: %v", err)
	}

	displayCreds := make([]CredentialDisplay, len(creds.Credentials))
	for i, info := range creds.Credentials {
		displayCreds[i] = CredentialDisplay{
			ID:      base64.URLEncoding.EncodeToString(info.Credential.ID),
			Name:    info.Name,
			AddedAt: info.AddedAt,
		}
	}

	data := WebAuthnSettingsData{
		Enabled:             creds.Enabled,
		CredentialCount:     len(creds.Credentials),
		Credentials:         displayCreds,
		IsSecuritySettings:  true,
		TrustLinkedAccounts: creds.TrustLinkedAccounts,
	}

	return ctx.JSON(http.StatusOK, data)
}

// handleSetupBegin initiates WebAuthn registration
func handleSetupBegin(ctx *alps.Context) error {
	if ctx.Session == nil {
		return alps.NewHTTPError(http.StatusUnauthorized, "not logged in")
	}

	creds, err := loadCredentials(ctx.Session.Store())
	if err != nil {
		return fmt.Errorf("failed to load credentials: %v", err)
	}

	// Generate user ID if this is first registration
	if len(creds.UserID) == 0 {
		creds.UserID = make([]byte, 32)
		if _, err := rand.Read(creds.UserID); err != nil {
			return fmt.Errorf("failed to generate user ID: %v", err)
		}
	}

	user := &webauthnUser{
		username:    ctx.Session.Username(),
		credentials: creds,
	}

	// Build exclusion list from existing credentials
	var exclusions []protocol.CredentialDescriptor
	for _, credInfo := range creds.Credentials {
		exclusions = append(exclusions, protocol.CredentialDescriptor{
			Type:         protocol.PublicKeyCredentialType,
			CredentialID: credInfo.Credential.ID,
			Transport:    credInfo.Credential.Transport,
		})
	}

	// Begin registration with explicit exclusions
	options, session, err := ctx.Server.WebAuthn.BeginRegistration(user, webauthn.WithExclusions(exclusions))
	if err != nil {
		return fmt.Errorf("failed to begin registration: %v", err)
	}

	// Store session data
	sessionDataBytes, err := json.Marshal(session)
	if err != nil {
		return fmt.Errorf("failed to marshal session: %v", err)
	}

	if err := saveSessionData(ctx.Session, &sessionData{
		Challenge: string(sessionDataBytes),
		UserID:    creds.UserID,
	}); err != nil {
		return fmt.Errorf("failed to save session: %v", err)
	}

	ctx.Response.Header().Set("Content-Type", "application/json")
	return json.NewEncoder(ctx.Response).Encode(options)
}

// handleSetupFinish completes WebAuthn registration
func handleSetupFinish(ctx *alps.Context) error {
	if ctx.Session == nil {
		return alps.NewHTTPError(http.StatusUnauthorized, "not logged in")
	}

	// Parse request body first to get the name and transports before FinishRegistration consumes it
	var requestData struct {
		ID         string   `json:"id"`
		RawID      string   `json:"rawId"`
		Type       string   `json:"type"`
		Transports []string `json:"transports"`
		Response   struct {
			AttestationObject string `json:"attestationObject"`
			ClientDataJSON    string `json:"clientDataJSON"`
		} `json:"response"`
		Name string `json:"name"`
	}
	if err := json.NewDecoder(ctx.Request.Body).Decode(&requestData); err != nil {
		return fmt.Errorf("failed to decode request: %v", err)
	}

	// Reconstruct the request body WITHOUT the name field for FinishRegistration
	// Keep transports as it's part of the WebAuthn spec
	credentialData := map[string]interface{}{
		"id":         requestData.ID,
		"rawId":      requestData.RawID,
		"type":       requestData.Type,
		"transports": requestData.Transports,
		"response": map[string]interface{}{
			"attestationObject": requestData.Response.AttestationObject,
			"clientDataJSON":    requestData.Response.ClientDataJSON,
		},
	}
	requestBody, err := json.Marshal(credentialData)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %v", err)
	}
	ctx.Request.Body = io.NopCloser(bytes.NewReader(requestBody))

	// Load session data
	sessionDataStored, err := loadSessionData(ctx.Session)
	if err != nil {
		return fmt.Errorf("failed to load session: %v", err)
	}

	var session webauthn.SessionData
	if err := json.Unmarshal([]byte(sessionDataStored.Challenge), &session); err != nil {
		return fmt.Errorf("failed to unmarshal session: %v", err)
	}

	// Load credentials
	creds, err := loadCredentials(ctx.Session.Store())
	if err != nil {
		return fmt.Errorf("failed to load credentials: %v", err)
	}
	creds.UserID = sessionDataStored.UserID

	user := &webauthnUser{
		username:    ctx.Session.Username(),
		credentials: creds,
	}

	credential, err := ctx.Server.WebAuthn.FinishRegistration(user, session, ctx.Request)
	if err != nil {
		return fmt.Errorf("failed to finish registration: %v", err)
	}

	// Manually set transports from the browser response
	// FinishRegistration doesn't preserve them, so we need to set them ourselves
	if len(requestData.Transports) > 0 {
		credential.Transport = make([]protocol.AuthenticatorTransport, len(requestData.Transports))
		for i, t := range requestData.Transports {
			credential.Transport[i] = protocol.AuthenticatorTransport(t)
		}
	}

	// Use the name from the request
	credName := requestData.Name
	if credName == "" {
		credName = fmt.Sprintf("Security Key %d", len(creds.Credentials)+1)
	}

	// Add new credential with metadata
	creds.Credentials = append(creds.Credentials, CredentialInfo{
		Credential: *credential,
		Name:       credName,
		AddedAt:    time.Now().Format(time.RFC3339),
	})
	creds.Enabled = true

	if err := saveCredentials(ctx.Session.Store(), creds); err != nil {
		return fmt.Errorf("failed to save credentials: %v", err)
	}

	if err := clearSessionData(ctx.Session); err != nil {
		return fmt.Errorf("failed to clear session: %v", err)
	}

	// Elevate the session to 2FA authenticated since the user proved physical presence
	ctx.Session.SetAuthenticated2FA(true)

	// Update the login token so the session restoration knows 2FA is verified
	tokenUser, tokenPass, _, isPersistent := ctx.GetLoginToken()
	if tokenUser != "" && tokenPass != "" {
		ctx.SetLoginToken(tokenUser, tokenPass, true, isPersistent)
	}

	ctx.Response.Header().Set("Content-Type", "application/json")
	return json.NewEncoder(ctx.Response).Encode(map[string]interface{}{
		"success": true,
	})
}

// handleDisable removes WebAuthn authentication
func handleDisable(ctx *alps.Context) error {
	if ctx.Session == nil {
		return alps.NewHTTPError(http.StatusUnauthorized, "not logged in")
	}

	creds := &UserCredentials{
		Enabled:     false,
		Credentials: []CredentialInfo{},
	}

	if err := saveCredentials(ctx.Session.Store(), creds); err != nil {
		return fmt.Errorf("failed to save credentials: %v", err)
	}

	return ctx.JSON(http.StatusOK, map[string]interface{}{"success": true})
}

// handleDeleteCredential removes a specific credential by ID
func handleDeleteCredential(ctx *alps.Context) error {
	if ctx.Session == nil {
		return alps.NewHTTPError(http.StatusUnauthorized, "not logged in")
	}

	credID := ctx.Param("id")
	if credID == "" {
		return alps.NewHTTPError(http.StatusBadRequest, "missing credential ID")
	}

	// Decode the credential ID from base64 URL encoding
	credIDBytes, err := base64.URLEncoding.DecodeString(credID)
	if err != nil {
		return alps.NewHTTPError(http.StatusBadRequest, "invalid credential ID")
	}

	creds, err := loadCredentials(ctx.Session.Store())
	if err != nil {
		return fmt.Errorf("failed to load credentials: %v", err)
	}

	// Find and remove the credential
	found := false
	newCreds := make([]CredentialInfo, 0, len(creds.Credentials)-1)
	for _, info := range creds.Credentials {
		if string(info.Credential.ID) != string(credIDBytes) {
			newCreds = append(newCreds, info)
		} else {
			found = true
		}
	}

	if !found {
		return alps.NewHTTPError(http.StatusNotFound, "credential not found")
	}

	creds.Credentials = newCreds

	// If no credentials left, disable 2FA
	if len(newCreds) == 0 {
		creds.Enabled = false
	}

	if err := saveCredentials(ctx.Session.Store(), creds); err != nil {
		return fmt.Errorf("failed to save credentials: %v", err)
	}

	return ctx.JSON(http.StatusOK, map[string]interface{}{"success": true})
}

// handleTrustLinkedAccounts toggles the trust_linked_accounts setting
func handleTrustLinkedAccounts(ctx *alps.Context) error {
	if ctx.Session == nil {
		return alps.NewHTTPError(http.StatusUnauthorized, "not logged in")
	}

	var req struct {
		Trust bool `json:"trust"`
	}
	if err := ctx.BindJSON(&req); err != nil {
		return alps.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("invalid request: %v", err))
	}

	// Only allow enabling this setting if session is 2FA authenticated
	if req.Trust && !ctx.Session.IsAuthenticated2FA() {
		return alps.NewHTTPError(http.StatusForbidden, "2FA authentication required to change this setting")
	}

	creds, err := loadCredentials(ctx.Session.Store())
	if err != nil {
		return fmt.Errorf("failed to load credentials: %v", err)
	}

	creds.TrustLinkedAccounts = req.Trust

	if err := saveCredentials(ctx.Session.Store(), creds); err != nil {
		return fmt.Errorf("failed to save credentials: %v", err)
	}

	return ctx.JSON(http.StatusOK, map[string]interface{}{"success": true})
}

// handleVerifyBegin initiates WebAuthn authentication during login
func handleVerifyBegin(ctx *alps.Context) error {
	// Get pending 2FA session cookie
	pendingCookie, err := ctx.Cookie("alps_2fa_pending")
	if err != nil || pendingCookie == nil {
		return alps.NewHTTPError(http.StatusUnauthorized, "no pending 2FA session")
	}

	// Get the temporary session using the token
	session, err := ctx.Server.Sessions.Get(pendingCookie.Value)
	if err != nil {
		return alps.NewHTTPError(http.StatusUnauthorized, "invalid 2FA session")
	}

	// Load user credentials from IMAP METADATA
	creds, err := loadCredentials(session.Store())
	if err != nil {
		return fmt.Errorf("failed to load credentials: %v", err)
	}

	if !creds.Enabled || len(creds.Credentials) == 0 {
		return alps.NewHTTPError(http.StatusBadRequest, "2FA not enabled")
	}

	user := &webauthnUser{
		username:    session.Username(),
		credentials: creds,
	}

	// Begin WebAuthn authentication
	// Use UserVerificationPreferred to allow both platform (fingerprint) and cross-platform (security key) authenticators
	options, webauthnSession, err := ctx.Server.WebAuthn.BeginLogin(user,
		webauthn.WithUserVerification(protocol.VerificationDiscouraged))
	if err != nil {
		return fmt.Errorf("failed to begin login: %v", err)
	}

	// Store session data in IMAP METADATA
	sessionDataBytes, err := json.Marshal(webauthnSession)
	if err != nil {
		return fmt.Errorf("failed to marshal session: %v", err)
	}

	if err := saveSessionData(session, &sessionData{
		Challenge: string(sessionDataBytes),
	}); err != nil {
		return fmt.Errorf("failed to save session: %v", err)
	}

	ctx.Response.Header().Set("Content-Type", "application/json")
	return json.NewEncoder(ctx.Response).Encode(options)
}

// handleVerifyFinish completes WebAuthn authentication during login
func handleVerifyFinish(ctx *alps.Context) error {
	// Get pending 2FA session cookie
	pendingCookie, err := ctx.Cookie("alps_2fa_pending")
	if err != nil || pendingCookie == nil {
		return alps.NewHTTPError(http.StatusUnauthorized, "no pending 2FA session")
	}

	// Get the temporary session
	session, err := ctx.Server.Sessions.Get(pendingCookie.Value)
	if err != nil {
		return alps.NewHTTPError(http.StatusUnauthorized, "invalid 2FA session")
	}

	// Load session data from IMAP METADATA
	sessionDataStored, err := loadSessionData(session)
	if err != nil {
		return fmt.Errorf("failed to load session: %v", err)
	}

	var sessionData webauthn.SessionData
	if err := json.Unmarshal([]byte(sessionDataStored.Challenge), &sessionData); err != nil {
		return fmt.Errorf("failed to unmarshal session: %v", err)
	}

	// Load credentials
	creds, err := loadCredentials(session.Store())
	if err != nil {
		return fmt.Errorf("failed to load credentials: %v", err)
	}

	user := &webauthnUser{
		username:    session.Username(),
		credentials: creds,
	}

	// Verify WebAuthn assertion
	_, err = ctx.Server.WebAuthn.FinishLogin(user, sessionData, ctx.Request)
	if err != nil {
		return fmt.Errorf("failed to finish login: %v", err)
	}

	// Success! Mark session as authenticated with 2FA
	session.SetAuthenticated2FA(true)

	// Clear session data and 2FA cookies
	if err := clearSessionData(session); err != nil {
		return fmt.Errorf("failed to clear session: %v", err)
	}

	// Clear pending 2FA cookie
	ctx.SetCookie(&http.Cookie{
		Name:     "alps_2fa_pending",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		MaxAge:   -1,
	})

	// Check if "remember me" was selected
	rememberCookie, _ := ctx.Cookie("alps_2fa_remember")
	persistent := rememberCookie != nil && rememberCookie.Value == "true"

	// Clear remember cookie
	if rememberCookie != nil {
		ctx.SetCookie(&http.Cookie{
			Name:     "alps_2fa_remember",
			Value:    "",
			Path:     "/",
			HttpOnly: true,
			MaxAge:   -1,
		})
	}

	// Set the real session cookie
	ctx.SetSessionWithExpiry(session, persistent)

	// Set login token for session restoration after server restart
	// Retrieve credentials that were stored during initial login
	var credentials map[string]string
	if err := session.Store().Get("2fa_login_credentials", &credentials); err == nil {
		username := credentials["username"]
		password := credentials["password"]
		if username != "" && password != "" {
			ctx.SetLoginToken(username, password, true, persistent)
		}
		// Clear stored credentials by overwriting with empty map
		session.Store().Put("2fa_login_credentials", map[string]string{})
	}

	ctx.Response.Header().Set("Content-Type", "application/json")
	return json.NewEncoder(ctx.Response).Encode(map[string]interface{}{
		"success": true,
	})
}

// Helper functions for login integration (to be used by base plugin)

// IsEnabled checks if a user has WebAuthn enabled
func IsEnabled(store provider.Store) (bool, error) {
	creds, err := loadCredentials(store)
	if err != nil {
		return false, err
	}
	return creds.Enabled && len(creds.Credentials) > 0, nil
}

// BeginLogin starts WebAuthn authentication for a user
func BeginLogin(server *alps.Server, username string, session *alps.Session) (*protocol.CredentialAssertion, error) {
	creds, err := loadCredentials(session.Store())
	if err != nil {
		return nil, err
	}

	user := &webauthnUser{
		username:    username,
		credentials: creds,
	}

	options, webauthnSession, err := server.WebAuthn.BeginLogin(user)
	if err != nil {
		return nil, err
	}

	// Store session data
	sessionDataBytes, err := json.Marshal(webauthnSession)
	if err != nil {
		return nil, err
	}

	if err := saveSessionData(session, &sessionData{
		Challenge: string(sessionDataBytes),
	}); err != nil {
		return nil, err
	}

	return options, nil
}

// FinishLogin completes WebAuthn authentication
func FinishLogin(server *alps.Server, session *alps.Session, response *http.Request) error {
	// Load session data
	sessionDataStored, err := loadSessionData(session)
	if err != nil {
		return err
	}

	var webauthnSession webauthn.SessionData
	if err := json.Unmarshal([]byte(sessionDataStored.Challenge), &webauthnSession); err != nil {
		return err
	}

	// Load credentials
	creds, err := loadCredentials(session.Store())
	if err != nil {
		return err
	}

	user := &webauthnUser{
		credentials: creds,
	}

	_, err = server.WebAuthn.FinishLogin(user, webauthnSession, response)
	if err != nil {
		return err
	}

	if err := clearSessionData(session); err != nil {
		return err
	}

	return nil
}

// handleLinkedAccountsTrust updates the trust setting for linked accounts
func handleLinkedAccountsTrust(ctx *alps.Context) error {
	if ctx.Session == nil {
		return alps.NewHTTPError(http.StatusUnauthorized, "not logged in")
	}

	var req struct {
		Trust bool `json:"trust"`
	}
	if err := ctx.BindJSON(&req); err != nil {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}

	creds, err := loadCredentials(ctx.Session.Store())
	if err != nil {
		return fmt.Errorf("failed to load credentials: %v", err)
	}

	creds.TrustLinkedAccounts = req.Trust
	if err := saveCredentials(ctx.Session.Store(), creds); err != nil {
		return fmt.Errorf("failed to save credentials: %v", err)
	}

	return ctx.JSON(http.StatusOK, map[string]interface{}{"ok": true})
}
