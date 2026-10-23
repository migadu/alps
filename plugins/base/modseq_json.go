package alpsbase

import (
	"encoding/json"
	"github.com/emersion/go-imap/v2"
)

// A MODSEQ is an opaque 63-bit value (RFC7162). Decimal text preserves it
// through JavaScript JSON, whose numbers are exact only through 2^53-1.
type exactModseqStatus struct {
	*imap.StatusData
	HighestModSeq uint64 `json:"HighestModSeq,string"`
}

func statusForJSON(status *imap.StatusData) *exactModseqStatus {
	if status == nil {
		return nil
	}
	return &exactModseqStatus{status, status.HighestModSeq}
}

func (status MailboxStatus) MarshalJSON() ([]byte, error) {
	if status.StatusData == nil {
		return []byte("{}"), nil
	}
	return json.Marshal(statusForJSON(status.StatusData))
}

// LIST-STATUS has the same wire boundary inside each folder's Status.
func (info MailboxInfo) MarshalJSON() ([]byte, error) {
	type fields MailboxInfo
	if info.ListData == nil {
		return json.Marshal(fields(info))
	}
	return json.Marshal(struct {
		fields
		Status *exactModseqStatus
	}{fields(info), statusForJSON(info.Status)})
}
