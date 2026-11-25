# Keyboard shortcuts

Press `?`, or choose the **?** button in the header, to open the keyboard shortcut list. The list is available from the header even when character shortcuts are disabled. Close it with **Close** or `Escape`; focus returns to where it was opened.

| Key | Action |
| --- | --- |
| `?` | Show the shortcut list |
| `q` | Mark messages as read |
| `z` | Archive messages |
| `ArrowDown` / `ArrowUp` | Move the focused row in the message list |
| `Enter` | Open the focused row |
| `Space` | Select or deselect the focused row, then move to the next row |

`q` and `z` act on checked messages first. With no selection, they act on the focused row while the message list has keyboard focus, or on the open message or conversation in the reader. A collapsed conversation row represents its messages together; an expanded row represents that message alone. In a reader conversation, `q` also marks unread Sent replies read, while `z` archives only messages in the viewed folder. `q` always marks mail read: pressing it again does not mark mail unread. Archive uses the account's Archive folder and offers the same undo action as the Archive button; it is unavailable in Archive, Trash and Drafts.

Character shortcuts do not act while typing in a field or composing text with an input method. Menus, dialogs, composers and attachment previews keep their own keys. Mail actions are available only in Messages, and ignore held keys and Ctrl, Command, Alt or Shift combinations. The Shift needed to type `?` is allowed.

The **Enable character shortcuts** switch in the shortcut list controls `?`, `q` and `z`. It is on by default, and the account's choice is saved in `base.settings.ui.keyboardShortcuts` through IMAP METADATA. Like other interface preferences, the browser also remembers the choice while settings load. Arrow keys, `Enter`, `Space` and `Escape` remain available when character shortcuts are off.
