import { DataAdapter, TFile, Vault, normalizePath } from "obsidian";
import type { UiLanguage } from "./i18n";

export const SUPPORTED_BOOK_EXTENSIONS = new Set(["azw3", "mobi", "azw", "epub", "pdf", "txt"]);

const SCHEMA_VERSION = 1;
const DATA_DIRECTORY = "data";
const INDEX_FILE = "library-index.json";
const STATE_FILE = "reading-state.json";
const SETTINGS_FILE = "settings.json";
const BACKUP_DIRECTORY = "backups";
const CACHE_DIRECTORY = "cache";
const BACKUP_METADATA_FILE = "backup-metadata.json";
const MAX_AUTOMATIC_BACKUPS = 3;
const MAX_BACKUP_BYTES = 50 * 1024 * 1024;
const MAX_TOTAL_BACKUP_BYTES = 100 * 1024 * 1024;
const MAX_CACHE_BYTES = 100 * 1024 * 1024;
const MAX_SINGLE_COVER_BYTES = 5 * 1024 * 1024;

export type ReadingStatus = "unread" | "reading" | "finished";
export type ReaderTheme = "system" | "light" | "dark" | "sepia";
export type ReaderFlow = "paginated" | "scrolled";
export type ReaderOpenMode = "tab" | "window";

export interface ReaderAppearanceSettings {
  fontSize: number;
  lineHeight: number;
  margin: number;
  theme: ReaderTheme;
  flow: ReaderFlow;
}

export type BookmarkLocator =
  | { type: "reflow"; fraction: number }
  | { type: "text"; progress: number }
  | { type: "pdf"; page: number };

export interface Bookmark {
  bookmarkId: string;
  label: string;
  createdAt: string;
  locator: BookmarkLocator;
}

export type ExcerptLocator =
  | { type: "reflow"; fraction: number; cfi: string; chapter?: string }
  | { type: "text"; progress: number; start: number; end: number }
  | { type: "pdf"; page: number; start: number; end: number };

export interface Excerpt {
  excerptId: string;
  text: string;
  note: string;
  createdAt: string;
  locator: ExcerptLocator;
  tags?: string[];
}

export interface StoredExcerpt {
  book: BookRecord;
  excerpt: Excerpt;
}

export interface BookRecord {
  bookId: string;
  path: string;
  name: string;
  extension: string;
  size: number;
  modifiedAt: number;
  lastSeenAt: number;
  isMissing: boolean;
  metadata?: BookMetadata;
}

export interface BookMetadata {
  sourceModifiedAt: number;
  title?: string;
  authors?: string[];
  publisher?: string;
  published?: string;
  languages?: string[];
  identifier?: string;
  coverCachePath?: string;
  coverMimeType?: string;
}

export type BookMetadataInput = Omit<BookMetadata, "sourceModifiedAt">;

interface ScanState {
  status: "idle" | "paused" | "running";
  startedAt: number;
  pendingPaths: string[];
  cursor: number;
  discovered: number;
  relinked: number;
  ambiguous: number;
}

interface LibraryIndex {
  schemaVersion: number;
  books: Record<string, BookRecord>;
  scan?: ScanState;
}

export interface BookReadingState {
  reflowProgress?: number;
  textProgress?: number;
  pdfPage?: number;
  readerAppearance?: ReaderAppearanceSettings;
  status: ReadingStatus;
  isFavorite: boolean;
  lastOpenedAt?: number;
  bookmarks: Bookmark[];
  excerpts: Excerpt[];
}

interface LegacyPathProgress {
  reflowProgress: Record<string, number>;
  textProgress: Record<string, number>;
  pdfPages: Record<string, number>;
}

interface ReadingState {
  schemaVersion: number;
  books: Record<string, BookReadingState>;
  legacyPathProgress: LegacyPathProgress;
}

interface PluginSettings {
  schemaVersion: number;
  libraryOwnerName?: string;
  notesDirectory: string;
  noteTemplate: string;
  researchDirectory: string;
  readerAppearance: ReaderAppearanceSettings;
  readerAppearanceScopeVersion?: number;
  readerOpenMode: ReaderOpenMode;
  hasCompletedOnboarding: boolean;
  uiLanguage?: UiLanguage;
}

interface BackupMetadata {
  schemaVersion: number;
  lastPluginVersion?: string;
}

export interface CoreDataBackup {
  schemaVersion: number;
  createdAt: string;
  pluginVersion: string;
  libraryIndex: LibraryIndex;
  readingState: ReadingState;
  settings: PluginSettings;
}

export interface CoreDataBackupSummary {
  createdAt: string;
  pluginVersion: string;
  bookCount: number;
  readingRecordCount: number;
  bookmarkCount: number;
  excerptCount: number;
}

export interface DataStorageUsage {
  coreBytes: number;
  cacheBytes: number;
  cacheFileCount: number;
  cacheLimitBytes: number;
}

export interface LegacyReaderData {
  reflowProgress?: Record<string, number>;
  textProgress?: Record<string, number>;
  pdfPages?: Record<string, number>;
}

export interface ScanProgress {
  checked: number;
  total: number;
  discovered: number;
  relinked: number;
  ambiguous: number;
  elapsedMs: number;
  status: "idle" | "paused" | "running";
}

export interface LibraryBook {
  book: BookRecord;
  reading: BookReadingState;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function numberRecord(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};
  const result: Record<string, number> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === "number" && Number.isFinite(item)) result[key] = item;
  }
  return result;
}

function snapshot<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function defaultIndex(): LibraryIndex {
  return { schemaVersion: SCHEMA_VERSION, books: {}, scan: defaultScanState() };
}

function defaultScanState(): ScanState {
  return { status: "idle", startedAt: 0, pendingPaths: [], cursor: 0, discovered: 0, relinked: 0, ambiguous: 0 };
}

function defaultState(): ReadingState {
  return {
    schemaVersion: SCHEMA_VERSION,
    books: {},
    legacyPathProgress: { reflowProgress: {}, textProgress: {}, pdfPages: {} }
  };
}

function defaultSettings(language: UiLanguage = "zh-CN"): PluginSettings {
  return {
    schemaVersion: SCHEMA_VERSION,
    libraryOwnerName: "",
    notesDirectory: language === "en" ? "zz_Reading & Research/Reading Notes" : "zz_阅读与研究/阅读笔记",
    noteTemplate: defaultNoteTemplate(language),
    researchDirectory: language === "en" ? "zz_Reading & Research/Research Notes" : "zz_阅读与研究/主题研究",
    readerAppearance: defaultReaderAppearance(),
    readerAppearanceScopeVersion: 1,
    readerOpenMode: "tab",
    hasCompletedOnboarding: false,
    uiLanguage: language
  };
}

export function defaultNoteTemplate(language: UiLanguage = "zh-CN"): string {
  return [
    "---",
    "title: {{titleJson}}",
    "bookId: {{bookIdJson}}",
    "bookPath: {{bookPathJson}}",
    "format: {{formatJson}}",
    "readingStatus: {{readingStatusJson}}",
    "created: {{createdJson}}",
    "---",
    "",
    language === "en" ? "# {{title}}" : "# {{title}}",
    ""
  ].join("\n");
}

export function defaultReaderAppearance(): ReaderAppearanceSettings {
  return { fontSize: 100, lineHeight: 1.6, margin: 32, theme: "system", flow: "paginated" };
}

function defaultBackupMetadata(): BackupMetadata {
  return { schemaVersion: SCHEMA_VERSION };
}

function isBookRecord(value: unknown): value is BookRecord {
  return isRecord(value)
    && typeof value.bookId === "string"
    && typeof value.path === "string"
    && typeof value.name === "string"
    && typeof value.extension === "string"
    && typeof value.size === "number"
    && typeof value.modifiedAt === "number"
    && typeof value.lastSeenAt === "number"
    && typeof value.isMissing === "boolean"
    && (value.metadata === undefined || isBookMetadata(value.metadata));
}

function isBookMetadata(value: unknown): value is BookMetadata {
  return isRecord(value)
    && typeof value.sourceModifiedAt === "number" && Number.isFinite(value.sourceModifiedAt)
    && (value.title === undefined || typeof value.title === "string")
    && (value.authors === undefined || (Array.isArray(value.authors) && value.authors.every((item) => typeof item === "string")))
    && (value.publisher === undefined || typeof value.publisher === "string")
    && (value.published === undefined || typeof value.published === "string")
    && (value.languages === undefined || (Array.isArray(value.languages) && value.languages.every((item) => typeof item === "string")))
    && (value.identifier === undefined || typeof value.identifier === "string")
    && (value.coverCachePath === undefined || typeof value.coverCachePath === "string")
    && (value.coverMimeType === undefined || typeof value.coverMimeType === "string");
}

function isReadingState(value: unknown): value is BookReadingState {
  if (!isRecord(value) || !["unread", "reading", "finished"].includes(String(value.status))
    || typeof value.isFavorite !== "boolean") return false;
  if (![value.reflowProgress, value.textProgress, value.pdfPage, value.lastOpenedAt]
    .every((item) => item === undefined || (typeof item === "number" && Number.isFinite(item)))) return false;
  if (value.bookmarks !== undefined && (!Array.isArray(value.bookmarks) || !value.bookmarks.every(isBookmark))) return false;
  return (value.excerpts === undefined || (Array.isArray(value.excerpts) && value.excerpts.every(isExcerpt)))
    && (value.readerAppearance === undefined || isReaderAppearance(value.readerAppearance));
}

function isBookmark(value: unknown): value is Bookmark {
  if (!isRecord(value) || typeof value.bookmarkId !== "string" || typeof value.label !== "string"
    || typeof value.createdAt !== "string" || !isRecord(value.locator)) return false;
  if (value.locator.type === "reflow") return typeof value.locator.fraction === "number";
  if (value.locator.type === "text") return typeof value.locator.progress === "number";
  return value.locator.type === "pdf" && typeof value.locator.page === "number";
}

function isExcerpt(value: unknown): value is Excerpt {
  if (!isRecord(value) || typeof value.excerptId !== "string" || typeof value.text !== "string"
    || typeof value.note !== "string" || typeof value.createdAt !== "string" || !isRecord(value.locator)) return false;
  if (value.tags !== undefined && (!Array.isArray(value.tags) || !value.tags.every((tag) => typeof tag === "string"))) return false;
  if (value.locator.type === "reflow") {
    return typeof value.locator.fraction === "number" && typeof value.locator.cfi === "string"
      && (value.locator.chapter === undefined || typeof value.locator.chapter === "string");
  }
  if (value.locator.type === "text") {
    return typeof value.locator.progress === "number"
      && typeof value.locator.start === "number"
      && typeof value.locator.end === "number";
  }
  return value.locator.type === "pdf"
    && typeof value.locator.page === "number"
    && typeof value.locator.start === "number"
    && typeof value.locator.end === "number";
}

function isIndex(value: unknown): value is LibraryIndex {
  return isRecord(value) && value.schemaVersion === SCHEMA_VERSION && isRecord(value.books)
    && Object.values(value.books).every(isBookRecord)
    && (value.scan === undefined || isScanState(value.scan));
}

function isScanState(value: unknown): value is ScanState {
  return isRecord(value)
    && ["idle", "paused", "running"].includes(String(value.status))
    && typeof value.startedAt === "number"
    && Array.isArray(value.pendingPaths) && value.pendingPaths.every((path) => typeof path === "string")
    && typeof value.cursor === "number" && Number.isInteger(value.cursor) && value.cursor >= 0
    && typeof value.discovered === "number" && Number.isInteger(value.discovered) && value.discovered >= 0
    && (value.relinked === undefined || (typeof value.relinked === "number" && Number.isInteger(value.relinked) && value.relinked >= 0))
    && (value.ambiguous === undefined || (typeof value.ambiguous === "number" && Number.isInteger(value.ambiguous) && value.ambiguous >= 0));
}

function isState(value: unknown): value is ReadingState {
  return isRecord(value) && value.schemaVersion === SCHEMA_VERSION && isRecord(value.books)
    && Object.values(value.books).every(isReadingState)
    && (value.legacyPathProgress === undefined || isRecord(value.legacyPathProgress));
}

function isSettings(value: unknown): value is PluginSettings {
  return isRecord(value) && value.schemaVersion === SCHEMA_VERSION
    && (value.libraryOwnerName === undefined || typeof value.libraryOwnerName === "string")
    && typeof value.notesDirectory === "string" && typeof value.researchDirectory === "string"
    && (value.noteTemplate === undefined || typeof value.noteTemplate === "string")
    && (value.readerAppearance === undefined || isReaderAppearance(value.readerAppearance))
    && (value.readerAppearanceScopeVersion === undefined
      || (typeof value.readerAppearanceScopeVersion === "number" && Number.isInteger(value.readerAppearanceScopeVersion)))
    && (value.readerOpenMode === undefined || ["tab", "window"].includes(String(value.readerOpenMode)))
    && (value.hasCompletedOnboarding === undefined || typeof value.hasCompletedOnboarding === "boolean");
}

function isReaderAppearance(value: unknown): value is ReaderAppearanceSettings {
  return isRecord(value) && typeof value.fontSize === "number" && Number.isFinite(value.fontSize)
    && typeof value.margin === "number" && Number.isFinite(value.margin)
    && ["system", "light", "dark", "sepia"].includes(String(value.theme))
    && (value.lineHeight === undefined || (typeof value.lineHeight === "number" && Number.isFinite(value.lineHeight)))
    && (value.flow === undefined || ["paginated", "scrolled"].includes(String(value.flow)));
}

function isBackupMetadata(value: unknown): value is BackupMetadata {
  return isRecord(value) && value.schemaVersion === SCHEMA_VERSION
    && (value.lastPluginVersion === undefined || typeof value.lastPluginVersion === "string");
}

export function isCoreDataBackup(value: unknown): value is CoreDataBackup {
  return isRecord(value) && value.schemaVersion === SCHEMA_VERSION
    && typeof value.createdAt === "string" && typeof value.pluginVersion === "string"
    && isIndex(value.libraryIndex) && isState(value.readingState) && isSettings(value.settings);
}

/**
 * Persists only plugin-owned JSON under this Vault's plugin directory. A write
 * is first validated as a temporary file and then replaced; a failed fallback
 * restores the previous file instead of deleting user reading data.
 */
class VaultJsonStore {
  private readonly directory: string;
  private readonly blockedFiles = new Set<string>();

  constructor(vault: Vault, pluginId: string) {
    this.directory = normalizePath(`${vault.configDir}/plugins/${pluginId}/${DATA_DIRECTORY}`);
    this.adapter = vault.adapter;
  }

  private readonly adapter: DataAdapter;

  /**
   * A process may stop between writing a validated temporary JSON file and its
   * final rename. On the next startup, recover only plugin-owned artifacts:
   * promote valid data when its target is absent, otherwise discard the stale
   * temporary copy. An unreadable previous-file rollback is preserved for
   * manual recovery rather than risking the loss of core reading data.
   */
  async recoverInterruptedWrites(): Promise<void> {
    let artifacts: string[];
    try {
      artifacts = (await this.listFilesRecursively("")).filter((path) =>
        path.includes(".writing-") || path.endsWith(".previous"));
    } catch (error) {
      console.error("Local Book Reader could not inspect interrupted writes", error);
      return;
    }

    for (const artifact of artifacts) {
      const isTemporary = artifact.includes(".writing-");
      const marker = isTemporary ? ".writing-" : ".previous";
      const target = artifact.slice(0, artifact.indexOf(marker));
      if (!target) continue;

      try {
        JSON.parse(await this.adapter.read(artifact));
      } catch (error) {
        if (isTemporary) {
          try {
            await this.adapter.remove(artifact);
          } catch (removeError) {
            console.error(`Local Book Reader could not discard incomplete temporary data: ${artifact}`, removeError);
          }
        } else {
          console.error(`Local Book Reader kept an unreadable rollback file for manual recovery: ${artifact}`, error);
        }
        continue;
      }

      try {
        if (await this.adapter.exists(target)) await this.adapter.remove(artifact);
        else await this.adapter.rename(artifact, target);
      } catch (error) {
        console.error(`Local Book Reader could not recover interrupted data write: ${artifact}`, error);
      }
    }
  }

  async load<T>(fileName: string, fallback: T, validator: (value: unknown) => value is T): Promise<T> {
    const path = this.pathFor(fileName);
    if (!await this.adapter.exists(path)) return fallback;

    try {
      const parsed: unknown = JSON.parse(await this.adapter.read(path));
      if (!validator(parsed)) throw new Error("数据结构与当前版本不兼容");
      return parsed;
    } catch (error) {
      this.blockedFiles.add(fileName);
      console.error(`Local Book Reader cannot safely read ${fileName}`, error);
      return fallback;
    }
  }

  async exists(fileName: string): Promise<boolean> {
    return this.adapter.exists(this.pathFor(fileName));
  }

  async write(fileName: string, value: unknown): Promise<void> {
    if (this.blockedFiles.has(fileName)) {
      throw new Error(`${fileName} 无法读取，已停止写入以保护已有数据。请先恢复该文件或从备份恢复。`);
    }

    await this.ensureParentDirectory(fileName);
    const target = this.pathFor(fileName);
    const temporary = `${target}.writing-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const previous = `${target}.previous`;
    const serialized = JSON.stringify(value, null, 2);

    try {
      await this.adapter.write(temporary, serialized);
      JSON.parse(await this.adapter.read(temporary));

      try {
        await this.adapter.rename(temporary, target);
      } catch (firstRenameError) {
        // Some adapters refuse to overwrite an existing target. Keep a local
        // rollback file only long enough to complete the replacement.
        if (!await this.adapter.exists(target)) throw firstRenameError;
        if (await this.adapter.exists(previous)) await this.adapter.remove(previous);
        await this.adapter.rename(target, previous);
        try {
          await this.adapter.rename(temporary, target);
          await this.adapter.remove(previous);
        } catch (replacementError) {
          if (!await this.adapter.exists(target) && await this.adapter.exists(previous)) {
            await this.adapter.rename(previous, target);
          }
          throw replacementError;
        }
      }
    } finally {
      if (await this.adapter.exists(temporary)) await this.adapter.remove(temporary);
    }
  }

  async writeBinary(fileName: string, value: ArrayBuffer): Promise<void> {
    await this.ensureParentDirectory(fileName);
    await this.adapter.writeBinary(this.pathFor(fileName), value);
  }

  resourcePath(fileName: string): string {
    return this.adapter.getResourcePath(this.pathFor(fileName));
  }

  async listFiles(directoryName: string): Promise<string[]> {
    const path = this.pathFor(directoryName);
    if (!await this.adapter.exists(path)) return [];
    return (await this.adapter.list(path)).files;
  }

  async listFilesRecursively(directoryName: string): Promise<string[]> {
    const root = this.pathFor(directoryName);
    if (!await this.adapter.exists(root)) return [];
    const result: string[] = [];
    const visit = async (directory: string): Promise<void> => {
      const listing = await this.adapter.list(directory);
      result.push(...listing.files);
      for (const nested of listing.folders) await visit(nested);
    };
    await visit(root);
    return result;
  }

  async fileSize(path: string): Promise<number> {
    return (await this.adapter.stat(path))?.size ?? 0;
  }

  async readPath(path: string): Promise<string> {
    return this.adapter.read(path);
  }

  async removePath(path: string): Promise<void> {
    if (await this.adapter.exists(path)) await this.adapter.remove(path);
  }

  private pathFor(fileName: string): string {
    return normalizePath(`${this.directory}/${fileName}`);
  }

  private async ensureParentDirectory(fileName: string): Promise<void> {
    if (!await this.adapter.exists(this.directory)) await this.adapter.mkdir(this.directory);
    const separator = fileName.lastIndexOf("/");
    if (separator < 0) return;
    const nested = normalizePath(`${this.directory}/${fileName.slice(0, separator)}`);
    if (!await this.adapter.exists(nested)) await this.adapter.mkdir(nested);
  }
}

export class BookStore {
  private readonly files: VaultJsonStore;
  private readonly bookIdByPath = new Map<string, string>();
  private index = defaultIndex();
  private state = defaultState();
  private settings = defaultSettings();
  private saveTimer: number | undefined;
  private saveInFlight: Promise<void> | undefined;
  private indexWriteQueue: Promise<void> = Promise.resolve();
  private stateWriteQueue: Promise<void> = Promise.resolve();
  private settingsWriteQueue: Promise<void> = Promise.resolve();
  private activeScan: Promise<ScanProgress> | undefined;
  private scanPaused = false;
  private scanCancelled = false;
  private resumePausedScan: (() => void) | undefined;

  constructor(private readonly vault: Vault, pluginId: string) {
    this.files = new VaultJsonStore(vault, pluginId);
  }

  async initialize(legacy: LegacyReaderData | null, pluginVersion = "unknown"): Promise<void> {
    await this.files.recoverInterruptedWrites();
    const hadExistingPluginData = await this.files.exists(INDEX_FILE)
      || await this.files.exists(STATE_FILE)
      || await this.files.exists(SETTINGS_FILE);
    this.index = await this.files.load(INDEX_FILE, defaultIndex(), isIndex);
    this.index.scan ??= defaultScanState();
    this.index.scan.relinked ??= 0;
    this.index.scan.ambiguous ??= 0;
    this.rebuildBookPathIndex();
    if (this.index.scan.status === "running") this.index.scan.status = "paused";
    this.state = await this.files.load(STATE_FILE, defaultState(), isState);
    const hadSavedSettings = await this.files.exists(SETTINGS_FILE);
    this.settings = await this.files.load(SETTINGS_FILE, defaultSettings(), isSettings);
    this.settings.readerAppearance = this.normalizeReaderAppearance(this.settings.readerAppearance);
    this.settings.readerOpenMode = this.normalizeReaderOpenMode(this.settings.readerOpenMode);
    this.settings.libraryOwnerName = this.normalizeLibraryOwnerName(this.settings.libraryOwnerName ?? "");
    this.settings.uiLanguage ??= hadExistingPluginData ? "zh-CN" : "en";
    if (!hadExistingPluginData) {
      const freshDefaults = defaultSettings(this.settings.uiLanguage);
      this.settings.notesDirectory = freshDefaults.notesDirectory;
      this.settings.researchDirectory = freshDefaults.researchDirectory;
      this.settings.noteTemplate = freshDefaults.noteTemplate;
    }
    this.settings.noteTemplate ??= defaultNoteTemplate(this.settings.uiLanguage);
    // Existing users have already learned the original workflow; only a truly
    // new installation receives the one-time first-use guide.
    this.settings.hasCompletedOnboarding ??= hadSavedSettings;
    const needsPerBookAppearanceMigration = this.settings.readerAppearanceScopeVersion !== 1;
    this.state.legacyPathProgress = {
      reflowProgress: numberRecord(this.state.legacyPathProgress?.reflowProgress),
      textProgress: numberRecord(this.state.legacyPathProgress?.textProgress),
      pdfPages: numberRecord(this.state.legacyPathProgress?.pdfPages)
    };
    for (const reading of Object.values(this.state.books)) {
      reading.bookmarks ??= [];
      reading.excerpts ??= [];
      if (reading.readerAppearance) reading.readerAppearance = this.normalizeReaderAppearance(reading.readerAppearance);
      for (const excerpt of reading.excerpts) excerpt.tags ??= [];
    }

    if (legacy && Object.keys(this.state.legacyPathProgress.reflowProgress).length === 0
      && Object.keys(this.state.legacyPathProgress.textProgress).length === 0
      && Object.keys(this.state.legacyPathProgress.pdfPages).length === 0) {
      this.state.legacyPathProgress = {
        reflowProgress: numberRecord(legacy.reflowProgress),
        textProgress: numberRecord(legacy.textProgress),
        pdfPages: numberRecord(legacy.pdfPages)
      };
    }

    try {
      await this.createAutomaticBackup(pluginVersion);
      await this.pruneAutomaticBackups();
    } catch (error) {
      // A backup failure must never make books, notes, or the host Vault
      // unavailable. Existing data remains untouched and the failure is
      // observable in the developer console.
      console.error("Local Book Reader could not create an automatic backup", error);
    }
    if (needsPerBookAppearanceMigration) {
      this.settings.readerAppearance = defaultReaderAppearance();
      this.settings.readerAppearanceScopeVersion = 1;
      try {
        await this.saveSettings();
      } catch (error) {
        console.error("Local Book Reader could not migrate reader appearance settings", error);
      }
    }
  }

  isSupported(file: TFile): boolean {
    return SUPPORTED_BOOK_EXTENSIONS.has(file.extension.toLowerCase());
  }

  async prepareForOpen(file: TFile): Promise<BookRecord> {
    const book = await this.ensureBook(file);
    const reading = this.readingFor(book, file.path);
    reading.status = reading.status === "unread" ? "reading" : reading.status;
    reading.lastOpenedAt = Date.now();
    this.queueStateSave();
    return book;
  }

  getReflowProgress(path: string): number | undefined {
    return this.readingForPath(path)?.reflowProgress;
  }

  setReflowProgress(path: string, progress: number): void {
    if (!Number.isFinite(progress)) return;
    const reading = this.readingForPath(path);
    if (!reading) return;
    reading.reflowProgress = Math.min(1, Math.max(0, progress));
    this.queueStateSave();
  }

  getTextProgress(path: string): number | undefined {
    return this.readingForPath(path)?.textProgress;
  }

  setTextProgress(path: string, progress: number): void {
    if (!Number.isFinite(progress)) return;
    const reading = this.readingForPath(path);
    if (!reading) return;
    reading.textProgress = Math.min(1, Math.max(0, progress));
    this.queueStateSave();
  }

  getPdfPage(path: string): number | undefined {
    return this.readingForPath(path)?.pdfPage;
  }

  getReaderAppearance(path?: string): ReaderAppearanceSettings {
    const book = path ? this.findBookByPath(path) : undefined;
    const appearance = book ? this.state.books[book.bookId]?.readerAppearance : undefined;
    return { ...(appearance ?? this.settings.readerAppearance) };
  }

  getBookMetadata(path: string): BookMetadata | undefined {
    const metadata = this.findBookByPath(path)?.metadata;
    return metadata?.sourceModifiedAt === this.findBookByPath(path)?.modifiedAt ? snapshot(metadata) : undefined;
  }

  async cacheBookMetadata(file: TFile, input: BookMetadataInput): Promise<void> {
    const book = this.findBookByPath(file.path);
    if (!book) return;
    const metadata = this.normalizeBookMetadata(input);
    if (Object.keys(metadata).length === 0) return;
    const priorCover = book.metadata?.sourceModifiedAt === file.stat.mtime
      ? { coverCachePath: book.metadata.coverCachePath, coverMimeType: book.metadata.coverMimeType }
      : {};
    book.metadata = { sourceModifiedAt: file.stat.mtime, ...metadata, ...priorCover };
    await this.saveIndex();
  }

  async cacheBookCover(file: TFile, cover: Blob): Promise<void> {
    const book = this.findBookByPath(file.path);
    if (!book || cover.size <= 0 || cover.size > MAX_SINGLE_COVER_BYTES) return;
    const mimeType = this.normalizeCoverMimeType(cover.type);
    if (!mimeType) return;
    const cacheFile = `${CACHE_DIRECTORY}/covers/${book.bookId}.${this.coverExtension(mimeType)}`;
    const usage = await this.getDataStorageUsage();
    if (usage.cacheBytes + cover.size > MAX_CACHE_BYTES) {
      await this.clearCache();
    }
    await this.files.writeBinary(cacheFile, await cover.arrayBuffer());
    book.metadata = {
      ...(book.metadata?.sourceModifiedAt === file.stat.mtime ? book.metadata : { sourceModifiedAt: file.stat.mtime }),
      coverCachePath: cacheFile,
      coverMimeType: mimeType
    };
    await this.saveIndex();
  }

  getBookCoverResourcePath(path: string): string | undefined {
    const metadata = this.getBookMetadata(path);
    return metadata?.coverCachePath ? this.files.resourcePath(metadata.coverCachePath) : undefined;
  }

  hasCompletedOnboarding(): boolean {
    return this.settings.hasCompletedOnboarding;
  }

  getLibraryOwnerName(): string {
    return this.settings.libraryOwnerName ?? "";
  }

  async setLibraryOwnerName(name: string): Promise<void> {
    this.settings.libraryOwnerName = this.normalizeLibraryOwnerName(name);
    await this.saveSettings();
  }

  async completeOnboarding(): Promise<void> {
    if (this.settings.hasCompletedOnboarding) return;
    this.settings.hasCompletedOnboarding = true;
    await this.saveSettings();
  }

  getUiLanguage(): UiLanguage {
    if (this.settings.uiLanguage === "en" || this.settings.uiLanguage === "zh-TW") return this.settings.uiLanguage;
    return "zh-CN";
  }

  async setUiLanguage(language: UiLanguage): Promise<void> {
    this.settings.uiLanguage = language;
    await this.saveSettings();
  }

  getNotesDirectory(): string {
    return this.settings.notesDirectory;
  }

  async setNotesDirectory(directory: string): Promise<void> {
    this.settings.notesDirectory = this.normalizeUserDirectory(directory);
    await this.saveSettings();
  }

  getResearchDirectory(): string {
    return this.settings.researchDirectory;
  }

  async setResearchDirectory(directory: string): Promise<void> {
    this.settings.researchDirectory = this.normalizeUserDirectory(directory);
    await this.saveSettings();
  }

  getNoteTemplate(): string {
    return this.settings.noteTemplate;
  }

  async setNoteTemplate(template: string): Promise<void> {
    const normalized = template.replace(/\r\n/g, "\n");
    if (!normalized.trim() || normalized.length > 100_000) {
      throw new Error("笔记模板不能为空，且不能超过 100,000 个字符。");
    }
    this.settings.noteTemplate = normalized;
    await this.saveSettings();
  }

  async setReaderAppearance(path: string, next: ReaderAppearanceSettings): Promise<void> {
    const reading = this.readingForPath(path);
    if (!reading) throw new Error("当前书籍尚未建立阅读记录，无法保存阅读外观。");
    reading.readerAppearance = this.normalizeReaderAppearance(next);
    await this.flush();
  }

  getReaderOpenMode(): ReaderOpenMode {
    return this.settings.readerOpenMode;
  }

  async setReaderOpenMode(mode: ReaderOpenMode): Promise<void> {
    this.settings.readerOpenMode = this.normalizeReaderOpenMode(mode);
    await this.saveSettings();
  }

  async resetSettingsToDefaults(): Promise<void> {
    const hasCompletedOnboarding = this.settings.hasCompletedOnboarding;
    const uiLanguage = this.getUiLanguage();
    this.settings = { ...defaultSettings(uiLanguage), hasCompletedOnboarding, uiLanguage };
    await this.saveSettings();
  }

  private normalizeReaderAppearance(next: Partial<ReaderAppearanceSettings> = {}): ReaderAppearanceSettings {
    const defaults = defaultReaderAppearance();
    return {
      fontSize: Math.min(180, Math.max(75, Math.round(next.fontSize ?? defaults.fontSize))),
      lineHeight: Math.min(2.4, Math.max(1.1, Math.round((next.lineHeight ?? defaults.lineHeight) * 10) / 10)),
      margin: Math.min(80, Math.max(8, Math.round(next.margin ?? defaults.margin))),
      theme: next.theme && ["system", "light", "dark", "sepia"].includes(next.theme) ? next.theme : defaults.theme,
      flow: next.flow && ["paginated", "scrolled"].includes(next.flow) ? next.flow : defaults.flow
    };
  }

  private normalizeReaderOpenMode(mode: unknown): ReaderOpenMode {
    return mode === "window" ? "window" : "tab";
  }

  private normalizeLibraryOwnerName(name: string): string {
    const normalized = name.replace(/\s+/g, " ").trim();
    if (normalized.length > 80) throw new Error("馆主名称不能超过 80 个字符。");
    return normalized;
  }

  private normalizeBookMetadata(input: BookMetadataInput): BookMetadataInput {
    const text = (value: unknown, max = 300): string | undefined => {
      if (typeof value !== "string") return undefined;
      const normalized = value.replace(/\s+/g, " ").trim().slice(0, max);
      return normalized || undefined;
    };
    const values = (value: unknown): string[] | undefined => {
      if (!Array.isArray(value)) return undefined;
      const normalized = [...new Set(value.map((item) => text(item, 180)).filter((item): item is string => Boolean(item)))].slice(0, 12);
      return normalized.length ? normalized : undefined;
    };
    return {
      ...(text(input.title) ? { title: text(input.title) } : {}),
      ...(values(input.authors) ? { authors: values(input.authors) } : {}),
      ...(text(input.publisher) ? { publisher: text(input.publisher) } : {}),
      ...(text(input.published, 80) ? { published: text(input.published, 80) } : {}),
      ...(values(input.languages) ? { languages: values(input.languages) } : {}),
      ...(text(input.identifier, 300) ? { identifier: text(input.identifier, 300) } : {})
    };
  }

  private normalizeCoverMimeType(value: string): string | undefined {
    const normalized = value.toLowerCase().split(";")[0].trim();
    return ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(normalized) ? normalized : undefined;
  }

  private coverExtension(mimeType: string): string {
    return mimeType === "image/jpeg" ? "jpg" : mimeType.slice("image/".length);
  }

  private normalizeUserDirectory(directory: string): string {
    const source = directory.trim().replace(/\\/g, "/");
    if (!source || source === "." || source.startsWith("/") || /^[A-Za-z]:/.test(source)
      || source.split("/").some((part) => part === "..")) {
      throw new Error("笔记目录必须是 Vault 内的相对路径。");
    }
    const normalized = normalizePath(source).replace(/\/$/, "");
    if (!normalized || normalized === ".obsidian" || normalized.startsWith(".obsidian/")) {
      throw new Error("笔记目录不能位于 .obsidian 内。");
    }
    return normalized;
  }

  setPdfPage(path: string, page: number): void {
    if (!Number.isFinite(page)) return;
    const reading = this.readingForPath(path);
    if (!reading) return;
    reading.pdfPage = Math.max(1, Math.floor(page));
    this.queueStateSave();
  }

  async handleRename(file: TFile, oldPath: string): Promise<void> {
    const book = this.findBookByPath(oldPath);
    if (!book) {
      if (this.isSupported(file)) await this.ensureBook(file);
      return;
    }

    if (!this.isSupported(file)) {
      book.isMissing = true;
      await this.saveIndex();
      return;
    }

    this.updateRecordFromFile(book, file);
    await this.saveIndex();
  }

  async handleCreate(file: TFile): Promise<void> {
    if (!this.isSupported(file)) return;
    await this.ensureBook(file, false, false);
    await this.saveIndex();
  }

  async handleModify(file: TFile): Promise<void> {
    if (!this.isSupported(file)) return;
    const book = this.findBookByPath(file.path);
    if (!book) {
      await this.handleCreate(file);
      return;
    }
    this.updateRecordFromFile(book, file);
    await this.saveIndex();
  }

  async handleDelete(file: TFile): Promise<void> {
    const book = this.findBookByPath(file.path);
    if (!book) return;
    book.isMissing = true;
    await this.saveIndex();
  }

  setReadingStatus(bookId: string, status: ReadingStatus): void {
    if (!this.index.books[bookId]) return;
    this.readingForBookId(bookId).status = status;
    this.queueStateSave();
  }

  setFavorite(bookId: string, isFavorite: boolean): void {
    if (!this.index.books[bookId]) return;
    this.readingForBookId(bookId).isFavorite = isFavorite;
    this.queueStateSave();
  }

  addBookmark(path: string, locator: BookmarkLocator, label: string): Bookmark | undefined {
    const reading = this.readingForPath(path);
    if (!reading) return undefined;
    const bookmark: Bookmark = {
      bookmarkId: this.newBookId(),
      label: label.trim(),
      createdAt: formatBeijingTime(),
      locator,
    };
    reading.bookmarks.push(bookmark);
    this.queueStateSave();
    return bookmark;
  }

  listBookmarks(path: string): Bookmark[] {
    return [...(this.readingForPath(path)?.bookmarks ?? [])];
  }

  addExcerpt(path: string, text: string, locator: ExcerptLocator, note: string, tags: string[] = []): Excerpt | undefined {
    const reading = this.readingForPath(path);
    const normalizedText = text.trim();
    if (!reading || !normalizedText) return undefined;
    const excerpt: Excerpt = {
      excerptId: this.newBookId(),
      text: normalizedText,
      note: note.trim(),
      createdAt: formatBeijingTime(),
      locator,
      tags: [...new Set(tags)],
    };
    reading.excerpts.push(excerpt);
    this.queueStateSave();
    return excerpt;
  }

  listExcerpts(path: string): Excerpt[] {
    return [...(this.readingForPath(path)?.excerpts ?? [])];
  }

  removeExcerpt(path: string, excerptId: string): Excerpt | undefined {
    const reading = this.readingForPath(path);
    if (!reading) return undefined;
    const excerpt = reading.excerpts.find((item) => item.excerptId === excerptId);
    if (!excerpt) return undefined;
    reading.excerpts = reading.excerpts.filter((item) => item.excerptId !== excerptId);
    this.queueStateSave();
    return excerpt;
  }

  findExcerpt(excerptId: string): StoredExcerpt | undefined {
    for (const book of Object.values(this.index.books)) {
      const excerpt = this.state.books[book.bookId]?.excerpts?.find((item) => item.excerptId === excerptId);
      if (excerpt) return { book, excerpt };
    }
    return undefined;
  }

  listStoredExcerpts(): StoredExcerpt[] {
    const entries: StoredExcerpt[] = [];
    for (const book of Object.values(this.index.books)) {
      const excerpts = this.state.books[book.bookId]?.excerpts ?? [];
      for (const excerpt of excerpts) entries.push({ book, excerpt });
    }
    return entries.sort((left, right) => right.excerpt.createdAt.localeCompare(left.excerpt.createdAt, this.locale()));
  }

  getBookByPath(path: string): BookRecord | undefined {
    return this.findBookByPath(path);
  }

  getReadingStatus(path: string): ReadingStatus {
    const book = this.findBookByPath(path);
    return book ? (this.state.books[book.bookId]?.status ?? "unread") : "unread";
  }

  removeBookmark(path: string, bookmarkId: string): void {
    const reading = this.readingForPath(path);
    if (!reading) return;
    reading.bookmarks = reading.bookmarks.filter((bookmark) => bookmark.bookmarkId !== bookmarkId);
    this.queueStateSave();
  }

  /** Removes only last-opened timestamps; bookmarks, excerpts, progress, status and favorites remain. */
  async clearReadingHistory(bookId?: string): Promise<number> {
    let changed = 0;
    for (const [id, reading] of Object.entries(this.state.books)) {
      if (bookId && id !== bookId) continue;
      if (reading.lastOpenedAt === undefined) continue;
      delete reading.lastOpenedAt;
      changed += 1;
    }
    if (changed > 0) {
      this.queueStateSave();
      await this.flush();
    }
    return changed;
  }

  /** Resets only return-to-reading positions; all user-created research data remains. */
  async resetReadingProgress(bookId?: string): Promise<number> {
    let changed = 0;
    for (const [id, reading] of Object.entries(this.state.books)) {
      if (bookId && id !== bookId) continue;
      const hasProgress = reading.reflowProgress !== undefined
        || reading.textProgress !== undefined
        || reading.pdfPage !== undefined;
      if (!hasProgress) continue;
      delete reading.reflowProgress;
      delete reading.textProgress;
      delete reading.pdfPage;
      changed += 1;
    }
    if (changed > 0) {
      this.queueStateSave();
      await this.flush();
    }
    return changed;
  }

  async getDataStorageUsage(): Promise<DataStorageUsage> {
    const [allFiles, cacheFiles] = await Promise.all([
      this.files.listFilesRecursively(""),
      this.files.listFilesRecursively(CACHE_DIRECTORY),
    ]);
    const cacheSet = new Set(cacheFiles);
    const [coreBytes, cacheBytes] = await Promise.all([
      this.totalBytes(allFiles.filter((path) => !cacheSet.has(path))),
      this.totalBytes(cacheFiles),
    ]);
    return { coreBytes, cacheBytes, cacheFileCount: cacheFiles.length, cacheLimitBytes: MAX_CACHE_BYTES };
  }

  async clearCache(): Promise<{ files: number; bytes: number }> {
    const cacheFiles = await this.files.listFilesRecursively(CACHE_DIRECTORY);
    const bytes = await this.totalBytes(cacheFiles);
    for (const path of cacheFiles) await this.files.removePath(path);
    return { files: cacheFiles.length, bytes };
  }

  listLibraryBooks(): LibraryBook[] {
    return Object.values(this.index.books)
      .map((book) => ({ book, reading: this.state.books[book.bookId] ?? {
        status: "unread", isFavorite: false, bookmarks: [], excerpts: []
      } }))
      .sort((left, right) => left.book.name.localeCompare(right.book.name, this.locale()));
  }

  findLikelyDuplicates(bookId: string): LibraryBook[] {
    const source = this.index.books[bookId];
    if (!source || source.isMissing) return [];
    const normalizedName = this.normalizeDuplicateName(source.name);
    return this.listLibraryBooks().filter((item) => item.book.bookId !== source.bookId
      && !item.book.isMissing
      && item.book.extension === source.extension
      && item.book.size === source.size
      && this.normalizeDuplicateName(item.book.name) === normalizedName);
  }

  getScanProgress(): ScanProgress {
    return this.scanProgress(this.index.scan ?? defaultScanState());
  }

  private scanProgress(scan: ScanState): ScanProgress {
    return {
      checked: scan.cursor,
      total: scan.pendingPaths.length,
      discovered: scan.discovered,
      relinked: scan.relinked,
      ambiguous: scan.ambiguous,
      elapsedMs: scan.startedAt === 0 ? 0 : Math.max(0, Date.now() - scan.startedAt),
      status: scan.status
    };
  }

  async startOrResumeScan(onProgress?: (progress: ScanProgress) => void): Promise<ScanProgress> {
    if (this.activeScan) {
      if (this.scanPaused) this.resumeScan();
      return this.activeScan;
    }

    const scan = this.index.scan ?? defaultScanState();
    if (scan.status === "idle" || scan.cursor >= scan.pendingPaths.length) {
      scan.status = "running";
      scan.startedAt = Date.now();
      scan.pendingPaths = this.vault.getFiles()
        .filter((file) => this.isSupported(file))
        .map((file) => file.path)
      .sort((left, right) => left.localeCompare(right, this.locale()));
      scan.cursor = 0;
      scan.discovered = 0;
      scan.relinked = 0;
      scan.ambiguous = 0;
      this.markPathsMissingBeforeScan(scan.pendingPaths);
      this.index.scan = scan;
    } else {
      scan.status = "running";
    }

    this.scanPaused = false;
    this.scanCancelled = false;
    await this.saveIndex();
    this.activeScan = this.runScan(scan, onProgress).finally(() => {
      this.activeScan = undefined;
      this.resumePausedScan = undefined;
    });
    return this.activeScan;
  }

  pauseScan(): void {
    if (this.index.scan?.status !== "running") return;
    this.scanPaused = true;
    if (this.index.scan) this.index.scan.status = "paused";
  }

  resumeScan(): void {
    this.scanPaused = false;
    if (this.index.scan) this.index.scan.status = "running";
    this.resumePausedScan?.();
  }

  cancelScan(): void {
    if (this.index.scan?.status === "idle") return;
    this.scanCancelled = true;
    this.scanPaused = false;
    this.resumePausedScan?.();
  }

  async flush(): Promise<void> {
    if (this.saveTimer !== undefined) {
      window.clearTimeout(this.saveTimer);
      this.saveTimer = undefined;
    }
    if (this.saveInFlight) await this.saveInFlight;
    await this.saveState();
  }

  async createCoreDataBackup(pluginVersion: string): Promise<CoreDataBackup> {
    await this.flush();
    return this.buildCoreDataBackup(pluginVersion);
  }

  async restoreCoreDataBackup(backup: CoreDataBackup, pluginVersion: string): Promise<void> {
    if (!isCoreDataBackup(backup)) throw new Error("备份文件格式不正确或版本不受支持。 ");
    await this.flush();
    // Do not replace current reading data unless a recoverable pre-restore
    // snapshot has been safely written first.
    await this.createAutomaticBackup(pluginVersion, true);

    const previous = {
      index: snapshot(this.index),
      state: snapshot(this.state),
      settings: snapshot(this.settings),
    };
    this.index = snapshot(backup.libraryIndex);
    this.state = snapshot(backup.readingState);
    this.settings = snapshot(backup.settings);
    this.normalizeLoadedData();
    try {
      await this.files.write(INDEX_FILE, this.index);
      await this.files.write(STATE_FILE, this.state);
      await this.files.write(SETTINGS_FILE, this.settings);
    } catch (error) {
      this.index = previous.index;
      this.state = previous.state;
      this.settings = previous.settings;
      try {
        await this.files.write(INDEX_FILE, this.index);
        await this.files.write(STATE_FILE, this.state);
        await this.files.write(SETTINGS_FILE, this.settings);
      } catch (rollbackError) {
        console.error("Local Book Reader could not roll back a failed restore", rollbackError);
      }
      throw error;
    }
  }

  private async totalBytes(paths: string[]): Promise<number> {
    let total = 0;
    for (const path of paths) total += await this.files.fileSize(path);
    return total;
  }

  private buildCoreDataBackup(pluginVersion: string): CoreDataBackup {
    return {
      schemaVersion: SCHEMA_VERSION,
      createdAt: formatBeijingTime(),
      pluginVersion,
      libraryIndex: snapshot(this.index),
      readingState: snapshot(this.state),
      settings: snapshot(this.settings)
    };
  }

  private normalizeLoadedData(): void {
    this.index.scan ??= defaultScanState();
    this.index.scan.relinked ??= 0;
    this.index.scan.ambiguous ??= 0;
    this.rebuildBookPathIndex();
    if (this.index.scan.status === "running") this.index.scan.status = "paused";
    this.settings.readerAppearance = this.normalizeReaderAppearance(this.settings.readerAppearance);
    if (this.settings.readerAppearanceScopeVersion !== 1) {
      this.settings.readerAppearance = defaultReaderAppearance();
    }
    this.settings.readerAppearanceScopeVersion = 1;
    this.settings.readerOpenMode = this.normalizeReaderOpenMode(this.settings.readerOpenMode);
    this.settings.libraryOwnerName = this.normalizeLibraryOwnerName(this.settings.libraryOwnerName ?? "");
    this.settings.noteTemplate ??= defaultNoteTemplate();
    this.state.legacyPathProgress = {
      reflowProgress: numberRecord(this.state.legacyPathProgress?.reflowProgress),
      textProgress: numberRecord(this.state.legacyPathProgress?.textProgress),
      pdfPages: numberRecord(this.state.legacyPathProgress?.pdfPages)
    };
    for (const reading of Object.values(this.state.books)) {
      reading.bookmarks ??= [];
      reading.excerpts ??= [];
      if (reading.readerAppearance) reading.readerAppearance = this.normalizeReaderAppearance(reading.readerAppearance);
      for (const excerpt of reading.excerpts) excerpt.tags ??= [];
    }
  }

  private async createAutomaticBackup(pluginVersion: string, force = false): Promise<void> {
    const metadata = await this.files.load(BACKUP_METADATA_FILE, defaultBackupMetadata(), isBackupMetadata);
    if (!force && metadata.lastPluginVersion === pluginVersion) return;

    const backup = this.buildCoreDataBackup(pluginVersion);
    const size = new TextEncoder().encode(JSON.stringify(backup)).byteLength;
    if (size > MAX_BACKUP_BYTES) {
      throw new Error(`Automatic backup is ${size} bytes, exceeding the ${MAX_BACKUP_BYTES}-byte safety limit.`);
    }

    const fileName = `${BACKUP_DIRECTORY}/backup-${Date.now()}.json`;
    await this.files.write(fileName, backup);
    metadata.lastPluginVersion = pluginVersion;
    await this.files.write(BACKUP_METADATA_FILE, metadata);
    await this.pruneAutomaticBackups();
  }

  private async pruneAutomaticBackups(): Promise<void> {
    const files = (await this.files.listFiles(BACKUP_DIRECTORY))
      .filter((path) => /\/backup-\d+\.json$/i.test(path))
      .sort((left, right) => right.localeCompare(left));
    let retained = 0;
    let retainedBytes = 0;

    for (const path of files) {
      let contents: string;
      try {
        contents = await this.files.readPath(path);
        const parsed: unknown = JSON.parse(contents);
        if (!isCoreDataBackup(parsed)) {
          console.error(`Local Book Reader kept an unreadable automatic backup: ${path}`);
          continue;
        }
      } catch (error) {
        console.error(`Local Book Reader kept an unreadable automatic backup: ${path}`, error);
        continue;
      }

      const size = new TextEncoder().encode(contents).byteLength;
      if (retained < MAX_AUTOMATIC_BACKUPS && retainedBytes + size <= MAX_TOTAL_BACKUP_BYTES) {
        retained += 1;
        retainedBytes += size;
        continue;
      }
      await this.files.removePath(path);
    }
  }

  private async ensureBook(
    file: TFile,
    persist = true,
    ensureReading = true
  ): Promise<BookRecord & { relinked?: boolean; ambiguous?: boolean }> {
    let book = this.findBookByPath(file.path);
    let relinked = false;
    let ambiguous = false;
    if (!book) {
      const candidates = this.findMissingRelinkCandidates(file);
      if (candidates.length === 1) {
        book = candidates[0];
        relinked = true;
        this.updateRecordFromFile(book, file);
      } else {
        ambiguous = candidates.length > 1;
        book = {
          bookId: this.newBookId(),
          path: file.path,
          name: file.basename,
          extension: file.extension.toLowerCase(),
          size: file.stat.size,
          modifiedAt: file.stat.mtime,
          lastSeenAt: Date.now(),
          isMissing: false
        };
        this.index.books[book.bookId] = book;
        this.bookIdByPath.set(book.path, book.bookId);
      }
    } else {
      this.updateRecordFromFile(book, file);
    }
    if (ensureReading) this.readingFor(book, file.path);
    if (persist) {
      await this.saveIndex();
      await this.saveState();
    }
    return { ...book, ...(relinked ? { relinked: true } : {}), ...(ambiguous ? { ambiguous: true } : {}) };
  }

  /**
   * A manual refresh can discover a file moved while Obsidian was closed.
   * A filename alone is never enough to reuse reading data: exactly one
   * missing record must share the extension, byte size, and modification time.
   */
  private findMissingRelinkCandidates(file: TFile): BookRecord[] {
    const extension = file.extension.toLowerCase();
    return Object.values(this.index.books).filter((book) => book.isMissing
      && book.extension === extension
      && book.size === file.stat.size
      && book.modifiedAt === file.stat.mtime);
  }

  private markPathsMissingBeforeScan(pendingPaths: string[]): void {
    const present = new Set(pendingPaths);
    for (const book of Object.values(this.index.books)) {
      if (!present.has(book.path)) book.isMissing = true;
    }
  }

  private updateRecordFromFile(book: BookRecord, file: TFile): void {
    if (book.path !== file.path) this.bookIdByPath.delete(book.path);
    book.path = file.path;
    book.name = file.basename;
    book.extension = file.extension.toLowerCase();
    book.size = file.stat.size;
    book.modifiedAt = file.stat.mtime;
    book.lastSeenAt = Date.now();
    book.isMissing = false;
    this.bookIdByPath.set(book.path, book.bookId);
  }

  private readingForPath(path: string): BookReadingState | undefined {
    const book = this.findBookByPath(path);
    return book ? this.readingFor(book, path) : undefined;
  }

  private readingFor(book: BookRecord, currentPath: string): BookReadingState {
    let reading = this.state.books[book.bookId];
    if (!reading) {
      reading = { status: "unread", isFavorite: false, bookmarks: [], excerpts: [] };
      const legacy = this.state.legacyPathProgress;
      const reflow = legacy.reflowProgress[currentPath];
      const text = legacy.textProgress[currentPath];
      const pdfPage = legacy.pdfPages[currentPath];
      if (reflow !== undefined) reading.reflowProgress = reflow;
      if (text !== undefined) reading.textProgress = text;
      if (pdfPage !== undefined) reading.pdfPage = pdfPage;
      delete legacy.reflowProgress[currentPath];
      delete legacy.textProgress[currentPath];
      delete legacy.pdfPages[currentPath];
      this.state.books[book.bookId] = reading;
    }
    return reading;
  }

  private readingForBookId(bookId: string): BookReadingState {
    let reading = this.state.books[bookId];
    if (!reading) {
      reading = { status: "unread", isFavorite: false, bookmarks: [], excerpts: [] };
      this.state.books[bookId] = reading;
    }
    return reading;
  }

  private findBookByPath(path: string): BookRecord | undefined {
    const bookId = this.bookIdByPath.get(path);
    return bookId ? this.index.books[bookId] : undefined;
  }

  private normalizeDuplicateName(name: string): string {
    return name.normalize("NFKC").trim().toLocaleLowerCase(this.locale());
  }

  private rebuildBookPathIndex(): void {
    this.bookIdByPath.clear();
    for (const book of Object.values(this.index.books)) {
      this.bookIdByPath.set(book.path, book.bookId);
    }
  }

  private queueStateSave(): void {
    if (this.saveTimer !== undefined) window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => {
      this.saveTimer = undefined;
      this.saveInFlight = this.saveState().catch((error) => {
        console.error("Local Book Reader failed to save reading state", error);
      }).finally(() => {
        this.saveInFlight = undefined;
      });
    }, 500);
  }

  private async saveIndex(): Promise<void> {
    const value = snapshot(this.index);
    const write = this.indexWriteQueue.catch(() => undefined).then(() => this.files.write(INDEX_FILE, value));
    this.indexWriteQueue = write;
    await write;
  }

  private async saveState(): Promise<void> {
    const value = snapshot(this.state);
    const write = this.stateWriteQueue.catch(() => undefined).then(() => this.files.write(STATE_FILE, value));
    this.stateWriteQueue = write;
    await write;
  }

  private async saveSettings(): Promise<void> {
    const value = snapshot(this.settings);
    const write = this.settingsWriteQueue.catch(() => undefined).then(() => this.files.write(SETTINGS_FILE, value));
    this.settingsWriteQueue = write;
    await write;
  }

  private async runScan(scan: ScanState, onProgress?: (progress: ScanProgress) => void): Promise<ScanProgress> {
    while (scan.cursor < scan.pendingPaths.length) {
      await this.waitWhilePaused();
      if (this.scanCancelled) {
        this.index.scan = defaultScanState();
        await this.saveIndex();
        const cancelled = this.getScanProgress();
        onProgress?.(cancelled);
        return cancelled;
      }

      const path = scan.pendingPaths[scan.cursor];
      const file = this.vault.getAbstractFileByPath(path);
      if (file instanceof TFile && this.isSupported(file)) {
        const before = this.findBookByPath(file.path);
        const ensured = await this.ensureBook(file, false, false);
        if (!before) scan.discovered += 1;
        if (!before && ensured.relinked) scan.relinked += 1;
        if (!before && ensured.ambiguous) scan.ambiguous += 1;
      }
      scan.cursor += 1;

      if (scan.cursor % 100 === 0 || scan.cursor === scan.pendingPaths.length) {
        await this.saveIndex();
      }
      if (scan.cursor % 25 === 0 || scan.cursor === scan.pendingPaths.length) {
        onProgress?.(this.getScanProgress());
      }
      if (scan.cursor % 100 === 0) await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    }

    for (const book of Object.values(this.index.books)) {
      if (book.lastSeenAt < scan.startedAt) book.isMissing = true;
    }
    const completed = { ...this.scanProgress(scan), status: "idle" as const };
    this.index.scan = defaultScanState();
    await this.saveIndex();
    onProgress?.(completed);
    return completed;
  }

  private async waitWhilePaused(): Promise<void> {
    while (this.scanPaused && !this.scanCancelled) {
      await this.saveIndex();
      await new Promise<void>((resolve) => {
        this.resumePausedScan = resolve;
      });
    }
  }

  private newBookId(): string {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `book-${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
  }

  private locale(): string {
    if (this.getUiLanguage() === "en") return "en";
    return this.getUiLanguage() === "zh-TW" ? "zh-Hant-TW" : "zh-Hans-CN";
  }
}

export function formatBeijingTime(language: UiLanguage = "zh-CN", date = new Date()): string {
  const values = new Map(
    new Intl.DateTimeFormat(language === "en" ? "en-CA" : language === "zh-TW" ? "zh-TW" : "zh-CN", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(date).map((part) => [part.type, part.value])
  );
  return `${values.get("year")}-${values.get("month")}-${values.get("day")} ${values.get("hour")}:${values.get("minute")}`;
}

export function summarizeCoreDataBackup(backup: CoreDataBackup): CoreDataBackupSummary {
  let bookmarkCount = 0;
  let excerptCount = 0;
  for (const reading of Object.values(backup.readingState.books)) {
    bookmarkCount += reading.bookmarks?.length ?? 0;
    excerptCount += reading.excerpts?.length ?? 0;
  }
  return {
    createdAt: backup.createdAt,
    pluginVersion: backup.pluginVersion,
    bookCount: Object.keys(backup.libraryIndex.books).length,
    readingRecordCount: Object.keys(backup.readingState.books).length,
    bookmarkCount,
    excerptCount,
  };
}
