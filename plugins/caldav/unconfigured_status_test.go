package alpscaldav

import (
	"context"
	"errors"
	"github.com/migadu/alps"
	"net/http"
	"testing"
)

func TestUnconfiguredCalDAVHasAStableStatus(t *testing.T) {
	p := &plugin{}
	_, _, err := p.clientWithCalendars(context.Background(), nil)
	var status *alps.HTTPError
	if !errors.As(err, &status) || status.Code != http.StatusConflict || status.Message != "caldav_not_configured" {
		t.Fatalf("unconfigured: %v", err)
	}
}
