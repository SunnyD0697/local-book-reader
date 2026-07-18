import { TFile, Vault, normalizePath } from "obsidian";
import { BookmarkLocator, BookStore, Excerpt, formatBeijingTime, StoredExcerpt } from "./book-store";

export interface ResearchMarkdownEntry {
  kind: "thought" | "research-note";
  title: string;
  path: string;
  text: string;
  tags: string[];
  createdAt?: string;
}

export class NoteService {
  constructor(private readonly vault: Vault, private readonly books: BookStore) {}

  async openOrCreateNote(file: TFile): Promise<TFile> {
    const book = this.books.getBookByPath(file.path);
    if (!book) throw new Error("This book does not have a reading identity yet.");
    return this.ensureNote(book.bookId, book.name, book.path, book.extension, this.books.getReadingStatus(file.path));
  }

  async appendThought(file: TFile, locator: BookmarkLocator, thought: string, tags: string[] = []): Promise<TFile> {
    const book = this.books.getBookByPath(file.path);
    if (!book) throw new Error("此书尚未建立阅读身份，无法创建读书笔记。");
    const note = await this.openOrCreateNote(file);
    const createdAt = formatBeijingTime();
    const annotationId = `anno-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
    const source = this.describeLocator(locator);
    const block = [
      "",
      `> [!note] 想法`,
      `> 来源：${source} · ${book.extension.toUpperCase()}`,
      `> 创建：${createdAt}`,
      ...this.markdownTags(tags),
      ">",
      ...thought.trim().split(/\r?\n/).map((line) => `> ${line}`),
      "",
      `^${annotationId}`,
      ""
    ].join("\n");
    await this.vault.process(note, (content) => `${content.replace(/\s*$/, "")}\n${block}`);
    return note;
  }

  async appendExcerpt(file: TFile, excerpt: Excerpt): Promise<TFile> {
    const book = this.books.getBookByPath(file.path);
    if (!book) throw new Error("This book does not have a reading identity yet.");
    const note = await this.openOrCreateNote(file);
    const source = this.describeExcerptLocator(excerpt);
    const quoteLines = excerpt.text.split(/\r?\n/).map((line) => `> ${line}`);
    const thoughtLines = excerpt.note
      ? [">", `> **随想**：${excerpt.note}`]
      : [];
    const block = [
      "",
      "> [!quote] 摘录",
      `> 来源：${source} · ${book.extension.toUpperCase()}`,
      `> 创建：${excerpt.createdAt}`,
      `> 定位：[返回原文](obsidian://local-book-reader?annotation=${encodeURIComponent(excerpt.excerptId)})`,
      ...this.markdownTags(excerpt.tags ?? []),
      ">",
      ...quoteLines,
      ...thoughtLines,
      "",
      `^${excerpt.excerptId}`,
      ""
    ].join("\n");
    await this.vault.process(note, (content) => `${content.replace(/\s*$/, "")}\n${block}`);
    return note;
  }

  async appendResearchEntries(title: string, entries: StoredExcerpt[]): Promise<TFile> {
    const normalizedTitle = title.trim();
    if (!normalizedTitle || normalizedTitle.length > 120) throw new Error("主题名称不能为空且不能超过 120 个字符。");
    if (entries.length === 0) throw new Error("请至少选择一条摘录。");
    const directory = this.books.getResearchDirectory();
    await this.ensureFolder(directory);
    const path = normalizePath(`${directory}/${this.safeTitle(normalizedTitle)}.md`);
    const existing = this.vault.getAbstractFileByPath(path);
    const note = existing instanceof TFile
      ? existing
      : await this.vault.create(path, [
        "---",
        "type: 主题研究",
        `created: ${JSON.stringify(formatBeijingTime())}`,
        "---",
        "",
        `# ${normalizedTitle}`,
        ""
      ].join("\n"));
    const blocks = entries.map((entry) => this.renderResearchEntry(entry));
    await this.vault.process(note, (content) => `${content.replace(/\s*$/, "")}\n${blocks.join("\n")}`);
    return note;
  }

  async listResearchMarkdownEntries(): Promise<ResearchMarkdownEntry[]> {
    const notesDirectory = this.books.getNotesDirectory();
    const researchDirectory = this.books.getResearchDirectory();
    const entries: ResearchMarkdownEntry[] = [];
    const vaultWithMarkdownFiles = this.vault as Vault & { getMarkdownFiles?: () => TFile[] };
    const markdownFiles = vaultWithMarkdownFiles.getMarkdownFiles?.()
      ?? this.vault.getFiles().filter((file) => file.extension.toLowerCase() === "md");
    const files = markdownFiles.filter((file) =>
      this.isInDirectory(file.path, notesDirectory) || this.isInDirectory(file.path, researchDirectory));
    for (const file of files) {
      const content = await this.vault.read(file);
      if (this.isInDirectory(file.path, notesDirectory)) {
        entries.push(...this.extractThoughts(file, content));
      }
      if (this.isInDirectory(file.path, researchDirectory)) {
        const text = content.trim();
        if (text) entries.push({
          kind: "research-note",
          title: this.titleOf(file, content),
          path: file.path,
          text,
          tags: this.extractTags(content),
          createdAt: this.extractCreatedAt(content)
        });
      }
    }
    return entries.sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? "", "zh-Hans-CN"));
  }

  private async ensureNote(bookId: string, title: string, path: string, extension: string, status: string): Promise<TFile> {
    const notesDirectory = this.books.getNotesDirectory();
    await this.ensureFolder(notesDirectory);
    const notePath = normalizePath(`${notesDirectory}/${this.safeTitle(title)}-${bookId.slice(0, 8)}.md`);
    const existing = this.vault.getAbstractFileByPath(notePath);
    if (existing instanceof TFile) return existing;
    return this.vault.create(notePath, this.renderNoteTemplate({
      title,
      bookId,
      path,
      extension,
      status,
      createdAt: formatBeijingTime()
    }));
  }

  private async ensureFolder(path: string): Promise<void> {
    if (!this.vault.getAbstractFileByPath(path)) await this.vault.createFolder(path);
  }

  private safeTitle(title: string): string {
    return (title.replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim() || "未命名书籍").slice(0, 80);
  }

  private describeLocator(locator: BookmarkLocator): string {
    if (locator.type === "pdf") return `PDF 第 ${locator.page} 页`;
    const percent = `${Math.round((locator.type === "reflow" ? locator.fraction : locator.progress) * 100)}%`;
    return `阅读进度 ${percent}`;
  }

  private describeExcerptLocator(excerpt: Excerpt): string {
    if (excerpt.locator.type === "pdf") return `PDF 第 ${excerpt.locator.page} 页`;
    if (excerpt.locator.type === "reflow") {
      const chapter = excerpt.locator.chapter?.trim();
      return `${chapter ? `${chapter} · ` : ""}阅读进度 ${Math.round(excerpt.locator.fraction * 100)}%`;
    }
    return `阅读进度 ${Math.round(excerpt.locator.progress * 100)}%`;
  }

  private renderResearchEntry(entry: StoredExcerpt): string {
    const { book, excerpt } = entry;
    const noteLines = excerpt.note ? [">", `> **随想**：${excerpt.note}`] : [];
    return [
      "",
      `## ${book.name}`,
      `> 来源：${this.describeExcerptLocator(excerpt)} · ${book.extension.toUpperCase()}`,
      `> 创建：${excerpt.createdAt}`,
      `> 定位：[返回原文](obsidian://local-book-reader?annotation=${encodeURIComponent(excerpt.excerptId)})`,
      ...this.markdownTags(excerpt.tags ?? []),
      ">",
      ...excerpt.text.split(/\r?\n/).map((line) => `> ${line}`),
      ...noteLines,
      ""
    ].join("\n");
  }

  private extractThoughts(file: TFile, content: string): ResearchMarkdownEntry[] {
    const entries: ResearchMarkdownEntry[] = [];
    const pattern = /^> \[!note\] 想法\r?\n([\s\S]*?)^\^anno-[^\r\n]+\r?$/gm;
    for (const match of content.matchAll(pattern)) {
      const block = match[1];
      const text = block
        .split(/\r?\n/)
        .filter((line) => !/^> (?:来源|创建|标签)：/.test(line))
        .map((line) => line.replace(/^> ?/, ""))
        .join("\n")
        .trim();
      if (!text) continue;
      entries.push({
        kind: "thought",
        title: this.titleOf(file, content),
        path: file.path,
        text,
        tags: this.extractTags(block),
        createdAt: this.extractCreatedAt(block)
      });
    }
    return entries;
  }

  private titleOf(file: TFile, content: string): string {
    const match = content.match(/^title:\s*(.+)$/m);
    if (!match) return file.basename;
    const raw = match[1].trim();
    try {
      return typeof JSON.parse(raw) === "string" ? JSON.parse(raw) : file.basename;
    } catch {
      return raw.replace(/^['"]|['"]$/g, "") || file.basename;
    }
  }

  private extractCreatedAt(content: string): string | undefined {
    return content.match(/^> 创建：([^\r\n]+)$/m)?.[1]?.trim()
      ?? content.match(/^created:\s*["']?([^"'\r\n]+)["']?\s*$/m)?.[1]?.trim();
  }

  private extractTags(content: string): string[] {
    return [...new Set([...content.matchAll(/#([\p{L}\p{N}_/-]+)/gu)].map((match) => match[1]))].slice(0, 30);
  }

  private isInDirectory(path: string, directory: string): boolean {
    const prefix = `${normalizePath(directory).replace(/\/$/, "")}/`;
    return path.startsWith(prefix);
  }

  private renderNoteTemplate(context: {
    title: string;
    bookId: string;
    path: string;
    extension: string;
    status: string;
    createdAt: string;
  }): string {
    const values: Record<string, string> = {
      title: context.title,
      titleJson: JSON.stringify(context.title),
      bookId: context.bookId,
      bookIdJson: JSON.stringify(context.bookId),
      bookPath: context.path,
      bookPathJson: JSON.stringify(context.path),
      format: context.extension.toUpperCase(),
      formatJson: JSON.stringify(context.extension.toUpperCase()),
      readingStatus: context.status,
      readingStatusJson: JSON.stringify(context.status),
      created: context.createdAt,
      createdJson: JSON.stringify(context.createdAt)
    };
    return this.books.getNoteTemplate().replace(/{{([A-Za-z]+)}}/g, (placeholder, key: string) => values[key] ?? placeholder);
  }

  private markdownTags(tags: string[]): string[] {
    const safe = [...new Set(tags.map((tag) => tag.replace(/^#+/, "").replace(/[^\p{L}\p{N}_/-]/gu, "").slice(0, 60)).filter(Boolean))];
    return safe.length ? [`> 标签：${safe.map((tag) => `#${tag}`).join(" ")}`] : [];
  }
}
