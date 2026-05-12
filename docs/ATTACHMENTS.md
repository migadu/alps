# Attachment Handling in ALPS

ALPS implements a robust attachment management system designed to balance user experience with strict server resource protection. Because attachments can quickly consume significant amounts of RAM and disk space, ALPS employs a multi-tiered quota system and proactive eviction policies.

---

## The Attachment Lifecycle

When a user attaches a file while composing an email:

1. **Upload Phase**: The frontend uploads the file asynchronously to the `/attachments` endpoint.
2. **Storage**: The Go `multipart` parser receives the file. Small files (under 10MB) are kept in memory, while larger files are automatically spilled to temporary files on disk (in the server's `temp_dir`).
3. **Session Tracking**: The server assigns a unique UUID to the attachment and registers it with the user's current session. The attachment's file size is immediately deducted from the user's and the global attachment budgets.
4. **Consumption**: 
   - **Send**: When the user sends the email, ALPS retrieves the attachments from the session, encodes them into the outgoing MIME message, and immediately deletes the temporary files.
   - **Cancel/Delete**: If the user removes the attachment from the composer or discards the draft, the frontend issues a `DELETE` request, and the server deletes the file and restores the budget.

---

## Quotas and Limitations

To prevent abusive resource consumption or accidental denial-of-service (DoS) from massive uploads, ALPS enforces three layers of attachment limits. These can be configured in the `[server]` section of `config.toml`.

### 1. Per-Composer Limit (`max_attachment_mib`)
- **Default**: 32 MiB
- **Scope**: A single email draft.
- **Description**: The total combined size of all attachments for a single outgoing message cannot exceed this limit.

### 2. Per-Session Limit (`max_session_attachment_mib`)
- **Default**: 128 MiB
- **Scope**: A single user session (across all open composer windows).
- **Description**: Prevents a single user from hoarding disk space by opening multiple drafts and uploading files to all of them.

### 3. Global Server Limit (`max_global_attachment_mib`)
- **Default**: 1024 MiB (1 GiB)
- **Scope**: The entire ALPS server instance.
- **Description**: The absolute maximum amount of disk/memory space that ALPS will allocate to pending attachments across all active users. 

> [!WARNING]
> If your server expects heavy concurrent attachment uploads, you should increase `max_global_attachment_mib` and ensure your server has sufficient disk space in its temporary directory.

---

## Proactive Eviction and Cleanup

ALPS implements two distinct cleanup mechanisms to handle abandoned attachments.

### 1. The Global Budget Evictor
If a user attempts to upload an attachment that pushes the server over the `max_global_attachment_mib` limit, ALPS will not immediately reject the upload. 
Instead, it will search through all active sessions and find the single **oldest** pending attachment and forcefully delete it to free up budget. It will continue evicting the oldest attachments until enough space is available for the new upload. 
This ensures that active users are not blocked by stale drafts abandoned by other users.

### 2. The Temp File Sweeper
If the ALPS server crashes, or if the `multipart` package spills orphaned files to disk that evade the session tracker, these files could accumulate over time.
To mitigate this, ALPS runs a background scheduler (running every 1 hour) that scans the server's temporary directory for Go's `multipart-*` files. Any multipart temp file older than **7 days** is permanently deleted.
