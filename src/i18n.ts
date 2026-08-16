import { Notice as ObsidianNotice } from "obsidian";

export type UiLanguage = "zh-CN" | "zh-TW" | "en" | "fr";

let activeLanguage: UiLanguage = "zh-CN";

// Chinese remains the source language in the codebase. Keeping the table here
// lets an upgrade retain every existing Chinese string while adding English
// without changing stored book data, paths, or note content.
const english: Record<string, string> = {
  "取消": "Cancel",
  "关闭": "Close",
  "打开": "Open",
  "删除": "Delete",
  "跳转": "Go to",
  "添加": "Add",
  "应用": "Apply",
  "保存": "Save",
  "搜索": "Search",
  "暂停": "Pause",
  "继续扫描": "Resume scan",
  "刷新图书馆": "Refresh library",
  "个人图书馆": "Personal Library",
  "欢迎使用 Local Book Reader": "Welcome to Local Book Reader",
  "这里直接读取 Vault 内的电子书；不会复制、移动、重命名或修改原始书籍。": "This plugin reads ebooks directly from your Vault. It never copies, moves, renames, or changes the original books.",
  "打开“个人图书馆”，首次使用时点击“刷新图书馆”建立索引。": "Open Personal Library, then select Refresh library the first time to build an index.",
  "索引只读取文件路径和基础属性，不读取整本正文；之后新增书籍会自动发现。": "The index reads only file paths and basic properties, not whole book contents. Books added later are discovered automatically.",
  "阅读进度、书签、高亮和摘录保存在插件数据与 Markdown 笔记中，可在设置页导出核心数据备份。": "Reading progress, bookmarks, highlights, and excerpts are stored in plugin data and Markdown notes. You can export a core-data backup in Settings.",
  "稍后探索": "Explore later",
  "打开个人图书馆": "Open Personal Library",
  "插件设置": "Plugin settings",
  "界面语言": "Interface language",
  "选择 English、简体中文、繁體中文或 Français。切换后，重新打开已打开的插件页面即可看到完整界面更新；不会改动任何电子书、笔记或已有数据。": "Choose English, Simplified Chinese, Traditional Chinese, or Français. Reopen an open plugin page after switching to see the full update. This never changes books, notes, or existing data.",
  "馆主名称": "Library owner name",
  "填写后显示为“名称 的个人图书馆”；留空则显示“个人图书馆”。名称只保存在插件设置中，不会改动电子书或索引。": "When set, the library is shown as “Name's Personal Library”; otherwise it is “Personal Library”. The name stays in plugin settings and never changes books or the index.",
  "例如：Sunny D": "For example: Sunny D",
  "保存名称": "Save name",
  "个人图书馆名称已更新。": "Personal Library name updated.",
  "无法保存名称。": "Could not save the name.",
  "读书笔记保存目录": "Reading notes folder",
  "仅允许 Vault 内、且不在 .obsidian 内的相对路径。目录会在你首次主动创建笔记时才建立。": "Use a relative path inside the Vault, but not inside .obsidian. The folder is created only when you first choose to create a note.",
  "保存目录": "Save folder",
  "读书笔记保存目录已更新。": "Reading notes folder updated.",
  "无法保存目录：请填写 Vault 内的有效相对路径。": "Could not save the folder: enter a valid relative path inside the Vault.",
  "主题研究笔记保存目录": "Research notes folder",
  "用于从摘录检索创建或追加主题研究笔记；仅允许 Vault 内、且不在 .obsidian 内的相对路径。": "Used for creating or appending research notes from excerpt search. Use a relative path inside the Vault, but not inside .obsidian.",
  "主题研究笔记保存目录已更新。 ": "Research notes folder updated.",
  "新读书笔记默认模板": "Default template for new reading notes",
  "可使用 {{title}}、{{bookId}}、{{bookPath}}、{{format}}、{{readingStatus}}、{{created}}，以及对应的 Json 占位符（如 {{titleJson}}）。模板仅在新建笔记时使用。": "You can use {{title}}, {{bookId}}, {{bookPath}}, {{format}}, {{readingStatus}}, {{created}}, and their JSON placeholders (such as {{titleJson}}). The template is used only for newly created notes.",
  "保存模板": "Save template",
  "新读书笔记默认模板已更新。": "Default reading-note template updated.",
  "无法保存模板：模板不能为空且不能过长。": "Could not save the template: it cannot be empty or too long.",
  "恢复默认插件设置": "Restore default plugin settings",
  "只恢复馆主名称、读书笔记目录、主题研究目录、新笔记模板和新书默认阅读外观。已为单本书保存的外观不会改变；不会移动或删除已有 Markdown、阅读数据或电子书。": "Restores only the library owner name, note folders, new-note template, and default appearance for new books. Per-book appearance is kept. Existing Markdown, reading data, and ebooks are never moved or deleted.",
  "恢复默认设置": "Restore defaults",
  "电子书打开位置": "Where to open ebooks",
  "默认在 Obsidian 标签页打开。选择“独立阅读窗口”可减轻关闭大型 EPUB 时主窗口的卡顿；关闭时仍可能有短暂等待，且不会改动电子书或阅读数据。": "By default, books open in an Obsidian tab. A separate reader window can reduce pauses when closing large EPUBs. Closing may still take a moment; books and reading data are never changed.",
  "Obsidian 标签页（默认）": "Obsidian tab (default)",
  "独立阅读窗口（减轻关闭卡顿）": "Separate reader window (reduced closing pause)",
  "阅读数据维护": "Reading-data maintenance",
  "清除全部最近阅读历史": "Clear all recent-reading history",
  "仅清除“最近阅读”的打开时间记录。不会删除进度、书签、高亮、摘录、想法、收藏、Markdown 笔记或原始电子书。": "Clears only the opened-time records in Recent reading. It never deletes progress, bookmarks, highlights, excerpts, thoughts, favorites, Markdown notes, or original ebooks.",
  "清除全部历史": "Clear all history",
  "重置全部阅读进度": "Reset all reading progress",
  "仅清除每本书的上次阅读位置。不会删除书签、高亮、摘录、想法、阅读状态、收藏、Markdown 笔记或原始电子书。": "Clears only each book's last reading position. It never deletes bookmarks, highlights, excerpts, thoughts, reading status, favorites, Markdown notes, or original ebooks.",
  "重置全部进度": "Reset all progress",
  "备份与恢复": "Backup and restore",
  "导出核心数据备份": "Export core-data backup",
  "导出插件设置、图书索引、进度、书签、状态、收藏和本地摘录/高亮定位数据。不会导出电子书、Markdown 笔记、封面或缓存；由你通过系统窗口选择保存位置。": "Exports plugin settings, library index, progress, bookmarks, status, favorites, and local excerpt/highlight locations. It never exports ebooks, Markdown notes, covers, or cache. You choose the destination in a system window.",
  "导出备份": "Export backup",
  "从备份恢复核心数据": "Restore core data from backup",
  "只读取你主动选择的 Local Book Reader 备份文件。恢复前会显示备份摘要并要求确认；恢复前自动保存当前核心数据。电子书和 Markdown 笔记不会被读取或修改。": "Reads only a Local Book Reader backup file that you choose. It shows a summary and asks for confirmation before restoring, and automatically backs up current core data first. Ebooks and Markdown notes are not read or changed.",
  "选择备份文件": "Choose backup file",
  "缓存维护": "Cache maintenance",
  "正在读取缓存占用…": "Reading cache usage…",
  "无法读取缓存占用；现有阅读数据未受影响。 ": "Could not read cache usage; existing reading data is unaffected.",
  "清理可重建缓存": "Clear rebuildable cache",
  "只清理插件专属 cache 目录中的可重建文件。不会删除进度、书签、高亮、摘录、想法、状态、收藏、自动备份、Markdown 笔记或电子书。": "Clears only rebuildable files in this plugin's cache folder. It never deletes progress, bookmarks, highlights, excerpts, thoughts, status, favorites, automatic backups, Markdown notes, or ebooks.",
  "清理缓存": "Clear cache",
  "未读": "Unread",
  "正在阅读": "Reading",
  "已读": "Finished",
  "疑似重复文件": "Possible duplicate files",
  "仅按同名、同格式和同文件大小列出候选，不读取正文或计算文件哈希，因此结果只供人工核对。插件不会自动合并、移动、修改或删除任何电子书。": "Candidates match only on file name, format, and size. Contents and hashes are not read, so review them manually. The plugin never automatically merges, moves, changes, or deletes ebooks.",
  "当前书籍": "Current book",
  "没有发现符合当前保守规则的疑似重复文件。": "No possible duplicate files match the current conservative rules.",
  "仅索引文件名和基础属性；不会读取正文、提取封面或修改原始电子书。": "Indexes only file names and basic properties. It does not read book contents, extract covers, or change original ebooks.",
  "尚未建立图书馆索引。点击“刷新图书馆”开始。 ": "No library index yet. Select Refresh library to start.",
  "全部格式": "All formats",
  "全部分类": "All folders",
  "全部状态": "All statuses",
  "文件缺失": "File missing",
  "仅看收藏": "Favorites only",
  "最近阅读": "Recent reading",
  "尚无索引。请先点击“刷新图书馆”。": "No index yet. Select Refresh library first.",
  "没有符合当前筛选条件的书籍。": "No books match the current filters.",
  "根目录": "Vault root",
  "笔记": "Notes",
  "收藏": "Favorite",
  "取消收藏": "Remove favorite",
  "管理": "Manage",
  "清除本书最近阅读历史": "Clear this book's recent-reading history",
  "重置本书阅读进度": "Reset this book's reading progress",
  "检查疑似重复文件": "Check possible duplicates",
  "书籍信息": "Book information",
  "书名": "Title",
  "作者": "Author",
  "出版社": "Publisher",
  "出版日期": "Published",
  "语言": "Language",
  "标识符": "Identifier",
  "格式": "Format",
  "分类": "Folder",
  "本地缓存封面": "Locally cached cover",
  "添加书签": "Add bookmark",
  "可选：为书签填写名称或简短说明。": "Optional: give the bookmark a name or short note.",
  "记录想法": "Record a thought",
  "保存到读书笔记": "Save to reading note",
  "保存摘录": "Save excerpt",
  "阅读外观": "Reading appearance",
  "字号": "Text size",
  "行距": "Line spacing",
  "页边距": "Page margins",
  "主题": "Theme",
  "跟随 Obsidian": "Match Obsidian",
  "浅色": "Light",
  "深色": "Dark",
  "护眼": "Sepia",
  "阅读方式": "Reading mode",
  "分页": "Paginated",
  "连续滚动": "Continuous scroll",
  "搜索正文": "Search text",
  "上一页": "Previous page",
  "下一页": "Next page",
  "书签": "Bookmarks",
  "目录": "Table of contents",
  "摘录所选文字": "Excerpt selected text",
  "摘录": "Excerpts",
  "页码": "Page",
  "缩小": "Zoom out",
  "放大": "Zoom in",
  "适宽": "Fit width",
  "无法打开电子书": "Could not open ebook",
  "未命名章节": "Untitled chapter",
  "未命名书签": "Untitled bookmark",
  "删除高亮": "Delete highlight",
  "摘录与笔记检索": "Excerpt and note search",
  "书名筛选": "Filter by book title",
  "标签筛选（不带 #）": "Filter by tag (without #)",
  "开始日期": "Start date",
  "结束日期": "End date",
  "主题名称": "Research topic name",
  "创建/追加主题研究笔记": "Create/append research note",
  "想法与主题研究笔记": "Thoughts and research notes",
  "返回原文": "Return to source",
  "打开笔记": "Open note",
  "想法": "Thought",
  "主题研究笔记": "Research note",
  "确认清除": "Confirm clear",
  "确认重置": "Confirm reset",
  "确认恢复": "Confirm restore",
  "确认清理缓存": "Confirm clear cache",
  "选择保存位置": "Choose save location",
  "确认恢复默认设置": "Confirm restore defaults",
  "Local Book Reader 备份": "Local Book Reader backup",
  "输入书名、作者、文件夹或扩展名进行筛选": "Filter by title, author, folder, or file extension",
  "选择": "Select",
  "打开阅读器": "Open reader",
  "显示 Local Book Reader 使用引导": "Show Local Book Reader guide",
  "从个人书库打开电子书": "Open ebook from Personal Library",
  "检索摘录、想法和研究笔记": "Search excerpts, thoughts, and research notes",
  "在文件列表显示电子书文件": "Show ebook files in File Explorer",
  "在本地电子书阅读器中打开当前书籍": "Open current book in Local Book Reader",
  "候选文件": "Candidate files",
  "正在扫描…": "Scanning…",
  "输入书名、文件名或分类路径后按 Enter 搜索": "Enter a title, file name, or folder path, then press Enter",
  "按格式筛选": "Filter by format",
  "按分类筛选": "Filter by folder",
  "按阅读状态筛选": "Filter by reading status",
  "设置": "Set",
  "检查": "Check",
  "本书还没有书签。": "This book has no bookmarks yet.",
  "本书还没有摘录。": "This book has no excerpts yet.",
  "当前书籍没有可用目录。": "This book has no available table of contents.",
  "当前书籍不支持目录跳转。": "This book does not support table-of-contents navigation.",
  "该目录项没有可用的定位信息，无法跳转。": "This table-of-contents item has no usable location.",
  "无法跳转到该目录项。原书没有被修改。": "Could not open this table-of-contents item. The original book was not changed.",
  "此书签的定位方式与当前阅读器不匹配。 ": "This bookmark location does not match the current reader.",
  "已删除本地高亮；对应的 Markdown 摘录仍保留。": "Local highlight deleted; the corresponding Markdown excerpt was kept.",
  "未能安全保存摘录删除操作；请重新打开本书后确认高亮状态。": "Could not safely save the excerpt deletion. Reopen the book to confirm the highlight state.",
  "请先输入想法内容。 ": "Enter a thought first.",
  "无法写入读书笔记；原书没有被修改。 ": "Could not write the reading note. The original book was not changed.",
  "无法保存摘录；原始电子书没有被修改。": "Could not save the excerpt. The original ebook was not changed.",
  "无法保存阅读外观设置；原始电子书没有被修改。": "Could not save reading appearance. The original ebook was not changed.",
  "无法跳转到该搜索结果。": "Could not open this search result.",
  "当前阅读器尚未准备好，无法跳转到这条摘录。": "The reader is not ready to open this excerpt.",
  "无法打开此电子书；详细原因已显示在阅读器页面中。": "Could not open this ebook. Details are shown in the reader.",
  "当前书籍尚未准备好，暂时无法添加书签。": "The current book is not ready to add a bookmark.",
  "未能保存书签；请重新打开书籍后再试。": "Could not save the bookmark. Reopen the book and try again.",
  "书签已添加。": "Bookmark added.",
  "当前书籍尚未准备好，暂时无法记录想法。 ": "The current book is not ready to record a thought.",
  "想法已保存到读书笔记。 ": "Thought saved to the reading note.",
  "请先在正文中选中要摘录的文字。": "Select text in the book before saving an excerpt.",
  "摘录已保存到阅读笔记。": "Excerpt saved to the reading note.",
  "阅读外观已保存，仅应用于当前书籍。": "Reading appearance saved for this book only.",
  "当前书籍尚未准备好，暂时无法搜索。": "The current book is not ready to search.",
  "请通过命令、侧边栏按钮或文件菜单打开电子书。": "Open an ebook with a command, sidebar button, or File menu.",
  "信息仅在打开本书时从本地文件按需读取并缓存；原始电子书不会被修改。": "Information is read from the local file and cached only when this book opens. The original ebook is not changed.",
  "当前格式尚无可安全读取的详细元数据，将继续使用文件名和分类信息。": "This format has no safely readable detailed metadata, so the reader will use the file name and folder information.",
  "例如：第三章的关键论点": "For example: key argument in chapter 3",
  "将按需创建本书的 Markdown 读书笔记，并只追加这一条想法。": "Creates this book's Markdown reading note only when needed and appends only this thought.",
  "写下你的想法、问题或待核对的线索……": "Write a thought, question, or lead to verify…",
  "主题标签（可选，用空格或逗号分隔）": "Tags (optional; separate with spaces or commas)",
  "所选文字会保存到插件数据，并追加到本书的 Markdown 阅读笔记；不会修改原始电子书。": "Selected text is stored in plugin data and appended to this book's Markdown reading note. The original ebook is not changed.",
  "可选：为这段摘录写下随想": "Optional: add a note about this excerpt",
  "此处调整只保存到当前书籍，不会影响其他书籍。": "Changes here are saved only for this book and do not affect other books.",
  "输入关键词后按 Enter": "Enter a keyword, then press Enter",
  "正在搜索…": "Searching…",
  "没有找到匹配文字。": "No matching text found.",
  "搜索失败；原始电子书没有被修改。": "Search failed. The original ebook was not changed.",
  "当前书籍尚无可安全读取的详细元数据": "No detailed metadata can be safely read for this book yet.",
  "搜索结果": "Search result",
  "字符位置": "Character position",
  "输入页码后按 Enter 跳转": "Enter a page number, then press Enter to go to it",
  "搜索已保存摘录、阅读笔记中的想法和主题研究笔记；不读取或建立电子书正文索引。": "Search saved excerpts, thoughts in reading notes, and research notes. It does not read or create an ebook full-text index.",
  "摘录、想法或研究笔记关键词（按 Enter 搜索）": "Excerpt, thought, or research-note keywords (press Enter to search)",
  "按关键词、书名、标签和日期检索摘录、想法与主题研究笔记": "Search excerpts, thoughts, and research notes by keyword, book title, tag, and date",
  "例如：现代都市成长叙事": "For example: contemporary urban coming-of-age narratives",
  "将勾选的摘录写入指定主题的 Markdown 笔记；不会修改原始电子书": "Write selected excerpts to a Markdown note for the chosen topic. The original ebook is not changed.",
  "请先填写主题研究笔记名称。 ": "Enter a research-note topic name first.",
  "已创建或追加主题研究笔记；原始电子书没有被修改。 ": "Research note created or updated. The original ebook was not changed.",
  "无法写入主题研究笔记；原始电子书和已有笔记均未被修改。 ": "Could not write the research note. Original ebooks and existing notes were not changed.",
  "没有符合当前筛选条件的摘录。": "No excerpts match the current filters.",
  "尚未保存摘录。": "No excerpts saved yet.",
  "为保持界面流畅，当前只显示前 500 条结果；请继续缩小筛选范围。": "To keep the interface responsive, only the first 500 results are shown. Narrow the filters to see more.",
  "正在检索阅读笔记和主题研究笔记…": "Searching reading notes and research notes…",
  "没有符合当前筛选条件的想法或主题研究笔记。": "No thoughts or research notes match the current filters.",
  "选择《": "Select excerpts from ",
  "随想": "Note",
  "在阅读器中打开这条摘录对应的原书位置": "Open this excerpt's location in the reader",
  "无法返回原文；原书路径或定位数据可能已变化。原始电子书没有被修改。": "Could not return to the source. The book path or location data may have changed; the original ebook was not changed.",
  "打开这条内容所在的 Markdown 笔记": "Open the Markdown note that contains this item",
  "该 Markdown 笔记当前找不到。 ": "This Markdown note cannot currently be found.",
  "图书馆扫描未完成；已有索引和阅读数据已保留。请查看控制台后重试。": "Library scan did not finish. Existing index and reading data were kept. Check the console, then try again.",
  "此书文件当前找不到，已保留其阅读数据和笔记关联。": "This book file cannot currently be found. Its reading data and note links were kept.",
  "无法打开此书的读书笔记；原始电子书没有被修改。": "Could not open this book's reading note. The original ebook was not changed.",
  "已完成": "Completed",
  "未记录进度": "No progress recorded",
  "已暂停": "Paused",
  "清除本书的最近阅读历史或重置本书的阅读进度": "Clear this book's recent-reading history or reset its reading progress",
  "当前 Obsidian 环境不支持系统保存位置选择。 ": "The current Obsidian environment does not support choosing a system save location.",
  "当前 Obsidian 环境不支持系统文件选择。 ": "The current Obsidian environment does not support choosing a system file.",
  "备份文件格式不正确或版本不受支持。 ": "The backup file format is invalid or its version is unsupported.",
  "当前书籍尚未建立阅读记录，无法保存阅读外观。": "This book has no reading record yet, so its reading appearance cannot be saved.",
  "数据结构与当前版本不兼容": "The data structure is incompatible with the current version.",
  "笔记模板不能为空，且不能超过 100,000 个字符。": "The note template cannot be empty or exceed 100,000 characters.",
  "笔记目录不能位于 .obsidian 内。": "The notes folder cannot be inside .obsidian.",
  "笔记目录必须是 Vault 内的相对路径。": "The notes folder must be a relative path inside the Vault.",
  "馆主名称不能超过 80 个字符。": "Library owner name cannot exceed 80 characters.",
  "Local Book Reader 未能完成初始化，已停止本次加载；Obsidian 和原书不受影响。请查看控制台后重试。": "Local Book Reader could not finish starting and stopped loading. Obsidian and original books are unaffected. Check the console, then try again.",
  "主题研究笔记服务尚未初始化。 ": "Research-note service has not initialized.",
  "读书笔记服务尚未初始化": "Reading-note service has not initialized.",
  "阅读数据尚未初始化": "Reading data has not initialized.",
  "插件设置尚未初始化。": "Plugin settings have not initialized.",
  "原书当前不在记录的位置；请先在个人图书馆重新关联该书。": "The original book is no longer at its recorded location. Relink it in Personal Library first.",
  "后续打开的电子书将使用独立阅读窗口。": "Ebooks opened from now on will use a separate reader window.",
  "后续打开的电子书将使用 Obsidian 标签页。": "Ebooks opened from now on will use an Obsidian tab.",
  "备份内容超过 50 MB 安全上限，未写入任何文件。 ": "Backup content exceeds the 50 MB safety limit; no file was written.",
  "备份文件超过 50 MB 安全上限，未读取或恢复任何数据。 ": "Backup file exceeds the 50 MB safety limit; no data was read or restored.",
  "导出后的备份校验失败。 ": "Exported backup verification failed.",
  "已显示电子书文件。若文件树变慢，可在 Obsidian 设置中关闭“显示不支持文件类型”。": "Ebook files are now shown. If the file tree becomes slow, disable Show unsupported file types in Obsidian settings.",
  "已检测到书籍移动或重命名，但未能更新关联；原始电子书和已有笔记均未被修改。请稍后在个人图书馆刷新。 ": "A moved or renamed book was detected, but its link could not be updated. Original ebooks and existing notes were not changed. Refresh Personal Library later.",
  "当前格式无法跳转到这条摘录的位置。": "This format cannot jump to this excerpt's location.",
  "当前没有可清理的缓存文件。 ": "There are no cache files to clear.",
  "所选摘录已经不存在。 ": "The selected excerpts no longer exist.",
  "所选文件不是可恢复的 Local Book Reader 核心数据备份。 ": "The selected file is not a restorable Local Book Reader core-data backup.",
  "找不到这条摘录的本地定位数据；原始笔记内容仍可正常阅读。": "Local location data for this excerpt cannot be found; the original note content remains readable.",
  "插件设置已恢复默认值；已有笔记和电子书未被移动或修改。 ": "Plugin settings restored to defaults. Existing notes and ebooks were not moved or changed.",
  "无法保存此书的阅读数据；本次仍可只读打开，修复数据文件后再试。\n原始电子书不会被修改。": "Could not save reading data for this book. It can still open read-only; repair the data file and try again.\nThe original ebook was not changed.",
  "无法创建或打开读书笔记；原始电子书没有被修改。": "Could not create or open the reading note. The original ebook was not changed.",
  "无法打开独立阅读窗口，已改为在 Obsidian 标签页打开。": "Could not open a separate reader window, so the book opened in an Obsidian tab.",
  "无法更新文件列表显示设置；阅读器仍可通过“从个人书库打开电子书”使用。": "Could not update the file-list setting. You can still use the reader through Open ebook from Personal Library.",
  "无法返回原文；原始电子书没有被修改。": "Could not return to the source. The original ebook was not changed.",
  "核心数据已恢复。请关闭并重新打开已打开的图书馆或阅读器标签页，以显示恢复后的状态。 ": "Core data restored. Close and reopen any open library or reader tabs to show the restored state.",
  "格式不正确": "Incorrect format",
  "没有可清除的最近阅读历史。 ": "There is no recent-reading history to clear.",
  "没有可重置的阅读进度。 ": "There is no reading progress to reset.",
  "确认恢复核心数据": "Confirm restore core data",
  "确认恢复默认插件设置": "Confirm restore default plugin settings",
  "确认清理可重建缓存": "Confirm clear rebuildable cache",
  "简体中文": "Simplified Chinese",
  "请先选择支持的电子书文件。": "Select a supported ebook file first.",
  "返回原文链接缺少摘录标识。": "The Return to source link has no excerpt identifier.",
  "这本书": "this book",
  "主题名称不能为空且不能超过 120 个字符。": "Research topic name cannot be empty or exceed 120 characters.",
  "请至少选择一条摘录。": "Select at least one excerpt.",
  "此书尚未建立阅读身份，无法创建读书笔记。": "This book has no reading identity yet, so a reading note cannot be created.",
  "无法创建 PDF 页面绘制区域。": "Could not create the PDF page drawing area.",
  "无法创建重排版阅读器。": "Could not create the reflowable reader.",
  "本插件不会尝试绕过保护；请使用合法来源提供的未加密副本。": "This plugin will not bypass protection. Use an unencrypted copy provided through a lawful source.",
  "删除会移除本阅读器中的高亮和定位数据；已经写入的 Markdown 读书笔记会保留。": "Deleting removes this reader's highlight and location data. Markdown reading notes already written are kept.",
  "无法读取想法或主题研究笔记；已有摘录检索不受影响。 ": "Could not read thoughts or research notes; existing excerpt search is unaffected.",
  "主题研究笔记名称": "Research note name",
  "繁體中文": "Traditional Chinese",
  "这项操作只会清除最近打开时间。进度、书签、高亮、摘录、想法、收藏、Markdown 笔记和原始电子书都会保留。": "This clears only the last-opened time. Progress, bookmarks, highlights, excerpts, thoughts, favorites, Markdown notes, and original ebooks are all kept.",
  "这项操作只会清除上次阅读位置。书签、高亮、摘录、想法、阅读状态、收藏、Markdown 笔记和原始电子书都会保留。": "This clears only the last reading position. Bookmarks, highlights, excerpts, thoughts, reading status, favorites, Markdown notes, and original ebooks are all kept.",
  "将导出插件设置、图书索引、进度、书签、状态、收藏和本地摘录/高亮定位数据。不会导出或修改电子书、Markdown 笔记、封面和缓存。下一步将由你选择新的保存位置。": "Exports plugin settings, library index, progress, bookmarks, status, favorites, and local excerpt/highlight locations. Ebooks, Markdown notes, covers, and cache are not exported or changed. You will choose a new save location next.",
  "只会删除插件专属 cache 目录中的可重建文件。进度、书签、高亮、摘录、想法、状态、收藏、自动备份、Markdown 笔记和原始电子书都会保留。": "Deletes only rebuildable files in this plugin's cache folder. Progress, bookmarks, highlights, excerpts, thoughts, status, favorites, automatic backups, Markdown notes, and original ebooks are all kept.",
  "将恢复默认的馆主名称、读书笔记目录、主题研究目录、新笔记模板和新书默认阅读外观。已为单本书保存的外观不会改变；已有 Markdown 文件、进度、书签、高亮、摘录、想法、收藏、自动备份、缓存和电子书均不会被移动、删除或修改。": "Restores the default library owner name, note folders, new-note template, and default appearance for new books. Per-book appearance is kept. Existing Markdown files, progress, bookmarks, highlights, excerpts, thoughts, favorites, automatic backups, cache, and ebooks are never moved, deleted, or changed.",
};

// French keeps the same Chinese source keys so one t() call serves every
// language. The "vous" form is used for user-facing text.
const french: Record<string, string> = {
  "取消": "Annuler",
  "关闭": "Fermer",
  "打开": "Ouvrir",
  "删除": "Supprimer",
  "跳转": "Aller à",
  "添加": "Ajouter",
  "应用": "Appliquer",
  "保存": "Enregistrer",
  "搜索": "Rechercher",
  "暂停": "Suspendre",
  "继续扫描": "Reprendre l'analyse",
  "刷新图书馆": "Actualiser la bibliothèque",
  "个人图书馆": "Bibliothèque personnelle",
  "欢迎使用 Local Book Reader": "Bienvenue dans Local Book Reader",
  "这里直接读取 Vault 内的电子书；不会复制、移动、重命名或修改原始书籍。": "Ce plugin lit directement les livres électroniques de votre coffre (Vault). Il ne copie, ne déplace, ne renomme et ne modifie jamais les livres d'origine.",
  "打开“个人图书馆”，首次使用时点击“刷新图书馆”建立索引。": "Ouvrez Bibliothèque personnelle, puis sélectionnez Actualiser la bibliothèque la première fois pour créer l'index.",
  "索引只读取文件路径和基础属性，不读取整本正文；之后新增书籍会自动发现。": "L'index ne lit que les chemins de fichiers et les propriétés de base, pas le contenu des livres. Les livres ajoutés ensuite sont détectés automatiquement.",
  "阅读进度、书签、高亮和摘录保存在插件数据与 Markdown 笔记中，可在设置页导出核心数据备份。": "Progression de lecture, signets, surlignages et extraits sont enregistrés dans les données du plugin et les notes Markdown. Vous pouvez exporter une sauvegarde des données principales dans les paramètres.",
  "稍后探索": "Explorer plus tard",
  "打开个人图书馆": "Ouvrir la bibliothèque personnelle",
  "插件设置": "Paramètres du plugin",
  "界面语言": "Langue de l'interface",
  "选择 English、简体中文、繁體中文或 Français。切换后，重新打开已打开的插件页面即可看到完整界面更新；不会改动任何电子书、笔记或已有数据。": "Choisissez English, 简体中文, 繁體中文 ou Français. Après le changement, rouvrez les pages ouvertes du plugin pour voir la mise à jour complète de l'interface ; aucun livre, aucune note ni donnée existante n'est modifié.",
  "馆主名称": "Nom du propriétaire de la bibliothèque",
  "填写后显示为“名称 的个人图书馆”；留空则显示“个人图书馆”。名称只保存在插件设置中，不会改动电子书或索引。": "Lorsqu'il est défini, la bibliothèque s'affiche sous la forme « Bibliothèque personnelle de Nom » ; sinon « Bibliothèque personnelle ». Le nom reste dans les paramètres du plugin et ne modifie jamais les livres ni l'index.",
  "例如：Sunny D": "Par exemple : Sunny D",
  "保存名称": "Enregistrer le nom",
  "个人图书馆名称已更新。": "Nom de la bibliothèque personnelle mis à jour.",
  "无法保存名称。": "Impossible d'enregistrer le nom.",
  "读书笔记保存目录": "Dossier des notes de lecture",
  "仅允许 Vault 内、且不在 .obsidian 内的相对路径。目录会在你首次主动创建笔记时才建立。": "Utilisez un chemin relatif dans le coffre (Vault), mais pas dans .obsidian. Le dossier n'est créé que lorsque vous choisissez de créer une note.",
  "保存目录": "Enregistrer le dossier",
  "读书笔记保存目录已更新。": "Dossier des notes de lecture mis à jour.",
  "无法保存目录：请填写 Vault 内的有效相对路径。": "Impossible d'enregistrer le dossier : saisissez un chemin relatif valide dans le coffre (Vault).",
  "主题研究笔记保存目录": "Dossier des notes de recherche",
  "用于从摘录检索创建或追加主题研究笔记；仅允许 Vault 内、且不在 .obsidian 内的相对路径。": "Utilisé pour créer ou compléter des notes de recherche depuis la recherche d'extraits. Utilisez un chemin relatif dans le coffre (Vault), mais pas dans .obsidian.",
  "主题研究笔记保存目录已更新。 ": "Dossier des notes de recherche mis à jour. ",
  "新读书笔记默认模板": "Modèle par défaut des nouvelles notes de lecture",
  "可使用 {{title}}、{{bookId}}、{{bookPath}}、{{format}}、{{readingStatus}}、{{created}}，以及对应的 Json 占位符（如 {{titleJson}}）。模板仅在新建笔记时使用。": "Vous pouvez utiliser {{title}}, {{bookId}}, {{bookPath}}, {{format}}, {{readingStatus}}, {{created}} et leurs équivalents JSON (par exemple {{titleJson}}). Le modèle n'est utilisé que pour les nouvelles notes.",
  "保存模板": "Enregistrer le modèle",
  "新读书笔记默认模板已更新。": "Modèle par défaut des notes de lecture mis à jour.",
  "无法保存模板：模板不能为空且不能过长。": "Impossible d'enregistrer le modèle : il ne peut pas être vide ni trop long.",
  "恢复默认插件设置": "Restaurer les paramètres par défaut du plugin",
  "只恢复馆主名称、读书笔记目录、主题研究目录、新笔记模板和新书默认阅读外观。已为单本书保存的外观不会改变；不会移动或删除已有 Markdown、阅读数据或电子书。": "Restaure uniquement le nom du propriétaire, les dossiers de notes, le modèle des nouvelles notes et l'apparence par défaut des nouveaux livres. L'apparence propre à chaque livre est conservée. Les notes Markdown, les données de lecture et les livres électroniques existants ne sont jamais déplacés ni supprimés.",
  "恢复默认设置": "Restaurer les valeurs par défaut",
  "电子书打开位置": "Emplacement d'ouverture des livres électroniques",
  "默认在 Obsidian 标签页打开。选择“独立阅读窗口”可减轻关闭大型 EPUB 时主窗口的卡顿；关闭时仍可能有短暂等待，且不会改动电子书或阅读数据。": "Par défaut, les livres s'ouvrent dans un onglet Obsidian. Une fenêtre de lecture séparée peut réduire les ralentissements à la fermeture des gros EPUB. La fermeture peut encore prendre un instant ; les livres et les données de lecture ne sont jamais modifiés.",
  "Obsidian 标签页（默认）": "Onglet Obsidian (par défaut)",
  "独立阅读窗口（减轻关闭卡顿）": "Fenêtre de lecture séparée (réduit la pause à la fermeture)",
  "阅读数据维护": "Maintenance des données de lecture",
  "清除全部最近阅读历史": "Effacer tout l'historique de lecture récent",
  "仅清除“最近阅读”的打开时间记录。不会删除进度、书签、高亮、摘录、想法、收藏、Markdown 笔记或原始电子书。": "Efface uniquement les heures d'ouverture de Lecture récente. Ne supprime jamais la progression, les signets, les surlignages, les extraits, les pensées, les favoris, les notes Markdown ni les livres électroniques d'origine.",
  "清除全部历史": "Effacer tout l'historique",
  "重置全部阅读进度": "Réinitialiser toute la progression de lecture",
  "仅清除每本书的上次阅读位置。不会删除书签、高亮、摘录、想法、阅读状态、收藏、Markdown 笔记或原始电子书。": "Efface uniquement la dernière position de lecture de chaque livre. Ne supprime jamais les signets, les surlignages, les extraits, les pensées, les statuts de lecture, les favoris, les notes Markdown ni les livres électroniques d'origine.",
  "重置全部进度": "Réinitialiser toute la progression",
  "备份与恢复": "Sauvegarde et restauration",
  "导出核心数据备份": "Exporter la sauvegarde des données principales",
  "导出插件设置、图书索引、进度、书签、状态、收藏和本地摘录/高亮定位数据。不会导出电子书、Markdown 笔记、封面或缓存；由你通过系统窗口选择保存位置。": "Exporte les paramètres du plugin, l'index de la bibliothèque, la progression, les signets, les statuts, les favoris et les données de localisation locales des extraits/surlignages. N'exporte jamais les livres électroniques, les notes Markdown, les couvertures ni le cache. Vous choisissez la destination dans une fenêtre système.",
  "导出备份": "Exporter la sauvegarde",
  "从备份恢复核心数据": "Restaurer les données principales depuis une sauvegarde",
  "只读取你主动选择的 Local Book Reader 备份文件。恢复前会显示备份摘要并要求确认；恢复前自动保存当前核心数据。电子书和 Markdown 笔记不会被读取或修改。": "Lit uniquement un fichier de sauvegarde Local Book Reader que vous choisissez. Un résumé s'affiche et une confirmation est demandée avant la restauration ; les données principales actuelles sont sauvegardées automatiquement au préalable. Les livres électroniques et les notes Markdown ne sont ni lus ni modifiés.",
  "选择备份文件": "Choisir le fichier de sauvegarde",
  "缓存维护": "Maintenance du cache",
  "正在读取缓存占用…": "Lecture de l'utilisation du cache…",
  "无法读取缓存占用；现有阅读数据未受影响。 ": "Impossible de lire l'utilisation du cache ; les données de lecture existantes ne sont pas affectées. ",
  "清理可重建缓存": "Vider le cache reconstruisible",
  "只清理插件专属 cache 目录中的可重建文件。不会删除进度、书签、高亮、摘录、想法、状态、收藏、自动备份、Markdown 笔记或电子书。": "Supprime uniquement les fichiers reconstruisibles du dossier cache propre au plugin. Ne supprime jamais la progression, les signets, les surlignages, les extraits, les pensées, les statuts, les favoris, les sauvegardes automatiques, les notes Markdown ni les livres électroniques.",
  "清理缓存": "Vider le cache",
  "未读": "Non lu",
  "正在阅读": "En cours de lecture",
  "已读": "Terminé",
  "疑似重复文件": "Fichiers potentiellement en double",
  "仅按同名、同格式和同文件大小列出候选，不读取正文或计算文件哈希，因此结果只供人工核对。插件不会自动合并、移动、修改或删除任何电子书。": "Les candidats correspondent uniquement au nom, au format et à la taille du fichier. Le contenu et les empreintes ne sont pas lus, examinez donc les résultats manuellement. Le plugin ne fusionne, ne déplace, ne modifie et ne supprime jamais automatiquement des livres électroniques.",
  "当前书籍": "Livre actuel",
  "没有发现符合当前保守规则的疑似重复文件。": "Aucun fichier potentiellement en double ne correspond aux règles prudentes actuelles.",
  "仅索引文件名和基础属性；不会读取正文、提取封面或修改原始电子书。": "Indexe uniquement les noms de fichiers et les propriétés de base. Il ne lit pas le contenu des livres, n'extrait pas les couvertures et ne modifie pas les livres électroniques d'origine.",
  "尚未建立图书馆索引。点击“刷新图书馆”开始。 ": "Aucun index de bibliothèque pour l'instant. Sélectionnez Actualiser la bibliothèque pour commencer. ",
  "全部格式": "Tous les formats",
  "全部分类": "Tous les dossiers",
  "全部状态": "Tous les statuts",
  "文件缺失": "Fichier manquant",
  "仅看收藏": "Favoris uniquement",
  "最近阅读": "Lecture récente",
  "尚无索引。请先点击“刷新图书馆”。": "Aucun index pour l'instant. Sélectionnez d'abord Actualiser la bibliothèque.",
  "没有符合当前筛选条件的书籍。": "Aucun livre ne correspond aux filtres actuels.",
  "根目录": "Racine du coffre",
  "笔记": "Notes",
  "收藏": "Favori",
  "取消收藏": "Retirer des favoris",
  "管理": "Gérer",
  "清除本书最近阅读历史": "Effacer l'historique de lecture récent de ce livre",
  "重置本书阅读进度": "Réinitialiser la progression de lecture de ce livre",
  "检查疑似重复文件": "Vérifier les doublons possibles",
  "书籍信息": "Informations sur le livre",
  "书名": "Titre",
  "作者": "Auteur",
  "出版社": "Éditeur",
  "出版日期": "Publié",
  "语言": "Langue",
  "标识符": "Identifiant",
  "格式": "Format",
  "分类": "Dossier",
  "本地缓存封面": "Couverture en cache local",
  "添加书签": "Ajouter un signet",
  "可选：为书签填写名称或简短说明。": "Facultatif : donnez un nom ou une courte note au signet.",
  "记录想法": "Enregistrer une pensée",
  "保存到读书笔记": "Enregistrer dans la note de lecture",
  "保存摘录": "Enregistrer l'extrait",
  "阅读外观": "Apparence de lecture",
  "字号": "Taille du texte",
  "行距": "Interligne",
  "页边距": "Marges",
  "主题": "Thème",
  "跟随 Obsidian": "Suivre Obsidian",
  "浅色": "Clair",
  "深色": "Sombre",
  "护眼": "Sépia",
  "阅读方式": "Mode de lecture",
  "分页": "Paginé",
  "连续滚动": "Défilement continu",
  "搜索正文": "Rechercher dans le texte",
  "上一页": "Page précédente",
  "下一页": "Page suivante",
  "书签": "Signets",
  "目录": "Table des matières",
  "摘录所选文字": "Extraire le texte sélectionné",
  "摘录": "Extraits",
  "页码": "Page",
  "缩小": "Réduire",
  "放大": "Agrandir",
  "适宽": "Ajuster à la largeur",
  "无法打开电子书": "Impossible d'ouvrir le livre électronique",
  "未命名章节": "Chapitre sans titre",
  "未命名书签": "Signet sans titre",
  "删除高亮": "Supprimer le surlignage",
  "摘录与笔记检索": "Recherche d'extraits et de notes",
  "书名筛选": "Filtrer par titre",
  "标签筛选（不带 #）": "Filtrer par étiquette (sans #)",
  "开始日期": "Date de début",
  "结束日期": "Date de fin",
  "主题名称": "Nom du sujet de recherche",
  "创建/追加主题研究笔记": "Créer/compléter une note de recherche",
  "想法与主题研究笔记": "Pensées et notes de recherche",
  "返回原文": "Retour à la source",
  "打开笔记": "Ouvrir la note",
  "想法": "Pensée",
  "主题研究笔记": "Note de recherche",
  "确认清除": "Confirmer l'effacement",
  "确认重置": "Confirmer la réinitialisation",
  "确认恢复": "Confirmer la restauration",
  "确认清理缓存": "Confirmer la vidange du cache",
  "选择保存位置": "Choisir l'emplacement de sauvegarde",
  "确认恢复默认设置": "Confirmer la restauration des valeurs par défaut",
  "Local Book Reader 备份": "Sauvegarde Local Book Reader",
  "输入书名、作者、文件夹或扩展名进行筛选": "Filtrer par titre, auteur, dossier ou extension de fichier",
  "选择": "Sélectionner",
  "打开阅读器": "Ouvrir le lecteur",
  "显示 Local Book Reader 使用引导": "Afficher le guide de Local Book Reader",
  "从个人书库打开电子书": "Ouvrir un livre électronique depuis la bibliothèque personnelle",
  "检索摘录、想法和研究笔记": "Rechercher des extraits, pensées et notes de recherche",
  "在文件列表显示电子书文件": "Afficher les livres électroniques dans l'explorateur de fichiers",
  "在本地电子书阅读器中打开当前书籍": "Ouvrir le livre actuel dans Local Book Reader",
  "候选文件": "Fichiers candidats",
  "正在扫描…": "Analyse en cours…",
  "输入书名、文件名或分类路径后按 Enter 搜索": "Saisissez un titre, un nom de fichier ou un chemin de dossier, puis appuyez sur Entrée",
  "按格式筛选": "Filtrer par format",
  "按分类筛选": "Filtrer par dossier",
  "按阅读状态筛选": "Filtrer par statut de lecture",
  "设置": "Définir",
  "检查": "Vérifier",
  "本书还没有书签。": "Ce livre n'a pas encore de signets.",
  "本书还没有摘录。": "Ce livre n'a pas encore d'extraits.",
  "当前书籍没有可用目录。": "Ce livre n'a pas de table des matières disponible.",
  "当前书籍不支持目录跳转。": "Ce livre ne prend pas en charge la navigation par table des matières.",
  "该目录项没有可用的定位信息，无法跳转。": "Cet élément de la table des matières n'a pas d'emplacement utilisable.",
  "无法跳转到该目录项。原书没有被修改。": "Impossible d'ouvrir cet élément de la table des matières. Le livre d'origine n'a pas été modifié.",
  "此书签的定位方式与当前阅读器不匹配。 ": "L'emplacement de ce signet ne correspond pas au lecteur actuel. ",
  "已删除本地高亮；对应的 Markdown 摘录仍保留。": "Surlignage local supprimé ; l'extrait Markdown correspondant a été conservé.",
  "未能安全保存摘录删除操作；请重新打开本书后确认高亮状态。": "Impossible d'enregistrer la suppression de l'extrait en toute sécurité. Rouvrez le livre pour vérifier l'état du surlignage.",
  "请先输入想法内容。 ": "Saisissez d'abord le contenu d'une pensée. ",
  "无法写入读书笔记；原书没有被修改。 ": "Impossible d'écrire la note de lecture. Le livre d'origine n'a pas été modifié. ",
  "无法保存摘录；原始电子书没有被修改。": "Impossible d'enregistrer l'extrait. Le livre électronique d'origine n'a pas été modifié.",
  "无法保存阅读外观设置；原始电子书没有被修改。": "Impossible d'enregistrer l'apparence de lecture. Le livre électronique d'origine n'a pas été modifié.",
  "无法跳转到该搜索结果。": "Impossible d'ouvrir ce résultat de recherche.",
  "当前阅读器尚未准备好，无法跳转到这条摘录。": "Le lecteur n'est pas prêt à ouvrir cet extrait.",
  "无法打开此电子书；详细原因已显示在阅读器页面中。": "Impossible d'ouvrir ce livre électronique. Les détails sont affichés dans le lecteur.",
  "当前书籍尚未准备好，暂时无法添加书签。": "Le livre actuel n'est pas prêt pour ajouter un signet.",
  "未能保存书签；请重新打开书籍后再试。": "Impossible d'enregistrer le signet. Rouvrez le livre et réessayez.",
  "书签已添加。": "Signet ajouté.",
  "当前书籍尚未准备好，暂时无法记录想法。 ": "Le livre actuel n'est pas prêt pour enregistrer une pensée. ",
  "想法已保存到读书笔记。 ": "Pensée enregistrée dans la note de lecture. ",
  "请先在正文中选中要摘录的文字。": "Sélectionnez du texte dans le livre avant d'enregistrer un extrait.",
  "摘录已保存到阅读笔记。": "Extrait enregistré dans la note de lecture.",
  "阅读外观已保存，仅应用于当前书籍。": "Apparence de lecture enregistrée pour ce livre uniquement.",
  "当前书籍尚未准备好，暂时无法搜索。": "Le livre actuel n'est pas prêt pour la recherche.",
  "请通过命令、侧边栏按钮或文件菜单打开电子书。": "Ouvrez un livre électronique avec une commande, un bouton de la barre latérale ou le menu Fichier.",
  "信息仅在打开本书时从本地文件按需读取并缓存；原始电子书不会被修改。": "Les informations sont lues depuis le fichier local et mises en cache uniquement à l'ouverture de ce livre. Le livre électronique d'origine n'est pas modifié.",
  "当前格式尚无可安全读取的详细元数据，将继续使用文件名和分类信息。": "Ce format n'a pas de métadonnées détaillées lisibles en toute sécurité ; le lecteur utilisera donc le nom de fichier et le dossier.",
  "例如：第三章的关键论点": "Par exemple : argument clé du chapitre 3",
  "将按需创建本书的 Markdown 读书笔记，并只追加这一条想法。": "Crée la note de lecture Markdown de ce livre uniquement si nécessaire et n'ajoute que cette pensée.",
  "写下你的想法、问题或待核对的线索……": "Écrivez votre pensée, votre question ou la piste à vérifier…",
  "主题标签（可选，用空格或逗号分隔）": "Étiquettes (facultatif ; séparez-les par des espaces ou des virgules)",
  "所选文字会保存到插件数据，并追加到本书的 Markdown 阅读笔记；不会修改原始电子书。": "Le texte sélectionné est enregistré dans les données du plugin et ajouté à la note de lecture Markdown de ce livre. Le livre électronique d'origine n'est pas modifié.",
  "可选：为这段摘录写下随想": "Facultatif : ajoutez une note à propos de cet extrait",
  "此处调整只保存到当前书籍，不会影响其他书籍。": "Ces réglages ne sont enregistrés que pour ce livre et n'affectent pas les autres livres.",
  "输入关键词后按 Enter": "Saisissez un mot-clé, puis appuyez sur Entrée",
  "正在搜索…": "Recherche en cours…",
  "没有找到匹配文字。": "Aucun texte correspondant trouvé.",
  "搜索失败；原始电子书没有被修改。": "Échec de la recherche. Le livre électronique d'origine n'a pas été modifié.",
  "当前书籍尚无可安全读取的详细元数据": "Aucune métadonnée détaillée ne peut encore être lue en toute sécurité pour ce livre",
  "搜索结果": "Résultat de recherche",
  "字符位置": "Position du caractère",
  "输入页码后按 Enter 跳转": "Saisissez un numéro de page, puis appuyez sur Entrée pour y aller",
  "搜索已保存摘录、阅读笔记中的想法和主题研究笔记；不读取或建立电子书正文索引。": "Recherche les extraits enregistrés, les pensées des notes de lecture et les notes de recherche. Il ne lit ni ne crée d'index plein texte des livres électroniques.",
  "摘录、想法或研究笔记关键词（按 Enter 搜索）": "Mots-clés d'extrait, de pensée ou de note de recherche (appuyez sur Entrée pour rechercher)",
  "按关键词、书名、标签和日期检索摘录、想法与主题研究笔记": "Rechercher des extraits, pensées et notes de recherche par mot-clé, titre, étiquette et date",
  "例如：现代都市成长叙事": "Par exemple : récits urbains contemporains de passage à l'âge adulte",
  "将勾选的摘录写入指定主题的 Markdown 笔记；不会修改原始电子书": "Écrit les extraits sélectionnés dans une note Markdown pour le sujet choisi. Le livre électronique d'origine n'est pas modifié.",
  "请先填写主题研究笔记名称。 ": "Saisissez d'abord le nom du sujet de la note de recherche. ",
  "已创建或追加主题研究笔记；原始电子书没有被修改。 ": "Note de recherche créée ou complétée. Le livre électronique d'origine n'a pas été modifié. ",
  "无法写入主题研究笔记；原始电子书和已有笔记均未被修改。 ": "Impossible d'écrire la note de recherche. Les livres électroniques d'origine et les notes existantes n'ont pas été modifiés. ",
  "没有符合当前筛选条件的摘录。": "Aucun extrait ne correspond aux filtres actuels.",
  "尚未保存摘录。": "Aucun extrait enregistré pour l'instant.",
  "为保持界面流畅，当前只显示前 500 条结果；请继续缩小筛选范围。": "Pour garder une interface réactive, seuls les 500 premiers résultats sont affichés. Affinez les filtres pour en voir plus.",
  "正在检索阅读笔记和主题研究笔记…": "Recherche des notes de lecture et des notes de recherche…",
  "没有符合当前筛选条件的想法或主题研究笔记。": "Aucune pensée ni note de recherche ne correspond aux filtres actuels.",
  "选择《": "Sélectionner les extraits de ",
  "随想": "Note",
  "在阅读器中打开这条摘录对应的原书位置": "Ouvrir l'emplacement de cet extrait dans le lecteur",
  "无法返回原文；原书路径或定位数据可能已变化。原始电子书没有被修改。": "Impossible de retourner à la source. Le chemin ou les données d'emplacement du livre ont peut-être changé ; le livre électronique d'origine n'a pas été modifié.",
  "打开这条内容所在的 Markdown 笔记": "Ouvrir la note Markdown qui contient cet élément",
  "该 Markdown 笔记当前找不到。 ": "Cette note Markdown est introuvable pour l'instant. ",
  "图书馆扫描未完成；已有索引和阅读数据已保留。请查看控制台后重试。": "L'analyse de la bibliothèque ne s'est pas terminée. L'index et les données de lecture existants ont été conservés. Vérifiez la console, puis réessayez.",
  "此书文件当前找不到，已保留其阅读数据和笔记关联。": "Ce fichier de livre est introuvable pour l'instant. Ses données de lecture et ses liens de notes ont été conservés.",
  "无法打开此书的读书笔记；原始电子书没有被修改。": "Impossible d'ouvrir la note de lecture de ce livre. Le livre électronique d'origine n'a pas été modifié.",
  "已完成": "Terminé",
  "未记录进度": "Aucune progression enregistrée",
  "已暂停": "En pause",
  "清除本书的最近阅读历史或重置本书的阅读进度": "Effacer l'historique de lecture récent de ce livre ou réinitialiser sa progression de lecture",
  "当前 Obsidian 环境不支持系统保存位置选择。 ": "L'environnement Obsidian actuel ne prend pas en charge le choix d'un emplacement de sauvegarde système. ",
  "当前 Obsidian 环境不支持系统文件选择。 ": "L'environnement Obsidian actuel ne prend pas en charge le choix d'un fichier système. ",
  "备份文件格式不正确或版本不受支持。 ": "Le format du fichier de sauvegarde est invalide ou sa version n'est pas prise en charge. ",
  "当前书籍尚未建立阅读记录，无法保存阅读外观。": "Ce livre n'a pas encore de fiche de lecture ; son apparence de lecture ne peut donc pas être enregistrée.",
  "数据结构与当前版本不兼容": "La structure des données est incompatible avec la version actuelle",
  "笔记模板不能为空，且不能超过 100,000 个字符。": "Le modèle de note ne peut pas être vide ni dépasser 100 000 caractères.",
  "笔记目录不能位于 .obsidian 内。": "Le dossier des notes ne peut pas se trouver dans .obsidian.",
  "笔记目录必须是 Vault 内的相对路径。": "Le dossier des notes doit être un chemin relatif dans le coffre (Vault).",
  "馆主名称不能超过 80 个字符。": "Le nom du propriétaire de la bibliothèque ne peut pas dépasser 80 caractères.",
  "Local Book Reader 未能完成初始化，已停止本次加载；Obsidian 和原书不受影响。请查看控制台后重试。": "Local Book Reader n'a pas pu terminer son démarrage et a arrêté le chargement. Obsidian et les livres d'origine ne sont pas affectés. Vérifiez la console, puis réessayez.",
  "主题研究笔记服务尚未初始化。 ": "Le service de notes de recherche n'est pas initialisé. ",
  "读书笔记服务尚未初始化": "Le service de notes de lecture n'est pas initialisé",
  "阅读数据尚未初始化": "Les données de lecture ne sont pas initialisées",
  "插件设置尚未初始化。": "Les paramètres du plugin ne sont pas initialisés.",
  "原书当前不在记录的位置；请先在个人图书馆重新关联该书。": "Le livre d'origine n'est plus à l'emplacement enregistré. Réassociez-le d'abord dans la bibliothèque personnelle.",
  "后续打开的电子书将使用独立阅读窗口。": "Les livres électroniques ouverts à partir de maintenant utiliseront une fenêtre de lecture séparée.",
  "后续打开的电子书将使用 Obsidian 标签页。": "Les livres électroniques ouverts à partir de maintenant utiliseront un onglet Obsidian.",
  "备份内容超过 50 MB 安全上限，未写入任何文件。 ": "Le contenu de la sauvegarde dépasse la limite de sécurité de 50 Mo ; aucun fichier n'a été écrit. ",
  "备份文件超过 50 MB 安全上限，未读取或恢复任何数据。 ": "Le fichier de sauvegarde dépasse la limite de sécurité de 50 Mo ; aucune donnée n'a été lue ni restaurée. ",
  "导出后的备份校验失败。 ": "La vérification de la sauvegarde exportée a échoué. ",
  "已显示电子书文件。若文件树变慢，可在 Obsidian 设置中关闭“显示不支持文件类型”。": "Les fichiers de livres électroniques sont maintenant affichés. Si l'arborescence des fichiers devient lente, désactivez Afficher les types de fichiers non pris en charge dans les paramètres d'Obsidian.",
  "已检测到书籍移动或重命名，但未能更新关联；原始电子书和已有笔记均未被修改。请稍后在个人图书馆刷新。 ": "Un livre déplacé ou renommé a été détecté, mais son lien n'a pas pu être mis à jour. Les livres électroniques d'origine et les notes existantes n'ont pas été modifiés. Actualisez la bibliothèque personnelle plus tard. ",
  "当前格式无法跳转到这条摘录的位置。": "Ce format ne peut pas ouvrir l'emplacement de cet extrait.",
  "当前没有可清理的缓存文件。 ": "Il n'y a aucun fichier de cache à supprimer. ",
  "所选摘录已经不存在。 ": "Les extraits sélectionnés n'existent plus. ",
  "所选文件不是可恢复的 Local Book Reader 核心数据备份。 ": "Le fichier sélectionné n'est pas une sauvegarde restaurable des données principales de Local Book Reader. ",
  "找不到这条摘录的本地定位数据；原始笔记内容仍可正常阅读。": "Les données d'emplacement locales de cet extrait sont introuvables ; le contenu de la note d'origine reste lisible.",
  "插件设置已恢复默认值；已有笔记和电子书未被移动或修改。 ": "Paramètres du plugin restaurés aux valeurs par défaut. Les notes et livres électroniques existants n'ont pas été déplacés ni modifiés. ",
  "无法保存此书的阅读数据；本次仍可只读打开，修复数据文件后再试。\n原始电子书不会被修改。": "Impossible d'enregistrer les données de lecture de ce livre. Il peut encore s'ouvrir en lecture seule ; réparez le fichier de données et réessayez.\nLe livre électronique d'origine n'a pas été modifié.",
  "无法创建或打开读书笔记；原始电子书没有被修改。": "Impossible de créer ou d'ouvrir la note de lecture. Le livre électronique d'origine n'a pas été modifié.",
  "无法打开独立阅读窗口，已改为在 Obsidian 标签页打开。": "Impossible d'ouvrir une fenêtre de lecture séparée ; le livre s'est ouvert dans un onglet Obsidian.",
  "无法更新文件列表显示设置；阅读器仍可通过“从个人书库打开电子书”使用。": "Impossible de mettre à jour le réglage de l'explorateur de fichiers. Vous pouvez toujours utiliser le lecteur via Ouvrir un livre électronique depuis la bibliothèque personnelle.",
  "无法返回原文；原始电子书没有被修改。": "Impossible de retourner à la source. Le livre électronique d'origine n'a pas été modifié.",
  "核心数据已恢复。请关闭并重新打开已打开的图书馆或阅读器标签页，以显示恢复后的状态。 ": "Données principales restaurées. Fermez puis rouvrez les onglets de bibliothèque ou de lecteur ouverts pour afficher l'état restauré. ",
  "格式不正确": "Format incorrect",
  "没有可清除的最近阅读历史。 ": "Il n'y a aucun historique de lecture récent à effacer. ",
  "没有可重置的阅读进度。 ": "Il n'y a aucune progression de lecture à réinitialiser. ",
  "确认恢复核心数据": "Confirmer la restauration des données principales",
  "确认恢复默认插件设置": "Confirmer la restauration des paramètres par défaut du plugin",
  "确认清理可重建缓存": "Confirmer la vidange du cache reconstruisible",
  "简体中文": "Chinois simplifié",
  "繁體中文": "Chinois traditionnel",
  "English": "Anglais",
  "Français": "Français",
  "请先选择支持的电子书文件。": "Sélectionnez d'abord un fichier de livre électronique pris en charge.",
  "返回原文链接缺少摘录标识。": "Le lien Retour à la source n'a pas d'identifiant d'extrait.",
  "这本书": "ce livre",
  "主题名称不能为空且不能超过 120 个字符。": "Le nom du sujet de recherche ne peut pas être vide ni dépasser 120 caractères.",
  "请至少选择一条摘录。": "Sélectionnez au moins un extrait.",
  "此书尚未建立阅读身份，无法创建读书笔记。": "Ce livre n'a pas encore d'identité de lecture ; une note de lecture ne peut donc pas être créée.",
  "无法创建 PDF 页面绘制区域。": "Impossible de créer la zone de rendu de la page PDF.",
  "无法创建重排版阅读器。": "Impossible de créer le lecteur de livres remis en page.",
  "本插件不会尝试绕过保护；请使用合法来源提供的未加密副本。": "Ce plugin ne contournera pas la protection. Utilisez une copie non chiffrée provenant d'une source légale.",
  "删除会移除本阅读器中的高亮和定位数据；已经写入的 Markdown 读书笔记会保留。": "La suppression retire le surlignage et les données d'emplacement de ce lecteur. Les notes de lecture Markdown déjà écrites sont conservées.",
  "无法读取想法或主题研究笔记；已有摘录检索不受影响。 ": "Impossible de lire les pensées ou notes de recherche ; la recherche d'extraits existante n'est pas affectée. ",
  "主题研究笔记名称": "Nom de la note de recherche",
  "这项操作只会清除最近打开时间。进度、书签、高亮、摘录、想法、收藏、Markdown 笔记和原始电子书都会保留。": "Cette opération n'efface que la dernière heure d'ouverture. Progression, signets, surlignages, extraits, pensées, favoris, notes Markdown et livres électroniques d'origine sont tous conservés.",
  "这项操作只会清除上次阅读位置。书签、高亮、摘录、想法、阅读状态、收藏、Markdown 笔记和原始电子书都会保留。": "Cette opération n'efface que la dernière position de lecture. Signets, surlignages, extraits, pensées, statuts de lecture, favoris, notes Markdown et livres électroniques d'origine sont tous conservés.",
  "将导出插件设置、图书索引、进度、书签、状态、收藏和本地摘录/高亮定位数据。不会导出或修改电子书、Markdown 笔记、封面和缓存。下一步将由你选择新的保存位置。": "Exportera les paramètres du plugin, l'index de la bibliothèque, la progression, les signets, les statuts, les favoris et les données de localisation locales des extraits/surlignages. Les livres électroniques, notes Markdown, couvertures et cache ne seront ni exportés ni modifiés. Vous choisirez ensuite un nouvel emplacement de sauvegarde.",
  "只会删除插件专属 cache 目录中的可重建文件。进度、书签、高亮、摘录、想法、状态、收藏、自动备份、Markdown 笔记和原始电子书都会保留。": "Supprimera uniquement les fichiers reconstruisibles du dossier cache propre au plugin. Progression, signets, surlignages, extraits, pensées, statuts, favoris, sauvegardes automatiques, notes Markdown et livres électroniques d'origine sont tous conservés.",
  "将恢复默认的馆主名称、读书笔记目录、主题研究目录、新笔记模板和新书默认阅读外观。已为单本书保存的外观不会改变；已有 Markdown 文件、进度、书签、高亮、摘录、想法、收藏、自动备份、缓存和电子书均不会被移动、删除或修改。": "Restaurera le nom du propriétaire par défaut, les dossiers de notes, le modèle des nouvelles notes et l'apparence par défaut des nouveaux livres. L'apparence propre à chaque livre est conservée. Les fichiers Markdown, la progression, les signets, les surlignages, les extraits, les pensées, les favoris, les sauvegardes automatiques, le cache et les livres électroniques existants ne seront jamais déplacés, supprimés ni modifiés.",
};

const chinese = Object.fromEntries(Object.entries(english).map(([source, translated]) => [translated, source]));

// The source strings are Simplified Chinese. This character map covers every
// Simplified-to-Traditional difference used by the interface and also handles
// dynamic status strings without changing ebook content or user data.
const traditionalCharacters: Record<string, string> = {
  "与": "與", "个": "個", "为": "為", "书": "書", "仅": "僅", "从": "從", "会": "會", "体": "體", "关": "關", "内": "內",
  "写": "寫", "准": "準", "击": "擊", "创": "創", "删": "刪", "务": "務", "动": "動", "历": "歷", "发": "發", "变": "變",
  "叙": "敘", "台": "臺", "号": "號", "响": "響", "图": "圖", "备": "備", "复": "復", "夹": "夾", "宽": "寬", "对": "對",
  "将": "將", "属": "屬", "带": "帶", "库": "庫", "应": "應", "开": "開", "当": "當", "录": "錄", "径": "徑", "态": "態",
  "扩": "擴", "护": "護", "择": "擇", "换": "換", "据": "據", "数": "數", "无": "無", "时": "時", "显": "顯", "暂": "暫",
  "条": "條", "标": "標", "树": "樹", "检": "檢", "没": "沒", "浅": "淺", "点": "點", "状": "狀", "独": "獨", "环": "環",
  "现": "現", "电": "電", "码": "碼", "础": "礎", "确": "確", "称": "稱", "笔": "筆", "筛": "篩", "签": "簽", "简": "簡",
  "类": "類", "经": "經", "结": "結", "统": "統", "缓": "緩", "缩": "縮", "联": "聯", "认": "認", "记": "記", "许": "許",
  "论": "論", "设": "設", "识": "識", "词": "詞", "试": "試", "该": "該", "语": "語", "请": "請", "读": "讀", "转": "轉",
  "载": "載", "输": "輸", "边": "邊", "过": "過", "这": "這", "进": "進", "适": "適", "选": "選", "键": "鍵", "长": "長",
  "闭": "閉", "间": "間", "阅": "閱", "随": "隨", "页": "頁", "项": "項", "题": "題", "馆": "館"
};

function toTraditional(source: string): string {
  return [...source].map((character) => traditionalCharacters[character] ?? character).join("");
}

export function setLanguage(language: UiLanguage): void {
  activeLanguage = language;
  window.dispatchEvent(new CustomEvent("local-book-reader-language-changed"));
}

export function getLanguage(): UiLanguage {
  return activeLanguage;
}

export function t(source: string): string {
  if (activeLanguage === "fr") return french[source] ?? translateDynamicToFrench(source);
  if (activeLanguage === "en") return english[source] ?? translateDynamicToEnglish(source);
  if (activeLanguage === "zh-TW") {
    // Convert only plugin-owned UI strings (static map keys and known dynamic
    // templates). Everything else, including book names, paths, and user
    // content, must pass through unchanged.
    if (english[source] !== undefined) return toTraditional(source);
    if (chinese[source] !== undefined) return toTraditional(chinese[source]);
    if (translateDynamicToEnglish(source) !== source) return toTraditional(source);
    return source;
  }
  return chinese[source] ?? source;
}

function translateDynamicToEnglish(source: string): string {
  let match = source.match(/^已索引 (\d+) 本书。$/u);
  if (match) return `${match[1]} books indexed.`;
  match = source.match(/^显示 (\d+) \/ (\d+) 本已索引书籍$/u);
  if (match) return `Showing ${match[1]} of ${match[2]} indexed books`;
  match = source.match(/^显示 (\d+) \/ (\d+) 条已保存摘录$/u);
  if (match) return `Showing ${match[1]} of ${match[2]} saved excerpts`;
  match = source.match(/^显示 (\d+) \/ (\d+) 条 Markdown 内容$/u);
  if (match) return `Showing ${match[1]} of ${match[2]} Markdown entries`;
  match = source.match(/^已选择 (\d+) 条摘录$/u);
  if (match) return `${match[1]} excerpts selected`;
  match = source.match(/^核心阅读数据：(.+)；可清理缓存：(.+) \/ (.+)（(\d+) 个文件）$/u);
  if (match) return `Core reading data: ${match[1]}; rebuildable cache: ${match[2]} / ${match[3]} (${match[4]} ${match[4] === "1" ? "file" : "files"})`;
  match = source.match(/^第 (\d+) \/ (\d+) 页 · (\d+)%$/u);
  if (match) return `Page ${match[1]} of ${match[2]} · ${match[3]}%`;
  match = source.match(/^第 (\d+) 页$/u);
  if (match) return `Page ${match[1]}`;
  match = source.match(/^进度 (\d+)%$/u);
  if (match) return `Progress ${match[1]}%`;
  match = source.match(/^阅读进度 (\d+)%$/u);
  if (match) return `Reading progress ${match[1]}%`;
  match = source.match(/^已找到 (\d+) 处$/u);
  if (match) return `${match[1]} matches found`;
  match = source.match(/^找到 (\d+) 处$/u);
  if (match) return `${match[1]} matches found`;
  match = source.match(/^正在扫描：([\d,]+) \/ ([\d,]+)，新发现 ([\d,]+) 本。$/u);
  if (match) return `Scanning: ${match[1]} / ${match[2]}, ${match[3]} new books found.`;
  match = source.match(/^已暂停：([\d,]+) \/ ([\d,]+)，新发现 ([\d,]+) 本。$/u);
  if (match) return `Paused: ${match[1]} / ${match[2]}, ${match[3]} new books found.`;
  match = source.match(/^图书馆刷新完成：检查 ([\d,]+) 本，新发现 ([\d,]+) 本，耗时 (.+)。$/u);
  if (match) return `Library refresh complete: checked ${match[1]} books, found ${match[2]} new books, in ${translateDurationToEnglish(match[3])}.`;
  match = source.match(/^已安全重新关联 ([\d,]+) 本移动或重新出现的书籍；原有进度、书签、摘录和收藏已保留。$/u);
  if (match) return `Safely relinked ${match[1]} moved or reappeared books. Existing progress, bookmarks, excerpts, and favorites were kept.`;
  match = source.match(/^([\d,]+) 本新发现书籍存在多个相同属性的缺失候选，未自动合并；原有数据均已保留。$/u);
  if (match) return `${match[1]} newly discovered books have multiple missing-file candidates with matching properties. They were not merged automatically; existing data was kept.`;
  match = source.match(/^候选文件（(\d+)）$/u);
  if (match) return `Candidate files (${match[1]})`;
  match = source.match(/^已清除 (\d+) 本书的最近阅读历史。$/u);
  if (match) return `Cleared recent-reading history for ${match[1]} books.`;
  match = source.match(/^已重置 (\d+) 本书的阅读进度。$/u);
  if (match) return `Reset reading progress for ${match[1]} books.`;
  match = source.match(/^已清理 (\d+) 个缓存文件，释放 (.+)。$/u);
  if (match) return `Cleared ${match[1]} cache files, freeing ${match[2]}.`;
  match = source.match(/^核心数据备份已导出：(.+)$/u);
  if (match) return `Core-data backup exported: ${match[1]}`;
  match = source.match(/^操作未完成(?:：(.+))? 现有阅读数据已保留。$/u);
  if (match) return match[1] ? `Action not completed: ${match[1].replace(/[。.]\s*$/u, "")}. Existing reading data was kept.` : "Action not completed. Existing reading data was kept.";
  match = source.match(/^无法保存名称：(.+)$/u);
  if (match) return `Could not save the name: ${match[1]}`;
  match = source.match(/^设置 ?(.+?) ?的阅读状态$/u);
  if (match) return `Set reading status for ${match[1]}`;
  match = source.match(/^字符位置 (\d+)$/u);
  if (match) return `Character position ${match[1]}`;
  match = source.match(/^(.+? · )进度 (\d+)%$/u);
  if (match) return `${match[1]}Progress ${match[2]}%`;
  match = source.match(/^\/ (\d+) · 适宽$/u);
  if (match) return `/ ${match[1]} · Fit width`;
  match = source.match(/^此 ([A-Z0-9]+) 文件带有加密或 DRM 保护（标记 (.+)）。本插件不会尝试绕过保护；请使用合法来源提供的未加密副本。$/u);
  if (match) return `This ${match[1]} file has encryption or DRM protection (marker: ${match[2]}). This plugin will not bypass protection. Use an unencrypted copy provided through a lawful source.`;
  match = source.match(/^确认清除(全部|《(.+?)》的)最近阅读历史$/u);
  if (match) return match[1] === "全部" ? "Confirm clear all recent-reading history" : `Confirm clear recent-reading history for “${match[2]}”`;
  match = source.match(/^确认重置(全部|《(.+?)》的)阅读进度$/u);
  if (match) return match[1] === "全部" ? "Confirm reset all reading progress" : `Confirm reset reading progress for “${match[2]}”`;
  match = source.match(/^备份：(.+)\n创建时间：(.+)\n插件版本：(.+)\n包含 (\d+) 本书、(\d+) 条阅读记录、(\d+) 个书签、(\d+) 条本地摘录。\n\n恢复会替换当前插件的核心数据；恢复前会自动备份当前核心数据。不会读取或修改电子书、Markdown 笔记、封面或缓存。$/u);
  if (match) return `Backup: ${match[1]}\nCreated: ${match[2]}\nPlugin version: ${match[3]}\nContains ${match[4]} books, ${match[5]} reading records, ${match[6]} bookmarks, and ${match[7]} local excerpts.\n\nRestoring replaces the plugin's core data; current core data is backed up automatically first. Ebooks, Markdown notes, covers, and cache are not read or changed.`;
  return source;
}

function translateDurationToEnglish(source: string): string {
  const milliseconds = source.match(/^(\d+) ms$/u);
  if (milliseconds) return `${milliseconds[1]} ms`;
  const seconds = source.match(/^([\d.]+) 秒$/u);
  if (seconds) return `${seconds[1]} s`;
  return source;
}

function frenchPlural(count: string, singular: string, plural: string): string {
  return count === "1" ? singular : plural;
}

function translateDynamicToFrench(source: string): string {
  let match = source.match(/^已索引 (\d+) 本书。$/u);
  if (match) return `${match[1]} ${frenchPlural(match[1], "livre indexé", "livres indexés")}.`;
  match = source.match(/^显示 (\d+) \/ (\d+) 本已索引书籍$/u);
  if (match) return `Affichage de ${match[1]} sur ${match[2]} livres indexés`;
  match = source.match(/^显示 (\d+) \/ (\d+) 条已保存摘录$/u);
  if (match) return `Affichage de ${match[1]} sur ${match[2]} extraits enregistrés`;
  match = source.match(/^显示 (\d+) \/ (\d+) 条 Markdown 内容$/u);
  if (match) return `Affichage de ${match[1]} sur ${match[2]} entrées Markdown`;
  match = source.match(/^已选择 (\d+) 条摘录$/u);
  if (match) return `${match[1]} ${frenchPlural(match[1], "extrait sélectionné", "extraits sélectionnés")}`;
  match = source.match(/^核心阅读数据：(.+)；可清理缓存：(.+) \/ (.+)（(\d+) 个文件）$/u);
  if (match) return `Données de lecture principales : ${match[1]} ; cache reconstruisible : ${match[2]} / ${match[3]} (${match[4]} ${frenchPlural(match[4], "fichier", "fichiers")})`;
  match = source.match(/^第 (\d+) \/ (\d+) 页 · (\d+)%$/u);
  if (match) return `Page ${match[1]} sur ${match[2]} · ${match[3]}%`;
  match = source.match(/^第 (\d+) 页$/u);
  if (match) return `Page ${match[1]}`;
  match = source.match(/^进度 (\d+)%$/u);
  if (match) return `Progression ${match[1]}%`;
  match = source.match(/^阅读进度 (\d+)%$/u);
  if (match) return `Progression de lecture ${match[1]}%`;
  match = source.match(/^已找到 (\d+) 处$/u);
  if (match) return `${match[1]} ${frenchPlural(match[1], "correspondance trouvée", "correspondances trouvées")}`;
  match = source.match(/^找到 (\d+) 处$/u);
  if (match) return `${match[1]} ${frenchPlural(match[1], "correspondance trouvée", "correspondances trouvées")}`;
  match = source.match(/^正在扫描：([\d,]+) \/ ([\d,]+)，新发现 ([\d,]+) 本。$/u);
  if (match) return `Analyse en cours : ${match[1]} / ${match[2]}, ${match[3]} ${frenchPlural(match[3], "nouveau livre trouvé", "nouveaux livres trouvés")}.`;
  match = source.match(/^已暂停：([\d,]+) \/ ([\d,]+)，新发现 ([\d,]+) 本。$/u);
  if (match) return `En pause : ${match[1]} / ${match[2]}, ${match[3]} ${frenchPlural(match[3], "nouveau livre trouvé", "nouveaux livres trouvés")}.`;
  match = source.match(/^图书馆刷新完成：检查 ([\d,]+) 本，新发现 ([\d,]+) 本，耗时 (.+)。$/u);
  if (match) return `Actualisation de la bibliothèque terminée : ${match[1]} livres vérifiés, ${match[2]} ${frenchPlural(match[2], "nouveau livre trouvé", "nouveaux livres trouvés")}, en ${translateDurationToFrench(match[3])}.`;
  match = source.match(/^已安全重新关联 ([\d,]+) 本移动或重新出现的书籍；原有进度、书签、摘录和收藏已保留。$/u);
  if (match) return `${match[1]} livres déplacés ou réapparus ont été réassociés. Progression, signets, extraits et favoris existants conservés.`;
  match = source.match(/^([\d,]+) 本新发现书籍存在多个相同属性的缺失候选，未自动合并；原有数据均已保留。$/u);
  if (match) return `${match[1]} nouveaux livres présentent plusieurs candidats manquants aux mêmes propriétés. Aucune fusion automatique ; les données existantes ont été conservées.`;
  match = source.match(/^候选文件（(\d+)）$/u);
  if (match) return `Fichiers candidats (${match[1]})`;
  match = source.match(/^已清除 (\d+) 本书的最近阅读历史。$/u);
  if (match) return `Historique de lecture récent effacé pour ${match[1]} ${frenchPlural(match[1], "livre", "livres")}.`;
  match = source.match(/^已重置 (\d+) 本书的阅读进度。$/u);
  if (match) return `Progression de lecture réinitialisée pour ${match[1]} ${frenchPlural(match[1], "livre", "livres")}.`;
  match = source.match(/^已清理 (\d+) 个缓存文件，释放 (.+)。$/u);
  if (match) return `${match[1]} ${frenchPlural(match[1], "fichier de cache supprimé", "fichiers de cache supprimés")}, ${match[2]} ${frenchPlural(match[1], "libéré", "libérés")}.`;
  match = source.match(/^核心数据备份已导出：(.+)$/u);
  if (match) return `Sauvegarde des données principales exportée : ${match[1]}`;
  match = source.match(/^操作未完成(?:：(.+))? 现有阅读数据已保留。$/u);
  if (match) return match[1] ? `Action non terminée : ${match[1].replace(/[。.]\s*$/u, "")}. Les données de lecture existantes ont été conservées.` : "Action non terminée. Les données de lecture existantes ont été conservées.";
  match = source.match(/^无法保存名称：(.+)$/u);
  if (match) return `Impossible d'enregistrer le nom : ${match[1]}`;
  match = source.match(/^设置 ?(.+?) ?的阅读状态$/u);
  if (match) return `Définir le statut de lecture de ${match[1]}`;
  match = source.match(/^字符位置 (\d+)$/u);
  if (match) return `Position du caractère ${match[1]}`;
  match = source.match(/^(.+? · )进度 (\d+)%$/u);
  if (match) return `${match[1]}Progression de lecture ${match[2]}%`;
  match = source.match(/^\/ (\d+) · 适宽$/u);
  if (match) return `/ ${match[1]} · Ajuster à la largeur`;
  match = source.match(/^此 ([A-Z0-9]+) 文件带有加密或 DRM 保护（标记 (.+)）。本插件不会尝试绕过保护；请使用合法来源提供的未加密副本。$/u);
  if (match) return `Ce fichier ${match[1]} est protégé par un chiffrement ou un DRM (marqueur : ${match[2]}). Ce plugin ne contournera pas la protection. Utilisez une copie non chiffrée provenant d'une source légale.`;
  match = source.match(/^确认清除(全部|《(.+?)》的)最近阅读历史$/u);
  if (match) return match[1] === "全部" ? "Confirmer la suppression de tout l'historique de lecture récent" : `Confirmer la suppression de l'historique de lecture récent de « ${match[2]} »`;
  match = source.match(/^确认重置(全部|《(.+?)》的)阅读进度$/u);
  if (match) return match[1] === "全部" ? "Confirmer la réinitialisation de toute la progression de lecture" : `Confirmer la réinitialisation de la progression de lecture de « ${match[2]} »`;
  match = source.match(/^备份：(.+)\n创建时间：(.+)\n插件版本：(.+)\n包含 (\d+) 本书、(\d+) 条阅读记录、(\d+) 个书签、(\d+) 条本地摘录。\n\n恢复会替换当前插件的核心数据；恢复前会自动备份当前核心数据。不会读取或修改电子书、Markdown 笔记、封面或缓存。$/u);
  if (match) return `Sauvegarde : ${match[1]}\nCrée : ${match[2]}\nVersion du plugin : ${match[3]}\nContient ${match[4]} livres, ${match[5]} enregistrements de lecture, ${match[6]} signets et ${match[7]} extraits locaux.\n\nLa restauration remplace les données principales du plugin ; les données principales actuelles sont sauvegardées automatiquement au préalable. Les livres électroniques, notes Markdown, couvertures et cache ne sont ni lus ni modifiés.`;
  return source;
}

function translateDurationToFrench(source: string): string {
  const milliseconds = source.match(/^(\d+) ms$/u);
  if (milliseconds) return `${milliseconds[1]} ms`;
  const seconds = source.match(/^([\d.]+) 秒$/u);
  if (seconds) return `${seconds[1]} s`;
  return source;
}

export function translationCoverage(): { language: UiLanguage; missing: number }[] {
  const results: { language: UiLanguage; missing: number }[] = [];
  for (const language of ["en", "fr", "zh-TW"] as const) {
    let missing = 0;
    for (const source of Object.keys(english)) {
      if (language === "en" && !english[source]) missing++;
      if (language === "fr" && !french[source]) missing++;
      if (language === "zh-TW" && chinese[english[source]] !== source) missing++;
    }
    results.push({ language, missing });
  }
  return results;
}

export class LocalizedNotice extends ObsidianNotice {
  constructor(message: string, timeout?: number) {
    super(t(message), timeout);
  }
}

function localizeElement(element: Element): void {
  if (element.closest("[data-local-book-reader-no-localize='true']")) return;
  for (const attribute of ["aria-label", "placeholder", "title", "alt"]) {
    const value = element.getAttribute(attribute);
    if (value) element.setAttribute(attribute, t(value));
  }
}

export function localizeTree(root: HTMLElement): void {
  localizeElement(root);
  const elements = root.querySelectorAll("*");
  for (const element of Array.from(elements)) localizeElement(element);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if (node.nodeValue && !(node.parentElement?.closest("[data-local-book-reader-no-localize='true']"))) node.nodeValue = t(node.nodeValue);
    node = walker.nextNode();
  }
}

export function observeLocalization(root: HTMLElement): () => void {
  // Do not watch the complete Obsidian DOM. Its controls can mutate while
  // rendering, which turns a translation pass into an unbounded UI update.
  // Views explicitly localize their initial render and reopen after a language
  // change, so a one-time pass is both sufficient and responsive.
  localizeTree(root);
  return () => undefined;
}
