# Privacy

Local Book Reader is designed for use with an Obsidian Vault on the local
machine.

- It does not intentionally send analytics, telemetry, account data, ebook
  content, or library metadata to a remote service.
- It does not require an account.
- It stores plugin-owned index, reading state, settings, backups, and cover
  cache locally in the active Vault's plugin data directory.
- It creates or appends Markdown notes only after a user requests that action.
- It does not copy, move, rename, overwrite, or delete original ebook files.
- When the user explicitly chooses **Export backup**, selects a destination,
  and confirms the operation, the plugin may create one JSON backup file at
  that user-selected location outside the Vault. It does not scan, read,
  modify, delete, or automatically synchronize other files at that location.

Exported backups contain plugin settings and core reading data. They do not
contain ebook files, Markdown notes, cover images, or rebuildable caches. The
user is responsible for protecting and deleting manually exported backups.

This policy describes the plugin. Obsidian, the operating system, and any other
plugins have their own policies and behavior.
