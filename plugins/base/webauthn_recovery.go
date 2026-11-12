package alpsbase

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"

	"github.com/migadu/alps"
)

// Recovery codes are the way back to an account whose security key is not at
// hand: a passkey kept in another browser, a hardware key left at home or
// lost. Each signs in once in the key's place, and the session it opens has
// given the second factor, so it can add a new key and remove the old one.
// Without them only the operator could help, by removing the account's record.
//
// The first key comes with ten, shown once in the answer that adds it; new
// ones replace them when asked for (handleRecoveryCodes). The record keeps
// each as its SHA-256 alone. A code is fifty random bits, and is tried only
// against the login limits, so a plain hash is enough to keep it from being
// read back.

const (
	recoveryCodeCount  = 10
	recoveryCodeLength = 10
	// Crockford's base32: digits and lower-case letters, without i, l, o and
	// u, so that a code copied by hand reads back as written.
	recoveryAlphabet = "0123456789abcdefghjkmnpqrstvwxyz"
)

// Shared METADATA coordinates credential versions across instances. Other
// stores retain standalone support; a clustered transient/file store cannot
// safely consume recovery codes across processes.
func recoveryCodesAvailable(ctx *alps.Context, pending ...*alps.Session) bool {
	if ctx.Server.Options.ClusterBroadcaster == nil {
		return true
	}
	session := ctx.Session
	if len(pending) != 0 {
		session = pending[0]
	}
	if session == nil {
		return false
	}
	available, err := session.SharedWebAuthnAvailable()
	return err == nil && available
}

func recoveryUnavailable(ctx *alps.Context) error {
	return ctx.JSON(http.StatusServiceUnavailable, map[string]string{"error": "recovery_unavailable"})
}

// newRecoveryCodes makes a fresh set of codes, as shown to the user, and the
// hashes the record keeps of them.
func newRecoveryCodes() (codes, hashes []string, err error) {
	for i := 0; i < recoveryCodeCount; i++ {
		raw := make([]byte, recoveryCodeLength)
		if _, err := rand.Read(raw); err != nil {
			return nil, nil, fmt.Errorf("failed to generate a recovery code: %v", err)
		}
		// 256 is a multiple of 32, so every symbol is as likely.
		for j, b := range raw {
			raw[j] = recoveryAlphabet[int(b)%len(recoveryAlphabet)]
		}
		code := string(raw)
		codes = append(codes, code[:5]+"-"+code[5:])
		hashes = append(hashes, hashRecoveryCode(code))
	}
	return codes, hashes, nil
}

// normalRecoveryCode is a code as it may be written down or typed: in
// capitals, with spaces or dashes between its groups, an O for a 0, an I or
// an L for a 1.
func normalRecoveryCode(written string) string {
	var b strings.Builder
	for _, r := range strings.ToLower(written) {
		switch r {
		case ' ', '-', '\t':
			continue
		case 'o':
			r = '0'
		case 'i', 'l':
			r = '1'
		}
		b.WriteRune(r)
	}
	return b.String()
}

func hashRecoveryCode(normal string) string {
	sum := sha256.Sum256([]byte(normal))
	return hex.EncodeToString(sum[:])
}

// takeRecoveryCode removes the code written from the record, and reports
// whether it was one of the codes not yet used. Every stored code is compared,
// whichever matches.
func (c *UserCredentials) takeRecoveryCode(written string) bool {
	normal := normalRecoveryCode(written)
	if len(normal) != recoveryCodeLength {
		return false
	}
	want := []byte(hashRecoveryCode(normal))
	match := -1
	for i, stored := range c.RecoveryCodes {
		if subtle.ConstantTimeCompare([]byte(stored), want) == 1 {
			match = i
		}
	}
	if match < 0 {
		return false
	}
	c.RecoveryCodes = append(c.RecoveryCodes[:match:match], c.RecoveryCodes[match+1:]...)
	return true
}

// logRecoveryCodesCreated logs a new set of codes, as a key added is logged.
// The codes themselves never reach the log.
func logRecoveryCodesCreated(ctx *alps.Context) {
	ctx.Server.Logger().Slog().Info("recovery codes created",
		"user", ctx.Session.Username(),
		"ip", ctx.ClientIP(),
		"session", ctx.Session.ID(),
		"codes", recoveryCodeCount,
		"agent", ctx.Request.UserAgent())
}

// recoveryCodesRequest is the body of a request for new codes.
type recoveryCodesRequest struct {
	CurrentPassword string `json:"current_password"`
}

// handleRecoveryCodes replaces the account's recovery codes with new ones,
// and answers with them, once. It is as strong a change as removing a key,
// and takes as much: the account must have a key, the session must have
// given it, and the account's password must be given again (see
// confirmCurrentPassword).
//
// The refusals carry stable codes for the page, besides the password's:
// no_security_key (409), two_factor_required (403) and keys_unavailable (503).
func handleRecoveryCodes(ctx *alps.Context) error {
	if ctx.Session == nil {
		return alps.NewHTTPError(http.StatusUnauthorized, "not logged in")
	}

	var req recoveryCodesRequest
	if err := ctx.BindJSON(&req); err != nil {
		return ctx.RespondBindError(err)
	}

	if !recoveryCodesAvailable(ctx) {
		return recoveryUnavailable(ctx)
	}

	return ctx.Session.WithWebAuthnRecord(func(record *alps.WebAuthnRecord) error {
		creds, err := readCredentials(record.Read)
		if err != nil {
			ctx.Server.Logger().Errorf("WebAuthn recovery codes: failed to load credentials for user %s: %v", ctx.Session.Username(), err)
			return ctx.JSON(http.StatusServiceUnavailable, map[string]string{"error": "keys_unavailable"})
		}
		if len(creds.Credentials) == 0 {
			return ctx.JSON(http.StatusConflict, map[string]string{"error": "no_security_key"})
		}
		// Checked before the password, so that a session without the second
		// factor cannot use this to find out whether a password is right.
		if !ctx.Session.IsAuthenticated2FA() {
			return respondTwoFactorRequired(ctx)
		}
		if ok, err := confirmCurrentPassword(ctx, req.CurrentPassword); !ok {
			return err
		}

		codes, hashes, err := newRecoveryCodes()
		if err != nil {
			return err
		}
		creds.RecoveryCodes = hashes
		if err := saveCredentials(record.Write, creds); err != nil {
			ctx.Server.Logger().Errorf("WebAuthn recovery codes: failed to save credentials for user %s: %v", ctx.Session.Username(), err)
			return ctx.JSON(http.StatusServiceUnavailable, map[string]string{"error": "keys_unavailable"})
		}
		logRecoveryCodesCreated(ctx)

		return ctx.JSON(http.StatusOK, map[string]interface{}{"recovery_codes": codes})
	})
}

// recoveryCodeRequest is the body of a sign-in with a recovery code.
type recoveryCodeRequest struct {
	Code string `json:"code"`
}

// handleVerifyRecovery gives the second factor a sign-in waits for with a
// recovery code instead of the key, and spends the code.
//
// Unlike a key's signature, a code can be guessed, so each try counts against
// the login limits for the account and the address it comes from, as a
// password does. The code is spent before the session is let in: a record
// that cannot be saved refuses the sign-in, rather than leave the code usable
// again.
//
// The refusals carry stable codes the page translates: code_required (400),
// wrong_code (400, for a used code too), rate_limited (429) and
// keys_unavailable (503). A 401 says the pending sign-in itself is gone.
func handleVerifyRecovery(ctx *alps.Context) error {
	pendingCookie, err := ctx.Cookie("alps_2fa_pending")
	if err != nil || pendingCookie == nil {
		return alps.NewHTTPError(http.StatusUnauthorized, "no pending 2FA session")
	}
	session, err := ctx.Server.Sessions.Get(pendingCookie.Value)
	if err != nil {
		return alps.NewHTTPError(http.StatusUnauthorized, "invalid 2FA session")
	}

	var req recoveryCodeRequest
	if err := ctx.BindJSON(&req); err != nil {
		return ctx.RespondBindError(err)
	}
	if strings.TrimSpace(req.Code) == "" {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "code_required"})
	}

	if !recoveryCodesAvailable(ctx, session) {
		return recoveryUnavailable(ctx)
	}

	return session.WithWebAuthnRecord(func(record *alps.WebAuthnRecord) error {
		username := session.Username()
		if allowed, _, retryAfter := ctx.Server.RateLimiter.CheckLoginAllowed(ctx.Request, username); !allowed {
			ctx.Server.Logger().Printf("WebAuthn: recovery code rate limited for %s", username)
			seconds := ctx.RetryAfter(retryAfter)
			return ctx.JSON(http.StatusTooManyRequests, map[string]interface{}{
				"error":       "rate_limited",
				"retry_after": seconds,
			})
		}

		creds, err := readCredentials(record.Read)
		if err != nil {
			ctx.Server.Logger().Errorf("WebAuthn recovery: failed to load credentials for user %s: %v", username, err)
			return ctx.JSON(http.StatusServiceUnavailable, map[string]string{"error": "keys_unavailable"})
		}
		if !creds.Enabled || len(creds.Credentials) == 0 {
			return alps.NewHTTPError(http.StatusBadRequest, "2FA not enabled")
		}

		taken := creds.takeRecoveryCode(req.Code)
		ctx.Server.RateLimiter.RecordLoginAttempt(ctx.Request, username, taken)
		if !taken {
			ctx.Server.Logger().Slog().Warn("sign-in failed",
				"user", username,
				"ip", ctx.ClientIP(),
				"reason", "recovery code refused",
				"session", session.ID())
			return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "wrong_code"})
		}
		if err := saveCredentials(record.Write, creds); err != nil {
			ctx.Server.Logger().Errorf("WebAuthn recovery: failed to spend a code for user %s: %v", username, err)
			return ctx.JSON(http.StatusServiceUnavailable, map[string]string{"error": "keys_unavailable"})
		}

		left := len(creds.RecoveryCodes)
		return completeSecondFactor(ctx, session, map[string]interface{}{"recovery_codes_left": left},
			"factor", "recovery code", "recovery_codes_left", left)
	})
}
