# Localization and RTL in ALPS

The ALPS web interface is translated in the browser. It ships dictionaries for 19 languages. Each user picks one in Settings > Localization, or leaves the setting on Auto and gets the language their browser prefers. Arabic is written right to left, and the layout mirrors for it. The server has no language setting of its own.

This page is for contributors who add or change translations, and for operators who want to know where a user's language comes from.

---

## Languages

Each language has an ALPS code. The code names its dictionary file and is the value saved in the user's settings. Where ALPS hands the language to the browser, it uses the language's BCP-47 tag instead: the document's `lang`, the `lang` of each option in the language picker, the plural rules, and the dates and numbers that some views format in the interface language, such as the month names of a contact's birthday and the dates in a calendar invitation. `intlTag()` in `frontend/src/store/i18n-store.ts` turns a code into its tag. The dates and times of the message list and the reader follow the browser's own locale instead (see [Date and Time Settings](#date-and-time-settings)).

| Code | Language | Name in the picker | Tag |
|---|---|---|---|
| `ar` | Arabic | العربية | `ar` |
| `da` | Danish | Dansk | `da` |
| `de` | German | Deutsch | `de` |
| `en` | English | English | `en` |
| `es` | Spanish | Español | `es` |
| `fr` | French | Français | `fr` |
| `hi` | Hindi | हिन्दी | `hi` |
| `id` | Indonesian | Bahasa Indonesia | `id` |
| `it` | Italian | Italiano | `it` |
| `ja` | Japanese | 日本語 | `ja` |
| `ko` | Korean | 한국어 | `ko` |
| `pt` | Portuguese (Portugal) | Português (Portugal) | `pt-PT` |
| `pt-BR` | Portuguese (Brazil) | Português (Brasil) | `pt-BR` |
| `rs` | Serbian, Cyrillic script | Српски (ћирилица) | `sr-Cyrl` |
| `ru` | Russian | Русский | `ru` |
| `sr` | Serbian, Latin script | Srpski (latinica) | `sr-Latn` |
| `tr` | Turkish | Türkçe | `tr` |
| `zh-Hans` | Chinese, Simplified | 简体中文 | `zh-Hans` |
| `zh-Hant` | Chinese, Traditional | 繁體中文 | `zh-Hant` |

Three codes differ from their tags:

- **Serbian.** `rs` is Serbian in Cyrillic, tagged `sr-Cyrl`, and `sr` is Serbian in Latin, tagged `sr-Latn`. This is the opposite of what the tags suggest: a bare BCP-47 `sr` stands for Cyrillic, yet `sr.ts` is the Latin dictionary and `rs.ts` the Cyrillic one, and `rs` is not a language tag at all. The picker offers `rs` as "Српски (ћирилица)" and `sr` as "Srpski (latinica)".
- **Portuguese.** `pt` is the Portuguese of Portugal, tagged `pt-PT`, beside `pt-BR`. `Intl` reads a bare `pt` as Brazilian, so the tag keeps the plural rules and date forms European.

Every other code is its own tag. All 19 languages are written left to right except `ar`.

---

## Dictionaries

### Core Dictionaries

The core dictionaries are in `frontend/src/i18n/`, one file per code. `en.ts` defines every key. The type `TranslationDictionary` is a deep-partial of `en`, and each dictionary module exports its dictionary as its default export, which is what the loader reads.

English is bundled with the application. Every other dictionary is built as a separate chunk and fetched the first time its language is shown.

A key is a dot path into nested objects, such as `general.cancel` or `settings.localization.language`. A value is either a string or, for a phrase with a count in it, an object of CLDR plural forms (`one`, `few`, `many`, `other`, and so on). `{name}` in a string is a placeholder that the caller fills in.

### Plugin Dictionaries

A plugin with a frontend ships its own dictionaries in `plugins/<name>/frontend/i18n/<code>.ts`, each as a default export. Five plugins do: `caldav`, `carddav`, `gpg`, `managesieve` and `password`. Each has all 19 codes. See [PLUGINS.md](PLUGINS.md#translations) for the plugin layout.

When a language is shown, ALPS loads the core dictionary and every plugin's dictionary for that code. It deep-merges the plugin dictionaries over the core one, so a plugin key wins where both define it. Every plugin's `en.ts` is merged into core English in the same way when the application loads.

### Lookup and English Fallback

`t(key, params)` looks a key up in this order:

1. The active language's merged dictionary.
2. English: core `en` with every plugin's `en` merged in.
3. The key itself, so a missing key shows as literal text such as `general.cancel`.

For a plural entry, `Intl.PluralRules` for the language's tag picks the form for `params.count`. When the dictionary has no such form, or the call passes no numeric `count`, the `other` form is used. Placeholders are then filled from `params`. A placeholder with no value is left as written.

When a dictionary cannot be loaded:

- A plugin chunk that fails is logged (`Failed to load a plugin dictionary`), and only that plugin's strings stay in English.
- When the core chunk fails, the whole interface shows English text. The document's `lang` and `dir` and the plural rules still follow the chosen language.

---

## How a Language Is Chosen

The `language` setting holds a code or `auto`. `auto` is the default, and an account with no setting is treated the same way. A code chosen in Settings is used as it is, whatever the browser prefers.

ALPS starts in English. It sets the language when the page loads, from the settings stored in the browser, and again whenever the settings change, including when the account's settings arrive after sign-in.

### Auto

Under `auto`, ALPS reads the browser's languages, first `navigator.languages` in the reader's order of preference and then `navigator.language`. It uses the first tag it has a dictionary for. If none matches, it uses English. A value that is not a valid language tag is skipped.

Each tag is matched by these rules (`dictionaryFor()` in `frontend/src/store/i18n-store.ts`):

- **Serbian.** A tag that names the Latin script (`sr-Latn`, `sr-Latn-RS`), or the old Serbo-Croatian tag `sh` (`sh-RS`), maps to `sr`. A Cyrillic tag (`sr-Cyrl`), a bare `sr`, or a tag with a region only (`sr-RS`) maps to `rs`. A browser tag `rs` matches nothing, since `rs` is a country code and not a language. Croatian (`hr`) and Bosnian (`bs`) never get a Serbian dictionary.
- **Chinese.** A script in the tag decides first: `Hant` maps to `zh-Hant` and `Hans` to `zh-Hans`, whatever the region, so `zh-Hans-TW` is Simplified and `zh-Hant-CN` Traditional. Without a script, the regions `TW`, `HK` and `MO` map to `zh-Hant`, and any other region, or none, maps to `zh-Hans`.
- **Portuguese.** The region `BR` maps to `pt-BR`. Every other region (`pt-PT`, `pt-AO`), and a bare `pt`, maps to `pt`.
- **Every other language** matches by its primary language subtag: `de-DE` and `de-AT` map to `de`, `fr-CA` to `fr`, `ar-EG` to `ar`. A language ALPS has no dictionary for (`fa-IR`, `he-IL`) is passed over for the next tag. A browser that prefers `fa-IR`, then `de-AT`, then `fr` gets `de`.

`auto` is resolved before anything else sees it. The document's `lang` and `dir`, the plural rules, and the language sent with calendar scheduling emails are always those of the resolved language, never `auto`.

---

## Right-to-Left Layout

`frontend/index.html` starts with `lang="en" dir="ltr"`. Whenever the language changes, ALPS sets the document's `lang` to the language's tag and `dir` to its direction. The direction comes from the language's script. `Intl.Locale(tag).maximize()` supplies the likely script for a bare language, and the scripts `Arab`, `Hebr`, `Syrc`, `Thaa`, `Nkoo`, `Adlm` and `Rohg` are right to left. Of the shipped languages only `ar` is right to left. A new language written in one of those scripts is laid out right to left with no other change.

When `dir` is `rtl`, the layout mirrors:

- Stylesheets use logical properties (`margin-inline-start`, `inset-inline-end`, `border-inline-start`, `text-align: start`) instead of left and right, and flex and grid order follow the direction. `frontend/test/rtl-interface.test.ts` fails on a new physical side (`margin-left`, `padding-right`, `left:`, `text-align: right` and the like) in the `css` blocks and `style` attributes of any `.ts` source under `frontend/src` or a plugin's `frontend/`. The few that stay physical are listed in that test, each with its reason.
- Icons that point along the reading direction are flipped with `scale: var(--ui-inline-direction, 1) 1`: back arrows, carets, reply and forward, undo and redo, indent and outdent, and the sidebar toggle. `--ui-inline-direction` is `1` on `:root` and `-1` on `:root[dir='rtl']` (`frontend/src/index.css`). Other icons, such as the trash can, the padlock or the refresh arrow, keep their shape. The list is `DIRECTIONAL_ICONS` in `frontend/src/utils/ui.ts`.
- Menus aligned to the start or end of their trigger, resizing the sidebar and the contacts list, the message list splitter, the corner that docked composers sit in, and arrow-key navigation in the attachment preview and the mini calendar all follow the direction.

Some things stay left to right, or take their own direction:

- Fields for addresses, passwords, URLs, numbers, phone numbers, dates and times (`alps-input` with type `password`, `email`, `url`, `number`, `tel`, `date`, `datetime-local`, `time`, `month` or `week`) are written left to right in every language. A password stays left to right while it is shown. Other text fields use `dir="auto"` and take the direction of what is typed. A field can set its own with the `input-dir` attribute.
- A message's content takes its direction from the message itself: the direction its author set, or, where the author set none or used `dir="auto"`, its first strong letter. The reader, the quoted text of a reply and the composer apply the same rules (`frontend/src/utils/content-direction.ts`). The interface language does not change it.
- Names and addresses shown among other text, such as in recipient pills, message list rows, thread cards, quote headers, printed messages and the people of events, tasks and contacts, are each set in an isolate (`<bdi>`): a name in its own direction and an address left to right. Neither changes the order of the text around it.

---

## Date and Time Settings

Settings > Localization has three more settings beside Language:

| Setting | Saved as | Values | Default |
|---|---|---|---|
| Time Format | `hour_format` | `auto`, `12`, `24` | `auto` |
| Date Format | `date_format` | `auto`, `YYYY-MM-DD`, `MM/DD/YYYY`, `DD.MM.YYYY` | `auto` |
| First Day of the Week | `week_start` | `1` (Monday), `0` (Sunday) | `1`, unless the operator sets another (see [For Operators](#for-operators)) |

- Under `auto`, the time format is the browser's own clock, and the date format is the browser's own numeric date, with its field order and separators. Both come from `Intl` with no locale, that is, from the browser's formatting locale, not from the ALPS interface language. A browser that formats dates for `en-US` shows a 12-hour clock even when ALPS is shown in German. The browser's clock is read once per page load.
- A chosen date format writes numeric dates in that order and with that separator, for example in full dates and for messages from another year in the message list. A contact's birthday is shown in that format, and its day, month and year are asked for in the same order.
- First Day of the Week has no `auto` and does not follow the browser. Only Monday (`1`) and Sunday (`0`) exist.

---

## For Operators

- Language, time format, date format and first day of the week are per-user settings. ALPS saves them in the account's settings record, the `base.settings` entry, as `language`, `hour_format`, `date_format` and `week_start`. With the IMAP provider this is the METADATA entry `/private/vendor/alps/base.settings`, and with the maildir provider the same key in `alps_store.json`. The settings follow the account to every browser it signs in on. On an IMAP server without METADATA they are kept only for the connection and do not persist (see [MAIL_SERVER.md](MAIL_SERVER.md#2-metadata-where-alps-keeps-its-records)). See [ARCHITECTURE.md](ARCHITECTURE.md#4-stateless-persistence-imap-metadata) for the other records kept this way.
- The browser also keeps the language setting it last used in localStorage, under `alps_settings` with the theme and layout settings. It is kept when the user signs out, so the sign-in page is shown in that language before anyone signs in. A browser with nothing stored shows the sign-in page under `auto`.
- An account that has never saved a language is given the one this browser last used, unless that is `auto`, and it is saved to the account, so other browsers use it too. An account left on `auto` shows each browser its own language.
- There is no configuration key for the language and no server-side default. The server does not read `Accept-Language`. What a user sees changes only through Settings > Localization or, while the setting is on Auto, through the browser's language order.
- The first day of the week for users who have not chosen one is Monday. `options = { week_start = 0 }` in the `[plugin.caldav]` section makes it Sunday (see [CDAV.md](CDAV.md#options)). A user who chooses one in Settings keeps their own.
- Calendar scheduling emails (invitations, replies and cancellations) are written by the server. The browser sends the user's resolved language with the request (`lang`), and the readable text of the email comes from a table in `plugins/caldav/mailtext.go`. A code missing from that table falls back to its primary subtag, then to English. The calendar data in the email is the same in every language. See [CDAV.md](CDAV.md#5-scheduling-invitations-and-tasks).

---

## Adding a Language

A new file in `frontend/src/i18n/` is a language `auto` can choose as soon as it exists: `SUPPORTED_LANGUAGES` is built from the files present. To be offered in Settings and to pass the tests, a language needs all of the following:

1. **The core dictionary**, `frontend/src/i18n/<code>.ts`, typed `TranslationDictionary`, with every key of `en.ts`. Export it under a name, as the others do (`export const de`), and as the default export. Choose the code with the matching rules in mind. A code that is its own bare language tag (such as `nl` or `pl`) is matched by `auto` through the primary subtag. A code with a script or region in it, or one that `intlTag()` maps to another tag, is never matched that way and needs its own rule in `dictionaryFor()`. If the code is not its own BCP-47 tag, map it in `intlTag()`, in the copy of `intlTag` at the top of `frontend/test/i18n-dictionaries.test.ts`, and in `intlLocale()` in `plugins/caldav/frontend/tasks-service.ts`, which keeps its own copy for the due dates of tasks.
2. **A dictionary in each plugin** that has one: `plugins/caldav`, `carddav`, `gpg`, `managesieve` and `password`, each at `frontend/i18n/<code>.ts` with that plugin's `en` keys.
3. **An option in the language picker.** The list in `renderLocalization()` in `frontend/src/components/settings-window.ts` is written out by hand. Add an option like the others, with `value` set to the code, `lang` set to `intlTag("<code>")`, and its label from `settings.localization.<name>`. Without it the language is reachable only through `auto`.
4. **Its name in its own words**, as `settings.localization.<name>`, in every core dictionary. The name is the same in all of them, written in the new language's own script, such as "Deutsch" or "Српски (ћирилица)".
5. **The tests.** In `frontend/test/i18n-dictionaries.test.ts`, import the dictionary and add it to `CORE`, add the code to the list each plugin must have, and add the name to `ENDONYMS`. In `frontend/test/settings-language-picker.test.ts`, add the option to the expected picker list.
6. **Optionally, calendar email text**: an entry in `mailDictionaries` in `plugins/caldav/mailtext.go`, keyed by the code in lower case. Without one, scheduling emails are written in English, or in the dictionary of the code's primary subtag where one exists.

Right-to-left layout needs no extra step when the language's script is one of those listed under [Right-to-Left Layout](#right-to-left-layout).

Run the frontend unit tests with `cd frontend && npm test` (see [E2E.md](E2E.md#frontend-unit-tests) for the test tiers).

---

## Tests

These frontend unit tests cover localization:

- `frontend/test/i18n-dictionaries.test.ts` checks the dictionaries and how the source uses them:
  - Every core dictionary has exactly the keys of core `en`, and every plugin dictionary exactly the keys of that plugin's `en`. Each plugin must have all 19 codes.
  - A plural entry has the forms the language's plural rules use and no others. `many` may be left out, since `other` answers for it. A `one` form keeps `{count}` in a language whose `one` also covers 21, such as Serbian.
  - Every string is non-empty and keeps the placeholders of English.
  - Every key used in the source resolves in the merged English, no plural key is asked for without a count, and no `t()` result has `.replace()` chained onto it. A number that counts something in English is a plural key, apart from a short list of exemptions.
  - `rs` is written in Cyrillic, with a listed set of Latin tokens allowed (protocol names, example addresses, a command), and `sr` in Latin, in the core dictionaries and in every plugin.
  - Every core dictionary names each language in its own words, the same everywhere. Example domains are reserved ones (`example.com`, `.net`, `.org` or the `.example` top-level domain). The Spam, Junk and Trash folder names are different from each other.
  - Some languages are held to their own style: the Serbian and Spanish register, sentence case in Serbian, Italian, French, Spanish and Portuguese, Serbian terms, and the space French puts before `:`, `;`, `?` and `!`.
- `frontend/test/browser-language.test.ts`: `SUPPORTED_LANGUAGES` matches the dictionary files, and `auto` follows the rules above.
- `frontend/test/i18n-store.test.ts`: the document's `lang`, plural forms, English text when a dictionary cannot be loaded, switching language while a dictionary is still loading, and the plugin merge.
- `frontend/test/settings-language-picker.test.ts`: the picker's options, their order, names and `lang` tags. Auto is the first option for language, time and date, and First Day of the Week offers Monday and Sunday.
- `frontend/test/rtl-interface.test.ts` and `frontend/test/rtl-mail-geometry.test.ts`: the document direction, mirrored icons, menus, fields, resize handles, arrow keys, docked composers, and logical sides in the stylesheets.
- `frontend/test/bidi-isolation.test.ts`: names and addresses isolated from the text around them.
- `frontend/test/browser-dates.test.ts`: the clock and the date formats, chosen and under `auto`.
