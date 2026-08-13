# Local Book Reader

[English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md)

Local Book Reader 是一款僅支援桌面版的 Obsidian 外掛，用於在目前的 Vault 中閱讀與整理個人電子書。它會在本機處理電子書，將原始電子書視為唯讀輸入，並將研究成果儲存為一般 Markdown 檔案。

> **發布狀態：** `0.3.3` 是目前最新的 GitHub 公開預覽版本。可從 GitHub Release 下載專用安裝 ZIP，尚未進入 Obsidian 社群外掛目錄。
>
> **社群目錄狀態：** `0.3.4` 是尚未發布的社群目錄合規修正候選版本，只修改自動審查要求的原始碼實作細節，暫時不能安裝。

## 功能

- 開啟目前 Vault 中未加密的 EPUB、MOBI、AZW、AZW3、TXT 與 PDF 檔案。
- 提供可手動啟動、可續掃的個人圖書館掃描，以及搜尋與篩選功能。
- 在本機儲存閱讀進度、書籤、摘錄、閱讀外觀與外掛專屬備份。
- 僅在使用者主動要求時建立閱讀與研究用的 Markdown 筆記。
- 使用內附的離線 PDF Worker 轉譯 PDF。

## 已驗證的規模與效能

在 Windows 桌面版 Obsidian 的實際本機電子書收藏中，首次完整掃描 10,336 本電子書約需兩分鐘。掃描會顯示進度，並可暫停、繼續或取消。這是實測結果，不是最低效能保證；實際時間取決於電腦與收藏規模。

## 安全與隱私承諾

- 原始電子書為唯讀：外掛不會複製、移動、重新命名、覆寫或刪除它們。
- 外掛沒有刪除電子書的功能。
- 不提供 DRM 繞過；受 DRM 保護的書籍不在支援範圍內。
- 外掛不會主動發出網路請求、啟動伺服器、執行外部程式、蒐集遙測資料，也不需要帳號。
- 電子書內容會視為不受信任的輸入。內附的 `foliate-js` 閱讀器修補程式會移除 Electron/Chromium 環境中 iframe 的 `allow-scripts` 權限。

部分動作會刻意影響外掛專屬資料，或影響你主動要求建立的 Markdown 筆記。經確認後匯出的備份，可在你選擇的位置建立一個位於 Vault 外的 JSON 檔案。完整界限請閱讀 [PRIVACY.md](PRIVACY.md) 與 [SECURITY.md](SECURITY.md)。

## 公開預覽版需求

- Obsidian 桌面版 `1.12.7` 或更新版本
- Windows 桌面版；此預覽版尚未在 macOS 或 Linux 驗證
- 一個存有你有權閱讀之電子書的 Vault
- 提供 English、簡體中文與繁體中文介面。既有安裝會保留簡體中文；新安裝預設為 English，可在 **Local Book Reader settings** 中切換。切換不會重新命名、移動或改寫既有電子書、筆記、資料夾或閱讀資料。

不支援手機或平板裝置。

## 安裝、升級與解除安裝

請從 GitHub Release 下載專用外掛 ZIP。**不要**使用 GitHub 自動產生的 **Source code (zip)**；那是原始碼，不是安裝套件。

完整的安裝、升級、備份與解除安裝說明請見 [docs/INSTALLATION.zh-TW.md](docs/INSTALLATION.zh-TW.md)。請先在含非敏感範例書籍的獨立 Vault 中測試此預覽版。

## 從原始碼建置

需要 Node.js `22.13.0` 或更新版本，以及 pnpm `11.9.0`：

```powershell
pnpm install --frozen-lockfile
pnpm run build
```

正式執行所需檔案為 `main.js`、`manifest.json` 與 `styles.css`。PDF Worker 已內嵌於 `main.js`，因此建置結果符合 Obsidian 社群外掛的標準安裝配置。請勿將產生的執行檔提交至程式碼庫；它們應作為 GitHub Release 附件提供。

## 已知限制

- 這是 GitHub 公開預覽版，不是 Obsidian 社群外掛目錄的正式發布。
- 掃描影像型 PDF 不提供 OCR。
- 不提供雲端同步、電子書轉換、線上中繼資料、AI 功能、文字轉語音或全圖書館全文索引。
- 刻意不提供電子書的自動整理、重新命名、移動、合併與刪除功能。

## 專案界限

本專案不是通用電子書管理工具、雲端閱讀器、DRM 工具或內容轉換服務。它刻意不會在 Obsidian 啟動時自動掃描整個 Vault；請改用個人圖書館中的明確掃描或重新整理功能。

## 貢獻與支援

- 提交 Pull Request 前，請閱讀 [CONTRIBUTING.md](CONTRIBUTING.md)。
- 安全的錯誤回報方式請見 [SUPPORT.md](SUPPORT.md)。
- 安全漏洞請依 [SECURITY.md](SECURITY.md) 所述方式私下回報。
- 內附軟體及授權說明請見 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

## 作者

建立與維護：Sunny D（[@SunnyD0697](https://github.com/SunnyD0697)）

## 授權

Local Book Reader 使用 [MIT License](LICENSE)。內附的第三方元件保留各自的授權。
