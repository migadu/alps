package alpsbase

import (
	"html/template"
	"net/url"
	"strings"
	"time"

	"github.com/dustin/go-humanize"
	"github.com/emersion/go-imap"
)

const (
	inputDateLayout = "2006-01-02"
	inputTimeLayout = "15:04"
)

var templateFuncs = template.FuncMap{
	"tuple": func(values ...interface{}) []interface{} {
		return values
	},
	"pathescape": url.PathEscape,
	"formatdate": func(t time.Time) string {
		return t.Format("Mon Jan 02 15:04")
	},
	"formatflag": func(flag string) string {
		switch flag {
		case imap.SeenFlag:
			return "Seen"
		case imap.AnsweredFlag:
			return "Answered"
		case imap.FlaggedFlag:
			return "Starred"
		case imap.DraftFlag:
			return "Draft"
		default:
			return flag
		}
	},
	"ismutableflag": func(flag string) bool {
		switch flag {
		case imap.AnsweredFlag, imap.DeletedFlag, imap.DraftFlag:
			return false
		default:
			return true
		}
	},
	"join": strings.Join,
	"formatinputdate": func(t time.Time) string {
		if t.IsZero() {
			return ""
		}
		return t.Format(inputDateLayout)
	},
	"formatinputtime": func(t time.Time) string {
		if t.IsZero() {
			return ""
		}
		return t.Format(inputTimeLayout)
	},
	"humantime": humanize.Time,
}
