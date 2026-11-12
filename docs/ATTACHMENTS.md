# Attachment Handling in ALPS

A file the user attaches in the composer is uploaded to ALPS and held there until the draft or message it belongs to is written. These pending uploads take memory and disk space, so ALPS counts them against three budgets, caps each upload request, and deletes older uploads when the session or global budget is full.

---

## The Attachment Lifecycle

When a user attaches a file while composing an email:

1. **Upload**: Before uploading, the web composer adds up the size of all its attachments, the new files included, and compares the total with the `MaxAttachmentMiB` value the server reports (`max_attachment_mib`). If the total is over it, the composer shows a message and uploads nothing. Otherwise it sends one request per file to `POST /attachments` and shows each file's progress (see [The Upload Endpoints](#the-upload-endpoints)).
2. **Storage**: The request is parsed with a 32 KiB in-memory allowance. A file part that fits in what is left of it stays in memory, and any larger file part is written to disk whole, in a temporary file named `multipart-*` in the process temp directory (see [The Temporary Directory](#the-temporary-directory)).
3. **Session Tracking**: The server gives each file a UUID and keeps it in the user's current session, under the composer it was uploaded for. From then on it counts against the composer, session and global budgets (see [Quotas and Limitations](#quotas-and-limitations)) until it leaves the session.
4. **Draft Save**: The composer saves the draft as soon as the last upload of a batch finishes, so uploads normally stay pending only until that save. A draft save names its uploads in `attachment-uuids`. While it runs, they are taken out of the session, as for a send, and written into the draft stored in Drafts. When the save can then read the stored draft back, their files are deleted and the answer says which stored part each upload became. From then on the composer refers to those files by part path (`prev_attachments`) instead of UUID. Reading the draft back needs its new UID: ALPS takes it from the server's APPENDUID answer, or, on a server without UIDPLUS, finds the new copy by its Message-ID among the messages stored since just before the APPEND (see [MAIL_SERVER.md](MAIL_SERVER.md)). If the save fails, or the new copy cannot be told apart or read, the uploads are given back to the session for the next save.
5. **Send**: A send names its uploads in `attachment-uuids` too. While the request runs, the uploads are taken out of the session and its budgets, and written into the message. Once the SMTP server has accepted the message, they are removed when the request ends. If the send fails, they are given back to the session for the next try, or removed if the session has ended in the meantime.
6. **Remove/Discard**: When the user removes an uploaded file from the composer, or discards the draft, the composer sends `DELETE /attachments/{uuid}`. The server takes the upload out of the session and its budgets, and deletes its file once no other upload from the same request holds it. Removing a file that is still uploading aborts that request instead.

Parts carried from a saved draft, or from a message being replied to or forwarded, are read from the IMAP server at save or send time. They never pass through `/attachments` and do not count against the attachment budgets.

If a send or draft save names an upload the session does not hold (it was evicted, or its session ended), the request is refused with 409, and `missing_attachments` lists every missing UUID. Nothing is sent or stored, and the composer lists those files as ones to add again.

### The Upload Endpoints

- `POST /attachments?composer_id=<composer id>` takes `multipart/form-data` with the files in the field `attachments`. One request may carry several files. The answer is 200 with a JSON array of upload UUIDs in file order. The files of one request are stored whole or not at all.
- `DELETE /attachments/{uuid}` releases one upload. It answers 200 whether or not the session held it.

An upload is refused with:

- **413** when the request body exceeds `max_attachment_mib` + 1 MiB.
- **400** when the files do not fit a budget, the body is malformed, or a file part cannot be written to the temp directory.
- **401** when the session has ended. The file of an upload that finishes after its session has ended is removed.

---

## The Temporary Directory

Uploads go in the process temp directory: `[server] temp_dir` when that is set, otherwise the OS default (`$TMPDIR`, else `/tmp`). ALPS applies `temp_dir` by setting `TMPDIR` at startup and does not create the directory, so it must already exist, or every upload over 32 KiB is refused with 400. See [CONFIGURATION.md](CONFIGURATION.md) for the key, and [OPERATIONS.md](OPERATIONS.md) for what else ALPS writes to disk.

All of one request's spilled file parts share a single `multipart-*` file. It is removed as soon as a refused request ends. Otherwise it stays until the last attachment stored from that request is removed: sent, saved into a draft, deleted, evicted, or dropped when its session ends. The web composer sends one file per request, so each of its uploads that is written to disk has a file of its own.

Uploads exist only in the memory and temp directory of the ALPS process that received them. They do not survive a restart and are not shared between cluster nodes (see [CLUSTER.md](CLUSTER.md)), so a session restored from the login token (see [SESSIONS.md](SESSIONS.md)) starts with none. The composer's next save or send is then refused with 409 `missing_attachments`, and the composer lists those files as ones to add again.

---

## Quotas and Limitations

To keep uploads from exhausting memory and disk, ALPS enforces three layers of attachment limits and a cap on each upload request. The limits are set in the `[server]` section of `config.toml` (see [CONFIGURATION.md](CONFIGURATION.md)). They take positive whole numbers of MiB. 0 or a negative value means the default (32, 128 and 1024), so none of the limits can be turned off.

Each stored upload counts against all three budgets. A request whose files together exceed any one of the three limits is refused (400) before anything is stored. Each file is then fitted against current usage. Over the composer budget it is refused. Over the session or global budget, older uploads are deleted to make room (see [Eviction and Cleanup](#eviction-and-cleanup)).

### Request Size Cap
- **Value**: `max_attachment_mib` + 1 MiB, the extra MiB being slack for multipart framing.
- **Scope**: A single upload request.
- **Description**: A larger body is refused with 413 while it is still being read.

### 1. Per-Composer Limit (`max_attachment_mib`)
- **Default**: 32 MiB
- **Scope**: The uploads one session holds for one composer (`composer_id`).
- **Description**: The server refuses (400) an upload that would take the uploads this session holds for that composer over this limit. It counts pending uploads only: parts already written into a saved draft, and parts carried from another message, are not counted. The web composer checks the whole message: before uploading, it adds up all of its attachments, uploads and carried parts alike, and compares the total with the `MaxAttachmentMiB` value the server reports.

### 2. Per-Session Limit (`max_session_attachment_mib`)
- **Default**: 128 MiB
- **Scope**: All the uploads one session holds, across all its open composer windows. Every session has its own budget, including each of several sessions of one user.
- **Description**: When a new upload would take the session over this limit, ALPS deletes that session's oldest pending uploads to make room (see [The Session Budget Evictor](#1-the-session-budget-evictor)).

### 3. Global Server Limit (`max_global_attachment_mib`)
- **Default**: 1024 MiB (1 GiB)
- **Scope**: The pending uploads held by all the sessions of one ALPS process. In a cluster, each node has its own budget.
- **Description**: An in-memory counter. When a new upload would take this process over the limit, ALPS deletes the oldest pending uploads on this node to make room (see [The Global Budget Evictor](#2-the-global-budget-evictor)). Some bytes are on disk outside this count. An upload body is written to the temp directory before the budgets are checked (each request is capped at `max_attachment_mib` + 1 MiB). Uploads being written into a message by a send or draft save in progress have left the count, while their files remain until the request ends.

> [!WARNING]
> If your server expects heavy concurrent attachment uploads, increase `max_global_attachment_mib` and make sure the temp directory has room to spare above that value.

---

## Eviction and Cleanup

ALPS removes pending uploads in three ways besides the user's own removal: the session budget evictor, the global budget evictor, and the end of a session. Users whose uploads were deleted have their next save or send refused with 409 `missing_attachments`, and their composer lists those files as ones to add again.

### 1. The Session Budget Evictor
When a new upload would take the session over `max_session_attachment_mib`, ALPS deletes that session's oldest pending uploads, by upload time and from any of its composers, until the new upload fits. It refuses the upload (400) only if nothing is left to delete.

### 2. The Global Budget Evictor
When a new upload would take this process over `max_global_attachment_mib`, ALPS does not immediately reject the upload. It deletes the oldest pending uploads on this node, chosen by upload time alone and whichever session holds them (the uploader's own included), until the new upload fits. If nothing is left to delete, the upload is refused (400). A request that alone exceeds the global limit is refused before anything is evicted.

### 3. When a Session Ends
When a session ends (sign-out, a switch to a linked account, idle timeout, the absolute session lifetime, eviction under `max_sessions` or `max_sessions_per_user`, the mail server refusing the session's password, or a mail connection that cannot be opened again), every upload it holds is removed and its bytes are returned to the global budget. See [SESSIONS.md](SESSIONS.md) for how long a session lasts.

### 4. The Temp File Sweeper
A crash or a killed process leaves its `multipart-*` files behind. A shutdown starts each session's cleanup and waits up to 5 seconds in all for it, so files can be left behind after a stop as well when the cleanup takes longer. No upload survives a restart, so while ALPS is stopped every `multipart-*` file in its own temp directory is a leftover.

A running ALPS sweeps them with the job `core:cleanup_temp_attachments`. Once an hour, the first time an hour after startup, it removes every `multipart-*` file at the top level of the temp directory whose modification time is more than 7 days old. It keeps the files of the uploads the process still holds, however old they are: those a session keeps for a composer, and those a send or draft save in progress has taken from it. The sweep does not tell ALPS's files from another program's files of the same name, so give ALPS its own `temp_dir`.
