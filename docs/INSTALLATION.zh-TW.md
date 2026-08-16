# 安裝、升級與解除安裝

[English](INSTALLATION.md) | [简体中文](INSTALLATION.zh-CN.md) | [繁體中文](INSTALLATION.zh-TW.md) | [Français](INSTALLATION.fr.md)

## 開始前

- 請在 Windows 上使用 Obsidian 桌面版 `1.12.7` 或更新版本。
- 此公開預覽版尚未在 macOS 或 Linux 驗證，也不支援行動裝置。
- 請先在含非敏感範例書籍的獨立 Vault 中測試。
- 若你重視閱讀進度、書籤、摘錄、設定或已建立的筆記，請先備份外掛的本機資料。
- 請勿使用此外掛繞過 DRM。

## 安裝 GitHub 公開預覽版

1. 開啟儲存庫的 [Releases 頁面](https://github.com/SunnyD0697/local-book-reader/releases)。
2. 下載 `local-book-reader-0.3.6.zip`。**不要**下載 GitHub 自動產生的 **Source code (zip)**；它是原始碼，不是安裝套件。
3. 關閉 Obsidian，或在替換檔案前先停用 Local Book Reader。
4. 建立資料夾：`<Vault>/.obsidian/plugins/local-book-reader/`。
5. 將專用外掛 ZIP 的內容解壓縮至該資料夾。確認以下三個執行檔直接位於 `local-book-reader` 資料夾中：
   - `main.js`
   - `manifest.json`
   - `styles.css`
6. 重新開啟 Obsidian，並在「社群外掛」中啟用 **Local Book Reader**。新安裝預設顯示 English；可隨時在 **Local Book Reader settings** 的「Interface language」切換 English、簡體中文、繁體中文與法語。切換不會改變電子書、筆記、資料夾或閱讀資料。

如需在解壓縮前驗證下載的 ZIP，請使用同一 Release 附帶的 `SHA256SUMS.txt`。

Local Book Reader 也已進入 Obsidian 社群外掛目錄。兩種安裝途徑使用相同的三個執行檔。

## 從原始碼建置並安裝

1. 安裝 Node.js `22.13.0` 或更新版本，以及 pnpm `11.9.0`。
2. 在儲存庫目錄中執行 `pnpm install --frozen-lockfile` 與 `pnpm run build`。
3. 依上文第 3–6 步操作。目前公開的 `0.3.6` ZIP 與從原始碼建置的版本都使用標準的三個執行檔：`main.js`、`manifest.json` 與 `styles.css`。

首次使用說明會顯示在 Obsidian 中。為避免大型收藏導致啟動卡頓，外掛會將電子書副檔名的處理權交由 Obsidian 管理。

## 升級

1. 若此目錄存在，請備份 `<Vault>/.obsidian/plugins/local-book-reader/data/`。
2. 下載新版本對應的專用外掛 ZIP。
3. 停用外掛或關閉 Obsidian。
4. 替換上文列出的三個執行檔。若是從 `0.3.0` 升級，也可以移除不再使用的 `pdf.worker.min.mjs` 檔案。
5. 重新開啟 Obsidian，並在開啟電子書前確認外掛能正常載入。

在寫入升級後資料前，外掛可能會為自身的索引、閱讀狀態與設定建立版本相關備份。這些備份不包含電子書內容，也不能取代你自己的備份。

## 解除安裝

1. 在 Obsidian 中停用 Local Book Reader。
2. 若想保留外掛專屬的閱讀資料，請先備份 `<Vault>/.obsidian/plugins/local-book-reader/data/`。
3. 完成備份後，再刪除 `local-book-reader` 外掛資料夾。

解除安裝外掛不會刪除、移動、重新命名、覆寫或以其他方式改變原始電子書。你建立的 Markdown 筆記會保留在 Vault 中。
