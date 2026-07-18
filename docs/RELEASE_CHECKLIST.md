# Public release checklist

This checklist is for a future GitHub release. Completing local checks does not
authorize creating a repository, pushing code, publishing a release, or
submitting to the Obsidian community-plugin directory.

## Privacy and source review

- [ ] Start from this sanitized candidate directory, not the personal dev tree.
- [ ] Confirm no `diagnostics`, `.cache`, `.agents`, `.codex`, `node_modules`,
  private Vault data, ebooks, backups, `.env` files, or credentials are staged.
- [ ] Review `git status --ignored` and the complete staged diff.
- [ ] Search for real local paths, email addresses, tokens, and private samples.

## Build and security

- [ ] Run `pnpm install --frozen-lockfile` in a clean environment.
- [ ] Run `pnpm run build`.
- [ ] Verify the `foliate-js` patch removes iframe `allow-scripts`.
- [ ] Confirm no direct ebook copy, move, rename, overwrite, or delete path.
- [ ] Confirm no DRM bypass, telemetry, account requirement, external process,
  server, or undocumented network request.

## Public documentation

- [ ] Review README, LICENSE, SECURITY, PRIVACY, CONTRIBUTING, SUPPORT, and
  CHANGELOG for accuracy and public contact details.
- [ ] Fill in repository URL, issue tracker URL, and homepage only after the
  repository exists and the user approves their publication.
- [ ] Keep `v0.2.71` labeled as a local baseline, not a public-release claim.

## GitHub and release decisions

- [ ] Review CI on a private rehearsal repository.
- [ ] Enable GitHub private vulnerability reporting and update SECURITY.md.
- [ ] Choose a release version and tag only after the public-release checklist
  is complete.
- [ ] Obtain explicit user confirmation before each external action: repository
  creation, push, public visibility change, Release publication, or PR.
