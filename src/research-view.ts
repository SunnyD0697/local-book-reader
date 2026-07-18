import { ItemView, Notice, WorkspaceLeaf } from "obsidian";
import type { StoredExcerpt } from "./book-store";
import type { ResearchMarkdownEntry } from "./note-service";
import LocalBookReaderPlugin from "./main";

export const BOOK_RESEARCH_VIEW_TYPE = "local-book-reader-research";

function tagsOf(entry: StoredExcerpt): string[] {
  return entry.excerpt.tags ?? [];
}

function dayOf(value: string): string {
  return value.slice(0, 10);
}

export class BookResearchView extends ItemView {
  private query = "";
  private bookQuery = "";
  private tagQuery = "";
  private from = "";
  private to = "";
  private readonly selectedExcerptIds = new Set<string>();
  private markdownEntries: ResearchMarkdownEntry[] | undefined;
  private markdownLoading = false;
  private markdownSearchGeneration = 0;

  constructor(leaf: WorkspaceLeaf, private readonly plugin: LocalBookReaderPlugin) {
    super(leaf);
  }

  getViewType(): string {
    return BOOK_RESEARCH_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "摘录与笔记检索";
  }

  getIcon(): string {
    return "quote";
  }

  async onOpen(): Promise<void> {
    this.render();
  }

  private render(): void {
    this.contentEl.empty();
    this.contentEl.addClass("ebook-research__view");
    this.contentEl.createEl("h2", { text: "摘录与笔记检索" });
    this.contentEl.createEl("p", {
      cls: "ebook-research__hint",
      text: "搜索已保存摘录、阅读笔记中的想法和主题研究笔记；不读取或建立电子书正文索引。"
    });

    const filters = this.contentEl.createDiv({ cls: "ebook-research__filters" });
    const query = filters.createEl("input", {
      type: "search",
      placeholder: "摘录、想法或研究笔记关键词（按 Enter 搜索）",
      value: this.query
    });
    const book = filters.createEl("input", { type: "search", placeholder: "书名筛选", value: this.bookQuery });
    const tag = filters.createEl("input", { type: "search", placeholder: "标签筛选（不带 #）", value: this.tagQuery });
    const from = filters.createEl("input", { type: "date", value: this.from, attr: { "aria-label": "开始日期" } });
    const to = filters.createEl("input", { type: "date", value: this.to, attr: { "aria-label": "结束日期" } });
      const search = filters.createEl("button", {
        text: "搜索",
        attr: { title: "按关键词、书名、标签和日期检索摘录、想法与主题研究笔记" },
      });
    search.type = "button";
    const apply = () => void this.searchAllSources(
      query.value,
      book.value,
      tag.value,
      from.value,
      to.value,
    );
    [query, book, tag].forEach((input) => input.onkeydown = (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        apply();
      }
    });
    from.onchange = apply;
    to.onchange = apply;
    search.onclick = apply;

    const compose = this.contentEl.createDiv({ cls: "ebook-research__compose" });
    const titleLabel = compose.createEl("label", { text: "主题名称" });
    const title = compose.createEl("input", {
      type: "text",
      placeholder: "例如：现代都市成长叙事",
      attr: { "aria-label": "主题研究笔记名称" }
    });
    titleLabel.htmlFor = title.id = "ebook-research-title";
      const create = compose.createEl("button", {
        text: "创建/追加主题研究笔记",
        attr: { title: "将勾选的摘录写入指定主题的 Markdown 笔记；不会修改原始电子书" },
      });
    create.type = "button";
    const selectionState = compose.createSpan({ cls: "ebook-research__summary" });
    const refreshSelectionState = () => {
      selectionState.setText(`已选择 ${this.selectedExcerptIds.size} 条摘录`);
      create.disabled = this.selectedExcerptIds.size === 0 || !title.value.trim();
    };
    title.oninput = refreshSelectionState;
    create.onclick = () => {
      const name = title.value.trim();
      if (!name) {
        new Notice("请先填写主题研究笔记名称。 ");
        return;
      }
      create.disabled = true;
      void this.plugin.createOrAppendResearchNote(name, [...this.selectedExcerptIds]).then(() => {
        this.selectedExcerptIds.clear();
        new Notice("已创建或追加主题研究笔记；原始电子书没有被修改。 ");
        this.render();
      }).catch((error) => {
        console.error("Local Book Reader could not create a research note", error);
        create.disabled = false;
        new Notice("无法写入主题研究笔记；原始电子书和已有笔记均未被修改。 ");
      });
    };
    refreshSelectionState();

    this.renderMarkdownEntries();

    const all = this.plugin.getStoredExcerpts();
    const entries = all.filter((entry) => this.matches(entry));
    this.contentEl.createDiv({
      cls: "ebook-research__summary",
      text: `显示 ${entries.length} / ${all.length} 条已保存摘录`
    });
    const list = this.contentEl.createDiv({ cls: "ebook-research__list" });
    if (entries.length === 0) {
      list.createDiv({ cls: "ebook-library__empty", text: all.length ? "没有符合当前筛选条件的摘录。" : "尚未保存摘录。" });
      return;
    }
    for (const entry of entries.slice(0, 500)) this.renderEntry(list, entry, refreshSelectionState);
    if (entries.length > 500) {
      list.createDiv({ cls: "ebook-research__summary", text: "为保持界面流畅，当前只显示前 500 条结果；请继续缩小筛选范围。" });
    }
  }

  private renderMarkdownEntries(): void {
    if (!this.markdownLoading && !this.markdownEntries) return;
    const section = this.contentEl.createDiv({ cls: "ebook-research__markdown-results" });
    section.createEl("h3", { text: "想法与主题研究笔记" });
    if (this.markdownLoading) {
      section.createDiv({ cls: "ebook-research__summary", text: "正在检索阅读笔记和主题研究笔记…" });
      return;
    }
    const all = this.markdownEntries ?? [];
    const entries = all.filter((entry) => this.matchesMarkdown(entry));
    section.createDiv({ cls: "ebook-research__summary", text: `显示 ${entries.length} / ${all.length} 条 Markdown 内容` });
    if (entries.length === 0) {
      section.createDiv({ cls: "ebook-library__empty", text: "没有符合当前筛选条件的想法或主题研究笔记。" });
      return;
    }
    for (const entry of entries.slice(0, 300)) this.renderMarkdownEntry(section, entry);
  }

  private async searchAllSources(query: string, bookQuery: string, tagQuery: string, from: string, to: string): Promise<void> {
    this.query = query;
    this.bookQuery = bookQuery;
    this.tagQuery = tagQuery.replace(/^#+/, "");
    this.from = from;
    this.to = to;
    const generation = ++this.markdownSearchGeneration;
    this.markdownLoading = true;
    this.markdownEntries = undefined;
    this.render();
    try {
      const entries = await this.plugin.getResearchMarkdownEntries();
      if (generation !== this.markdownSearchGeneration) return;
      this.markdownEntries = entries;
    } catch (error) {
      console.error("Local Book Reader could not search Markdown research entries", error);
      if (generation !== this.markdownSearchGeneration) return;
      this.markdownEntries = [];
      new Notice("无法读取想法或主题研究笔记；已有摘录检索不受影响。 ");
    } finally {
      if (generation !== this.markdownSearchGeneration) return;
      this.markdownLoading = false;
      this.render();
    }
  }

  private matches(entry: StoredExcerpt): boolean {
    const text = `${entry.book.name}\n${entry.book.path}\n${entry.excerpt.text}\n${entry.excerpt.note}\n${tagsOf(entry).join(" ")}`
      .toLocaleLowerCase("zh-Hans-CN");
    const query = this.query.trim().toLocaleLowerCase("zh-Hans-CN");
    const book = this.bookQuery.trim().toLocaleLowerCase("zh-Hans-CN");
    const tag = this.tagQuery.trim().toLocaleLowerCase("zh-Hans-CN");
    const date = dayOf(entry.excerpt.createdAt);
    if (query && !text.includes(query)) return false;
    if (book && !`${entry.book.name}\n${entry.book.path}`.toLocaleLowerCase("zh-Hans-CN").includes(book)) return false;
    if (tag && !tagsOf(entry).some((item) => item.toLocaleLowerCase("zh-Hans-CN").includes(tag))) return false;
    if (this.from && date < this.from) return false;
    if (this.to && date > this.to) return false;
    return true;
  }

  private matchesMarkdown(entry: ResearchMarkdownEntry): boolean {
    const query = this.query.trim().toLocaleLowerCase("zh-Hans-CN");
    const book = this.bookQuery.trim().toLocaleLowerCase("zh-Hans-CN");
    const tag = this.tagQuery.trim().toLocaleLowerCase("zh-Hans-CN");
    const text = `${entry.title}\n${entry.path}\n${entry.text}\n${entry.tags.join(" ")}`.toLocaleLowerCase("zh-Hans-CN");
    const date = entry.createdAt?.slice(0, 10);
    if (query && !text.includes(query)) return false;
    if (book && !`${entry.title}\n${entry.path}`.toLocaleLowerCase("zh-Hans-CN").includes(book)) return false;
    if (tag && !entry.tags.some((item) => item.toLocaleLowerCase("zh-Hans-CN").includes(tag))) return false;
    if (this.from && (!date || date < this.from)) return false;
    if (this.to && (!date || date > this.to)) return false;
    return true;
  }

  private renderEntry(container: HTMLElement, entry: StoredExcerpt, refreshSelectionState: () => void): void {
    const row = container.createDiv({ cls: "ebook-research__entry" });
    const select = row.createEl("input", { type: "checkbox", attr: { "aria-label": `选择《${entry.book.name}》中的摘录` } });
    select.checked = this.selectedExcerptIds.has(entry.excerpt.excerptId);
    select.onchange = () => {
      if (select.checked) this.selectedExcerptIds.add(entry.excerpt.excerptId);
      else this.selectedExcerptIds.delete(entry.excerpt.excerptId);
      refreshSelectionState();
    };
    row.createDiv({ cls: "ebook-research__book", text: entry.book.name });
    row.createDiv({ cls: "ebook-research__meta", text: `${entry.book.extension.toUpperCase()} · ${entry.excerpt.createdAt}` });
    if (tagsOf(entry).length) row.createDiv({ cls: "ebook-research__meta", text: tagsOf(entry).map((tag) => `#${tag}`).join(" ") });
    row.createEl("blockquote", { text: entry.excerpt.text });
    if (entry.excerpt.note) row.createDiv({ cls: "ebook-research__note", text: `随想：${entry.excerpt.note}` });
    const open = row.createEl("button", {
      text: "返回原文",
      attr: { title: "在阅读器中打开这条摘录对应的原书位置" },
    });
    open.type = "button";
    open.onclick = () => void this.plugin.openExcerptById(entry.excerpt.excerptId).then((opened) => {
      if (!opened) new Notice("无法返回原文；原书路径或定位数据可能已变化。原始电子书没有被修改。");
    });
  }

  private renderMarkdownEntry(container: HTMLElement, entry: ResearchMarkdownEntry): void {
    const row = container.createDiv({ cls: "ebook-research__entry" });
    row.createDiv({ cls: "ebook-research__book", text: entry.title });
    row.createDiv({ cls: "ebook-research__meta", text: `${entry.kind === "thought" ? "想法" : "主题研究笔记"}${entry.createdAt ? ` · ${entry.createdAt}` : ""}` });
    if (entry.tags.length) row.createDiv({ cls: "ebook-research__meta", text: entry.tags.map((tag) => `#${tag}`).join(" ") });
    row.createDiv({ cls: "ebook-research__markdown-preview", text: this.markdownPreview(entry.text) });
    const open = row.createEl("button", {
      text: "打开笔记",
      attr: { title: "打开这条内容所在的 Markdown 笔记" },
    });
    open.type = "button";
    open.onclick = () => void this.plugin.openMarkdownNote(entry.path).then((opened) => {
      if (!opened) new Notice("该 Markdown 笔记当前找不到。 ");
    });
  }

  private markdownPreview(source: string): string {
    return source
      .replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*/u, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/gu, "$1")
      .replace(/^#{1,6}\s*/gmu, "")
      .replace(/^>\s?/gmu, "")
      .replace(/^\^[\w-]+\s*$/gmu, "")
      .replace(/\s+/gu, " ")
      .trim()
      .slice(0, 500);
  }
}
