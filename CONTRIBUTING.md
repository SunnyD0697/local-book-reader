# Contributing

Thank you for helping improve Local Book Reader.

## Before contributing

- Do not commit ebooks, DRM-protected material, personal Vault data, library
  indexes, reading-state files, backups, screenshots containing private data,
  credentials, or diagnostic archives.
- Preserve the core rule: original ebooks are read-only. A change must not copy,
  move, rename, overwrite, or delete an original ebook.
- Do not add DRM bypass, telemetry, account requirements, or network behavior.

## Local checks

Use Node.js 22.13 or newer and pnpm 11.9.0:

```powershell
pnpm install --frozen-lockfile
pnpm run build
```

Describe the tested Obsidian version, the supported format, and any local data
written by the change. Keep pull requests focused and avoid generated files.

## Reporting bugs

Use redacted, minimal steps. Explain expected behavior, actual behavior,
Obsidian version, plugin version, and operating system.
