package managesieve

import "testing"

func TestSuccessGreetingKeepsCompatibilityWithMixedQuotedAndBareText(t *testing.T) {
	c, cleanup := newTestClient(t, "\"IMPLEMENTATION\" \"ManageSieve\"\r\n\"VERSION\" \"1.0\"\r\nOK \"Sora\" ManageSieve server ready.\r\n")
	defer cleanup()
	if err := c.readResponse(); err != nil {
		t.Fatalf("previously accepted server greeting refused: %v", err)
	}
	if c.capabilities["VERSION"] != "1.0" {
		t.Fatal("lost greeting capabilities")
	}
}
