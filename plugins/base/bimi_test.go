package alpsbase

import (
	"strings"
	"testing"
)

func TestSanitizeSVGRemovesScript(t *testing.T) {
	// The avatar is also served with a sandboxing CSP and nosniff; this is the
	// layer underneath, so each way of spelling script in SVG is checked.
	inputs := map[string]string{
		"script element":         `<svg><script>alert(1)</script><rect/></svg>`,
		"script with attributes": `<svg><script type="text/ecmascript">alert(1)</script></svg>`,
		"closing tag with space": `<svg><script>alert(1)</script ></svg>`,
		"self-closing script":    `<svg><script href="https://evil.example/x.js"/></svg>`,
		"unclosed script":        `<svg><script>alert(1)</svg>`,
		"double-quoted handler":  `<svg onload="alert(1)"></svg>`,
		"single-quoted handler":  `<svg onload='alert(1)'></svg>`,
		"unquoted handler":       `<svg onload=alert(1)></svg>`,
		"handler with spaces":    `<svg onload = "alert(1)"></svg>`,
		"handler on a new line":  "<svg\nonclick\n=\n'alert(1)'></svg>",
		"javascript URL":         `<svg><a href="javascript:alert(1)"><text>x</text></a></svg>`,
		"upper case":             `<SVG ONLOAD="alert(1)"><SCRIPT>alert(1)</SCRIPT></SVG>`,
	}
	for name, in := range inputs {
		out := strings.ToLower(string(sanitizeSVG([]byte(in))))
		for _, marker := range []string{"<script", "onload", "onclick", "javascript:"} {
			if strings.Contains(out, marker) {
				t.Errorf("%s: %q survived in %q", name, marker, out)
			}
		}
	}
}

func TestSanitizeSVGKeepsAnOrdinaryLogo(t *testing.T) {
	logo := `<svg xmlns="http://www.w3.org/2000/svg" version="1.2" baseProfile="tiny-ps"><title>Brand</title>` +
		`<polygon points="0,0 10,0 5,8" fill="#c00"/><path d="M0 0h10" stroke="#000" transform="rotate(10)"/></svg>`
	if got := string(sanitizeSVG([]byte(logo))); got != logo {
		t.Errorf("an ordinary logo was changed:\n%s", got)
	}
}
