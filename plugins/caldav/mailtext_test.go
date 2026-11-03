package alpscaldav

import "testing"

// The frontend names Simplified Chinese "zh-Hans" and Traditional Chinese
// "zh-Hant". Each script's words are kept under its own code rather than
// under "zh", so neither falls back to the other's, and a Chinese the
// frontend does not name is written in English.
func TestWordsForChinese(t *testing.T) {
	for lang, want := range map[string]string{
		"zh-Hans": "任务",
		"zh-Hant": "工作",
		"zh-HK":   "Task",
	} {
		if got := wordsFor(lang).task; got != want {
			t.Errorf("%s: %q, want %q", lang, got, want)
		}
	}
}
