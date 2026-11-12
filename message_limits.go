package alps

import (
	"time"
)

// MessageSizeLimit returns the smallest known, advertised upstream message cap.
// A failed or unsupported SMTP probe leaves the IMAP/configured policy usable.
func (s *Session) MessageSizeLimit() int64 {
	s.messageSizeLocker.Lock()
	defer s.messageSizeLocker.Unlock()
	if s.manager.smtpSizeLimit != nil && (s.smtpSizeChecked.IsZero() || time.Since(s.smtpSizeChecked) > 10*time.Minute) {
		s.smtpSizeChecked = time.Now()
		if size, err := s.manager.smtpSizeLimit(s.Username()); err == nil {
			s.smtpMessageLimit = size
		}
	}
	return s.knownMessageSizeLimitLocked()
}

// KnownMessageSizeLimit never opens a connection while preparing a mutation.
// SMTP itself checks its current SIZE; UI reads populate the cached probe.
func (s *Session) KnownMessageSizeLimit() int64 {
	s.messageSizeLocker.Lock()
	defer s.messageSizeLocker.Unlock()
	return s.knownMessageSizeLimitLocked()
}
func (s *Session) knownMessageSizeLimitLocked() int64 {
	var limit int64
	if value, ok := s.GetData("appendLimitBytes"); ok {
		limit, _ = value.(int64)
	}
	if s.smtpMessageLimit > 0 && (limit <= 0 || s.smtpMessageLimit < limit) {
		limit = s.smtpMessageLimit
	}
	return limit
}

// AttachmentSizeLimit reserves space for body/headers and base64 line breaks.
// The complete encoded message is checked separately before it is submitted.
func (s *Session) AttachmentSizeLimit() int64 {
	return s.attachmentSizeLimit(s.MessageSizeLimit())
}

// KnownAttachmentSizeLimit enforces cached capabilities without a probe on a write.
func (s *Session) KnownAttachmentSizeLimit() int64 {
	return s.attachmentSizeLimit(s.KnownMessageSizeLimit())
}
func (s *Session) attachmentSizeLimit(size int64) int64 {
	configured := s.manager.MaxAttachmentSize()
	if size > 0 {
		available := size - (64 << 10)
		if available <= 0 {
			available = size / 2
		}
		raw := (available / 78) * 57
		if raw < 1 {
			raw = 1
		}
		if configured <= 0 || raw < configured {
			return raw
		}
	}
	return configured
}
