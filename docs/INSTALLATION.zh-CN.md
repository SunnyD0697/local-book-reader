# 安装、升级与卸载

[English](INSTALLATION.md) | [简体中文](INSTALLATION.zh-CN.md) | [繁體中文](INSTALLATION.zh-TW.md)

## 开始前

- 请在 Windows 上使用 Obsidian 桌面版 `1.12.7` 或更高版本。
- 本公开预览版尚未在 macOS 或 Linux 上验证，也不支持移动设备。
- 请先使用不含敏感内容的样书，在单独的测试 Vault 中试用。
- 如果你重视阅读进度、书签、摘录、设置或已生成的笔记，请先备份插件的本地数据。
- 请勿使用本插件绕过 DRM。

## 安装 GitHub 公开预览版

1. 打开仓库的 [Releases 页面](https://github.com/SunnyD0697/local-book-reader/releases)。
2. 下载 `local-book-reader-0.3.5.zip`。**不要**下载 GitHub 自动生成的 **Source code (zip)**；它是源代码，不是安装包。
3. 关闭 Obsidian，或在替换文件前先停用 Local Book Reader。
4. 创建文件夹：`<Vault>/.obsidian/plugins/local-book-reader/`。
5. 将专用插件 ZIP 的内容解压到该文件夹中。确认以下三个运行文件直接位于 `local-book-reader` 文件夹内：
   - `main.js`
   - `manifest.json`
   - `styles.css`
6. 重新打开 Obsidian，并在“社区插件”中启用 **Local Book Reader**。新安装默认显示英文；可随时在 **Local Book Reader 设置** 中通过“界面语言”切换英文、简体中文与繁體中文。切换不会改变电子书、笔记、目录或阅读数据。

如需在解压前校验下载的 ZIP，可使用同一 Release 附带的 `SHA256SUMS.txt`。

Local Book Reader 尚未进入 Obsidian 社区插件目录。`0.3.5` 已采用标准运行文件布局，社区目录发布仍在进行自动审查。

## 从源代码构建并安装

1. 安装 Node.js `22.13.0` 或更新版本，以及 pnpm `11.9.0`。
2. 在仓库目录中运行 `pnpm install --frozen-lockfile` 和 `pnpm run build`。
3. 按上文第 3–6 步操作。当前公开的 `0.3.5` ZIP 和从源代码构建的版本都使用标准的三个运行文件：`main.js`、`manifest.json` 和 `styles.css`。

首次使用说明会显示在 Obsidian 内。为避免大型书库导致启动卡顿，插件会把电子书扩展名的处理权交由 Obsidian 管理。

## 升级

1. 如该目录存在，请备份 `<Vault>/.obsidian/plugins/local-book-reader/data/`。
2. 下载新版本对应的专用插件 ZIP。
3. 停用插件或关闭 Obsidian。
4. 替换上文列出的三个运行文件。从 `0.3.0` 升级时，也可以删除已不再使用的 `pdf.worker.min.mjs` 文件。
5. 重新打开 Obsidian，并在打开电子书前确认插件能够正常加载。

在写入升级后的数据前，插件可能会为自身的索引、阅读状态和设置创建与版本关联的备份。这些备份不包含电子书内容，也不能替代你自己的备份。

## 卸载

1. 在 Obsidian 中停用 Local Book Reader。
2. 如果想保留插件自身的阅读数据，请先备份 `<Vault>/.obsidian/plugins/local-book-reader/data/`。
3. 完成备份后，再删除 `local-book-reader` 插件文件夹。

卸载插件不会删除、移动、重命名、覆盖或以其他方式改变原始电子书。你创建的 Markdown 笔记会保留在 Vault 中。
