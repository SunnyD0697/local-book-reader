# Public release checklist

This checklist covers the first GitHub public preview and the following
community-directory candidate. Completing local checks does not authorize
pushing a branch, changing repository visibility, creating a tag, publishing a
GitHub Release, or submitting to the Obsidian community directory.

## Version identity

- [ ] Keep the display name **Local Book Reader** and plugin ID
  `local-book-reader`.
- [ ] Set `manifest.json` and `package.json` to the intended release version.
- [ ] Set `manifest.json` `minAppVersion` and `versions.json` to `1.12.7`.
- [ ] Use the exact Git tag that matches `manifest.json`, without a `v` prefix.
- [ ] Keep `v0.2.71` labeled as a frozen local baseline, not a public release.

## Privacy and source review

- [ ] Start from the sanitized candidate repository, not the personal dev tree.
- [ ] Confirm no `diagnostics`, `.cache`, `.agents`, `.codex`, `node_modules`,
  private Vault data, ebooks, backups, `.env` files, or credentials are staged.
- [ ] Review `git status --ignored` and the complete branch diff.
- [ ] Search for real local paths, tokens, private samples, and unintended
  personal data.
- [ ] Confirm the only intentionally public email address is the security and
  conduct contact documented by the maintainer.

## Build, security, and licenses

- [ ] Run `pnpm install --frozen-lockfile` in a clean environment.
- [ ] Run `pnpm run build`.
- [ ] Verify the `foliate-js` patch removes iframe `allow-scripts`.
- [ ] Confirm no direct ebook copy, move, rename, overwrite, or delete path.
- [ ] Confirm no DRM bypass, telemetry, account requirement, external process,
  server, or undocumented network request.
- [ ] Verify `THIRD_PARTY_NOTICES.md` against the exact bundled dependency
  versions and preserve required license notices in the release package.

## Public documentation

- [ ] Review README, LICENSE, THIRD_PARTY_NOTICES, SECURITY, PRIVACY,
  CONTRIBUTING, CODE_OF_CONDUCT, SUPPORT, INSTALLATION, and CHANGELOG.
- [ ] State that the preview is tested on Windows with Obsidian desktop
  `1.12.7`; mark macOS and Linux as unvalidated and mobile as unsupported.
- [ ] State that the current UI is Simplified Chinese.
- [ ] Document the user-confirmed backup-export exception outside the Vault.
- [ ] Warn that GitHub's automatic **Source code (zip)** archive is not an
  install package.

## GitHub public-preview package (`0.3.0` only)

- [ ] Build `local-book-reader-0.3.0.zip` from the reviewed commit.
- [ ] Include `main.js`, `manifest.json`, `styles.css`,
  `pdf.worker.min.mjs`, `LICENSE`, `THIRD_PARTY_NOTICES.md`, and `LICENSES/`.
- [ ] Confirm the four runtime files are at the ZIP root and no source, cache,
  ebook, Vault data, or credentials are included.
- [ ] Generate and verify `SHA256SUMS.txt`.
- [ ] Install the dedicated ZIP in a separate test Vault and perform the final
  smoke test.

## GitHub decisions and approval gates

- [ ] Confirm the private-repository CI passes on the reviewed commit.
- [ ] Obtain separate user approval before pushing the preparation branch.
- [ ] Obtain separate user approval before merging its pull request.
- [ ] Obtain separate user approval before changing the repository to Public.
- [ ] After the repository is public, enable private vulnerability reporting.
- [ ] Obtain separate user approval before creating tag `0.3.0` or publishing
  the GitHub Release.

## Obsidian community-directory candidate (`0.3.1`)

- [ ] Keep the released `0.3.0` GitHub public-preview ZIP unchanged; it has a
  historical four-file layout including `pdf.worker.min.mjs`.
- [ ] Confirm that `0.3.1` bundles the PDF Worker into `main.js` and requires
  no fourth runtime file.
- [ ] Create a fresh test Vault containing only `main.js`, `manifest.json`, and
  `styles.css`, then complete EPUB and PDF smoke tests before any release.
- [ ] Before a future community submission, repeat the security review and
  recheck that the plugin name and ID remain unique.
