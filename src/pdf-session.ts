import { App, TFile } from "obsidian";

type PdfViewport = {
  width: number;
  height: number;
};

type PdfPage = {
  getViewport(options: { scale: number }): PdfViewport;
  render(options: { canvasContext: CanvasRenderingContext2D; viewport: PdfViewport }): { promise: Promise<unknown> };
  getTextContent(): Promise<unknown>;
};

type PdfDocument = {
  numPages: number;
  getPage(pageNumber: number): Promise<PdfPage>;
  destroy?: () => Promise<void> | void;
};

type PdfLoadingTask = {
  promise: Promise<PdfDocument>;
  destroy?: () => Promise<void> | void;
};

type PdfJsModule = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument(options: { data: Uint8Array }): unknown;
  TextLayer: new (options: { textContentSource: unknown; container: HTMLElement; viewport: unknown }) => { render(): Promise<void> };
};

type PdfTextContent = { items?: Array<{ str?: unknown }> };

export interface PdfTextHighlight {
  start: number;
  end: number;
  kind: "excerpt" | "search";
}

export interface PdfRenderedPage {
  textLayer: HTMLElement;
  text: string;
}

async function createWorkerUrl(app: App, pluginId: string): Promise<string> {
  const configDir = app.vault.configDir || ".obsidian";
  const resourceUrl = app.vault.adapter.getResourcePath(`${configDir}/plugins/${pluginId}/pdf.worker.min.mjs`);
  const response = await fetch(resourceUrl);
  if (!response.ok) throw new Error(`无法读取本地 PDF Worker（${response.status}）。`);
  // Obsidian's app:// resources are deliberately isolated from the app shell,
  // so Chromium cannot construct a module Worker from that URL directly. A
  // same-renderer blob keeps the bundled Worker fully local and offline.
  return URL.createObjectURL(new Blob([await response.text()], { type: "text/javascript" }));
}

/** A deliberately small PDF.js adapter. It only reads the selected Vault file. */
export class PdfSession {
  private readonly pageText = new Map<number, string>();

  private constructor(
    private readonly document: PdfDocument,
    private readonly loadingTask: PdfLoadingTask,
    private readonly workerBlobUrl: string,
    private readonly pdfjs: PdfJsModule
  ) {}

  static async open(app: App, file: TFile, pluginId: string): Promise<PdfSession> {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs") as unknown as PdfJsModule;
    const workerBlobUrl = await createWorkerUrl(app, pluginId);
    pdfjs.GlobalWorkerOptions.workerSrc = workerBlobUrl;
    const bytes = new Uint8Array(await app.vault.readBinary(file));
    const loadingTask = pdfjs.getDocument({ data: bytes }) as unknown as PdfLoadingTask;
    try {
      return new PdfSession(await loadingTask.promise, loadingTask, workerBlobUrl, pdfjs);
    } catch (error) {
      await loadingTask.destroy?.();
      URL.revokeObjectURL(workerBlobUrl);
      throw error;
    }
  }

  get pageCount(): number {
    return this.document.numPages;
  }

  clampPage(page: number): number {
    return Math.max(1, Math.min(this.pageCount, Math.floor(page) || 1));
  }

  async render(
    container: HTMLElement,
    pageNumber: number,
    scale: number,
    fitWidth: boolean,
    highlights: PdfTextHighlight[] = []
  ): Promise<PdfRenderedPage> {
    const page = await this.document.getPage(this.clampPage(pageNumber));
    const baseViewport = page.getViewport({ scale: 1 });
    const availableWidth = Math.max(180, container.clientWidth - 32);
    const effectiveScale = fitWidth ? availableWidth / baseViewport.width : scale;
    const viewport = page.getViewport({ scale: effectiveScale });
    const pixelRatio = window.devicePixelRatio || 1;

    container.empty();
    const pageElement = container.createDiv({ cls: "ebook-reader__pdf-page" });
    pageElement.style.width = `${Math.floor(viewport.width)}px`;
    pageElement.style.height = `${Math.floor(viewport.height)}px`;
    const canvas = pageElement.createEl("canvas", { cls: "ebook-reader__pdf-canvas" });
    canvas.width = Math.max(1, Math.floor(viewport.width * pixelRatio));
    canvas.height = Math.max(1, Math.floor(viewport.height * pixelRatio));
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("无法创建 PDF 页面绘制区域。");
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const textLayer = pageElement.createDiv({ cls: "ebook-reader__pdf-text-layer textLayer" });
    const textContent = await page.getTextContent();
    const text = this.textFromContent(textContent);
    this.pageText.set(this.clampPage(pageNumber), text);
    await Promise.all([
      page.render({ canvasContext: context, viewport }).promise,
      new this.pdfjs.TextLayer({ textContentSource: textContent, container: textLayer, viewport }).render()
    ]);
    for (const highlight of highlights) this.applyHighlight(textLayer, highlight);
    return { textLayer, text };
  }

  async search(query: string, add: (result: { page: number; start: number; end: number; excerpt: string }) => void): Promise<number> {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return 0;
    let count = 0;
    for (let page = 1; page <= this.pageCount; page += 1) {
      const text = await this.getPageText(page);
      const lower = text.toLocaleLowerCase();
      let start = 0;
      while (start < lower.length) {
        const found = lower.indexOf(needle, start);
        if (found < 0) break;
        const end = found + needle.length;
        const before = Math.max(0, found - 42);
        const after = Math.min(text.length, end + 72);
        add({ page, start: found, end, excerpt: `${before > 0 ? "…" : ""}${text.slice(before, after)}${after < text.length ? "…" : ""}` });
        count += 1;
        if (count >= 300) return count;
        start = Math.max(end, found + 1);
      }
    }
    return count;
  }

  private async getPageText(pageNumber: number): Promise<string> {
    const normalized = this.clampPage(pageNumber);
    const cached = this.pageText.get(normalized);
    if (cached !== undefined) return cached;
    const page = await this.document.getPage(normalized);
    const text = this.textFromContent(await page.getTextContent());
    this.pageText.set(normalized, text);
    return text;
  }

  private textFromContent(content: unknown): string {
    const items = (content as PdfTextContent).items;
    if (!Array.isArray(items)) return "";
    return items.map((item) => typeof item.str === "string" ? item.str : "").join("");
  }

  highlightTextLayer(layer: HTMLElement, highlight: PdfTextHighlight): void {
    this.applyHighlight(layer, highlight);
    if (highlight.kind === "search") this.drawSearchOverlays(layer, highlight);
  }

  private applyHighlight(layer: HTMLElement, highlight: PdfTextHighlight): void {
    const start = Math.max(0, Math.floor(highlight.start));
    const end = Math.max(start, Math.floor(highlight.end));
    if (end <= start) return;
    const nodes: Text[] = [];
    const walker = document.createTreeWalker(layer, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) nodes.push(node as Text);
    let offset = 0;
    for (const textNode of nodes) {
      const nodeStart = offset;
      const nodeEnd = nodeStart + textNode.data.length;
      offset = nodeEnd;
      const localStart = Math.max(start, nodeStart) - nodeStart;
      const localEnd = Math.min(end, nodeEnd) - nodeStart;
      if (localEnd <= localStart) continue;
      const source = textNode.data;
      const fragment = document.createDocumentFragment();
      if (localStart > 0) fragment.append(source.slice(0, localStart));
      const mark = document.createElement("mark");
      mark.addClass("ebook-reader__pdf-text-highlight", `is-${highlight.kind}`);
      mark.textContent = source.slice(localStart, localEnd);
      fragment.append(mark);
      if (localEnd < source.length) fragment.append(source.slice(localEnd));
      textNode.replaceWith(fragment);
    }
  }

  private drawSearchOverlays(layer: HTMLElement, highlight: PdfTextHighlight): void {
    const parent = layer.parentElement;
    if (!parent) return;
    const locate = (target: number): { node: Text; offset: number } | undefined => {
      let position = 0;
      const walker = document.createTreeWalker(layer, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const length = node.textContent?.length ?? 0;
        if (target <= position + length) return { node: node as Text, offset: Math.max(0, target - position) };
        position += length;
      }
      return undefined;
    };
    const start = locate(Math.max(0, Math.floor(highlight.start)));
    const end = locate(Math.max(0, Math.floor(highlight.end)));
    if (!start || !end) return;
    const range = document.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);
    const parentRect = parent.getBoundingClientRect();
    for (const rect of Array.from(range.getClientRects())) {
      if (rect.width <= 0 || rect.height <= 0) continue;
      const overlay = parent.createDiv({ cls: "ebook-reader__pdf-search-overlay" });
      overlay.style.left = `${rect.left - parentRect.left}px`;
      overlay.style.top = `${rect.top - parentRect.top}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
    }
  }

  async destroy(): Promise<void> {
    await this.document.destroy?.();
    await this.loadingTask.destroy?.();
    URL.revokeObjectURL(this.workerBlobUrl);
    this.pageText.clear();
  }
}
