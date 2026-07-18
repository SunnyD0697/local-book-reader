# Security policy

## Supported versions

Security reports are accepted for the latest released version only. This source
tree is a public-release candidate, not a published release.

## Reporting a vulnerability

Do not publish exploits, proof-of-concept files, or sensitive details in a
public issue. Before GitHub private vulnerability reporting is enabled for the
repository, email a concise report to `sunny1943021@gmail.com`. Include the
plugin version, Obsidian version, steps to reproduce, impact, and a safe
redacted sample when possible.

## Security boundaries

- The plugin does not intentionally make network requests, start a server, or
  execute external programs.
- Ebook files are treated as untrusted, read-only input. The plugin must not
  copy, move, rename, overwrite, or delete an original ebook.
- The plugin stores its own index, reading state, settings, backups, and cache
  under its plugin data directory. User-requested Markdown notes are written
  only inside the active Vault.
- DRM bypass and support for DRM-protected books are out of scope.
- New formats remain disabled until their parser and renderer have been
  reviewed with representative and malformed samples.
