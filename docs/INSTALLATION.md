# Installation, upgrade, and uninstall

[English](INSTALLATION.md) | [简体中文](INSTALLATION.zh-CN.md) | [繁體中文](INSTALLATION.zh-TW.md) | [Français](INSTALLATION.fr.md)

## Before you begin

- Use Obsidian desktop `1.12.7` or newer on Windows.
- This public preview has not yet been validated on macOS or Linux and does not
  support mobile devices.
- Test first in a separate Vault with non-sensitive sample books.
- Keep a backup of the plugin's local data if you value reading progress,
  bookmarks, excerpts, settings, or generated notes.
- Do not use this plugin to bypass DRM.

## Install the GitHub public preview

1. Open the repository's
   [Releases page](https://github.com/SunnyD0697/local-book-reader/releases).
2. Download `local-book-reader-0.3.6.zip`. Do **not** download GitHub's
   automatic **Source code (zip)** archive; it is source code, not an install
   package.
3. Close Obsidian, or disable Local Book Reader while replacing its files.
4. Create `<Vault>/.obsidian/plugins/local-book-reader/`.
5. Extract the dedicated plugin ZIP into that directory. Confirm that these
   three runtime files are directly inside the `local-book-reader` directory:
   - `main.js`
   - `manifest.json`
   - `styles.css`
6. Reopen Obsidian and enable **Local Book Reader** in Community plugins. New
   installations begin in English; choose **Interface language** in **Local
   Book Reader settings** at any time to switch between English, Simplified
   Chinese, Traditional Chinese, and French. The choice never changes ebooks,
   notes, folders, or reading data.

Use the accompanying `SHA256SUMS.txt` release attachment if you want to verify
the downloaded ZIP before extracting it.

Local Book Reader is also available in the Obsidian community-plugin
directory. The same three runtime files are used for both installation paths.

## Build and install from source

1. Install Node.js `22.13.0` or newer and pnpm `11.9.0`.
2. Run `pnpm install --frozen-lockfile` and `pnpm run build` in the repository.
3. Follow steps 3–6 above. The current public `0.3.6` ZIP and source build use
   the standard three runtime files: `main.js`, `manifest.json`, and
   `styles.css`.

The first-use guide is shown inside Obsidian. The plugin keeps ebook extension
handlers under Obsidian's control to avoid startup freezes with large
libraries.

## Upgrade

1. Back up `<Vault>/.obsidian/plugins/local-book-reader/data/` if it exists.
2. Download the dedicated plugin ZIP for the new release.
3. Disable the plugin or close Obsidian.
4. Replace the three runtime files listed above. When upgrading from `0.3.0`,
   you may also remove the no-longer-used `pdf.worker.min.mjs` file.
5. Reopen Obsidian and confirm that the plugin loads before opening a book.

The plugin may create version-bound backups of its own index, reading state,
and settings before it writes upgraded data. These backups do not include ebook
content and are not a replacement for your own backup.

## Uninstall

1. Disable Local Book Reader in Obsidian.
2. Back up `<Vault>/.obsidian/plugins/local-book-reader/data/` if you want to
   retain plugin-owned reading data.
3. Remove the `local-book-reader` plugin directory only after that backup is
   complete.

Uninstalling the plugin does not delete, move, rename, overwrite, or otherwise
alter original ebook files. Markdown notes you created remain in the Vault.
