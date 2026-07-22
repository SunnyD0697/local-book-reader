# Local Book Reader

Local Book Reader is a desktop-only Obsidian plugin for reading and organizing
personal ebooks in the active Vault. It is designed to keep ebook handling
local and to keep original ebook files read-only.

> **Release status:** this is a public-release candidate prepared from the
> frozen local `v0.2.71` baseline. It is not yet a GitHub release or an
> Obsidian community-plugin release.

## What it does

- Opens EPUB, MOBI, AZW, AZW3, TXT, and PDF files from the active Vault.
- Provides a manual, resumable Personal Library scan with search and filters.
- Saves reading progress, bookmarks, excerpts, reader appearance, and
  plugin-owned backups locally.
- Creates reading and research Markdown notes only when the user asks.
- Supports local PDF rendering with a bundled offline worker.

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
notes. Read [PRIVACY.md](PRIVACY.md) and [SECURITY.md](SECURITY.md) for scope
and reporting guidance.

## Requirements

- Obsidian desktop `1.8.0` or newer
- A Vault containing ebooks you are permitted to read
- Windows, macOS, or Linux desktop environment supported by Obsidian

## Install, upgrade, and uninstall

The detailed instructions are in [docs/INSTALLATION.md](docs/INSTALLATION.md).
Until an official release exists, use a separate test Vault and install only
artifacts you build and review yourself.

## Build from source

Use Node.js `22.13.0` or newer and pnpm `11.9.0`:

```powershell
pnpm install --frozen-lockfile
pnpm run build
```

The production artifacts are `main.js`, `manifest.json`, `styles.css`, and the
bundled `pdf.worker.min.mjs`. Do not commit generated artifacts unless the
release process explicitly requires them.

## Project boundaries

This project is not a general ebook manager, cloud reader, DRM tool, or
content-conversion service. It deliberately avoids automatic full-Vault ebook
indexing during Obsidian startup; use the Personal Library's explicit scan or
refresh action instead.

## Contributing and support

- Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.
- Use [SUPPORT.md](SUPPORT.md) for safe bug-report guidance.
- Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## Author

Created and maintained by Sunny D
([@SunnyD0697](https://github.com/SunnyD0697)).

## License

Licensed under the [MIT License](LICENSE).
