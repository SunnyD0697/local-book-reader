# Third-party notices

Local Book Reader is licensed under the project's [MIT License](LICENSE).
The production bundle also contains or distributes the components below. Each
component remains subject to its own license.

| Component | Version | License | Use in the release |
|---|---:|---|---|
| [foliate-js](https://github.com/johnfactotum/foliate-js) | 1.0.1 | MIT | Ebook parsing and rendering; locally patched to remove iframe `allow-scripts` |
| [construct-style-sheets-polyfill](https://github.com/calebdwilliams/construct-style-sheets) | 3.1.0 | MIT | Bundled dependency of `foliate-js` |
| [fflate](https://github.com/101arrowz/fflate) | 0.8.2 | MIT | Vendored by `foliate-js` for decompression |
| [zip.js](https://github.com/gildas-lormeau/zip.js) | 2.7.52 | BSD-3-Clause | Vendored by `foliate-js` for archive reading |
| [PDF.js / pdfjs-dist](https://github.com/mozilla/pdf.js) | 6.1.200 | Apache-2.0 | PDF parsing, rendering, and the bundled Worker |
| [core-js](https://github.com/zloirock/core-js) | 3.49.0 | MIT | Compatibility code embedded in the PDF.js distribution |

The exact bundled versions were derived from `pnpm-lock.yaml` and the generated
`main.js` and `pdf.worker.min.mjs`. Development-only tools and Obsidian APIs are
not distributed inside the plugin bundle.

## Copyright notices

- foliate-js: Copyright (c) 2022 John Factotum
- construct-style-sheets-polyfill: Copyright 2019 Caleb Williamsgit st
- fflate: Copyright (c) 2023 Arjun Barrett
- zip.js: Copyright (c) 2023, Gildas Lormeau
- PDF.js: Copyright 2024 Mozilla Foundation
- core-js: Copyright (c) 2013–2025 Denis Pushkarev (zloirock.ru); Copyright
  (c) 2025–2026 CoreJS Company (core-js.io)

The full applicable license texts are included in:

- [LICENSES/foliate-js-MIT.txt](LICENSES/foliate-js-MIT.txt)
- [LICENSES/construct-style-sheets-polyfill-MIT.txt](LICENSES/construct-style-sheets-polyfill-MIT.txt)
- [LICENSES/fflate-MIT.txt](LICENSES/fflate-MIT.txt)
- [LICENSES/core-js-MIT.txt](LICENSES/core-js-MIT.txt)
- [LICENSES/BSD-3-Clause.txt](LICENSES/BSD-3-Clause.txt)
- [LICENSES/Apache-2.0.txt](LICENSES/Apache-2.0.txt)

The generated `pdf.worker.min.mjs` also retains PDF.js's upstream license
header. This notice does not replace or modify any third-party license.
