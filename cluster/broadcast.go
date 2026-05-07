package cluster

import "github.com/hashicorp/memberlist"

// broadcastMsg implements the memberlist.Broadcast interface.
// It wraps a payload to be transmitted over the gossip network.
type broadcastMsg struct {
	msg    []byte
	notify chan<- struct{} // optional channel to notify when broadcast is finished
}

// Invalidates checks if this broadcast invalidates another.
// For our simple use cases (like rate limits), we don't invalidate previous messages,
// as every attempt counts.
func (b *broadcastMsg) Invalidates(other memberlist.Broadcast) bool {
	return false
}

// Message returns the payload to be broadcast.
func (b *broadcastMsg) Message() []byte {
	return b.msg
}

// Finished is called when the broadcast has been transmitted to enough nodes
// or when the node leaves the cluster.
func (b *broadcastMsg) Finished() {
	if b.notify != nil {
		close(b.notify)
	}
}
