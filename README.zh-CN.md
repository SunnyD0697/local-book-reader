# Local Book Reader

[English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md)

Local Book Reader 是一款仅支持桌面端的 Obsidian 插件，用于在当前库（Vault）中阅读和整理个人电子书。它在本地处理电子书，将原始电子书作为只读内容，并把研究成果保存为普通 Markdown 文件。

> **发布状态：** `0.3.2` 是最新的 GitHub 公开预览版本。专用安装 ZIP 可从 GitHub Release 下载，暂未进入 Obsidian 社区插件目录。
>
> **社区目录状态：** `0.3.3` 是尚未发布的社区目录审查修复候选版本，只修改目录使用的固定简介，暂不能安装。

## 可以做什么

- 打开当前 Vault 中未加密的 EPUB、MOBI、AZW、AZW3、TXT 和 PDF 文件。
- 手动扫描“个人书库”；扫描可暂停和继续，并支持搜索与筛选。
- 在本地保存阅读进度、书签、摘录、阅读外观设置和插件自身的备份。
- 只在你主动要求时创建阅读笔记和研究用 Markdown 笔记。
- 使用随插件附带的离线 PDF Worker 渲染 PDF。

## 已验证的规模与性能

在 Windows 桌面版 Obsidian 的真实本地书库中，首次完整扫描 10,336 本电子书约需两分钟。扫描会显示进度，并可暂停、继续或取消。这是一次实际测试结果，不是对最低性能的保证；实际耗时取决于电脑和书库情况。

## 安全与隐私承诺

- 原始电子书为只读：插件不会复制、移动、重命名、覆盖或删除它们。
- 插件没有删除电子书的功能。
- 不提供 DRM 绕过功能；受 DRM 保护的书籍不在支持范围内。
- 插件不会主动发起网络请求、启动服务器、运行外部程序、收集使用数据，也不要求注册账号。
- 电子书内容会被视为不受信任的输入。随插件附带的 `foliate-js` 阅读器补丁会移除 Electron/Chromium 环境中 iframe 的 `allow-scripts` 权限。

部分操作会有意影响插件自身的数据，或影响你主动要求创建的 Markdown 笔记。经你确认后导出的备份，可以在你选择的位置创建一个位于 Vault 外的 JSON 文件。完整边界请阅读 [PRIVACY.md](PRIVACY.md) 和 [SECURITY.md](SECURITY.md)。

## 公开预览版要求

- Obsidian 桌面版 `1.12.7` 或更高版本
- Windows 桌面端；本预览版尚未在 macOS 或 Linux 上验证
- 一个存有你有权阅读的电子书的 Vault
- 提供英文、简体中文和繁體中文界面。已有安装会继续保持简体中文；新安装默认英文，可在 **Local Book Reader 设置** 中切换。切换不会重命名、移动或改写已有电子书、笔记、目录或阅读数据。

不支持手机或平板设备。

## 安装、升级与卸载

请从 GitHub Release 下载专用插件 ZIP 压缩包。**不要**使用 GitHub 自动生成的 **Source code (zip)**；那是源代码，不是安装包。

详细的安装、升级、备份和卸载说明见 [docs/INSTALLATION.zh-CN.md](docs/INSTALLATION.zh-CN.md)。请先用不含敏感内容的样书，在单独的测试 Vault 中试用此预览版。

## 从源代码构建

需要 Node.js `22.13.0` 或更新版本，以及 pnpm `11.9.0`：

```powershell
pnpm install --frozen-lockfile
pnpm run build
```

正式运行所需的文件为 `main.js`、`manifest.json` 和 `styles.css`。PDF Worker 已内置于 `main.js`，因此构建结果符合 Obsidian 社区插件的标准安装布局。不要将生成的运行文件提交到代码仓库；它们应作为 GitHub Release 的附件提供。

## 已知边界

- 这是 GitHub 公开预览版，不是 Obsidian 社区插件目录的正式发布。
- 扫描版 PDF 不提供 OCR 文字识别。
- 不提供云同步、电子书转换、在线元数据、AI 功能、文字转语音或全书库全文索引。
- 不提供电子书的自动整理、重命名、移动、合并或删除。

## 项目边界

本项目不是通用电子书管理器、云端阅读器、DRM 工具或内容转换服务。它不会在 Obsidian 启动时自动扫描整个 Vault；请使用“个人书库”中的明确扫描或刷新操作。

## 贡献与支持

- 提交 Pull Request 前，请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。
- 安全的错误报告方式见 [SUPPORT.md](SUPPORT.md)。
- 安全漏洞请按 [SECURITY.md](SECURITY.md) 所述方式私下报告。
- 随附软件及许可证说明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

## 作者

创建与维护：Sunny D（[@SunnyD0697](https://github.com/SunnyD0697)）

## 许可证

Local Book Reader 使用 [MIT License](LICENSE)。随附的第三方组件保留各自的许可证。
