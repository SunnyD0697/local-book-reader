import { ItemView, Menu, Modal, WorkspaceLeaf } from "obsidian";
import type { BookReadingState, LibraryBook, ReadingStatus, ScanProgress } from "./book-store";
import LocalBookReaderPlugin from "./main";
import { LocalizedNotice as Notice, getLanguage, localizeTree, observeLocalization, t } from "./i18n";

export const BOOK_LIBRARY_VIEW_TYPE = "local-book-reader-library";

const STATUS_LABELS: Record<ReadingStatus, string> = {
  unread: "未读",
  reading: "正在阅读",
  finished: "已读"
};

const VIRTUAL_ROW_HEIGHT = 80;
const VIRTUAL_OVERSCAN = 6;

class SuspectedDuplicateModal extends Modal {
  private stopLocalization: (() => void) | undefined;
  constructor(
    app: import("obsidian").App,
    private readonly source: LibraryBook,
    private readonly candidates: LibraryBook[]
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "疑似重复文件" });
    contentEl.createEl("p", {
      text: "仅按同名、同格式和同文件大小列出候选，不读取正文或计算文件哈希，因此结果只供人工核对。插件不会自动合并、移动、修改或删除任何电子书。"
    });
    contentEl.createEl("h3", { text: "当前书籍" });
    contentEl.createEl("code", { text: this.source.book.path, attr: { "data-local-book-reader-no-localize": "true" } });
    if (this.candidates.length === 0) {
      contentEl.createEl("p", { text: "没有发现符合当前保守规则的疑似重复文件。" });
      return;
    }
    contentEl.createEl("h3", { text: `候选文件（${this.candidates.length}）` });
    const list = contentEl.createEl("ul");
    for (const item of this.candidates) list.createEl("li", { text: item.book.path });
    this.stopLocalization = observeLocalization(contentEl);
  }

  onClose(): void {
    this.stopLocalization?.();
    this.contentEl.empty();
  }
}

export class BookLibraryView extends ItemView {
  private stopLocalization: (() => void) | undefined;
  private query = "";
  private format = "all";
  private status = "all";
  private category = "all";
  private favoritesOnly = false;
  private progress: ScanProgress | undefined;
  private resultsEl: HTMLElement | undefined;
  private scanStatusEl: HTMLElement | undefined;
  private lastRenderedScanStatus: ScanProgress["status"] | undefined;
  private lastFullScanRenderAt = 0;
  private currentBooks: LibraryBook[] = [];
  private readonly searchableTextByBookId = new Map<string, string>();
  private pendingResultRender: number | undefined;

  constructor(leaf: WorkspaceLeaf, private readonly plugin: LocalBookReaderPlugin) {
    super(leaf);
  }

  getViewType(): string {
    return BOOK_LIBRARY_VIEW_TYPE;
  }

  getDisplayText(): string {
    return this.plugin.getLibraryDisplayName();
  }

  getIcon(): string {
    return "library";
  }

  async onClose(): Promise<void> {
    this.stopLocalization?.();
    this.cancelPendingResultRender();
  }

  async onOpen(): Promise<void> {
    this.stopLocalization = observeLocalization(this.contentEl);
    this.render();
  }

  refreshForLibraryChange(): void {
    this.render();
  }

  private render(): void {
    this.cancelPendingResultRender();
    this.contentEl.empty();
    this.contentEl.addClass("ebook-library__view");
    const header = this.contentEl.createDiv({ cls: "ebook-library__header" });
    header.createEl("h2", { text: this.plugin.getLibraryDisplayName() });
    header.createEl("p", {
      cls: "ebook-library__hint",
      text: "仅索引文件名和基础属性；不会读取正文、提取封面或修改原始电子书。"
    });

    const controls = this.contentEl.createDiv({ cls: "ebook-library__controls" });
    const scan = this.progress ?? this.plugin.getLibraryScanProgress();
    this.lastRenderedScanStatus = scan.status;
    this.lastFullScanRenderAt = scan.checked;
    const allBooks = this.plugin.getLibraryBooks();
    this.currentBooks = allBooks;
    this.searchableTextByBookId.clear();
    this.addScanControls(controls, scan, allBooks.length);
    this.addFilters(allBooks);
    this.renderRecentBooks(allBooks);
    this.resultsEl = this.contentEl.createDiv({ cls: "ebook-library__results" });
    // Build the potentially large result list in a later task. The controls,
    // especially the search field, can receive focus before list work begins.
    this.scheduleResultRender();
    localizeTree(this.contentEl);
  }

  private addScanControls(container: HTMLElement, scan: ScanProgress, indexedCount: number): void {
    const start = container.createEl("button", { text: scan.status === "paused" ? "继续扫描" : "刷新图书馆" });
    start.type = "button";
    start.onclick = () => void this.startOrResumeScan();

    if (scan.status === "running") {
      const pause = container.createEl("button", { text: "暂停" });
      pause.type = "button";
      pause.onclick = () => {
        this.plugin.pauseLibraryScan();
        this.progress = this.plugin.getLibraryScanProgress();
        this.render();
      };
    }
    if (scan.status === "running" || scan.status === "paused") {
      const cancel = container.createEl("button", { text: "取消" });
      cancel.type = "button";
      cancel.onclick = () => {
        this.plugin.cancelLibraryScan();
        this.progress = undefined;
        this.render();
      };
    }

    const status = container.createSpan({ cls: "ebook-library__scan-status" });
    this.scanStatusEl = status;
    if (scan.status === "idle" && indexedCount === 0) {
      status.setText("尚未建立图书馆索引。点击“刷新图书馆”开始。 ");
    } else if (scan.status === "idle") {
      status.setText(`已索引 ${indexedCount} 本书。`);
    } else {
      status.setText(`${scan.status === "paused" ? "已暂停" : "正在扫描"}：${scan.checked} / ${scan.total}，新发现 ${scan.discovered} 本。`);
    }
  }

  private addFilters(allBooks: LibraryBook[]): void {
    const filters = this.contentEl.createDiv({ cls: "ebook-library__filters" });
    const search = filters.createEl("input", {
      type: "search",
      placeholder: "输入书名、文件名或分类路径后按 Enter 搜索",
      value: this.query
    });
    search.onkeydown = (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      this.query = search.value;
      this.refreshResults();
    };
    search.addEventListener("search", () => {
      if (search.value) return;
      this.query = "";
      this.refreshResults();
    });

    const format = filters.createEl("select", { attr: { "aria-label": "按格式筛选" } });
    this.addOption(format, "all", "全部格式");
    ["EPUB", "MOBI", "AZW3", "AZW", "PDF", "TXT"].forEach((extension) => this.addOption(format, extension.toLowerCase(), extension));
    format.value = this.format;
    format.onchange = () => {
      this.format = format.value;
      this.render();
    };

    const category = filters.createEl("select", { attr: { "aria-label": "按分类筛选" } });
    this.addOption(category, "all", "全部分类");
    [...new Set(allBooks.map((item) => this.categoryOf(item.book.path)).filter(Boolean))]
      .sort((left, right) => left.localeCompare(right, getLanguage() === "en" ? "en" : "zh-Hans-CN"))
      .forEach((name) => this.addOption(category, name, name));
    category.value = this.category;
    category.onchange = () => {
      this.category = category.value;
      this.render();
    };

    const status = filters.createEl("select", { attr: { "aria-label": "按阅读状态筛选" } });
    this.addOption(status, "all", "全部状态");
    this.addOption(status, "unread", "未读");
    this.addOption(status, "reading", "正在阅读");
    this.addOption(status, "finished", "已读");
    this.addOption(status, "missing", "文件缺失");
    status.value = this.status;
    status.onchange = () => {
      this.status = status.value;
      this.render();
    };

    const favorites = filters.createEl("label", { cls: "ebook-library__favorite-filter" });
    const checkbox = favorites.createEl("input", { type: "checkbox" });
    checkbox.checked = this.favoritesOnly;
    checkbox.onchange = () => {
      this.favoritesOnly = checkbox.checked;
      this.render();
    };
    favorites.appendText("仅看收藏");
  }

  private renderRecentBooks(allBooks: LibraryBook[]): void {
    const recent = allBooks
      .filter((item) => !item.book.isMissing && item.reading.lastOpenedAt !== undefined)
      .sort((left, right) => (right.reading.lastOpenedAt ?? 0) - (left.reading.lastOpenedAt ?? 0))
      .slice(0, 5);
    if (recent.length === 0) return;

    const section = this.contentEl.createDiv({ cls: "ebook-library__recent" });
    section.createEl("h3", { text: "最近阅读" });
    const entries = section.createDiv({ cls: "ebook-library__recent-list" });
    for (const item of recent) {
      const button = entries.createEl("button", { text: item.book.name });
      button.type = "button";
      button.title = item.book.path;
      button.onclick = () => void this.openBook(item.book.path);
    }
  }

  private refreshResults(): void {
    if (!this.resultsEl) return;
    this.cancelPendingResultRender();
    this.resultsEl.empty();
    this.scheduleResultRender();
  }

  private scheduleResultRender(): void {
    const container = this.resultsEl;
    if (!container) return;
    this.pendingResultRender = window.setTimeout(() => {
      this.pendingResultRender = undefined;
      if (this.resultsEl !== container || !container.isConnected) return;
      this.renderBookList(container, this.currentBooks);
      localizeTree(container);
    }, 0);
  }

  private cancelPendingResultRender(): void {
    if (this.pendingResultRender === undefined) return;
    window.clearTimeout(this.pendingResultRender);
    this.pendingResultRender = undefined;
  }

  private renderBookList(container: HTMLElement, allBooks: LibraryBook[]): void {
    // Normalize the query once. With no query, do not touch every book's
    // Chinese title/path just to prove that an empty string matches it.
    const normalizedQuery = this.query.trim().toLocaleLowerCase(getLanguage() === "en" ? "en" : "zh-Hans-CN");
    const books = allBooks.filter((item) => this.matches(item, normalizedQuery));
    const summary = container.createDiv({ cls: "ebook-library__summary" });
    summary.setText(`显示 ${books.length} / ${allBooks.length} 本已索引书籍`);

    const list = container.createDiv({ cls: "ebook-library__list" });
    if (books.length === 0) {
      list.createDiv({
        cls: "ebook-library__empty",
        text: allBooks.length === 0 ? "尚无索引。请先点击“刷新图书馆”。" : "没有符合当前筛选条件的书籍。"
      });
      return;
    }

    const spacer = list.createDiv({ cls: "ebook-library__virtual-spacer" });
    spacer.style.height = `${books.length * VIRTUAL_ROW_HEIGHT}px`;
    const rows = list.createDiv({ cls: "ebook-library__virtual-rows" });
    const renderVisibleRows = () => {
      const visibleCount = Math.ceil(list.clientHeight / VIRTUAL_ROW_HEIGHT);
      const start = Math.max(0, Math.floor(list.scrollTop / VIRTUAL_ROW_HEIGHT) - VIRTUAL_OVERSCAN);
      const end = Math.min(books.length, start + visibleCount + VIRTUAL_OVERSCAN * 2);
      rows.empty();
      rows.style.transform = `translateY(${start * VIRTUAL_ROW_HEIGHT}px)`;
      for (let index = start; index < end; index += 1) this.renderBookRow(rows, books[index]);
    };
    list.onscroll = renderVisibleRows;
    window.requestAnimationFrame(renderVisibleRows);
  }

  private renderBookRow(list: HTMLElement, item: LibraryBook): void {
    const row = list.createDiv({ cls: "ebook-library__row" });
    const metadata = item.book.metadata?.sourceModifiedAt === item.book.modifiedAt ? item.book.metadata : undefined;
    const title = row.createDiv({ cls: "ebook-library__book-title", text: metadata?.title ?? item.book.name, attr: { "data-local-book-reader-no-localize": "true" } });
    title.title = item.book.path;
    const rawFolder = this.folderOf(item.book.path);
    const folder = rawFolder || t("根目录");
    const progress = t(this.progressText(item.reading));
    const readingStatus = t(item.book.isMissing ? "文件缺失" : STATUS_LABELS[item.reading.status]);
    row.createDiv({
      cls: "ebook-library__book-meta",
      text: `${item.book.extension.toUpperCase()}${metadata?.authors?.length ? ` · ${metadata.authors.join("、")}` : ""} · ${folder} · ${readingStatus} · ${progress}`,
      attr: { "data-local-book-reader-no-localize": "true" }
    });

    const actions = row.createDiv({ cls: "ebook-library__book-actions" });
    const open = actions.createEl("button", { text: "打开" });
    open.type = "button";
    open.disabled = item.book.isMissing;
    open.onclick = () => void this.openBook(item.book.path);

    const note = actions.createEl("button", { text: "笔记" });
    note.type = "button";
    note.disabled = item.book.isMissing;
    note.onclick = () => void this.openBookNote(item.book.path);

    const favorite = actions.createEl("button", { text: item.reading.isFavorite ? "取消收藏" : "收藏" });
    favorite.type = "button";
    favorite.onclick = () => {
      this.plugin.setBookFavorite(item.book.bookId, !item.reading.isFavorite);
      this.render();
    };

    const manage = actions.createEl("button", {
      text: "管理",
      attr: { title: "清除本书的最近阅读历史或重置本书的阅读进度" },
    });
    manage.type = "button";
    manage.onclick = (event) => {
      const menu = new Menu();
      menu.addItem((entry) => entry
        .setTitle("清除本书最近阅读历史")
        .setIcon("history")
        .onClick(() => this.plugin.confirmClearReadingHistory(item.book.bookId, item.book.name, () => this.render())));
      menu.addItem((entry) => entry
        .setTitle("重置本书阅读进度")
        .setIcon("rotate-ccw")
        .onClick(() => this.plugin.confirmResetReadingProgress(item.book.bookId, item.book.name, () => this.render())));
      menu.addItem((entry) => entry
        .setTitle("检查疑似重复文件")
        .setIcon("copy")
        .onClick(() => new SuspectedDuplicateModal(
          this.app,
          item,
          this.plugin.findLikelyDuplicates(item.book.bookId)
        ).open()));
      menu.showAtMouseEvent(event);
    };

    const state = actions.createEl("select", { attr: { "aria-label": `设置 ${item.book.name} 的阅读状态` } });
    this.addOption(state, "unread", "未读");
    this.addOption(state, "reading", "正在阅读");
    this.addOption(state, "finished", "已读");
    state.value = item.reading.status;
    state.onchange = () => {
      this.plugin.setBookReadingStatus(item.book.bookId, state.value as ReadingStatus);
      this.render();
    };
    localizeTree(row);
  }

  private async startOrResumeScan(): Promise<void> {
    try {
      this.progress = this.plugin.getLibraryScanProgress();
      this.render();
      const completed = await this.plugin.startOrResumeLibraryScan((progress) => {
        this.progress = progress;
        const needsFullRender = this.lastRenderedScanStatus !== progress.status
          || progress.checked - this.lastFullScanRenderAt >= 500;
        if (needsFullRender) {
          this.render();
        } else {
          this.scanStatusEl?.setText(`正在扫描：${progress.checked} / ${progress.total}，新发现 ${progress.discovered} 本。`);
        }
      });
      new Notice(`图书馆刷新完成：检查 ${completed.total} 本，新发现 ${completed.discovered} 本，耗时 ${this.formatDuration(completed.elapsedMs)}。`);
      if (completed.relinked > 0) {
        new Notice(`已安全重新关联 ${completed.relinked} 本移动或重新出现的书籍；原有进度、书签、摘录和收藏已保留。`);
      }
      if (completed.ambiguous > 0) {
        new Notice(`${completed.ambiguous} 本新发现书籍存在多个相同属性的缺失候选，未自动合并；原有数据均已保留。`);
      }
      this.progress = this.plugin.getLibraryScanProgress();
      this.render();
    } catch (error) {
      console.error("Local Book Reader library scan failed", error);
      new Notice("图书馆扫描未完成；已有索引和阅读数据已保留。请查看控制台后重试。");
      this.progress = undefined;
      this.render();
    }
  }

  private matches(item: LibraryBook, normalizedQuery: string): boolean {
    if (normalizedQuery) {
      let searchable = this.searchableTextByBookId.get(item.book.bookId);
      if (searchable === undefined) {
      searchable = `${item.book.name}\n${item.book.path}`.toLocaleLowerCase(getLanguage() === "en" ? "en" : "zh-Hans-CN");
        this.searchableTextByBookId.set(item.book.bookId, searchable);
      }
      if (!searchable.includes(normalizedQuery)) return false;
    }
    if (this.format !== "all" && item.book.extension !== this.format) return false;
    if (this.category !== "all" && this.categoryOf(item.book.path) !== this.category) return false;
    if (this.status === "missing" && !item.book.isMissing) return false;
    if (this.status !== "all" && this.status !== "missing" && item.reading.status !== this.status) return false;
    return !this.favoritesOnly || item.reading.isFavorite;
  }

  private formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) return `${milliseconds} ms`;
    return `${(milliseconds / 1000).toFixed(1)} 秒`;
  }

  private async openBook(path: string): Promise<void> {
    const opened = await this.plugin.openIndexedBook(path);
    if (!opened) new Notice("此书文件当前找不到，已保留其阅读数据和笔记关联。");
  }

  private async openBookNote(path: string): Promise<void> {
    const opened = await this.plugin.openOrCreateBookNote(path);
    if (!opened) new Notice("无法打开此书的读书笔记；原始电子书没有被修改。");
  }

  private addOption(select: HTMLSelectElement, value: string, text: string): void {
    select.createEl("option", { value, text });
  }

  private folderOf(path: string): string {
    const index = path.lastIndexOf("/");
    return index < 0 ? "" : path.slice(0, index);
  }

  private progressText(reading: BookReadingState): string {
    const fraction = reading.reflowProgress ?? reading.textProgress;
    if (typeof fraction === "number") return `进度 ${Math.round(Math.min(1, Math.max(0, fraction)) * 100)}%`;
    if (typeof reading.pdfPage === "number") return `第 ${Math.max(1, Math.floor(reading.pdfPage))} 页`;
    return reading.status === "finished" ? "已完成" : "未记录进度";
  }

  private categoryOf(path: string): string {
    const index = path.indexOf("/");
    return index < 0 ? "根目录" : path.slice(0, index);
  }
}
