package alps

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"strconv"
	"strings"
)

const webAuthnVersions = "webauthn-state"

var ErrWebAuthnConflict = errors.New("credential update superseded; retry the operation")

type credentialEnvelope struct {
	Version   int             `json:"version"`
	Committed bool            `json:"committed"`
	Data      json.RawMessage `json:"data"`
	Applied   []string        `json:"applied,omitempty"`
}

type credentialVersionStore interface {
	List(string) (map[string]json.RawMessage, error)
	putOnce(string, interface{}) error
}

type credentialVersions struct {
	entries   map[string]credentialEnvelope
	latest    string
	committed string
	number    uint64
}

func listCredentialVersions(store credentialVersionStore) (*credentialVersions, error) {
	values, err := store.List(webAuthnVersions)
	if err != nil {
		return nil, err
	}
	versions := &credentialVersions{entries: make(map[string]credentialEnvelope, len(values))}
	for key, raw := range values {
		if !strings.HasPrefix(key, webAuthnVersions+"/") {
			return nil, fmt.Errorf("unexpected credential entry %q", key)
		}
		id := strings.TrimPrefix(key, webAuthnVersions+"/")
		if len(id) != 53 || id[20] != '-' {
			return nil, fmt.Errorf("invalid credential version name %q", key)
		}
		number, err := strconv.ParseUint(id[:20], 10, 64)
		if err != nil || number == 0 || fmt.Sprintf("%020d", number) != id[:20] {
			return nil, fmt.Errorf("invalid credential version number %q", key)
		}
		if _, err := hex.DecodeString(id[21:]); err != nil {
			return nil, fmt.Errorf("invalid credential version ID %q", key)
		}
		var envelope credentialEnvelope
		if err := json.Unmarshal(raw, &envelope); err != nil || envelope.Version != 1 {
			return nil, fmt.Errorf("invalid credential version %q", key)
		}
		if envelope.Committed && len(envelope.Data) == 0 {
			return nil, fmt.Errorf("committed credential version %q has no data or explicit tombstone", key)
		}
		versions.entries[key] = envelope
		if key > versions.latest {
			versions.latest, versions.number = key, number
		}
		if envelope.Committed && key > versions.committed {
			versions.committed = key
		}
	}
	return versions, nil
}

type credentialVersion struct {
	store    credentialVersionStore
	key      string
	mutation string
	parents  []string
}

// beginCredentialVersion announces a monotonically ordered proposal before
// reading the credential record. It never takes a lock or waits for another
// proposal: a crashed or paused process cannot block a subsequent update.
func beginCredentialVersion(store credentialVersionStore) (*credentialVersion, error) {
	versions, err := listCredentialVersions(store)
	if err != nil {
		return nil, err
	}
	if versions.number == math.MaxUint64 {
		return nil, fmt.Errorf("credential version number exhausted")
	}
	// Keep the highest proposal (the fence) and highest committed record
	// (including a deletion tombstone). Every removed entry is strictly older
	// than a retained entry. Delayed writes only recreate obsolete names.
	for key := range versions.entries {
		if key != versions.latest && key != versions.committed {
			if err := store.putOnce(key, nil); err != nil {
				return nil, fmt.Errorf("pruning credential version: %w", err)
			}
		}
	}
	var id [16]byte
	if _, err := rand.Read(id[:]); err != nil {
		return nil, err
	}
	key := fmt.Sprintf("%s/%020d-%s", webAuthnVersions, versions.number+1, hex.EncodeToString(id[:]))
	if err := store.putOnce(key, credentialEnvelope{Version: 1}); err != nil {
		return nil, fmt.Errorf("announcing credential version: %w", err)
	}
	return &credentialVersion{store: store, key: key, mutation: key}, nil
}

// commit stores only at this proposal's unique name, then validates the fence
// with a fresh, complete listing. A newer proposal means this write cannot
// authenticate a recovery session. Conversely, a proposal announced after a
// successful validation must read the already committed record before writing.
// Thus no later successful update can restore a successfully consumed code.
// There is no mutable current-pointer for a delayed writer to overwrite.
func (version *credentialVersion) commit(data json.RawMessage) error {
	for attempt := 0; attempt < 8; attempt++ {
		key := version.key
		applied := append([]string(nil), version.parents...)
		if !containsCredentialMutation(applied, version.mutation) {
			applied = append(applied, version.mutation)
		}
		if len(applied) > 32 {
			applied = applied[len(applied)-32:]
		}
		if err := version.store.putOnce(key, credentialEnvelope{Version: 1, Committed: true, Data: data, Applied: applied}); err != nil {
			return fmt.Errorf("saving credential version: %w", err)
		}
		current, err := listCredentialVersions(version.store)
		if err != nil {
			return err
		}
		if current.latest == key && current.committed == key {
			return nil
		}
		// A competing proposal may have crashed or incorporated our write.
		// Only rescue a current record that proves our mutation is included.
		if current.committed != key && !containsCredentialMutation(current.entries[current.committed].Applied, version.mutation) {
			return ErrWebAuthnConflict
		}
		next, err := beginCredentialVersion(version.store)
		if err != nil {
			return err
		}
		current, err = listCredentialVersions(version.store)
		if err != nil {
			return err
		}
		if current.committed != key && !containsCredentialMutation(current.entries[current.committed].Applied, version.mutation) {
			return ErrWebAuthnConflict
		}
		// A later update may have incorporated our provisional write. Its
		// ancestry proves inclusion; adopt the entire newer state so rescuing
		// our result also preserves that update. A bounded history may lose
		// this proof after a long pause, in which case we refuse, never guess.
		data = current.entries[current.committed].Data
		version.parents = append([]string(nil), current.entries[current.committed].Applied...)
		version.key = next.key
	}
	return ErrWebAuthnConflict
}

func containsCredentialMutation(applied []string, id string) bool {
	for _, old := range applied {
		if old == id {
			return true
		}
	}
	return false
}
