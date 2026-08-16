import { App, FileView, Modal, TFile, WorkspaceLeaf } from "obsidian";
import type { Bookmark, BookmarkLocator, BookMetadata, BookMetadataInput, Excerpt, ExcerptLocator, ReaderAppearanceSettings } from "./book-store";
import LocalBookReaderPlugin from "./main";
import { PdfSession, type PdfTextHighlight } from "./pdf-session";
import { LocalizedNotice as Notice, localizeTree, observeLocalization, t } from "./i18n";

export const BOOK_READER_VIEW_TYPE = "local-book-reader-view";

interface SelectedExcerpt {
  text: string;
  locator: ExcerptLocator;
}

interface TocItem {
  label: string;
  href: string;
  subitems?: TocItem[];
}

interface SearchResult {
  label: string;
  excerpt: string;
  open: () => Promise<void>;
}

interface PdfSearchLocation {
  page: number;
  query: string;
}

type FoliateAnnotation = {
  value: string;
  localBookReaderExcerpt?: boolean;
  localBookReaderSearch?: boolean;
};

interface FoliateSearchExcerpt {
  pre?: unknown;
  match?: unknown;
  post?: unknown;
}

type FoliateReaderElement = HTMLElement & {
  open(book: unknown): Promise<void>;
  goLeft(): Promise<void>;
  goRight(): Promise<void>;
  goToFraction(fraction: number): Promise<void>;
  goTo(target: string | number): Promise<unknown>;
  search(options: { query: string }): AsyncIterable<unknown>;
  clearSearch(): void;
  getCFI(index: number, range?: Range): string;
  addAnnotation(annotation: FoliateAnnotation): Promise<unknown>;
  deleteAnnotation(annotation: FoliateAnnotation): Promise<unknown>;
  deselect(): void;
  renderer?: HTMLElement & { setStyles?: (styles: string) => void };
  close(): void;
};

function textFromMetadata(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (Array.isArray(value)) return textFromMetadata(value[0]);
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  for (const key of ["zh-CN", "zh", "en", "und"]) {
    const text = textFromMetadata(record[key]);
    if (text) return text;
  }
  return textFromMetadata(Object.values(record)[0]);
}

function listFromMetadata(value: unknown, people = false): string[] | undefined {
  const values = Array.isArray(value) ? value : [value];
  const normalized = [...new Set(values.map((item) => {
    if (people && item && typeof item === "object") return textFromMetadata((item as Record<string, unknown>).name);
    return textFromMetadata(item);
  }).filter((item): item is string => Boolean(item)))];
  return normalized.length ? normalized : undefined;
}

function extractBookMetadata(value: unknown): BookMetadataInput {
  if (!value || typeof value !== "object") return {};
  const metadata = value as Record<string, unknown>;
  const title = textFromMetadata(metadata.title);
  const authors = listFromMetadata(metadata.author ?? metadata.creator, true);
  const publisher = textFromMetadata(metadata.publisher);
  const published = textFromMetadata(metadata.published ?? metadata.date);
  const languages = listFromMetadata(metadata.language);
  const identifier = textFromMetadata(metadata.identifier ?? metadata.isbn);
  return {
    ...(title ? { title } : {}),
    ...(authors ? { authors } : {}),
    ...(publisher ? { publisher } : {}),
    ...(published ? { published } : {}),
    ...(languages ? { languages } : {}),
    ...(identifier ? { identifier } : {})
  };
}

class BookInfoModal extends Modal {
  constructor(
    app: App,
    private readonly file: TFile,
    private readonly metadata: BookMetadata | undefined,
    private readonly coverResourcePath: string | undefined
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "书籍信息" });
    if (this.coverResourcePath) {
      const cover = contentEl.createEl("img", { cls: "ebook-reader__book-info-cover", attr: { src: this.coverResourcePath, alt: "本地缓存封面" } });
      cover.onerror = () => cover.remove();
    }
    const fields: Array<[string, string | undefined]> = [
      ["书名", this.metadata?.title ?? this.file.basename],
      ["作者", this.metadata?.authors?.join("、")],
      ["出版社", this.metadata?.publisher],
      ["出版日期", this.metadata?.published],
      ["语言", this.metadata?.languages?.join("、")],
      ["标识符", this.metadata?.identifier],
      ["格式", this.file.extension.toUpperCase()],
      ["分类", this.file.parent?.path || "根目录"]
    ];
    for (const [label, value] of fields) {
      if (!value) continue;
      const row = contentEl.createDiv({ cls: "ebook-reader__book-info-row" });
      row.createSpan({ cls: "ebook-reader__book-info-label", text: `${t(label)}:` });
      row.createSpan({ text: value, attr: { "data-local-book-reader-no-localize": "true" } });
    }
    contentEl.createEl("p", {
      cls: "ebook-reader__book-info-hint",
      text: this.metadata ? "信息仅在打开本书时从本地文件按需读取并缓存；原始电子书不会被修改。" : "当前格式尚无可安全读取的详细元数据，将继续使用文件名和分类信息。"
    });
    localizeTree(contentEl);
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

function parseTags(value: string): string[] {
  return [...new Set(value.split(/[\s,，]+/)
    .map((tag) => tag.replace(/^#+/, "").replace(/[^\p{L}\p{N}_/-]/gu, "").slice(0, 60))
    .filter(Boolean))].slice(0, 12);
}

class BookmarkModal extends Modal {
  constructor(app: App, private readonly onSubmit: (label: string) => void) {
    super(app);
  }

  onOpen(): void {
    this.contentEl.createEl("h2", { text: "添加书签" });
    this.contentEl.createEl("p", { text: "可选：为书签填写名称或简短说明。" });
    const input = this.contentEl.createEl("input", {
      type: "text",
      placeholder: "例如：第三章的关键论点"
    });
    input.addClass("ebook-reader__bookmark-input");
    const actions = this.contentEl.createDiv({ cls: "ebook-reader__bookmark-modal-actions" });
    const cancel = actions.createEl("button", { text: "取消" });
    cancel.type = "button";
    cancel.onclick = () => this.close();
    const submit = actions.createEl("button", { text: "添加" });
    submit.type = "button";
    const save = () => {
      this.onSubmit(input.value);
      this.close();
    };
    submit.onclick = save;
    input.onkeydown = (event) => {
      if (event.key === "Enter") save();
    };
    window.setTimeout(() => input.focus(), 0);
    localizeTree(this.contentEl);
  }
}

class ThoughtModal extends Modal {
  constructor(app: App, private readonly onSubmit: (thought: string, tags: string[]) => Promise<void>) {
    super(app);
  }

  onOpen(): void {
    this.contentEl.createEl("h2", { text: "记录想法" });
    this.contentEl.createEl("p", { text: "将按需创建本书的 Markdown 读书笔记，并只追加这一条想法。" });
    const input = this.contentEl.createEl("textarea", { placeholder: "写下你的想法、问题或待核对的线索……" });
    input.addClass("ebook-reader__thought-input");
    const tags = this.contentEl.createEl("input", { type: "text", placeholder: "主题标签（可选，用空格或逗号分隔）" });
    const actions = this.contentEl.createDiv({ cls: "ebook-reader__bookmark-modal-actions" });
    const cancel = actions.createEl("button", { text: "取消" });
    cancel.type = "button";
    cancel.onclick = () => this.close();
    const submit = actions.createEl("button", { text: "保存到读书笔记" });
    submit.type = "button";
    submit.onclick = () => {
      const thought = input.value.trim();
      if (!thought) {
        new Notice("请先输入想法内容。 ");
        return;
      }
      submit.disabled = true;
      void this.onSubmit(thought, parseTags(tags.value)).then(() => this.close()).catch((error) => {
        console.error("Local Book Reader failed to append thought", error);
        submit.disabled = false;
        new Notice("无法写入读书笔记；原书没有被修改。 ");
      });
    };
    window.setTimeout(() => input.focus(), 0);
    localizeTree(this.contentEl);
  }
}

class ExcerptModal extends Modal {
  constructor(
    app: App,
    private readonly selection: SelectedExcerpt,
    private readonly onSubmit: (note: string, tags: string[]) => Promise<void>
  ) {
    super(app);
  }

  onOpen(): void {
    this.contentEl.createEl("h2", { text: "保存摘录" });
    this.contentEl.createEl("p", { text: "所选文字会保存到插件数据，并追加到本书的 Markdown 阅读笔记；不会修改原始电子书。" });
    this.contentEl.createEl("blockquote", { text: this.selection.text });
    const input = this.contentEl.createEl("textarea", {
      placeholder: "可选：为这段摘录写下随想"
    });
    input.addClass("ebook-reader__thought-input");
    const tags = this.contentEl.createEl("input", { type: "text", placeholder: "主题标签（可选，用空格或逗号分隔）" });
    const actions = this.contentEl.createDiv({ cls: "ebook-reader__bookmark-modal-actions" });
    const cancel = actions.createEl("button", { text: "取消" });
    cancel.type = "button";
    cancel.onclick = () => this.close();
    const submit = actions.createEl("button", { text: "保存摘录" });
    submit.type = "button";
    submit.onclick = () => {
      submit.disabled = true;
      void this.onSubmit(input.value, parseTags(tags.value)).then(() => this.close()).catch((error) => {
        console.error("Local Book Reader failed to save excerpt", error);
        submit.disabled = false;
        new Notice("无法保存摘录；原始电子书没有被修改。");
      });
    };
    window.setTimeout(() => input.focus(), 0);
    localizeTree(this.contentEl);
  }
}

class AppearanceModal extends Modal {
  constructor(
    app: App,
    private readonly current: ReaderAppearanceSettings,
    private readonly onSubmit: (settings: ReaderAppearanceSettings) => Promise<void>
  ) {
    super(app);
  }

  onOpen(): void {
    this.contentEl.createEl("h2", { text: "阅读外观" });
    this.contentEl.createEl("p", { text: "此处调整只保存到当前书籍，不会影响其他书籍。" });
    const fontLabel = this.contentEl.createEl("label", { text: `${t("字号")}: ${this.current.fontSize}%` });
    const fontSize = this.contentEl.createEl("input", { attr: { type: "range", min: "75", max: "180", step: "5" } });
    fontSize.value = String(this.current.fontSize);
    fontSize.oninput = () => fontLabel.setText(`${t("字号")}: ${fontSize.value}%`);

    const lineLabel = this.contentEl.createEl("label", { text: `${t("行距")}: ${this.current.lineHeight}` });
    const lineHeight = this.contentEl.createEl("input", { attr: { type: "range", min: "1.1", max: "2.4", step: "0.1" } });
    lineHeight.value = String(this.current.lineHeight);
    lineHeight.oninput = () => lineLabel.setText(`${t("行距")}: ${lineHeight.value}`);

    const marginLabel = this.contentEl.createEl("label", { text: `${t("页边距")}: ${this.current.margin}px` });
    const margin = this.contentEl.createEl("input", { attr: { type: "range", min: "8", max: "80", step: "4" } });
    margin.value = String(this.current.margin);
    margin.oninput = () => marginLabel.setText(`${t("页边距")}: ${margin.value}px`);

    this.contentEl.createEl("label", { text: t("主题") });
    const theme = this.contentEl.createEl("select");
    for (const [value, label] of [["system", "跟随 Obsidian"], ["light", "浅色"], ["dark", "深色"], ["sepia", "护眼"]] as const) {
      theme.createEl("option", { text: t(label), value });
    }
    theme.value = this.current.theme;

    this.contentEl.createEl("label", { text: t("阅读方式") });
    const flow = this.contentEl.createEl("select");
    flow.createEl("option", { text: t("分页"), value: "paginated" });
    flow.createEl("option", { text: t("连续滚动"), value: "scrolled" });
    flow.value = this.current.flow;

    const actions = this.contentEl.createDiv({ cls: "ebook-reader__bookmark-modal-actions" });
    const cancel = actions.createEl("button", { text: t("取消") });
    cancel.type = "button";
    cancel.onclick = () => this.close();
    const save = actions.createEl("button", { text: t("应用") });
    save.type = "button";
    save.onclick = () => {
      save.disabled = true;
      void this.onSubmit({
        fontSize: Number(fontSize.value),
        lineHeight: Number(lineHeight.value),
        margin: Number(margin.value),
        theme: theme.value as ReaderAppearanceSettings["theme"],
        flow: flow.value as ReaderAppearanceSettings["flow"]
      }).then(() => this.close()).catch((error) => {
        console.error("Local Book Reader failed to save reader appearance", error);
        save.disabled = false;
        new Notice("无法保存阅读外观设置；原始电子书没有被修改。");
      });
    };
    localizeTree(this.contentEl);
  }
}

class SearchModal extends Modal {
  private generation = 0;
  private keepResultHighlight = false;

  constructor(
    app: App,
    private readonly search: (query: string, add: (result: SearchResult) => void) => Promise<number>,
    private readonly clearSearch: () => void
  ) {
    super(app);
  }

  onOpen(): void {
    this.contentEl.createEl("h2", { text: "搜索正文" });
    const input = this.contentEl.createEl("input", { type: "search", placeholder: "输入关键词后按 Enter" });
    const close = this.contentEl.createEl("button", { text: "关闭", cls: "ebook-reader__search-close" });
    close.type = "button";
    close.onclick = () => this.close();
    const status = this.contentEl.createDiv({ cls: "ebook-reader__search-status" });
    const results = this.contentEl.createDiv({ cls: "ebook-reader__search-results" });
    const run = () => {
      const query = input.value.trim();
      if (!query) return;
      const generation = ++this.generation;
      results.empty();
      status.setText(t("正在搜索…"));
      input.disabled = true;
      let count = 0;
      void this.search(query, (result) => {
        if (generation !== this.generation) return;
        count += 1;
        const button = results.createEl("button", { cls: "ebook-reader__search-result", text: result.excerpt });
        button.type = "button";
        button.title = result.label;
        button.onclick = () => {
          // Selecting a result closes this dialog, but the reader must retain
          // the landing highlight until the user explicitly clears the search.
          this.keepResultHighlight = true;
          void result.open().then(() => this.close()).catch((error) => {
            console.error("Local Book Reader could not open a search result", error);
            new Notice("无法跳转到该搜索结果。");
          });
        };
        status.setText(t(`已找到 ${count} 处`));
      }).then((total) => {
        if (generation !== this.generation) return;
        status.setText(total ? t(`找到 ${total} 处`) : t("没有找到匹配文字。"));
        input.disabled = false;
      }).catch((error) => {
        console.error("Local Book Reader search failed", error);
        if (generation === this.generation) {
          status.setText(t("搜索失败；原始电子书没有被修改。"));
          input.disabled = false;
        }
      });
    };
    input.onkeydown = (event) => {
      if (event.key === "Enter") run();
    };
    window.setTimeout(() => input.focus(), 0);
    localizeTree(this.contentEl);
  }

  onClose(): void {
    this.generation += 1;
    if (!this.keepResultHighlight) this.clearSearch();
    this.contentEl.empty();
  }
}

export class BookReaderView extends FileView {
  private currentFile: TFile | undefined;
  private foliateView: FoliateReaderElement | undefined;
  private stage: HTMLElement | undefined;
  private bookmarkPanel: HTMLElement | undefined;
  private tocPanel: HTMLElement | undefined;
  private excerptPanel: HTMLElement | undefined;
  private showingBookmarks = false;
  private showingToc = false;
  private showingExcerpts = false;
  private toc: TocItem[] = [];
  private currentReflowProgress = 0;
  private currentTextProgress = 0;
  private currentMetadata: BookMetadata | undefined;
  private currentCoverResourcePath: string | undefined;
  private currentChapter = "";
  private readingStatusEl: HTMLElement | undefined;
  private currentTextContent: string | undefined;
  private pdfSession: PdfSession | undefined;
  private currentPdfPage = 1;
  private currentPdfScale = 1;
  private pdfFitWidth = true;
  private pdfPageInput: HTMLInputElement | undefined;
  private pdfPageStatus: HTMLElement | undefined;
  private pdfTextLayer: HTMLElement | undefined;
  private activePdfSearch: PdfSearchLocation | undefined;
  private selectedExcerpt: SelectedExcerpt | undefined;
  private navigationInFlight = false;
  private activeSearchResultCfi: string | undefined;
  private stopLocalization: (() => void) | undefined;

  constructor(leaf: WorkspaceLeaf, private readonly plugin: LocalBookReaderPlugin) {
    super(leaf);
  }

  getViewType(): string {
    return BOOK_READER_VIEW_TYPE;
  }

  getDisplayText(): string {
    return this.currentFile ? `Reader: ${this.currentFile.basename}` : "Local Book Reader";
  }

  getIcon(): string {
    return "book-open";
  }

  async onOpen(): Promise<void> {
    this.contentEl.addClass("ebook-reader__view");
    this.stopLocalization = observeLocalization(this.contentEl);
    this.renderEmptyState();
  }

  async onLoadFile(file: TFile): Promise<void> {
    await this.openFile(file);
  }

  async onClose(): Promise<void> {
    this.stopLocalization?.();
    this.stopLocalization = undefined;
    // A closing tab should not wait for the optional PDF worker teardown. A
    // reflow reader is detached here; full Foliate disposal remains in use
    // when this ReaderView is reused for another book.
    void this.releaseSession(true);
  }

  async goToExcerpt(excerpt: Excerpt): Promise<void> {
    if (excerpt.locator.type === "reflow" && this.foliateView) {
      await this.foliateView.goTo(excerpt.locator.cfi);
      return;
    }
    if (excerpt.locator.type === "text" && this.stage && this.currentTextContent) {
      const maximumScroll = this.stage.scrollHeight - this.stage.clientHeight;
      this.stage.scrollTop = maximumScroll * (excerpt.locator.start / this.currentTextContent.length);
      this.selectTextOffsets(excerpt.locator.start, excerpt.locator.end);
      return;
    }
    if (excerpt.locator.type === "pdf" && this.pdfSession) {
      await this.goToPdfPage(excerpt.locator.page);
      return;
    }
    new Notice("当前阅读器尚未准备好，无法跳转到这条摘录。");
  }

  async openFile(file: TFile): Promise<void> {
    try {
      await this.plugin.prepareBook(file);
      await this.openFileUnsafe(file);
    } catch (error) {
      console.error("Local Book Reader failed to open a book", error);
      await this.releaseSession();
      this.renderOpenError(file, error);
      new Notice("无法打开此电子书；详细原因已显示在阅读器页面中。");
    }
  }

  private async openFileUnsafe(file: TFile): Promise<void> {
    this.currentFile = file;
    this.currentMetadata = undefined;
    this.currentCoverResourcePath = undefined;
    await this.releaseSession();
    this.contentEl.empty();
    const extension = file.extension.toLowerCase();
    const isPdf = extension === "pdf";
    const toolbar = this.contentEl.createDiv({ cls: "ebook-reader__toolbar" });
    toolbar.createSpan({ cls: "ebook-reader__title", text: file.basename, attr: { "data-local-book-reader-no-localize": "true" } });
    this.readingStatusEl = toolbar.createSpan({ cls: "ebook-reader__reading-status" });
    const info = toolbar.createEl("button", { text: "书籍信息", attr: { type: "button" } });
    const previous = toolbar.createEl("button", { text: "上一页", attr: { type: "button" } });
    const next = toolbar.createEl("button", { text: "下一页", attr: { type: "button" } });
    const addBookmark = toolbar.createEl("button", { text: "添加书签", attr: { type: "button" } });
    const bookmarks = toolbar.createEl("button", { text: "书签", attr: { type: "button" } });
    const toc = isPdf ? undefined : toolbar.createEl("button", { text: "目录", attr: { type: "button" } });
    const appearance = isPdf ? undefined : toolbar.createEl("button", { text: "阅读外观", attr: { type: "button" } });
    const search = toolbar.createEl("button", { text: "搜索正文", attr: { type: "button" } });
    const addExcerpt = toolbar.createEl("button", { text: "摘录所选文字", attr: { type: "button" } });
    const excerpts = toolbar.createEl("button", { text: "摘录", attr: { type: "button" } });
    const addThought = toolbar.createEl("button", { text: "记录想法", attr: { type: "button" } });
    if (isPdf) {
      const pageLabel = toolbar.createSpan({ cls: "ebook-reader__pdf-page-label", text: "页码" });
      this.pdfPageInput = pageLabel.createEl("input", { attr: { type: "number", min: "1", step: "1", title: "输入页码后按 Enter 跳转" } });
      this.pdfPageInput.addClass("ebook-reader__pdf-page-input");
      this.pdfPageStatus = toolbar.createSpan({ cls: "ebook-reader__pdf-page-status" });
      const zoomOut = toolbar.createEl("button", { text: "缩小", attr: { type: "button" } });
      const zoomIn = toolbar.createEl("button", { text: "放大", attr: { type: "button" } });
      const fit = toolbar.createEl("button", { text: "适宽", attr: { type: "button" } });
      this.registerDomEvent(this.pdfPageInput, "keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          void this.goToPdfPage(Number(this.pdfPageInput?.value));
        }
      });
      this.registerDomEvent(zoomOut, "click", () => void this.setPdfScale(this.currentPdfScale / 1.2));
      this.registerDomEvent(zoomIn, "click", () => void this.setPdfScale(this.currentPdfScale * 1.2));
      this.registerDomEvent(fit, "click", () => void this.setPdfFitWidth());
    }
    localizeTree(toolbar);
    this.bookmarkPanel = this.contentEl.createDiv({ cls: "ebook-reader__bookmarks" });
    this.tocPanel = this.contentEl.createDiv({ cls: "ebook-reader__toc" });
    this.excerptPanel = this.contentEl.createDiv({ cls: "ebook-reader__excerpts" });
    this.stage = this.contentEl.createDiv({ cls: "ebook-reader__stage" });
    this.stage.tabIndex = 0;

    this.registerDomEvent(previous, "click", () => void this.previous());
    this.registerDomEvent(next, "click", () => void this.next());
    this.registerDomEvent(info, "click", () => new BookInfoModal(
      this.app,
      file,
      this.currentMetadata ?? this.plugin.getBookMetadata(file.path),
      this.currentCoverResourcePath ?? this.plugin.getBookCoverResourcePath(file.path)
    ).open());
    this.registerDomEvent(addBookmark, "click", () => this.openBookmarkModal());
    this.registerDomEvent(bookmarks, "click", () => {
      this.showingBookmarks = !this.showingBookmarks;
      this.renderBookmarkPanel();
    });
    if (toc) this.registerDomEvent(toc, "click", () => {
      this.showingToc = !this.showingToc;
      this.renderTocPanel();
    });
    if (appearance) this.registerDomEvent(appearance, "click", () => this.openAppearanceModal());
    this.registerDomEvent(search, "click", () => this.openSearchModal());
    this.registerDomEvent(addExcerpt, "click", () => this.openExcerptModal());
    this.registerDomEvent(excerpts, "click", () => {
      this.showingExcerpts = !this.showingExcerpts;
      this.renderExcerptPanel();
    });
    this.registerDomEvent(addThought, "click", () => this.openThoughtModal());
    this.registerDomEvent(this.contentEl, "keydown", (event) => this.handleReaderKeydown(event));
    this.renderBookmarkPanel();
    this.renderTocPanel();
    this.renderExcerptPanel();

    if (extension === "pdf") {
      await this.openPdf(file);
      return;
    }
    if (extension === "txt") {
      await this.openText(file);
      return;
    }
    await this.openReflowableBook(file);
  }

  private renderEmptyState(): void {
    this.contentEl.empty();
    this.contentEl.createDiv({
      cls: "ebook-reader__empty",
      text: "请通过命令、侧边栏按钮或文件菜单打开电子书。"
    });
    localizeTree(this.contentEl);
  }

  private async openReflowableBook(file: TFile): Promise<void> {
    if (!this.stage) return;
    const fileData = await this.app.vault.readBinary(file);
    if (this.currentFile?.path !== file.path) {
      return;
    }
    this.ensureMobiFamilyIsNotEncrypted(fileData, file.extension);
    const [{ makeBook }, { Overlayer }] = await Promise.all([
      import("foliate-js/view.js"),
      import("foliate-js/overlayer.js")
    ]);
    const input = new File([fileData], file.name, { type: this.mimeType(file.extension) });
    const book = await makeBook(input);
    this.currentMetadata = (() => {
      const metadata = extractBookMetadata((book as { metadata?: unknown }).metadata);
      return Object.keys(metadata).length ? { sourceModifiedAt: file.stat.mtime, ...metadata } : undefined;
    })();
    if (this.currentMetadata) {
      void this.plugin.cacheBookMetadata(file, this.currentMetadata).catch((error) => {
        console.warn("Local Book Reader could not cache book metadata", error);
      });
    }
    const getCover = (book as { getCover?: () => Promise<Blob | null> }).getCover;
    if (typeof getCover === "function") {
      void getCover.call(book).then(async (cover) => {
        if (!cover || this.currentFile?.path !== file.path) return;
        await this.plugin.cacheBookCover(file, cover);
        if (this.currentFile?.path === file.path) this.currentCoverResourcePath = this.plugin.getBookCoverResourcePath(file.path);
      }).catch((error) => console.warn("Local Book Reader could not cache book cover", error));
    }
    this.toc = this.normalizeToc((book as { toc?: unknown }).toc);
    this.renderTocPanel();
    this.applyContentPolicy(book);
    const view = document.createElement("foliate-view") as FoliateReaderElement;
    view.setAttribute("data-local-book-reader-flow", this.plugin.getReaderAppearance(file.path).flow);
    if (!view) throw new Error("无法创建重排版阅读器。");
    this.foliateView = view;
    view.addEventListener("relocate", (event: Event) => {
      const detail = (event as CustomEvent<{ fraction?: number; tocItem?: { label?: string } }>).detail;
      if (typeof detail?.fraction === "number" && Number.isFinite(detail.fraction) && this.currentFile?.path === file.path) {
        this.currentReflowProgress = detail.fraction;
        this.currentChapter = typeof detail.tocItem?.label === "string" ? detail.tocItem.label : "";
        this.plugin.setReflowProgress(file.path, detail.fraction);
        this.updateReadingStatus();
      }
    });
    view.addEventListener("external-link", (event) => event.preventDefault());
    view.addEventListener("load", (event: Event) => {
      const detail = (event as CustomEvent<{ doc?: Document; index?: number }>).detail;
      if (!detail?.doc || typeof detail.index !== "number") return;
      detail.doc.addEventListener("selectionchange", () => {
        this.captureReflowSelection(view, detail.doc!, detail.index!, file);
      });
      detail.doc.addEventListener("keydown", (keyboardEvent) => this.handleReaderKeydown(keyboardEvent));
    });
    view.addEventListener("draw-annotation", (event: Event) => {
      const detail = (event as CustomEvent<{
        annotation?: FoliateAnnotation;
        draw?: (draw: typeof Overlayer.highlight, options: { color: string }) => void;
      }>).detail;
      if (!detail?.draw) return;
      if (detail.annotation?.localBookReaderExcerpt) {
        detail.draw(Overlayer.highlight, { color: "#f3c94d" });
      } else if (detail.annotation?.localBookReaderSearch) {
        detail.draw(Overlayer.highlight, { color: "#e75b5b" });
      }
    });
    view.addEventListener("create-overlay", () => {
      for (const excerpt of this.plugin.getExcerpts(file.path)) {
        if (excerpt.locator.type !== "reflow") continue;
        void view.addAnnotation({ value: excerpt.locator.cfi, localBookReaderExcerpt: true })
          .catch((error) => console.warn("Local Book Reader could not redraw an excerpt", error));
      }
    });
    this.stage.append(view);
    await view.open(book);
    this.applyReaderAppearance();
    const progress = this.plugin.getReflowProgress(file.path);
    if (progress !== undefined) {
      this.currentReflowProgress = progress;
      await view.goToFraction(progress);
    } else {
      this.currentReflowProgress = 0;
      await view.goRight();
    }
    this.updateReadingStatus();
  }

  private applyContentPolicy(book: unknown): void {
    const target = (book as { transformTarget?: EventTarget }).transformTarget;
    target?.addEventListener("data", (event) => {
      const detail = (event as CustomEvent<{ data: unknown; type?: string }>).detail;
      if (!detail || !/html|xhtml/i.test(detail.type ?? "")) return;
      detail.data = Promise.resolve(detail.data).then(async (data) => {
        const source = data instanceof Blob ? await data.text() : String(data);
        return this.sanitizeBookContent(source);
      });
    });
  }

  private sanitizeBookContent(source: string): string {
    // The reader iframe is sandboxed without allow-scripts. Avoid adding markup
    // here: legacy EPUBs frequently use strict XHTML and can reject new HTML tags.
    return source
      .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
      .replace(/<script\b[^>]*\/?>/gi, "")
      .replace(/<(?:iframe|object|embed)\b[^>]*>[\s\S]*?<\/(?:iframe|object|embed)\s*>/gi, "")
      .replace(/<(?:iframe|object|embed)\b[^>]*\/?>/gi, "")
      .replace(/<meta\b[^>]*http-equiv\s*=\s*(?:"refresh"|'refresh'|refresh)[^>]*\/?>/gi, "")
      .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(/\s(?:src|poster|data)\s*=\s*(?:"(?:https?:|file:|javascript:)[^"]*"|'(?:https?:|file:|javascript:)[^']*'|(?:https?:|file:|javascript:)[^\s>]+)/gi, "");
  }

  private renderOpenError(file: TFile, error: unknown): void {
    this.contentEl.empty();
    const message = error instanceof Error ? error.message : String(error);
    this.contentEl.createEl("h2", { text: t("无法打开电子书") });
    this.contentEl.createEl("p", { text: file.basename });
    this.contentEl.createEl("pre", {
      cls: "ebook-reader__error",
      text: t(message.slice(0, 1000))
    });
  }

  private ensureMobiFamilyIsNotEncrypted(fileData: ArrayBuffer, extension: string): void {
    if (!new Set(["mobi", "azw", "azw3"]).has(extension.toLowerCase())) return;

    // Palm database record 0 contains the PalmDOC encryption field. A non-zero
    // value means the text records are encrypted; passing them to a decompressor
    // would otherwise render binary garbage as if it were book text.
    if (fileData.byteLength < 82) return;
    const header = new DataView(fileData);
    const firstRecordOffset = header.getUint32(78, false);
    if (firstRecordOffset + 14 > fileData.byteLength) return;
    const encryption = header.getUint16(firstRecordOffset + 12, false);
    if (encryption !== 0) {
      throw new Error(
        `此 ${extension.toUpperCase()} 文件带有加密或 DRM 保护（标记 ${encryption}）。`
        + "本插件不会尝试绕过保护；请使用合法来源提供的未加密副本。"
      );
    }
  }

  private async openText(file: TFile): Promise<void> {
    if (!this.stage) return;
    const content = await this.app.vault.read(file);

    if (this.currentFile?.path !== file.path) {
      return;
    }

    this.currentTextContent = content;
    this.toc = [];
    this.renderTocPanel();
    this.renderTextExcerpts(file.path);
    this.applyReaderAppearance();

    this.registerDomEvent(this.stage, "scroll", () => {
      if (!this.stage) return;
      const maximumScroll = this.stage.scrollHeight - this.stage.clientHeight;
      const progress = maximumScroll <= 0 ? 0 : this.stage.scrollTop / maximumScroll;
      this.currentTextProgress = progress;
      this.plugin.setTextProgress(file.path, progress);
      this.updateReadingStatus();
    });
    this.registerDomEvent(this.stage, "mouseup", () => this.captureTextSelection(file));
    this.registerDomEvent(this.stage, "keyup", () => this.captureTextSelection(file));

    const progress = this.plugin.getTextProgress(file.path) ?? 0;
    this.currentTextProgress = progress;
    this.updateReadingStatus();
    window.requestAnimationFrame(() => {
      if (this.stage) {
        this.stage.scrollTop = (this.stage.scrollHeight - this.stage.clientHeight) * progress;
        this.updateReadingStatus();
      }
    });
  }

  private async openPdf(file: TFile): Promise<void> {
    if (!this.stage) return;
    this.stage.addClass("ebook-reader__pdf-stage");
    this.toc = [];
    this.renderTocPanel();
    this.pdfSession = await PdfSession.open(this.app, file);
    this.registerDomEvent(this.stage, "mouseup", () => this.capturePdfSelection(file));
    this.registerDomEvent(this.stage, "keyup", () => this.capturePdfSelection(file));
    const savedPage = this.plugin.getPdfPage(file.path) ?? 1;
    await this.goToPdfPage(savedPage);
  }

  private async goToPdfPage(page: number): Promise<void> {
    if (!this.pdfSession || !this.stage || this.navigationInFlight) return;
    this.navigationInFlight = true;
    try {
      this.currentPdfPage = this.pdfSession.clampPage(page);
      const rendered = await this.pdfSession.render(
        this.stage,
        this.currentPdfPage,
        this.currentPdfScale,
        this.pdfFitWidth,
        this.pdfHighlightsForCurrentPage()
      );
      this.pdfTextLayer = rendered.textLayer;
      this.applyActivePdfSearchHighlight(rendered.textLayer);
      this.plugin.setPdfPage(this.currentFile?.path ?? "", this.currentPdfPage);
      this.updatePdfControls();
      this.updateReadingStatus();
    } finally {
      this.navigationInFlight = false;
    }
  }

  private async setPdfScale(scale: number): Promise<void> {
    this.currentPdfScale = Math.max(0.5, Math.min(3, scale));
    this.pdfFitWidth = false;
    await this.goToPdfPage(this.currentPdfPage);
  }

  private async setPdfFitWidth(): Promise<void> {
    this.pdfFitWidth = true;
    await this.goToPdfPage(this.currentPdfPage);
  }

  private updatePdfControls(): void {
    if (!this.pdfSession) return;
    if (this.pdfPageInput) {
      this.pdfPageInput.value = String(this.currentPdfPage);
      this.pdfPageInput.max = String(this.pdfSession.pageCount);
    }
    if (this.pdfPageStatus) {
      const zoom = this.pdfFitWidth ? "适宽" : `${Math.round(this.currentPdfScale * 100)}%`;
      this.pdfPageStatus.setText(t(`/ ${this.pdfSession.pageCount} · ${zoom}`));
    }
  }

  private updateReadingStatus(): void {
    const file = this.currentFile;
    if (!file || !this.readingStatusEl) return;
    const extension = file.extension.toLowerCase();
    if (extension === "pdf" && this.pdfSession) {
      const percentage = Math.round((this.currentPdfPage / this.pdfSession.pageCount) * 100);
      this.readingStatusEl.setText(t(`第 ${this.currentPdfPage} / ${this.pdfSession.pageCount} 页 · ${percentage}%`));
      return;
    }
    const progress = extension === "txt" ? this.currentTextProgress : this.currentReflowProgress;
    const label = extension === "txt" ? "" : this.currentChapter ? `${this.currentChapter} · ` : "";
    this.readingStatusEl.setText(t(`${label}进度 ${Math.round(progress * 100)}%`));
  }

  private async previous(): Promise<void> {
    await this.navigate("previous");
  }

  private async next(): Promise<void> {
    await this.navigate("next");
  }

  private async navigate(direction: "previous" | "next"): Promise<void> {
    if (this.pdfSession) {
      await this.goToPdfPage(this.currentPdfPage + (direction === "previous" ? -1 : 1));
      return;
    }
    if (!this.foliateView || this.navigationInFlight) return;
    this.navigationInFlight = true;
    try {
      if (direction === "previous") await this.foliateView.goLeft();
      else await this.foliateView.goRight();
    } finally {
      this.navigationInFlight = false;
    }
  }

  private handleReaderKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || this.isEditableTarget(event.target)) return;
    if (event.key === "ArrowLeft" || event.key === "PageUp") {
      event.preventDefault();
      void this.previous();
    } else if (event.key === "ArrowRight" || event.key === "PageDown") {
      event.preventDefault();
      void this.next();
    }
  }

  private isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest("input, textarea, select, button, [contenteditable='true'], a"));
  }

  private async releaseSession(deferRendererDisposal = false): Promise<void> {
    const foliateView = this.foliateView;
    const pdfSession = this.pdfSession;
    this.foliateView = undefined;
    this.pdfSession = undefined;
    foliateView?.remove();
    this.stage = undefined;
    this.bookmarkPanel = undefined;
    this.tocPanel = undefined;
    this.excerptPanel = undefined;
    this.currentReflowProgress = 0;
    this.currentTextProgress = 0;
    this.currentChapter = "";
    this.readingStatusEl = undefined;
    this.currentTextContent = undefined;
    this.currentPdfPage = 1;
    this.currentPdfScale = 1;
    this.pdfFitWidth = true;
    this.pdfPageInput = undefined;
    this.pdfPageStatus = undefined;
    this.pdfTextLayer = undefined;
    this.activePdfSearch = undefined;
    this.selectedExcerpt = undefined;
    this.toc = [];
    this.showingToc = false;
    this.showingExcerpts = false;
    this.navigationInFlight = false;
    this.activeSearchResultCfi = undefined;

    if (deferRendererDisposal) {
      void pdfSession?.destroy().catch((error) => {
        console.warn("Local Book Reader could not release the PDF reader after closing", error);
      });
      return;
    }

    foliateView?.close();
    await pdfSession?.destroy();
  }

  private openBookmarkModal(): void {
    const locator = this.currentBookmarkLocator();
    const file = this.currentFile;
    if (!locator || !file) {
      new Notice("当前书籍尚未准备好，暂时无法添加书签。");
      return;
    }
    new BookmarkModal(this.app, (label) => {
      const bookmark = this.plugin.addBookmark(file.path, locator, label);
      if (!bookmark) {
        new Notice("未能保存书签；请重新打开书籍后再试。");
        return;
      }
      new Notice("书签已添加。");
      this.renderBookmarkPanel();
    }).open();
  }

  private openThoughtModal(): void {
    const locator = this.currentBookmarkLocator();
    const file = this.currentFile;
    if (!locator || !file) {
      new Notice("当前书籍尚未准备好，暂时无法记录想法。 ");
      return;
    }
    new ThoughtModal(this.app, async (thought, tags) => {
      const note = await this.plugin.appendThought(file, locator, thought, tags);
      const leaf = this.app.workspace.getLeaf("tab");
      await leaf.openFile(note, { active: true });
      new Notice("想法已保存到读书笔记。 ");
    }).open();
  }

  private openExcerptModal(): void {
    const selection = this.selectedExcerpt;
    const file = this.currentFile;
    if (!selection || !file) {
      new Notice("请先在正文中选中要摘录的文字。");
      return;
    }
    new ExcerptModal(this.app, selection, async (note, tags) => {
      const excerpt = this.plugin.addExcerpt(file.path, selection.text, selection.locator, note, tags);
      if (!excerpt) throw new Error("Could not create excerpt data.");
      // Persist plugin data before creating the optional Markdown projection, so
      // a failed data write never leaves a note that cannot be traced back.
      await this.plugin.flushReadingState();
      const readingNote = await this.plugin.appendExcerpt(file, excerpt);
      if (excerpt.locator.type === "reflow" && this.foliateView) {
        await this.foliateView.addAnnotation({
          value: excerpt.locator.cfi,
          localBookReaderExcerpt: true
        });
        this.foliateView.deselect();
      } else if (excerpt.locator.type === "text") {
        this.renderTextExcerpts(file.path);
      } else if (excerpt.locator.type === "pdf") {
        await this.goToPdfPage(excerpt.locator.page);
      }
      this.selectedExcerpt = undefined;
      this.renderExcerptPanel();
      const leaf = this.app.workspace.getLeaf("tab");
      await leaf.openFile(readingNote, { active: true });
      new Notice("摘录已保存到阅读笔记。");
    }).open();
  }

  private openAppearanceModal(): void {
    const file = this.currentFile;
    if (!file) return;
    new AppearanceModal(this.app, this.plugin.getReaderAppearance(file.path), async (settings) => {
      await this.plugin.setReaderAppearance(file.path, settings);
      this.applyReaderAppearance();
      new Notice("阅读外观已保存，仅应用于当前书籍。");
    }).open();
  }

  private applyReaderAppearance(): void {
    const settings = this.plugin.getReaderAppearance(this.currentFile?.path);
    const theme = settings.theme === "light"
      ? { background: "#ffffff", color: "#1f2328", scheme: "light" }
      : settings.theme === "dark"
        ? { background: "#1f2328", color: "#e6edf3", scheme: "dark" }
        : settings.theme === "sepia"
          ? { background: "#f4ecd8", color: "#4b3b2a", scheme: "light" }
          : { background: "Canvas", color: "CanvasText", scheme: "light dark" };
    if (this.stage) {
      this.stage.setCssStyles({
        fontSize: `${settings.fontSize}%`,
        lineHeight: String(settings.lineHeight),
        paddingInline: `${settings.margin}px`,
        background: theme.background,
        color: theme.color,
        colorScheme: theme.scheme,
      });
      const text = this.stage.querySelector<HTMLElement>(".ebook-reader__text");
      if (text) {
        // TXT is rendered in a pre element with its own default typography.
        // Make it inherit the user-selected reader appearance rather than the
        // Vault theme variables, and keep the horizontal margin in one place.
        this.stage.setCssStyles({ paddingInline: "0" });
        text.setCssStyles({
          fontSize: "inherit",
          lineHeight: "inherit",
          color: "inherit",
          paddingInline: `${settings.margin}px`,
        });
      }
    }
    const renderer = this.foliateView?.renderer;
    if (!renderer?.setStyles) return;
    renderer.style.setProperty("--_margin", `${settings.margin}px`);
    renderer.setAttribute("flow", settings.flow);
    renderer.setStyles(`
      html, body {
        font-size: ${settings.fontSize}% !important;
        color: ${theme.color} !important;
        background: ${theme.background} !important;
        color-scheme: ${theme.scheme};
      }
      body { padding-inline: ${settings.margin}px !important; line-height: ${settings.lineHeight} !important; }
      p, li, blockquote, dd { line-height: ${settings.lineHeight} !important; }
    `);
  }

  private openSearchModal(): void {
    if (!this.currentFile) {
      new Notice("当前书籍尚未准备好，暂时无法搜索。");
      return;
    }
    new SearchModal(this.app, async (query, add) => {
      if (this.pdfSession) return this.searchPdfBook(query, add);
      if (this.foliateView) return this.searchReflowableBook(query, add);
      return this.searchTextBook(query, add);
    }, () => this.clearReaderSearch()).open();
  }

  private async searchPdfBook(query: string, add: (result: SearchResult) => void): Promise<number> {
    const session = this.pdfSession;
    if (!session) return 0;
    await this.clearPdfSearch();
    return session.search(query, (result) => {
      add({
        label: `第 ${result.page} 页`,
        excerpt: this.compactSearchExcerpt(result.excerpt),
        open: async () => {
          this.activePdfSearch = { page: result.page, query: query.trim() };
          await this.goToPdfPage(result.page);
        }
      });
    });
  }

  private clearReaderSearch(): void {
    this.foliateView?.clearSearch();
    void this.clearActiveSearchResult();
    void this.clearPdfSearch();
  }

  private async clearPdfSearch(): Promise<void> {
    if (!this.activePdfSearch) return;
    this.activePdfSearch = undefined;
    if (this.pdfSession && this.stage && !this.navigationInFlight) {
      await this.goToPdfPage(this.currentPdfPage);
    }
  }

  private async searchReflowableBook(query: string, add: (result: SearchResult) => void): Promise<number> {
    const view = this.foliateView;
    if (!view) return 0;
    await this.clearActiveSearchResult();
    let count = 0;
    for await (const result of view.search({ query })) {
      if (!result || typeof result !== "object") continue;
      const group = result as { label?: unknown; subitems?: unknown; cfi?: unknown; excerpt?: unknown };
      const items = Array.isArray(group.subitems) ? group.subitems : [group];
      const label = typeof group.label === "string" && group.label ? group.label : "搜索结果";
      for (const item of items) {
        if (!item || typeof item !== "object") continue;
        const match = item as { cfi?: unknown; excerpt?: unknown };
        const excerpt = this.searchExcerptText(match.excerpt);
        if (typeof match.cfi !== "string" || !excerpt) continue;
        count += 1;
        add({
          label,
          excerpt: this.compactSearchExcerpt(excerpt),
          open: async () => {
            const cfi = match.cfi as string;
            await view.goTo(cfi);
            await this.showActiveSearchResult(cfi);
          }
        });
      }
    }
    return count;
  }

  private async showActiveSearchResult(cfi: string): Promise<void> {
    const view = this.foliateView;
    if (!view) return;
    await this.clearActiveSearchResult();
    await view.addAnnotation({ value: cfi, localBookReaderSearch: true });
    this.activeSearchResultCfi = cfi;
  }

  private async clearActiveSearchResult(): Promise<void> {
    const view = this.foliateView;
    const cfi = this.activeSearchResultCfi;
    this.activeSearchResultCfi = undefined;
    if (view && cfi) {
      await view.deleteAnnotation({ value: cfi, localBookReaderSearch: true });
    }
  }

  private async searchTextBook(query: string, add: (result: SearchResult) => void): Promise<number> {
    if (!this.stage || this.currentTextContent === undefined) return 0;
    const content = this.currentTextContent;
    const queryLower = query.toLocaleLowerCase();
    const sourceLower = content.toLocaleLowerCase();
    let count = 0;
    let index = 0;
    while (count < 100) {
      index = sourceLower.indexOf(queryLower, index);
      if (index < 0) break;
      const start = index;
      const end = start + query.length;
      count += 1;
      add({
        label: `字符位置 ${start + 1}`,
        excerpt: this.compactSearchExcerpt(content.slice(Math.max(0, start - 50), Math.min(content.length, end + 80))),
        open: async () => {
          if (!this.stage) return;
          const maximumScroll = this.stage.scrollHeight - this.stage.clientHeight;
          this.stage.scrollTop = content.length ? maximumScroll * (start / content.length) : 0;
        }
      });
      index = end;
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    }
    return count;
  }

  private compactSearchExcerpt(text: string): string {
    return text.replace(/\s+/g, " ").trim().slice(0, 240);
  }

  private searchExcerptText(value: unknown): string | undefined {
    if (typeof value === "string") return value;
    if (!value || typeof value !== "object") return undefined;
    const excerpt = value as FoliateSearchExcerpt;
    const parts = [excerpt.pre, excerpt.match, excerpt.post].filter((part): part is string => typeof part === "string");
    return parts.length ? parts.join("") : undefined;
  }

  private captureReflowSelection(view: FoliateReaderElement, doc: Document, index: number, file: TFile): void {
    if (this.currentFile?.path !== file.path) return;
    const selection = doc.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();
    if (!text) return;
    this.selectedExcerpt = {
      text,
      locator: {
        type: "reflow",
        fraction: this.currentReflowProgress,
        cfi: view.getCFI(index, range),
        chapter: this.currentChapter || undefined
      }
    };
  }

  private captureTextSelection(file: TFile): void {
    if (!this.stage || this.currentFile?.path !== file.path) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const root = this.stage;
    if (!root.contains(range.commonAncestorContainer)) return;
    const offsets = this.rangeOffsets(root, range);
    const text = selection.toString().trim();
    if (!offsets || !text || offsets.start === offsets.end) return;
    this.selectedExcerpt = {
      text,
      locator: {
        type: "text",
        progress: this.currentTextProgress,
        start: offsets.start,
        end: offsets.end
      }
    };
  }

  private capturePdfSelection(file: TFile): void {
    const layer = this.pdfTextLayer;
    if (!layer || this.currentFile?.path !== file.path) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (!layer.contains(range.startContainer) || !layer.contains(range.endContainer)) return;
    const start = this.rangeOffset(layer, range.startContainer, range.startOffset);
    const end = this.rangeOffset(layer, range.endContainer, range.endOffset);
    const rawText = selection.toString();
    const text = rawText.trim();
    if (start === undefined || end === undefined || end <= start || !text) return;
    const leading = rawText.length - rawText.trimStart().length;
    const trailing = rawText.length - rawText.trimEnd().length;
    this.selectedExcerpt = {
      text,
      locator: { type: "pdf", page: this.currentPdfPage, start: start + leading, end: end - trailing }
    };
  }

  private rangeOffset(root: HTMLElement, target: Node, targetOffset: number): number | undefined {
    try {
      const range = document.createRange();
      range.setStart(root, 0);
      range.setEnd(target, targetOffset);
      return range.toString().length;
    } catch {
      return undefined;
    }
  }

  private pdfHighlightsForCurrentPage(): PdfTextHighlight[] {
    const file = this.currentFile;
    if (!file) return [];
    const excerpts: PdfTextHighlight[] = this.plugin.getExcerpts(file.path)
      .filter((excerpt): excerpt is Excerpt & { locator: Extract<ExcerptLocator, { type: "pdf" }> } => excerpt.locator.type === "pdf" && excerpt.locator.page === this.currentPdfPage)
      .map((excerpt) => ({ start: excerpt.locator.start, end: excerpt.locator.end, kind: "excerpt" as const }));
    return excerpts;
  }

  private applyActivePdfSearchHighlight(layer: HTMLElement): void {
    const search = this.activePdfSearch;
    if (!search || search.page !== this.currentPdfPage || !this.pdfSession) return;
    const range = this.findPdfSearchRange(layer.textContent ?? "", search.query);
    if (!range) return;
    this.pdfSession.highlightTextLayer(layer, { ...range, kind: "search" });
  }

  private findPdfSearchRange(source: string, query: string): { start: number; end: number } | undefined {
    const directStart = source.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
    if (directStart >= 0) return { start: directStart, end: directStart + query.length };
    const sourceIndex: number[] = [];
    let normalizedSource = "";
    for (let index = 0; index < source.length; index += 1) {
      if (/\s/u.test(source[index])) continue;
      normalizedSource += source[index].toLocaleLowerCase();
      sourceIndex.push(index);
    }
    const normalizedQuery = [...query].filter((character) => !/\s/u.test(character)).join("").toLocaleLowerCase();
    if (!normalizedQuery) return undefined;
    const normalizedStart = normalizedSource.indexOf(normalizedQuery);
    if (normalizedStart < 0) return undefined;
    const start = sourceIndex[normalizedStart];
    const end = sourceIndex[normalizedStart + normalizedQuery.length - 1] + 1;
    return { start, end };
  }

  private rangeOffsets(root: HTMLElement, range: Range): { start: number; end: number } | undefined {
    let start: number | undefined;
    let end: number | undefined;
    let offset = 0;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (node === range.startContainer) start = offset + range.startOffset;
      if (node === range.endContainer) end = offset + range.endOffset;
      offset += node.textContent?.length ?? 0;
    }
    return start === undefined || end === undefined ? undefined : { start, end };
  }

  private selectTextOffsets(start: number, end: number): void {
    if (!this.stage) return;
    const locate = (target: number): { node: Node; offset: number } | undefined => {
      let position = 0;
      const walker = document.createTreeWalker(this.stage!, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const length = node.textContent?.length ?? 0;
        if (target <= position + length) return { node, offset: target - position };
        position += length;
      }
      return undefined;
    };
    const from = locate(start);
    const to = locate(end);
    if (!from || !to) return;
    const range = document.createRange();
    range.setStart(from.node, from.offset);
    range.setEnd(to.node, to.offset);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  private renderTextExcerpts(path: string): void {
    if (!this.stage || this.currentTextContent === undefined) return;
    const content = this.currentTextContent;
    const previousScroll = this.stage.scrollTop;
    this.stage.empty();
    const text = this.stage.createEl("pre", { cls: "ebook-reader__text" });
    let cursor = 0;
    const excerpts = this.plugin.getExcerpts(path)
      .filter((excerpt) => excerpt.locator.type === "text")
      .sort((left, right) => (left.locator as { start: number }).start - (right.locator as { start: number }).start);
    for (const excerpt of excerpts) {
      const locator = excerpt.locator as Extract<ExcerptLocator, { type: "text" }>;
      if (locator.start < cursor || locator.end > content.length || locator.start >= locator.end
        || content.slice(locator.start, locator.end).trim() !== excerpt.text.trim()) continue;
      text.append(document.createTextNode(content.slice(cursor, locator.start)));
      text.createEl("mark", { cls: "ebook-reader__excerpt-highlight", text: content.slice(locator.start, locator.end) });
      cursor = locator.end;
    }
    text.append(document.createTextNode(content.slice(cursor)));
    this.stage.scrollTop = previousScroll;
    this.applyReaderAppearance();
  }

  private normalizeToc(value: unknown): TocItem[] {
    if (!Array.isArray(value)) return [];
    return value.flatMap((item): TocItem[] => {
      if (!item || typeof item !== "object") return [];
      const candidate = item as { label?: unknown; href?: unknown; subitems?: unknown };
      if (typeof candidate.href !== "string" || !candidate.href) return [];
      return [{
        label: typeof candidate.label === "string" && candidate.label.trim() ? candidate.label.trim() : "未命名章节",
        href: candidate.href,
        subitems: this.normalizeToc(candidate.subitems)
      }];
    });
  }

  private renderTocPanel(): void {
    if (!this.tocPanel) return;
    this.tocPanel.empty();
    this.tocPanel.toggleClass("is-hidden", !this.showingToc);
    if (!this.showingToc) return;
    this.tocPanel.createEl("h3", { text: t("目录") });
    if (this.toc.length === 0) {
      this.tocPanel.createDiv({ cls: "ebook-reader__bookmark-empty", text: t("当前书籍没有可用目录。") });
      return;
    }
    this.renderTocItems(this.tocPanel, this.toc, 0);
  }

  private renderTocItems(container: HTMLElement, items: TocItem[], depth: number): void {
    for (const item of items) {
      const button = container.createEl("button", { cls: "ebook-reader__toc-item", text: item.label, attr: { "data-local-book-reader-no-localize": "true" } });
      button.type = "button";
      button.style.paddingInlineStart = `${0.5 + depth * 1}rem`;
      button.onclick = () => void this.goToTocItem(item);
      if (item.subitems?.length) this.renderTocItems(container, item.subitems, depth + 1);
    }
  }

  private async goToTocItem(item: TocItem): Promise<void> {
    if (!this.foliateView) {
      new Notice("当前书籍不支持目录跳转。");
      return;
    }
    try {
      const resolved = await this.foliateView.goTo(item.href);
      if (!resolved) {
        new Notice("该目录项没有可用的定位信息，无法跳转。");
        return;
      }
      this.showingToc = false;
      this.renderTocPanel();
    } catch (error) {
      console.error("Local Book Reader could not open a table-of-contents item", error);
      new Notice("无法跳转到该目录项。原书没有被修改。");
    }
  }

  private renderBookmarkPanel(): void {
    if (!this.bookmarkPanel) return;
    this.bookmarkPanel.empty();
    this.bookmarkPanel.toggleClass("is-hidden", !this.showingBookmarks);
    if (!this.showingBookmarks || !this.currentFile) return;

    const list = this.plugin.getBookmarks(this.currentFile.path);
    this.bookmarkPanel.createEl("h3", { text: t("书签") });
    if (list.length === 0) {
      this.bookmarkPanel.createDiv({ cls: "ebook-reader__bookmark-empty", text: t("本书还没有书签。") });
      return;
    }
    for (const bookmark of list) this.renderBookmarkItem(bookmark);
  }

  private renderBookmarkItem(bookmark: Bookmark): void {
    if (!this.bookmarkPanel || !this.currentFile) return;
    const row = this.bookmarkPanel.createDiv({ cls: "ebook-reader__bookmark-row" });
    row.createDiv({ cls: "ebook-reader__bookmark-label", text: bookmark.label || t("未命名书签"), attr: bookmark.label ? { "data-local-book-reader-no-localize": "true" } : undefined });
    row.createDiv({ cls: "ebook-reader__bookmark-time", text: bookmark.createdAt });
    const jump = row.createEl("button", { text: t("跳转") });
    jump.type = "button";
    jump.onclick = () => void this.goToBookmark(bookmark);
    const remove = row.createEl("button", { text: t("删除") });
    remove.type = "button";
    remove.onclick = () => {
      if (!this.currentFile) return;
      this.plugin.removeBookmark(this.currentFile.path, bookmark.bookmarkId);
      this.renderBookmarkPanel();
    };
  }

  private async goToBookmark(bookmark: Bookmark): Promise<void> {
    if (!this.stage) return;
    if (bookmark.locator.type === "reflow" && this.foliateView) {
      this.currentReflowProgress = bookmark.locator.fraction;
      await this.foliateView.goToFraction(bookmark.locator.fraction);
      return;
    }
    if (bookmark.locator.type === "text") {
      this.currentTextProgress = bookmark.locator.progress;
      this.stage.scrollTop = (this.stage.scrollHeight - this.stage.clientHeight) * bookmark.locator.progress;
      return;
    }
    if (bookmark.locator.type === "pdf" && this.pdfSession) {
      await this.goToPdfPage(bookmark.locator.page);
      return;
    }
    new Notice("此书签的定位方式与当前阅读器不匹配。 ");
  }

  private renderExcerptPanel(): void {
    if (!this.excerptPanel) return;
    this.excerptPanel.empty();
    this.excerptPanel.toggleClass("is-hidden", !this.showingExcerpts);
    if (!this.showingExcerpts || !this.currentFile) return;

    const excerpts = this.plugin.getExcerpts(this.currentFile.path);
    this.excerptPanel.createEl("h3", { text: t("摘录") });
    this.excerptPanel.createDiv({
      cls: "ebook-reader__excerpt-help",
      text: t("删除会移除本阅读器中的高亮和定位数据；已经写入的 Markdown 读书笔记会保留。")
    });
    if (excerpts.length === 0) {
      this.excerptPanel.createDiv({ cls: "ebook-reader__bookmark-empty", text: t("本书还没有摘录。") });
      return;
    }
    for (const excerpt of excerpts) this.renderExcerptItem(excerpt);
  }

  private renderExcerptItem(excerpt: Excerpt): void {
    if (!this.excerptPanel || !this.currentFile) return;
    const row = this.excerptPanel.createDiv({ cls: "ebook-reader__excerpt-row" });
    row.createDiv({ cls: "ebook-reader__excerpt-text", text: this.compactSearchExcerpt(excerpt.text) });
    row.createDiv({ cls: "ebook-reader__bookmark-time", text: excerpt.createdAt });
    const jump = row.createEl("button", { text: t("跳转") });
    jump.type = "button";
    jump.onclick = () => void this.goToExcerpt(excerpt);
    const remove = row.createEl("button", { text: t("删除高亮") });
    remove.type = "button";
    remove.onclick = () => void this.removeExcerpt(excerpt);
  }

  private async removeExcerpt(excerpt: Excerpt): Promise<void> {
    const file = this.currentFile;
    if (!file) return;
    const removed = this.plugin.removeExcerpt(file.path, excerpt.excerptId);
    if (!removed) return;
    try {
      await this.plugin.flushReadingState();
      if (removed.locator.type === "reflow" && this.foliateView) {
        await this.foliateView.deleteAnnotation({
          value: removed.locator.cfi,
          localBookReaderExcerpt: true
        });
      } else if (removed.locator.type === "text") {
        this.renderTextExcerpts(file.path);
      } else if (removed.locator.type === "pdf") {
        await this.goToPdfPage(removed.locator.page);
      }
      this.renderExcerptPanel();
      new Notice("已删除本地高亮；对应的 Markdown 摘录仍保留。");
    } catch (error) {
      console.error("Local Book Reader could not remove an excerpt", error);
      new Notice("未能安全保存摘录删除操作；请重新打开本书后确认高亮状态。");
    }
  }

  private currentBookmarkLocator(): BookmarkLocator | undefined {
    const extension = this.currentFile?.extension.toLowerCase();
    if (extension === "pdf" && this.pdfSession) return { type: "pdf", page: this.currentPdfPage };
    if (extension === "txt") return { type: "text", progress: this.currentTextProgress };
    if (this.foliateView) return { type: "reflow", fraction: this.currentReflowProgress };
    return undefined;
  }

  private mimeType(extension: string): string {
    const normalized = extension.toLowerCase();
    if (normalized === "epub") return "application/epub+zip";
    if (normalized === "mobi" || normalized === "azw" || normalized === "azw3") return "application/x-mobipocket-ebook";
    return "application/octet-stream";
  }
}
