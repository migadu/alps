package alps

import (
	"encoding/json"
)

// Messages between the nodes of a cluster.
//
// Rate-limit events have always gone out as bare JSON objects, and a node
// that knows no other kind of message decodes whatever arrives as one. Every
// other kind of message therefore starts with a tag byte that no JSON text
// can start with: such a node fails to decode it, logs that and drops it,
// and cannot take it for a rate-limit event. A node drops a tag it does not
// know the same way, so a newer kind of message can be sent while nodes that
// do not know it are still running.
const (
	// clusterMessageSecondFactor tells the other nodes that an account has
	// enrolled a key, followed by a secondFactorMessage as JSON. See
	// SessionManager.RequireSecondFactor.
	clusterMessageSecondFactor byte = 0x02
)

// secondFactorMessage names the account a clusterMessageSecondFactor is
// about.
type secondFactorMessage struct {
	Username string `json:"username"`
}

// encodeSecondFactorMessage is the message telling the other nodes that
// username has enrolled a key.
func encodeSecondFactorMessage(username string) ([]byte, error) {
	body, err := json.Marshal(secondFactorMessage{Username: username})
	if err != nil {
		return nil, err
	}
	return append([]byte{clusterMessageSecondFactor}, body...), nil
}

// HandleClusterMessage takes a message from another node of the cluster and
// hands it to what it is for. The cluster calls it on a goroutine of its own
// for each message.
func (s *Server) HandleClusterMessage(data []byte) {
	if len(data) == 0 {
		return
	}
	switch data[0] {
	case '{':
		s.RateLimiter.HandleClusterMessage(data)
	case clusterMessageSecondFactor:
		var msg secondFactorMessage
		if err := json.Unmarshal(data[1:], &msg); err != nil || msg.Username == "" {
			s.Logger().Debugf("Cluster: dropped a second-factor message that does not decode")
			return
		}
		s.Sessions.readSecondFactorAgain(msg.Username)
	default:
		s.Logger().Debugf("Cluster: dropped a message of unknown kind %#x", data[0])
	}
}
