import { App, FuzzySuggestModal, Menu, Modal, Plugin, PluginSettingTab, Setting, TFile, WorkspaceLeaf } from "obsidian";
import {
  BookStore,
  Bookmark,
  BookmarkLocator,
  Excerpt,
  ExcerptLocator,
  ReaderAppearanceSettings,
  ReaderOpenMode,
  StoredExcerpt,
  LegacyReaderData,
  LibraryBook,
  ReadingStatus,
  ScanProgress,
  SUPPORTED_BOOK_EXTENSIONS,
  CoreDataBackup,
  BookMetadata,
  BookMetadataInput,
  isCoreDataBackup,
  summarizeCoreDataBackup,
  DataStorageUsage,
} from "./book-store";
import { BookLibraryView, BOOK_LIBRARY_VIEW_TYPE } from "./library-view";
import { NoteService } from "./note-service";
import type { ResearchMarkdownEntry } from "./note-service";
import { BookReaderView, BOOK_READER_VIEW_TYPE } from "./reader-view";
import { BookResearchView, BOOK_RESEARCH_VIEW_TYPE } from "./research-view";
import { ConfirmActionModal } from "./confirm-action-modal";
import { chooseBackupToRestore, chooseNewBackupFile, writeNewBackupFile } from "./backup-file-picker";
import { LocalizedNotice as Notice, getLanguage, observeLocalization, setLanguage, t } from "./i18n";
import type { UiLanguage } from "./i18n";

const MAX_MANUAL_BACKUP_BYTES = 50 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

class BookPickerModal extends FuzzySuggestModal<TFile> {
  constructor(
    app: App,
    private readonly onChooseBook: (file: TFile) => Promise<void>
  ) {
    super(app);
    this.setPlaceholder(t("输入书名、作者、文件夹或扩展名进行筛选"));
    this.setInstructions([
      { command: "↑↓", purpose: t("选择") },
      { command: "↵", purpose: t("打开阅读器") },
      { command: "Esc", purpose: t("取消") }
    ]);
  }

  getItems(): TFile[] {
    return this.app.vault.getFiles()
      .filter((file) => SUPPORTED_BOOK_EXTENSIONS.has(file.extension.toLowerCase()))
      .sort((left, right) => left.path.localeCompare(right.path, getLanguage() === "en" ? "en" : "zh-Hans-CN"));
  }

  getItemText(file: TFile): string {
    return file.path;
  }

  onChooseItem(file: TFile): void {
    void this.onChooseBook(file);
  }
}

class FirstUseGuideModal extends Modal {
  private stopLocalization: (() => void) | undefined;

  constructor(app: App, private readonly plugin: LocalBookReaderPlugin) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    this.stopLocalization?.();
    contentEl.createEl("h2", { text: "欢迎使用 Local Book Reader" });
    contentEl.createEl("p", { text: "这里直接读取 Vault 内的电子书；不会复制、移动、重命名或修改原始书籍。" });
    contentEl.createEl("ol", { cls: "ebook-first-use__steps" }, (list) => {
      list.createEl("li", { text: "打开“个人图书馆”，首次使用时点击“刷新图书馆”建立索引。" });
      list.createEl("li", { text: "索引只读取文件路径和基础属性，不读取整本正文；之后新增书籍会自动发现。" });
      list.createEl("li", { text: "阅读进度、书签、高亮和摘录保存在插件数据与 Markdown 笔记中，可在设置页导出核心数据备份。" });
    });
    new Setting(contentEl)
      .setName("界面语言")
      .setDesc("选择 English 或简体中文。切换后，重新打开已打开的插件页面即可看到完整界面更新；不会改动任何电子书、笔记或已有数据。")
      .addDropdown((dropdown) => dropdown
        .addOption("en", "English")
        .addOption("zh-CN", "简体中文")
        .setValue(this.plugin.getUiLanguage())
        .onChange((value) => void this.plugin.setUiLanguage(value === "en" ? "en" : "zh-CN").then(() => this.onOpen())));
    const controls = new Setting(contentEl);
    controls.addButton((button) => button.setButtonText("稍后探索").onClick(() => this.close()));
    controls.addButton((button) => button.setButtonText("打开个人图书馆").setCta().onClick(() => {
      this.close();
      void this.plugin.openLibrary();
    }));
    this.stopLocalization = observeLocalization(contentEl);
  }

  onClose(): void {
    this.stopLocalization?.();
    this.stopLocalization = undefined;
    this.contentEl.empty();
  }
}

class LocalBookReaderSettingsTab extends PluginSettingTab {
  private stopLocalization: (() => void) | undefined;

  constructor(app: App, private readonly plugin: LocalBookReaderPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    this.stopLocalization?.();
    containerEl.empty();
    containerEl.createEl("h2", { text: "Local Book Reader 设置" });
    new Setting(containerEl)
      .setName("界面语言")
      .setDesc("选择 English 或简体中文。切换后，重新打开已打开的插件页面即可看到完整界面更新；不会改动任何电子书、笔记或已有数据。")
      .addDropdown((dropdown) => dropdown
        .addOption("en", "English")
        .addOption("zh-CN", "简体中文")
        .setValue(this.plugin.getUiLanguage())
        .onChange((value) => void this.plugin.setUiLanguage(value === "en" ? "en" : "zh-CN").then(() => this.display())));
    let libraryOwnerName = this.plugin.getLibraryOwnerName();
    new Setting(containerEl)
      .setName("馆主名称")
      .setDesc("填写后显示为“名称 的个人图书馆”；留空则显示“个人图书馆”。名称只保存在插件设置中，不会改动电子书或索引。")
      .addText((text) => text
        .setPlaceholder("例如：Sunny D")
        .setValue(libraryOwnerName)
        .onChange((value) => { libraryOwnerName = value; }))
      .addButton((button) => button.setButtonText("保存名称").setCta().onClick(async () => {
        try {
          await this.plugin.setLibraryOwnerName(libraryOwnerName);
          new Notice("个人图书馆名称已更新。");
        } catch (error) {
          console.error("Local Book Reader could not save library owner name", error);
          new Notice(error instanceof Error ? `无法保存名称：${error.message}` : "无法保存名称。");
        }
      }));

    let notesDirectory = this.plugin.getNotesDirectory();
    new Setting(containerEl)
      .setName("读书笔记保存目录")
      .setDesc("仅允许 Vault 内、且不在 .obsidian 内的相对路径。目录会在你首次主动创建笔记时才建立。")
      .addText((text) => text.setValue(notesDirectory).onChange((value) => { notesDirectory = value; }))
      .addButton((button) => button.setButtonText("保存目录").setCta().onClick(async () => {
        try {
          await this.plugin.setNotesDirectory(notesDirectory);
          new Notice("读书笔记保存目录已更新。");
        } catch (error) {
          console.error("Local Book Reader could not save notes directory", error);
          new Notice("无法保存目录：请填写 Vault 内的有效相对路径。");
        }
      }));

    let researchDirectory = this.plugin.getResearchDirectory();
    new Setting(containerEl)
      .setName("主题研究笔记保存目录")
      .setDesc("用于从摘录检索创建或追加主题研究笔记；仅允许 Vault 内、且不在 .obsidian 内的相对路径。")
      .addText((text) => text.setValue(researchDirectory).onChange((value) => { researchDirectory = value; }))
      .addButton((button) => button.setButtonText("保存目录").onClick(async () => {
        try {
          await this.plugin.setResearchDirectory(researchDirectory);
          new Notice("主题研究笔记保存目录已更新。 ");
        } catch (error) {
          console.error("Local Book Reader could not save research directory", error);
          new Notice("无法保存目录：请填写 Vault 内的有效相对路径。 ");
        }
      }));

    let noteTemplate = this.plugin.getNoteTemplate();
    new Setting(containerEl)
      .setName("新读书笔记默认模板")
      .setDesc("可使用 {{title}}、{{bookId}}、{{bookPath}}、{{format}}、{{readingStatus}}、{{created}}，以及对应的 Json 占位符（如 {{titleJson}}）。模板仅在新建笔记时使用。")
      .addTextArea((text) => {
        text.setValue(noteTemplate).onChange((value) => { noteTemplate = value; });
        text.inputEl.rows = 12;
        text.inputEl.cols = 48;
      })
      .addButton((button) => button.setButtonText("保存模板").onClick(async () => {
        try {
          await this.plugin.setNoteTemplate(noteTemplate);
          new Notice("新读书笔记默认模板已更新。");
        } catch (error) {
          console.error("Local Book Reader could not save note template", error);
          new Notice("无法保存模板：模板不能为空且不能过长。");
        }
      }));

    new Setting(containerEl)
      .setName("恢复默认插件设置")
      .setDesc("只恢复馆主名称、读书笔记目录、主题研究目录、新笔记模板和新书默认阅读外观。已为单本书保存的外观不会改变；不会移动或删除已有 Markdown、阅读数据或电子书。")
      .addButton((button) => button.setButtonText("恢复默认设置").setWarning().onClick(() => {
        this.plugin.confirmResetSettings(() => this.display());
      }));

    new Setting(containerEl)
      .setName("电子书打开位置")
      .setDesc("默认在 Obsidian 标签页打开。选择“独立阅读窗口”可减轻关闭大型 EPUB 时主窗口的卡顿；关闭时仍可能有短暂等待，且不会改动电子书或阅读数据。")
      .addDropdown((dropdown) => dropdown
        .addOption("tab", "Obsidian 标签页（默认）")
        .addOption("window", "独立阅读窗口（减轻关闭卡顿）")
        .setValue(this.plugin.getReaderOpenMode())
        .onChange(async (value) => {
          await this.plugin.setReaderOpenMode(value as ReaderOpenMode);
          new Notice(value === "window" ? "后续打开的电子书将使用独立阅读窗口。" : "后续打开的电子书将使用 Obsidian 标签页。");
        }));

    containerEl.createEl("h3", { text: "阅读数据维护" });
    new Setting(containerEl)
      .setName("清除全部最近阅读历史")
      .setDesc("仅清除“最近阅读”的打开时间记录。不会删除进度、书签、高亮、摘录、想法、收藏、Markdown 笔记或原始电子书。")
      .addButton((button) => button.setButtonText("清除全部历史").setWarning().onClick(() => {
        this.plugin.confirmClearReadingHistory();
      }));
    new Setting(containerEl)
      .setName("重置全部阅读进度")
      .setDesc("仅清除每本书的上次阅读位置。不会删除书签、高亮、摘录、想法、阅读状态、收藏、Markdown 笔记或原始电子书。")
      .addButton((button) => button.setButtonText("重置全部进度").setWarning().onClick(() => {
        this.plugin.confirmResetReadingProgress();
      }));

    containerEl.createEl("h3", { text: "备份与恢复" });
    new Setting(containerEl)
      .setName("导出核心数据备份")
      .setDesc("导出插件设置、图书索引、进度、书签、状态、收藏和本地摘录/高亮定位数据。不会导出电子书、Markdown 笔记、封面或缓存；由你通过系统窗口选择保存位置。")
      .addButton((button) => button.setButtonText("导出备份").setCta().onClick(() => {
        this.plugin.confirmExportCoreDataBackup();
      }));
    new Setting(containerEl)
      .setName("从备份恢复核心数据")
      .setDesc("只读取你主动选择的 Local Book Reader 备份文件。恢复前会显示备份摘要并要求确认；恢复前自动保存当前核心数据。电子书和 Markdown 笔记不会被读取或修改。")
      .addButton((button) => button.setButtonText("选择备份文件").setWarning().onClick(() => {
        void this.plugin.chooseCoreDataBackupForRestore();
      }));

    containerEl.createEl("h3", { text: "缓存维护" });
    const cacheUsage = containerEl.createDiv({ cls: "ebook-settings__cache-usage", text: "正在读取缓存占用…" });
    const refreshCacheUsage = () => {
      void this.plugin.getDataStorageUsage().then((usage) => {
        cacheUsage.setText(`核心阅读数据：${formatBytes(usage.coreBytes)}；可清理缓存：${formatBytes(usage.cacheBytes)} / ${formatBytes(usage.cacheLimitBytes)}（${usage.cacheFileCount} 个文件）`);
      }).catch((error) => {
        console.error("Local Book Reader could not read cache usage", error);
        cacheUsage.setText("无法读取缓存占用；现有阅读数据未受影响。 ");
      });
    };
    refreshCacheUsage();
    new Setting(containerEl)
      .setName("清理可重建缓存")
      .setDesc("只清理插件专属 cache 目录中的可重建文件。不会删除进度、书签、高亮、摘录、想法、状态、收藏、自动备份、Markdown 笔记或电子书。")
      .addButton((button) => button.setButtonText("清理缓存").setWarning().onClick(() => {
        this.plugin.confirmClearCache(refreshCacheUsage);
      }));
    this.stopLocalization = observeLocalization(containerEl);
  }
}

export default class LocalBookReaderPlugin extends Plugin {
  private bookStore: BookStore | undefined;
  private noteService: NoteService | undefined;
  private incrementalLibraryEventsRegistered = false;

  async onload(): Promise<void> {
    try {
      await this.startPlugin();
    } catch (error) {
      // A reader plugin must never prevent the host Vault from opening. Keep
      // this catch at the outer lifecycle boundary so a broken cache or a
      // future Obsidian API change leaves ordinary notes and files usable.
      console.error("Local Book Reader failed during startup", error);
      this.bookStore = undefined;
      this.noteService = undefined;
      new Notice("Local Book Reader 未能完成初始化，已停止本次加载；Obsidian 和原书不受影响。请查看控制台后重试。");
    }
  }

  private async startPlugin(): Promise<void> {
    this.bookStore = new BookStore(this.app.vault, this.manifest.id);
    await this.bookStore.initialize((await this.loadData()) as LegacyReaderData | null, this.manifest.version);
    setLanguage(this.bookStore.getUiLanguage());
    this.noteService = new NoteService(this.app.vault, this.bookStore);
    this.addSettingTab(new LocalBookReaderSettingsTab(this.app, this));

    this.registerView(BOOK_READER_VIEW_TYPE, (leaf) => new BookReaderView(leaf, this));
    this.registerView(BOOK_LIBRARY_VIEW_TYPE, (leaf) => new BookLibraryView(leaf, this));
    this.registerView(BOOK_RESEARCH_VIEW_TYPE, (leaf) => new BookResearchView(leaf, this));
    this.registerObsidianProtocolHandler("local-book-reader", (params) => {
      void this.openExcerptFromProtocol(params.annotation);
    });
    // Obsidian 1.12.7 can freeze while registering custom handlers for a large
    // local book collection. Keep file extensions owned by Obsidian and open
    // books explicitly through the picker or Personal Library instead.

    // Wait until the initial Vault layout is ready before tracking later file
    // changes. This deliberately avoids treating Obsidian's large startup
    // discovery wave as background re-indexing, while still keeping a small
    // user-added, moved, or deleted book current without a full refresh.
    this.app.workspace.onLayoutReady(() => {
      this.registerIncrementalLibraryEvents();
      void this.showFirstUseGuide();
    });

    this.addRibbonIcon("book-open", t("从个人书库打开电子书"), () => {
      this.openBookPicker();
    });
    this.addRibbonIcon("library", t("打开个人图书馆"), () => {
      void this.openLibrary();
    });
    this.addRibbonIcon("quote", t("检索摘录、想法和研究笔记"), () => {
      void this.openResearch();
    });
    this.addCommand({
      id: "show-first-use-guide",
      name: t("显示 Local Book Reader 使用引导"),
      callback: () => this.openFirstUseGuide()
    });

    this.addCommand({
      id: "open-book-picker",
      name: t("从个人书库打开电子书"),
      callback: () => this.openBookPicker()
    });

    this.addCommand({
      id: "open-personal-library",
      name: t("打开个人图书馆"),
      callback: () => void this.openLibrary()
    });

    this.addCommand({
      id: "open-saved-excerpt-search",
      name: t("检索摘录、想法和研究笔记"),
      callback: () => void this.openResearch()
    });

    this.addCommand({
      id: "show-book-files-in-file-explorer",
      name: t("在文件列表显示电子书文件"),
      callback: () => void this.showBookFormatsInFileExplorer()
    });

    this.addCommand({
      id: "open-current-book",
      name: t("在本地电子书阅读器中打开当前书籍"),
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || !this.isSupported(file)) {
          return false;
        }

        if (!checking) {
          void this.openBook(file);
        }

        return true;
      }
    });

    this.registerEvent(
      this.app.workspace.on("file-menu", (menu: Menu, file) => {
        if (file instanceof TFile && this.isSupported(file)) {
          menu.addItem((item) =>
            item.setTitle("Open in Local Book Reader").setIcon("book-open").onClick(() => {
              void this.openBook(file);
            })
          );
        }
      })
    );

  }

  private registerIncrementalLibraryEvents(): void {
    if (this.incrementalLibraryEventsRegistered) return;
    this.incrementalLibraryEventsRegistered = true;
    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        if (!(file instanceof TFile)) return;
        void this.handleLibraryRename(file, oldPath);
      })
    );
    this.registerEvent(
      this.app.vault.on("create", (file) => {
        if (!(file instanceof TFile)) return;
        void this.handleLibraryCreate(file);
      })
    );
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (!(file instanceof TFile)) return;
        void this.handleLibraryModify(file);
      })
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        if (!(file instanceof TFile)) return;
        void this.handleLibraryDelete(file);
      })
    );
  }

  private async showFirstUseGuide(): Promise<void> {
    if (!this.bookStore || this.bookStore.hasCompletedOnboarding()) return;
    try {
      await this.bookStore.completeOnboarding();
    } catch (error) {
      // The guide is still safe to show if its one-time marker cannot be
      // persisted; the next startup may show it again instead of losing data.
      console.error("Local Book Reader could not persist the first-use guide state", error);
    }
    this.openFirstUseGuide();
  }

  private openFirstUseGuide(): void {
    new FirstUseGuideModal(this.app, this).open();
  }

  onunload(): void {
    void this.bookStore?.flush().catch((error) => {
      console.error("Local Book Reader failed to flush reading state", error);
    });
  }

  getReflowProgress(path: string): number | undefined {
    return this.bookStore?.getReflowProgress(path);
  }

  setReflowProgress(path: string, progress: number): void {
    this.bookStore?.setReflowProgress(path, progress);
  }

  getTextProgress(path: string): number | undefined {
    return this.bookStore?.getTextProgress(path);
  }

  setTextProgress(path: string, progress: number): void {
    this.bookStore?.setTextProgress(path, progress);
  }

  getPdfPage(path: string): number | undefined {
    return this.bookStore?.getPdfPage(path);
  }

  setPdfPage(path: string, page: number): void {
    this.bookStore?.setPdfPage(path, page);
  }

  async prepareBook(file: TFile): Promise<void> {
    if (!this.bookStore) return;
    try {
      await this.bookStore.prepareForOpen(file);
    } catch (error) {
      console.error("Local Book Reader failed to prepare reading data", error);
      new Notice("无法保存此书的阅读数据；本次仍可只读打开，修复数据文件后再试。\n原始电子书不会被修改。");
    }
  }

  getLibraryBooks(): LibraryBook[] {
    return this.bookStore?.listLibraryBooks() ?? [];
  }

  getLibraryOwnerName(): string {
    return this.bookStore?.getLibraryOwnerName() ?? "";
  }

  getLibraryDisplayName(): string {
    const ownerName = this.getLibraryOwnerName();
    return ownerName ? (getLanguage() === "en" ? `${ownerName}'s Personal Library` : `${ownerName} 的个人图书馆`) : t("个人图书馆");
  }

  getUiLanguage(): UiLanguage {
    return this.bookStore?.getUiLanguage() ?? "zh-CN";
  }

  async setUiLanguage(language: UiLanguage): Promise<void> {
    if (!this.bookStore) throw new Error("插件设置尚未初始化。");
    await this.bookStore.setUiLanguage(language);
    setLanguage(language);
    this.app.workspace.trigger("layout-change");
  }

  async setLibraryOwnerName(name: string): Promise<void> {
    if (!this.bookStore) throw new Error("插件设置尚未初始化。");
    await this.bookStore.setLibraryOwnerName(name);
    this.refreshOpenLibraryViews();
    this.app.workspace.trigger("layout-change");
  }

  findLikelyDuplicates(bookId: string): LibraryBook[] {
    return this.bookStore?.findLikelyDuplicates(bookId) ?? [];
  }

  getLibraryScanProgress(): ScanProgress {
    return this.bookStore?.getScanProgress() ?? {
      checked: 0, total: 0, discovered: 0, relinked: 0, ambiguous: 0, elapsedMs: 0, status: "idle"
    };
  }

  async startOrResumeLibraryScan(onProgress: (progress: ScanProgress) => void): Promise<ScanProgress> {
    if (!this.bookStore) throw new Error("阅读数据尚未初始化");
    return this.bookStore.startOrResumeScan(onProgress);
  }

  pauseLibraryScan(): void {
    this.bookStore?.pauseScan();
  }

  cancelLibraryScan(): void {
    this.bookStore?.cancelScan();
  }

  setBookReadingStatus(bookId: string, status: ReadingStatus): void {
    this.bookStore?.setReadingStatus(bookId, status);
  }

  setBookFavorite(bookId: string, isFavorite: boolean): void {
    this.bookStore?.setFavorite(bookId, isFavorite);
  }

  async clearReadingHistory(bookId?: string): Promise<number> {
    if (!this.bookStore) throw new Error("阅读数据尚未初始化");
    return this.bookStore.clearReadingHistory(bookId);
  }

  async resetReadingProgress(bookId?: string): Promise<number> {
    if (!this.bookStore) throw new Error("阅读数据尚未初始化");
    return this.bookStore.resetReadingProgress(bookId);
  }

  confirmClearReadingHistory(bookId?: string, bookName?: string, onDone?: () => void): void {
    const scope = bookId ? `《${bookName ?? "这本书"}》的` : "全部";
    new ConfirmActionModal(this.app, {
      title: `确认清除${scope}最近阅读历史`,
      message: "这项操作只会清除最近打开时间。进度、书签、高亮、摘录、想法、收藏、Markdown 笔记和原始电子书都会保留。",
      confirmText: "确认清除",
      onConfirm: async () => {
        const changed = await this.clearReadingHistory(bookId);
        new Notice(changed > 0 ? `已清除 ${changed} 本书的最近阅读历史。` : "没有可清除的最近阅读历史。 ");
        onDone?.();
      }
    }).open();
  }

  confirmResetReadingProgress(bookId?: string, bookName?: string, onDone?: () => void): void {
    const scope = bookId ? `《${bookName ?? "这本书"}》的` : "全部";
    new ConfirmActionModal(this.app, {
      title: `确认重置${scope}阅读进度`,
      message: "这项操作只会清除上次阅读位置。书签、高亮、摘录、想法、阅读状态、收藏、Markdown 笔记和原始电子书都会保留。",
      confirmText: "确认重置",
      onConfirm: async () => {
        const changed = await this.resetReadingProgress(bookId);
        new Notice(changed > 0 ? `已重置 ${changed} 本书的阅读进度。` : "没有可重置的阅读进度。 ");
        onDone?.();
      }
    }).open();
  }

  confirmExportCoreDataBackup(): void {
    new ConfirmActionModal(this.app, {
      title: "导出核心数据备份",
      message: "将导出插件设置、图书索引、进度、书签、状态、收藏和本地摘录/高亮定位数据。不会导出或修改电子书、Markdown 笔记、封面和缓存。下一步将由你选择新的保存位置。",
      confirmText: "选择保存位置",
      onConfirm: async () => this.exportCoreDataBackup(),
    }).open();
  }

  async getDataStorageUsage(): Promise<DataStorageUsage> {
    if (!this.bookStore) throw new Error("阅读数据尚未初始化");
    return this.bookStore.getDataStorageUsage();
  }

  confirmClearCache(onDone?: () => void): void {
    new ConfirmActionModal(this.app, {
      title: "确认清理可重建缓存",
      message: "只会删除插件专属 cache 目录中的可重建文件。进度、书签、高亮、摘录、想法、状态、收藏、自动备份、Markdown 笔记和原始电子书都会保留。",
      confirmText: "确认清理缓存",
      onConfirm: async () => {
        if (!this.bookStore) throw new Error("阅读数据尚未初始化");
        const cleared = await this.bookStore.clearCache();
        new Notice(cleared.files > 0 ? `已清理 ${cleared.files} 个缓存文件，释放 ${formatBytes(cleared.bytes)}。` : "当前没有可清理的缓存文件。 ");
        onDone?.();
      }
    }).open();
  }

  async chooseCoreDataBackupForRestore(): Promise<void> {
    const file = await chooseBackupToRestore();
    if (!file) return;
    if (file.size > MAX_MANUAL_BACKUP_BYTES) {
      new Notice("备份文件超过 50 MB 安全上限，未读取或恢复任何数据。 ");
      return;
    }
    let backup: CoreDataBackup;
    try {
      const value: unknown = JSON.parse(await file.text());
      if (!isCoreDataBackup(value)) throw new Error("格式不正确");
      backup = value;
    } catch (error) {
      console.error("Local Book Reader could not validate selected backup", error);
      new Notice("所选文件不是可恢复的 Local Book Reader 核心数据备份。 ");
      return;
    }
    const summary = summarizeCoreDataBackup(backup);
    new ConfirmActionModal(this.app, {
      title: "确认恢复核心数据",
      message: `备份：${file.name}\n创建时间：${summary.createdAt}\n插件版本：${summary.pluginVersion}\n包含 ${summary.bookCount} 本书、${summary.readingRecordCount} 条阅读记录、${summary.bookmarkCount} 个书签、${summary.excerptCount} 条本地摘录。\n\n恢复会替换当前插件的核心数据；恢复前会自动备份当前核心数据。不会读取或修改电子书、Markdown 笔记、封面或缓存。`,
      confirmText: "确认恢复",
      onConfirm: async () => {
        if (!this.bookStore) throw new Error("阅读数据尚未初始化");
        await this.bookStore.restoreCoreDataBackup(backup, this.manifest.version);
        new Notice("核心数据已恢复。请关闭并重新打开已打开的图书馆或阅读器标签页，以显示恢复后的状态。 ");
      }
    }).open();
  }

  addBookmark(path: string, locator: BookmarkLocator, label: string): Bookmark | undefined {
    return this.bookStore?.addBookmark(path, locator, label);
  }

  getBookmarks(path: string): Bookmark[] {
    return this.bookStore?.listBookmarks(path) ?? [];
  }

  removeBookmark(path: string, bookmarkId: string): void {
    this.bookStore?.removeBookmark(path, bookmarkId);
  }

  addExcerpt(path: string, text: string, locator: ExcerptLocator, note: string, tags: string[]): Excerpt | undefined {
    return this.bookStore?.addExcerpt(path, text, locator, note, tags);
  }

  getExcerpts(path: string): Excerpt[] {
    return this.bookStore?.listExcerpts(path) ?? [];
  }

  removeExcerpt(path: string, excerptId: string): Excerpt | undefined {
    return this.bookStore?.removeExcerpt(path, excerptId);
  }

  async flushReadingState(): Promise<void> {
    if (!this.bookStore) throw new Error("Reading data store is not initialized.");
    await this.bookStore.flush();
  }

  getReaderAppearance(path?: string): ReaderAppearanceSettings {
    return this.bookStore?.getReaderAppearance(path) ?? {
      fontSize: 100, lineHeight: 1.6, margin: 32, theme: "system", flow: "paginated"
    };
  }

  getReaderOpenMode(): ReaderOpenMode {
    return this.bookStore?.getReaderOpenMode() ?? "tab";
  }

  getBookMetadata(path: string): BookMetadata | undefined {
    return this.bookStore?.getBookMetadata(path);
  }

  async cacheBookMetadata(file: TFile, metadata: BookMetadataInput): Promise<void> {
    await this.bookStore?.cacheBookMetadata(file, metadata);
  }

  async cacheBookCover(file: TFile, cover: Blob): Promise<void> {
    await this.bookStore?.cacheBookCover(file, cover);
  }

  getBookCoverResourcePath(path: string): string | undefined {
    return this.bookStore?.getBookCoverResourcePath(path);
  }

  getNotesDirectory(): string {
    return this.bookStore?.getNotesDirectory() ?? "zz_阅读与研究/阅读笔记";
  }

  async setNotesDirectory(directory: string): Promise<void> {
    if (!this.bookStore) throw new Error("Reader settings store is not initialized.");
    await this.bookStore.setNotesDirectory(directory);
  }

  getResearchDirectory(): string {
    return this.bookStore?.getResearchDirectory() ?? "zz_阅读与研究/主题研究";
  }

  async setResearchDirectory(directory: string): Promise<void> {
    if (!this.bookStore) throw new Error("Reader settings store is not initialized.");
    await this.bookStore.setResearchDirectory(directory);
  }

  getNoteTemplate(): string {
    return this.bookStore?.getNoteTemplate() ?? "# {{title}}\n";
  }

  async setNoteTemplate(template: string): Promise<void> {
    if (!this.bookStore) throw new Error("Reader settings store is not initialized.");
    await this.bookStore.setNoteTemplate(template);
  }

  async setReaderAppearance(path: string, settings: ReaderAppearanceSettings): Promise<void> {
    if (!this.bookStore) throw new Error("Reader settings store is not initialized.");
    await this.bookStore.setReaderAppearance(path, settings);
  }

  async setReaderOpenMode(mode: ReaderOpenMode): Promise<void> {
    if (!this.bookStore) throw new Error("Reader settings store is not initialized.");
    await this.bookStore.setReaderOpenMode(mode);
  }

  confirmResetSettings(onDone?: () => void): void {
    new ConfirmActionModal(this.app, {
      title: "确认恢复默认插件设置",
      message: "将恢复默认的馆主名称、读书笔记目录、主题研究目录、新笔记模板和新书默认阅读外观。已为单本书保存的外观不会改变；已有 Markdown 文件、进度、书签、高亮、摘录、想法、收藏、自动备份、缓存和电子书均不会被移动、删除或修改。",
      confirmText: "确认恢复默认设置",
      onConfirm: async () => {
        if (!this.bookStore) throw new Error("阅读数据尚未初始化");
        await this.bookStore.resetSettingsToDefaults();
        this.refreshOpenLibraryViews();
        this.app.workspace.trigger("layout-change");
        new Notice("插件设置已恢复默认值；已有笔记和电子书未被移动或修改。 ");
        onDone?.();
      }
    }).open();
  }

  async appendThought(file: TFile, locator: BookmarkLocator, thought: string, tags: string[] = []): Promise<TFile> {
    if (!this.noteService) throw new Error("读书笔记服务尚未初始化");
    return this.noteService.appendThought(file, locator, thought, tags);
  }

  async appendExcerpt(file: TFile, excerpt: Excerpt): Promise<TFile> {
    if (!this.noteService) throw new Error("Reading note service is not initialized.");
    return this.noteService.appendExcerpt(file, excerpt);
  }

  async createOrAppendResearchNote(title: string, excerptIds: string[]): Promise<TFile> {
    if (!this.noteService) throw new Error("主题研究笔记服务尚未初始化。 ");
    const entries = excerptIds.map((id) => this.findExcerpt(id)).filter((item): item is StoredExcerpt => Boolean(item));
    if (entries.length === 0) throw new Error("所选摘录已经不存在。 ");
    const note = await this.noteService.appendResearchEntries(title, entries);
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.openFile(note, { active: true });
    return note;
  }

  async getResearchMarkdownEntries(): Promise<ResearchMarkdownEntry[]> {
    if (!this.noteService) throw new Error("主题研究笔记服务尚未初始化。 ");
    return this.noteService.listResearchMarkdownEntries();
  }

  async openMarkdownNote(path: string): Promise<boolean> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) return false;
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.openFile(file, { active: true });
    return true;
  }

  findExcerpt(excerptId: string): StoredExcerpt | undefined {
    return this.bookStore?.findExcerpt(excerptId);
  }

  getStoredExcerpts(): StoredExcerpt[] {
    return this.bookStore?.listStoredExcerpts() ?? [];
  }

  async openExcerptById(excerptId: string): Promise<boolean> {
    const stored = this.findExcerpt(excerptId);
    if (!stored) return false;
    await this.openExcerptFromProtocol(excerptId);
    return true;
  }

  async openOrCreateBookNote(path: string): Promise<boolean> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile) || !this.isSupported(file) || !this.noteService) return false;
    try {
      const note = await this.noteService.openOrCreateNote(file);
      const leaf = this.app.workspace.getLeaf("tab");
      await leaf.openFile(note, { active: true });
      return true;
    } catch (error) {
      console.error("Local Book Reader could not open the reading note", error);
      new Notice("无法创建或打开读书笔记；原始电子书没有被修改。");
      return false;
    }
  }

  async openIndexedBook(path: string): Promise<boolean> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile) || !this.isSupported(file)) return false;
    await this.openBook(file);
    return true;
  }

  private async openActiveBook(): Promise<void> {
    const file = this.app.workspace.getActiveFile();
    if (!file || !this.isSupported(file)) {
      new Notice("请先选择支持的电子书文件。");
      return;
    }

    await this.openBook(file);
  }

  private async handleLibraryRename(file: TFile, oldPath: string): Promise<void> {
    if (!this.bookStore) return;
    try {
      await this.bookStore.handleRename(file, oldPath);
      this.refreshOpenLibraryViews();
    } catch (error) {
      console.error("Local Book Reader could not retain data after a book rename", error);
      new Notice("已检测到书籍移动或重命名，但未能更新关联；原始电子书和已有笔记均未被修改。请稍后在个人图书馆刷新。 ");
    }
  }

  private async handleLibraryCreate(file: TFile): Promise<void> {
    if (!this.bookStore || !this.isSupported(file)) return;
    try {
      await this.bookStore.handleCreate(file);
      this.refreshOpenLibraryViews();
    } catch (error) {
      console.error("Local Book Reader could not incrementally index a new book", error);
    }
  }

  private async handleLibraryModify(file: TFile): Promise<void> {
    if (!this.bookStore || !this.isSupported(file)) return;
    try {
      await this.bookStore.handleModify(file);
      this.refreshOpenLibraryViews();
    } catch (error) {
      console.error("Local Book Reader could not update a changed book record", error);
    }
  }

  private async handleLibraryDelete(file: TFile): Promise<void> {
    if (!this.bookStore) return;
    try {
      await this.bookStore.handleDelete(file);
      this.refreshOpenLibraryViews();
    } catch (error) {
      console.error("Local Book Reader could not mark a deleted book as missing", error);
    }
  }

  private refreshOpenLibraryViews(): void {
    for (const leaf of this.app.workspace.getLeavesOfType(BOOK_LIBRARY_VIEW_TYPE)) {
      const view = leaf.view;
      if (view instanceof BookLibraryView) view.refreshForLibraryChange();
    }
  }

  private async exportCoreDataBackup(): Promise<void> {
    if (!this.bookStore) throw new Error("阅读数据尚未初始化");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    // This call intentionally happens before any awaited data work so it stays
    // within the user's confirmation gesture and the host shows its native dialog.
    const handle = await chooseNewBackupFile(`local-book-reader-backup-${stamp}.json`);
    if (!handle) return;
    const backup = await this.bookStore.createCoreDataBackup(this.manifest.version);
    const contents = `${JSON.stringify(backup, null, 2)}\n`;
    if (new TextEncoder().encode(contents).byteLength > MAX_MANUAL_BACKUP_BYTES) {
      throw new Error("备份内容超过 50 MB 安全上限，未写入任何文件。 ");
    }
    const saved = await writeNewBackupFile(handle, contents);
    const verification: unknown = JSON.parse(await saved.text());
    if (!isCoreDataBackup(verification)) throw new Error("导出后的备份校验失败。 ");
    new Notice(`核心数据备份已导出：${saved.name}`);
  }

  async openBook(file: TFile): Promise<WorkspaceLeaf> {
    let leaf: WorkspaceLeaf;
    if (this.getReaderOpenMode() === "window") {
      try {
        leaf = this.app.workspace.openPopoutLeaf({ size: { width: 1100, height: 820 } });
      } catch (error) {
        console.warn("Local Book Reader could not open a popout reader window", error);
        new Notice("无法打开独立阅读窗口，已改为在 Obsidian 标签页打开。");
        leaf = this.app.workspace.getLeaf("tab");
      }
    } else {
      leaf = this.app.workspace.getLeaf("tab");
    }
    // FileView restores and opens the target file from its persisted view
    // state. Avoid instanceof here: Obsidian can expose a wrapped view object
    // across its workspace boundary, even when the registered reader loaded.
    await leaf.setViewState({
      type: BOOK_READER_VIEW_TYPE,
      state: { file: file.path },
      active: true
    });
    if (this.getReaderOpenMode() === "tab") this.app.workspace.revealLeaf(leaf);
    return leaf;
  }

  private async openExcerptFromProtocol(annotation: unknown): Promise<void> {
    if (typeof annotation !== "string") {
      new Notice("返回原文链接缺少摘录标识。");
      return;
    }
    const stored = this.findExcerpt(annotation);
    if (!stored) {
      new Notice("找不到这条摘录的本地定位数据；原始笔记内容仍可正常阅读。");
      return;
    }
    const file = this.app.vault.getAbstractFileByPath(stored.book.path);
    if (!(file instanceof TFile) || !this.isSupported(file)) {
      new Notice("原书当前不在记录的位置；请先在个人图书馆重新关联该书。");
      return;
    }
    try {
      const leaf = await this.openBook(file);
      const view = leaf.view as unknown as { goToExcerpt?: (excerpt: Excerpt) => Promise<void> };
      if (typeof view.goToExcerpt === "function") {
        await view.goToExcerpt(stored.excerpt);
      } else {
        new Notice("当前格式无法跳转到这条摘录的位置。");
      }
    } catch (error) {
      console.error("Local Book Reader could not return to an excerpt", error);
      new Notice("无法返回原文；原始电子书没有被修改。");
    }
  }

  async openLibrary(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(BOOK_LIBRARY_VIEW_TYPE)[0];
    if (existing) {
      this.app.workspace.revealLeaf(existing);
      return;
    }

    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.setViewState({ type: BOOK_LIBRARY_VIEW_TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);
  }

  private async openResearch(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(BOOK_RESEARCH_VIEW_TYPE)[0];
    if (existing) {
      this.app.workspace.revealLeaf(existing);
      return;
    }
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.setViewState({ type: BOOK_RESEARCH_VIEW_TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);
  }

  private isSupported(file: TFile): boolean {
    return SUPPORTED_BOOK_EXTENSIONS.has(file.extension.toLowerCase());
  }

  private openBookPicker(): void {
    new BookPickerModal(this.app, async (file) => { await this.openBook(file); }).open();
  }

  private async enableAllBookFormatsInFileExplorer(): Promise<void> {
    const vaultWithConfig = this.app.vault as typeof this.app.vault & {
      getConfig?: (key: string) => unknown;
      setConfig?: (key: string, value: boolean) => Promise<void> | void;
    };
    if (vaultWithConfig.getConfig?.("showUnsupportedFiles") === true) return;
    await vaultWithConfig.setConfig?.("showUnsupportedFiles", true);
  }

  private async showBookFormatsInFileExplorer(): Promise<void> {
    try {
      await this.enableAllBookFormatsInFileExplorer();
      new Notice("已显示电子书文件。若文件树变慢，可在 Obsidian 设置中关闭“显示不支持文件类型”。");
    } catch (error) {
      console.error("Local Book Reader could not change File Explorer visibility", error);
      new Notice("无法更新文件列表显示设置；阅读器仍可通过“从个人书库打开电子书”使用。");
    }
  }

}
