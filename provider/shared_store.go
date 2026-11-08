package provider

import "encoding/json"

// SharedStore lists one complete, fresh, consistent snapshot of a persistent
// entry subtree. It must not tear across concurrent pruning and publication.
// Entries acknowledged before a read starts must be visible to every client.
// Individual Put operations must replace one entry atomically. These are the
// read/write-register semantics used by WebAuthn's versioned metadata protocol.
// A cache, a transient store, or a replica with stale reads must not implement
// this interface. A failed or truncated listing must return an error.
type SharedStore interface {
	Store
	List(prefix string) (map[string]json.RawMessage, error)
}

// UncachedStore avoids retaining one cache entry for every short-lived version
// name. Versioned records are read through List, never through this cache.
type UncachedStore interface {
	PutUncached(key string, value interface{}) error
}
