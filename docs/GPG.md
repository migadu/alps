# OpenPGP Encryption (GPG)

The gpg plugin adds OpenPGP encryption to ALPS. It signs and encrypts the body of an outgoing message, and it decrypts encrypted messages in the reader.

All of the cryptography runs in the browser, with OpenPGP.js 6.3.0. The page loads the library the first time it needs it. The server only stores the user's keyring and hands it back. It never receives the passphrase or an unlocked private key.

Recipients' public keys come from their contacts on the CardDAV server, so the plugin depends on the carddav plugin (see [CDAV.md](CDAV.md)).

This document explains how the plugin is enabled, where the keyring is kept, how keys are created and unlocked, and what happens when a message is sent or read.

---

## 1. Enabling the Plugin

The gpg plugin is compiled into ALPS. It has no `server` and no options, only `enabled`:

```toml
[plugin.base]
enabled = true

[plugin.gpg]
enabled = true

# Recipient keys are looked up through carddav.
[plugin.carddav]
enabled = true
server = "https://dav.example.com/"
```

If any `[plugin.*]` section sets `enabled = true`, ALPS loads only the plugins whose own sections set it. In that case set it in `[plugin.gpg]`, and also in `[plugin.base]`, which provides sign-in and all mail, as the example above and `config.example.toml` do. When the plugin is not loaded, the frontend drops its Settings tab and its hooks. The full key reference is in [CONFIGURATION.md](CONFIGURATION.md).

### The carddav Dependency

The plugin finds recipients' keys through carddav's `/contacts` route. Without carddav, or for a user with no CardDAV endpoint, that lookup fails, and every encrypted send to anyone other than yourself stops with an error and is not sent. Generating, importing and reading do not use carddav.

### The Mail Server

The keyring is one of the per-account records ALPS keeps in IMAP METADATA. Without METADATA on the IMAP server it is not kept (see [The Keyring](#2-the-keyring) and [MAIL_SERVER.md](MAIL_SERVER.md)).

---

## 2. The Keyring

Each account has at most one keypair. The keyring is a JSON object with two armored blocks:

| Field | Content |
| --- | --- |
| `public_key` | The public key block, as shown in Settings for you to give to correspondents. |
| `encrypted_private_key` | The private key block, encrypted with the user's passphrase. |

### Where It Is Kept

The keyring is saved under the account store key `gpg_keys`:

- With the IMAP provider, it is the server METADATA entry `/private/vendor/alps/gpg_keys`. It therefore follows the account to every browser and every ALPS node.
- On an IMAP server without `METADATA` or `METADATA-SERVER`, ALPS uses a transient in-memory store. The keyring lasts only as long as that IMAP connection, and is lost after it.
- With the maildir provider, it is in `alps_store.json` at the root of the user's maildir (see [MAILDIR.md](MAILDIR.md)).

The other records kept the same way are listed in [ARCHITECTURE.md](ARCHITECTURE.md#4-stateless-persistence-imap-metadata).

### Routes

| Method | Path | What it does |
| --- | --- | --- |
| `GET` | `/gpg/keys` | Returns the keyring, read from the server rather than from a cached copy. Both fields are empty strings when nothing is stored. |
| `POST` | `/gpg/keys` | Saves the JSON body as the whole keyring. While a keypair is stored, only a request with `?replace=1` replaces it; any other answers `409` and keeps the stored keypair. Without `?replace=1`, a stored keyring that cannot be read gives `500`, and nothing is saved. |
| `DELETE` | `/gpg/keys` | Overwrites the keyring with an empty one. |

Each route answers `401` without a session.

---

## 3. Managing Your Key (Settings > GPG Keys)

The plugin adds a **GPG Keys** tab to Settings. With no keypair stored, the tab offers **Generate New Keypair** and **Import Existing GPG Keypair**. With one stored, it shows the public key block and **Purge Keypair**. To replace a keypair, purge it first.

If the keyring cannot be read (an error answer, or none in time), the tab says *Could not load the GPG keys.* and offers only **Try again**, never Generate or Import.

A tab that shows no keypair saves without `replace=1`. If a keypair was stored meanwhile, from another tab or browser, the server keeps it and answers `409`: the generate or import fails (*Failed to generate keys: 409 Conflict*, or *Import failed: 409 Conflict*), and the tab reads the keyring again and shows the stored keypair.

### Generating a Keypair

**Generate New Keypair** asks for a new passphrase, then asks for it again. If the two differ, ALPS says so and asks again; an empty passphrase cancels. OpenPGP.js then creates the keypair with `type: 'ecc'` and `curve: 'curve25519'`. That gives an OpenPGP v4 key with an Ed25519 primary key for signing and a Curve25519 subkey for encryption.

- The key does not expire.
- Its user ID is the name `ALPS User`, with no email address.
- The revocation certificate OpenPGP.js returns is neither kept nor shown.

The private key is encrypted with the passphrase before the keyring is saved.

### Importing a Keypair

**Import Existing GPG Keypair** takes a pasted public key block and a pasted private key block, for example from `gpg --armor --export-secret-keys`. Both are required, and each must parse as an OpenPGP key.

1. If the private key is protected by a passphrase, ALPS asks for that passphrase and unlocks the key in the browser. A wrong passphrase is asked for again; Cancel ends the import.
2. You then set a new passphrase, entered twice.
3. ALPS encrypts the private key with the new passphrase and saves it with the public key block as pasted.

ALPS does not check that the public block holds a public key, or that the two blocks belong to the same key. It saves the public block as pasted and shows it in the tab for you to give to correspondents, so paste the public key of the private key you import.

### Purging the Keypair

**Purge Keypair** asks for confirmation, then deletes the keyring from the server. Mail encrypted to that key cannot be read in ALPS until the same key is imported again.

Saving a new keypair, by generating or importing, and purging also make that browser tab forget the unlocked key (see [Unlocking the Private Key](#4-unlocking-the-private-key)).

---

## 4. Unlocking the Private Key

The first operation that needs your private key fetches the keyring with `GET /gpg/keys` and asks for the passphrase. That is an encrypted send, once the recipients' keys are found, or opening an encrypted message. A wrong passphrase is asked for again. Cancel stops the operation.

The unlocked key is held only in the page's memory, never in `sessionStorage` or `localStorage`. Each browser tab unlocks it separately. It is forgotten when:

- the page is reloaded or closed (a completed switch to a linked account reloads it),
- you sign out, you are signed out for inactivity, or the session expires,
- a new keypair is saved, or the keypair is purged, in the same tab.

---

## 5. Sending Encrypted Mail

The plugin adds a lock button, **Toggle GPG Encryption**, to the composer toolbar. It is off in every new composer window, replies included. A composer window that the page restores after a reload keeps the setting it had. While it is off, the plugin leaves the message alone.

With the button on, the plugin does the following when the message is sent, after the Undo countdown that follows Send:

1. It refuses to send a message with attachments: *Attachments cannot be encrypted with inline PGP and would be sent unencrypted. Remove the attachments, or turn off encryption to send them.* That covers new uploads and parts carried over from another message: a forward's attachments, a reopened draft's attachments, and, in an HTML reply or forward, the images the quoted message shows inline.
2. It looks up a public key for every To, Cc and Bcc recipient except your account's own address (see [Finding Recipient Keys](#finding-recipient-keys)).
3. If any recipient has no key, an alert names them (*Cannot encrypt: Missing public keys for: …*) and nothing is sent.
4. It unlocks your private key.
5. It signs the body with your private key and encrypts it to every recipient's key and to your own.
6. The message is sent with the encrypted text in place of the original body.

Any other error in these steps shows *GPG Encryption failed:* with the reason, and stops the send. That includes an account with no keyring (*No private key found on server. Please generate one in Settings.*) and a cancelled passphrase prompt. Whenever the send stops, the composer window comes back with the message as written.

### Finding Recipient Keys

For each recipient, the plugin takes the bare address (`bob@example.com` from `Bob <bob@example.com>`) and searches the contacts with `GET /contacts?query=<address>`. That is a CardDAV text search on the cards' `FN` or `EMAIL` in the first address book the server lists, the only one ALPS uses (see [CDAV.md](CDAV.md#address-books-and-calendars)). Its results include every card whose name or addresses contain the address.

From the results, the plugin takes the first card that both has a public key and lists the recipient's address among its email addresses. The address must equal one of the card's addresses, compared bare and without regard to case, so a card for `superbob@example.com` does not qualify for `bob@example.com`.

The card's public key is its preferred `KEY` property. In ALPS it is the contact's **Public Key** field. Its value must be an ASCII-armored public key block. A `KEY` in another form, such as a URI or binary data, cannot be read, and the send stops with an error.

Your account's own address, the one you signed in as, is not looked up, because the message is always encrypted to your own key. Any other address of yours, such as an identity's, is looked up like any recipient's.

### The Encrypted Message

- When you compose in HTML, the text encrypted is the message's HTML source; otherwise it is the plain text.
- Your own key is the public half of your unlocked private key. Encrypting to it lets you read the copy in Sent.
- The result is one ASCII-armored `-----BEGIN PGP MESSAGE-----` block, signed and encrypted. It replaces the text body, and the HTML body is dropped.
- The message goes out as a single `text/plain` part (inline PGP), and the copy saved to Sent is the same message.

---

## 6. Reading Encrypted Mail

Before the reader shows a message body, the plugin looks for `-----BEGIN PGP MESSAGE-----` in it. If it finds one, it takes the text from there to the first `-----END PGP MESSAGE-----`, unlocks your private key and decrypts that block. The decrypted text replaces the block, and the message is then shown as HTML. Text around the block is kept.

- Decrypted text that contains `<html`, `<body`, `<p>`, `<div` or `<br` is shown as HTML. Any other text is HTML-escaped, with its line breaks kept.
- Either way, the result then goes through the reader's HTML sanitizer, as any HTML message does.
- An info banner says *The content of this message was end-to-end encrypted with GPG.*
- If decryption fails, the encrypted text stays as it is, under an error banner that says *This message is encrypted but no matching private key is found on server to decrypt it.* The banner is the same whatever the cause: no keyring, a key that does not match, a cancelled prompt, or a block that cannot be read.

ALPS does not check the signature of a message it decrypts. The banner says only that the content was encrypted, not who sent it.

Only the message reader decrypts. The print view shows the armored block.

---

## 7. What Is and Is Not Encrypted

The plugin encrypts the message body only, at send time. It replaces the send request's text with the armored message and empties its HTML. Every other part of the request goes as the composer built it. So the subject, the From, To, Cc and Bcc addresses and the other headers are not encrypted. Attachments are not encrypted either: a send with attachments is refused instead. The plugin does nothing when a draft is saved, so the drafts ALPS saves to the Drafts folder while you write are stored unencrypted.

The encrypted message also carries, unencrypted, the ID of each key it is encrypted to, Bcc recipients' keys included, so every recipient can see which keys those are.

---

## 8. Hooks Used

The plugin's backend is the `/gpg/keys` routes. Everything else is in its frontend, `plugins/gpg/frontend/`. It registers its hooks with the plugin id `gpg`, so they run only when `/session` lists the plugin as enabled. How hooks are invoked is described in [PLUGINS.md](PLUGINS.md#frontend-hooks).

| Registration | What the plugin does |
| --- | --- |
| Settings tab `gpg` | The **GPG Keys** tab, the `alps-gpg-settings` component, fetched the first time the tab is shown. |
| `composer:toolbar` | Returns the lock button, which turns `encryptGpg` on or off for the composer window. |
| `composer:presend` | Returns the `FormData` unchanged while `encryptGpg` is off; otherwise the `FormData` with the encrypted body, or `false` to cancel the send. It reports its own errors in an alert and returns `false`, rather than rejecting. |
| `reader:content` | For a body with a PGP block: on success, returns the body with the first block decrypted, sets `payload.isHtml = true` and pushes the info banner onto `payload.banners`; on failure, returns the body unchanged and pushes the error banner. |
