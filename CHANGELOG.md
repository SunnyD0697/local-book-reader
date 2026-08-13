# Changelog

All notable changes to this project are documented here.

## Unreleased

## 0.3.4 — community review compliance candidate

- Replaced manually created settings headings with Obsidian's standard
  `Setting#setHeading()` API.
- Replaced direct reader appearance style assignments with Obsidian's
  supported `setCssStyles()` helper.
- Localized the English library-refresh completion, relink, and ambiguous-match
  notices at the point they are created.
- Localized Personal Library reading status and progress while keeping ebook
  format, title, author, and folder-path metadata unchanged.
- Localized the fixed root-folder label while continuing to keep actual folder
  paths unchanged.
- No reader behavior, user data, supported format, or interface language
  changed.

## 0.3.3 — GitHub public preview and community review fix

- Removed the redundant word `Obsidian` from the fixed community-directory
  description and added the required terminal punctuation.
- No reader behavior, user data, supported format, or interface language
  changed.

## 0.3.2 — localization and three-file installer layout

- Bundled the PDF.js Worker into `main.js`, removing the extra runtime file
  that the Obsidian community installer does not download.
- Prepared the standard three-asset layout: `main.js`, `manifest.json`, and
  `styles.css`. This version is released as a GitHub public preview but has
  not been submitted to the community directory.
- Added switchable English, Simplified Chinese, and Traditional Chinese
  interfaces. Existing
  installations keep Simplified Chinese; language changes never migrate or
  rewrite ebooks, reading data, folders, or Markdown notes.
- Added English output for newly created notes while retaining compatibility
  with the earlier Simplified-Chinese thought and excerpt formats.

## 0.3.0 — first GitHub public preview

- Prepared the first GitHub public preview from the frozen local `v0.2.71`
  baseline without changing the original-ebook safety boundary.
- Regenerated the `foliate-js` security patch and verified a clean, frozen,
  dependency installation followed by a production build.
- Added public-release documentation and a build-only GitHub Actions workflow.
- Completed the initial private-repository CI rehearsal.
- Pinned the Obsidian development dependency to `1.13.1` and linked the public
  `Sunny D` author metadata to the unique GitHub account `@SunnyD0697`.
- Set the conservatively tested minimum Obsidian desktop version to `1.12.7`.
- Documented the Windows-tested, Simplified-Chinese public-preview boundary and
  the separate future work required for Obsidian community-directory support.

## v0.2.71 — local baseline

`v0.2.71` is the frozen local-use baseline. It is not a public GitHub release
and has not yet passed public-release review.
