# Installation, upgrade, and uninstall

## Before you begin

- Use Obsidian desktop, not mobile.
- Test first in a separate Vault with non-sensitive sample books.
- Keep a backup of the plugin's local data if you value reading progress,
  bookmarks, excerpts, settings, or generated notes.
- Do not use this plugin to bypass DRM.

## Install a locally built candidate

1. Build the project with `pnpm install --frozen-lockfile` and `pnpm run build`.
2. Close Obsidian or disable the plugin while replacing its files.
3. Create `<Vault>/.obsidian/plugins/local-book-reader/`.
4. Copy these build artifacts into that directory:
   - `main.js`
   - `manifest.json`
   - `styles.css`
   - `pdf.worker.min.mjs`
5. Reopen Obsidian, enable **Local Book Reader** in Community plugins, and
   use **从个人书库打开电子书** or **打开个人图书馆**.

The first-use guide is shown inside Obsidian. The plugin keeps ebook extension
handlers under Obsidian's control to avoid startup freezes with large libraries.

## Upgrade

1. Back up `<Vault>/.obsidian/plugins/local-book-reader/data/` if it exists.
2. Replace only the four artifacts listed above.
3. Reopen Obsidian and confirm that the plugin loads before opening a book.

The plugin may create version-bound backups of its own index, reading state,
and settings before it writes upgraded data. These backups do not include ebook
content. They are not a replacement for your own backup.

## Uninstall

1. Disable Local Book Reader in Obsidian.
2. Back up `<Vault>/.obsidian/plugins/local-book-reader/data/` if you want to
   retain plugin-owned reading data.
3. Remove the plugin directory only after that backup is complete.

Uninstalling the plugin does not delete, move, rename, overwrite, or otherwise
alter original ebook files. Markdown notes you created remain in the Vault.
