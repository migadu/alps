package tlsmanager

import (
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"time"
)

func (m *Manager) certificateTime() time.Time {
	if m.certificateClock != nil {
		return m.certificateClock()
	}
	return time.Now()
}

func certificateLeaf(cert *tls.Certificate) (*x509.Certificate, error) {
	if cert == nil || len(cert.Certificate) == 0 {
		return nil, fmt.Errorf("certificate has no leaf")
	}
	if cert.Leaf != nil {
		return cert.Leaf, nil
	}
	return x509.ParseCertificate(cert.Certificate[0])
}

// Match autocert's renewal threshold: its default adapts to shorter-lived
// certificates, and configured RenewBefore values are capped at thirty days.
func certificateRenewalWindow(leaf *x509.Certificate, configured time.Duration) time.Duration {
	threshold := leaf.NotAfter.Sub(leaf.NotBefore) / 3
	if configured > 0 {
		threshold = configured
	}
	return min(threshold, 30*24*time.Hour)
}

// autocert returns its in-memory certificate without rechecking validity.
// Rejecting a stale result leaves its existing renewal worker intact.
func (m *Manager) validateCertificate(cert *tls.Certificate) error {
	leaf, err := certificateLeaf(cert)
	if err != nil {
		return err
	}
	now := m.certificateTime()
	if now.After(leaf.NotAfter) {
		return fmt.Errorf("certificate expired at %s", leaf.NotAfter.Format(time.RFC3339))
	}
	if now.Before(leaf.NotBefore) {
		return fmt.Errorf("certificate is not valid before %s", leaf.NotBefore.Format(time.RFC3339))
	}
	return nil
}
