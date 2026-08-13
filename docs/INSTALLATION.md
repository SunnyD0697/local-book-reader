# Installation, upgrade, and uninstall

[English](INSTALLATION.md) | [简体中文](INSTALLATION.zh-CN.md)

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
2. Download `local-book-reader-0.3.0.zip`. Do **not** download GitHub's
   automatic **Source code (zip)** archive; it is source code, not an install
   package.
3. Close Obsidian, or disable Local Book Reader while replacing its files.
4. Create `<Vault>/.obsidian/plugins/local-book-reader/`.
5. Extract the dedicated plugin ZIP into that directory. Confirm that these
   four runtime files are directly inside the `local-book-reader` directory:
   - `main.js`
   - `manifest.json`
   - `styles.css`
   - `pdf.worker.min.mjs`
6. Reopen Obsidian, enable **Local Book Reader** in Community plugins, and use
   **从个人书库打开电子书** or **打开个人图书馆**.

The ZIP may also contain `LICENSE`, `THIRD_PARTY_NOTICES.md`, and a `LICENSES`
directory; these are license documents and do not affect plugin operation.

Local Book Reader is not yet available in the Obsidian community-plugin
directory. The standard community installer does not currently retrieve the
additional PDF Worker required by this build.

## Build and install from source

1. Install Node.js `22.13.0` or newer and pnpm `11.9.0`.
2. Run `pnpm install --frozen-lockfile` and `pnpm run build` in the repository.
3. Follow steps 3–6 above, copying the four generated runtime artifacts instead
   of extracting the release ZIP.

The first-use guide is shown inside Obsidian. The plugin keeps ebook extension
handlers under Obsidian's control to avoid startup freezes with large
libraries.

## Upgrade

1. Back up `<Vault>/.obsidian/plugins/local-book-reader/data/` if it exists.
2. Download the dedicated plugin ZIP for the new release.
3. Disable the plugin or close Obsidian.
4. Replace only the four runtime files listed above.
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
