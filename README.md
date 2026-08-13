# Local Book Reader

[English](README.md) | [简体中文](README.zh-CN.md)

Local Book Reader is a desktop-only Obsidian plugin for reading and organizing
personal ebooks in the active Vault. It keeps ebook handling local, treats
original ebook files as read-only input, and stores research results as normal
Markdown.

> **Release status:** `0.3.0` is the first GitHub public-preview version.
> Download the dedicated installation ZIP from the GitHub Release. It is not
> yet available in the Obsidian community-plugin directory.

## What it does

- Opens unencrypted EPUB, MOBI, AZW, AZW3, TXT, and PDF files from the active
  Vault.
- Provides a manual, resumable Personal Library scan with search and filters.
- Saves reading progress, bookmarks, excerpts, reader appearance, and
  plugin-owned backups locally.
- Creates reading and research Markdown notes only when the user asks.
- Supports local PDF rendering with a bundled offline worker.

## Verified scale and performance

In a real local ebook collection on Obsidian desktop for Windows, the initial
full scan of 10,336 ebooks completed in about two minutes. The scan reports
progress and can be paused, resumed, or cancelled. This is an observed test
result, not a minimum performance guarantee; actual time depends on the
computer and the collection.

## Safety and privacy promises

- Original ebooks are read-only: the plugin must not copy, move, rename,
  overwrite, or delete them.
- There is no ebook-deletion feature.
- DRM bypass and DRM-protected books are out of scope.
- The plugin does not intentionally make network requests, start a server,
  execute external programs, collect telemetry, or require an account.
- Ebook content is untrusted input. The bundled `foliate-js` reader patch
  removes iframe `allow-scripts` for the Electron/Chromium environment.

Some actions intentionally affect plugin-owned data or user-requested Markdown
notes. A user-confirmed backup export may create a new JSON file outside the
Vault at a location the user selects. Read [PRIVACY.md](PRIVACY.md) and
[SECURITY.md](SECURITY.md) for the complete boundaries.

## Public-preview requirements

- Obsidian desktop `1.12.7` or newer
- Windows desktop; this preview has not yet been validated on macOS or Linux
- A Vault containing ebooks you are permitted to read
- Simplified Chinese UI; English localization is not yet available

Mobile devices are not supported.

## Install, upgrade, and uninstall

Download the dedicated plugin ZIP from the GitHub Release. Do **not** use the
automatic GitHub **Source code (zip)** archive as an install package.

Detailed installation, upgrade, backup, and uninstall instructions are in
[docs/INSTALLATION.md](docs/INSTALLATION.md). Test the preview first in a
separate Vault with non-sensitive sample books.

## Build from source

Use Node.js `22.13.0` or newer and pnpm `11.9.0`:

```powershell
pnpm install --frozen-lockfile
pnpm run build
```

The production runtime artifacts are `main.js`, `manifest.json`, `styles.css`,
and the bundled `pdf.worker.min.mjs`. Do not commit generated runtime artifacts;
they belong in the GitHub Release package.

## Known boundaries

- This is a GitHub public preview, not an Obsidian community-directory release.
- Scanned-image PDFs do not provide OCR.
- The project does not provide cloud sync, ebook conversion, online metadata,
  AI features, text-to-speech, or full-library content indexing.
- Automatic ebook organization, renaming, moving, merging, and deletion are
  deliberately excluded.

## Project boundaries

This project is not a general ebook manager, cloud reader, DRM tool, or
content-conversion service. It deliberately avoids automatic full-Vault ebook
indexing during Obsidian startup; use the Personal Library's explicit scan or
refresh action instead.

## Contributing and support

- Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.
- Use [SUPPORT.md](SUPPORT.md) for safe bug-report guidance.
- Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).
- See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for bundled software and
  license notices.

## Author

Created and maintained by Sunny D
([@SunnyD0697](https://github.com/SunnyD0697)).

## License

Local Book Reader is licensed under the [MIT License](LICENSE). Bundled
third-party components retain their respective licenses.
