import assert from "node:assert/strict";
import test from "node:test";
import { readFile, readdir } from "node:fs/promises";

// The i18n module dispatches a CustomEvent on window when the language is set.
// Node has neither global, so provide the smallest compatible stand-ins.
(globalThis as Record<string, unknown>).CustomEvent = class CustomEvent {
  constructor(public readonly type: string) {}
};
(globalThis as Record<string, unknown>).window = {
  dispatchEvent: () => undefined
};

import {
  LocalizedNotice,
  getLanguage,
  setLanguage,
  t,
  translationCoverage,
  type UiLanguage
} from "../src/i18n";
import { Notice } from "./stubs/obsidian";

const languages: UiLanguage[] = ["zh-CN", "zh-TW", "en", "fr"];

test("every static key has an English, Traditional-Chinese, and French translation", () => {
  for (const report of translationCoverage()) {
    assert.equal(report.missing, 0, `${report.language} is missing ${report.missing} static translations`);
  }
});

test("language switching updates the active language", () => {
  for (const language of languages) {
    setLanguage(language);
    assert.equal(getLanguage(), language);
  }
});

test("library status and progress labels are translated in every language", () => {
  const cases: Array<[string, Record<UiLanguage, string>]> = [
    ["未读", { "zh-CN": "未读", "zh-TW": "未讀", en: "Unread", fr: "Non lu" }],
    ["正在阅读", { "zh-CN": "正在阅读", "zh-TW": "正在閱讀", en: "Reading", fr: "En cours de lecture" }],
    ["已读", { "zh-CN": "已读", "zh-TW": "已讀", en: "Finished", fr: "Terminé" }],
    ["文件缺失", { "zh-CN": "文件缺失", "zh-TW": "文件缺失", en: "File missing", fr: "Fichier manquant" }],
    ["已完成", { "zh-CN": "已完成", "zh-TW": "已完成", en: "Completed", fr: "Terminé" }],
    ["未记录进度", { "zh-CN": "未记录进度", "zh-TW": "未記錄進度", en: "No progress recorded", fr: "Aucune progression enregistrée" }],
    ["已暂停", { "zh-CN": "已暂停", "zh-TW": "已暫停", en: "Paused", fr: "En pause" }],
    ["个人图书馆", { "zh-CN": "个人图书馆", "zh-TW": "個人圖書館", en: "Personal Library", fr: "Bibliothèque personnelle" }]
  ];
  for (const [source, expected] of cases) {
    for (const language of languages) {
      setLanguage(language);
      assert.equal(t(source), expected[language], `${source} in ${language}`);
    }
  }
});

test("dynamic notice and progress strings are translated in English and French", () => {
  const cases: Array<[string, Record<"en" | "fr", string>]> = [
    ["已索引 12 本书。", { en: "12 books indexed.", fr: "12 livres indexés." }],
    ["已索引 1 本书。", { en: "1 books indexed.", fr: "1 livre indexé." }],
    ["显示 3 / 8 本已索引书籍", { en: "Showing 3 of 8 indexed books", fr: "Affichage de 3 sur 8 livres indexés" }],
    ["显示 2 / 5 条已保存摘录", { en: "Showing 2 of 5 saved excerpts", fr: "Affichage de 2 sur 5 extraits enregistrés" }],
    ["显示 4 / 6 条 Markdown 内容", { en: "Showing 4 of 6 Markdown entries", fr: "Affichage de 4 sur 6 entrées Markdown" }],
    ["已选择 2 条摘录", { en: "2 excerpts selected", fr: "2 extraits sélectionnés" }],
    ["第 3 / 5 页 · 40%", { en: "Page 3 of 5 · 40%", fr: "Page 3 sur 5 · 40%" }],
    ["第 7 页", { en: "Page 7", fr: "Page 7" }],
    ["进度 45%", { en: "Progress 45%", fr: "Progression 45%" }],
    ["阅读进度 80%", { en: "Reading progress 80%", fr: "Progression de lecture 80%" }],
    ["已找到 3 处", { en: "3 matches found", fr: "3 correspondances trouvées" }],
    ["正在扫描：5 / 10，新发现 2 本。", { en: "Scanning: 5 / 10, 2 new books found.", fr: "Analyse en cours : 5 / 10, 2 nouveaux livres trouvés." }],
    ["已暂停：5 / 10，新发现 2 本。", { en: "Paused: 5 / 10, 2 new books found.", fr: "En pause : 5 / 10, 2 nouveaux livres trouvés." }],
    ["图书馆刷新完成：检查 12 本，新发现 3 本，耗时 1.2 秒。", {
      en: "Library refresh complete: checked 12 books, found 3 new books, in 1.2 s.",
      fr: "Actualisation de la bibliothèque terminée : 12 livres vérifiés, 3 nouveaux livres trouvés, en 1.2 s."
    }],
    ["已安全重新关联 2 本移动或重新出现的书籍；原有进度、书签、摘录和收藏已保留。", {
      en: "Safely relinked 2 moved or reappeared books. Existing progress, bookmarks, excerpts, and favorites were kept.",
      fr: "2 livres déplacés ou réapparus ont été réassociés. Progression, signets, extraits et favoris existants conservés."
    }],
    ["候选文件（3）", { en: "Candidate files (3)", fr: "Fichiers candidats (3)" }],
    ["已清除 2 本书的最近阅读历史。", { en: "Cleared recent-reading history for 2 books.", fr: "Historique de lecture récent effacé pour 2 livres." }],
    ["已重置 1 本书的阅读进度。", { en: "Reset reading progress for 1 books.", fr: "Progression de lecture réinitialisée pour 1 livre." }],
    ["已清理 3 个缓存文件，释放 12.5 MB。", { en: "Cleared 3 cache files, freeing 12.5 MB.", fr: "3 fichiers de cache supprimés, 12.5 MB libérés." }],
    ["核心数据备份已导出：demo.json", { en: "Core-data backup exported: demo.json", fr: "Sauvegarde des données principales exportée : demo.json" }],
    ["操作未完成：馆主名称不能超过 80 个字符。 现有阅读数据已保留。", {
      en: "Action not completed: 馆主名称不能超过 80 个字符. Existing reading data was kept.",
      fr: "Action non terminée : 馆主名称不能超过 80 个字符. Les données de lecture existantes ont été conservées."
    }],
    ["无法保存名称：馆主名称不能超过 80 个字符。", {
      en: "Could not save the name: 馆主名称不能超过 80 个字符。",
      fr: "Impossible d'enregistrer le nom : 馆主名称不能超过 80 个字符。"
    }],
    ["设置 《活着》 的阅读状态", { en: "Set reading status for 《活着》", fr: "Définir le statut de lecture de 《活着》" }],
    ["字符位置 12", { en: "Character position 12", fr: "Position du caractère 12" }],
    ["/ 300 · 适宽", { en: "/ 300 · Fit width", fr: "/ 300 · Ajuster à la largeur" }],
    ["此 EPUB 文件带有加密或 DRM 保护（标记 2）。本插件不会尝试绕过保护；请使用合法来源提供的未加密副本。", {
      en: "This EPUB file has encryption or DRM protection (marker: 2). This plugin will not bypass protection. Use an unencrypted copy provided through a lawful source.",
      fr: "Ce fichier EPUB est protégé par un chiffrement ou un DRM (marqueur : 2). Ce plugin ne contournera pas la protection. Utilisez une copie non chiffrée provenant d'une source légale."
    }],
    ["确认清除《活着》的最近阅读历史", {
      en: "Confirm clear recent-reading history for “活着”",
      fr: "Confirmer la suppression de l'historique de lecture récent de « 活着 »"
    }],
    ["确认重置全部阅读进度", {
      en: "Confirm reset all reading progress",
      fr: "Confirmer la réinitialisation de toute la progression de lecture"
    }],
    ["根目录", { en: "Vault root", fr: "Racine du coffre" }]
  ];
  for (const [source, expected] of cases) {
    for (const language of ["en", "fr"] as const) {
      setLanguage(language);
      assert.equal(t(source), expected[language], `${source} in ${language}`);
    }
  }
});

test("chapter progress keeps the untranslated chapter prefix", () => {
  setLanguage("en");
  assert.equal(t("第一章 · 进度 45%"), "第一章 · Progress 45%");
  setLanguage("fr");
  assert.equal(t("第一章 · 进度 45%"), "第一章 · Progression de lecture 45%");
});

test("Traditional Chinese still converts plugin-owned dynamic strings", () => {
  setLanguage("zh-TW");
  assert.equal(t("已索引 12 本书。"), "已索引 12 本書。");
  assert.equal(t("正在阅读"), "正在閱讀");
  assert.equal(t("图书馆刷新完成：检查 12 本，新发现 3 本，耗时 1.2 秒。"), "圖書館刷新完成：檢查 12 本，新發現 3 本，耗時 1.2 秒。");
});

test("backup-restore summary is translated without touching values", () => {
  const source = [
    "备份：lbr-backup.json",
    "创建时间：2026-08-16 12:00",
    "插件版本：0.3.6",
    "包含 2 本书、3 条阅读记录、4 个书签、5 条本地摘录。",
    "",
    "恢复会替换当前插件的核心数据；恢复前会自动备份当前核心数据。不会读取或修改电子书、Markdown 笔记、封面或缓存。"
  ].join("\n");
  setLanguage("en");
  assert.ok(t(source).startsWith("Backup: lbr-backup.json\nCreated: 2026-08-16 12:00"));
  setLanguage("fr");
  assert.ok(t(source).startsWith("Sauvegarde : lbr-backup.json\nCrée : 2026-08-16 12:00"));
});

test("error details are translated before being embedded in notices", () => {
  setLanguage("en");
  const enDetail = t("馆主名称不能超过 80 个字符。");
  assert.equal(
    t(`操作未完成：${enDetail} 现有阅读数据已保留。`),
    "Action not completed: Library owner name cannot exceed 80 characters. Existing reading data was kept."
  );
  assert.equal(
    t(`无法保存名称：${enDetail}`),
    "Could not save the name: Library owner name cannot exceed 80 characters."
  );
  setLanguage("fr");
  const frDetail = t("馆主名称不能超过 80 个字符。");
  assert.equal(
    t(`操作未完成：${frDetail} 现有阅读数据已保留。`),
    "Action non terminée : Le nom du propriétaire de la bibliothèque ne peut pas dépasser 80 caractères. Les données de lecture existantes ont été conservées."
  );
  assert.equal(
    t(`无法保存名称：${frDetail}`),
    "Impossible d'enregistrer le nom : Le nom du propriétaire de la bibliothèque ne peut pas dépasser 80 caractères."
  );
});

test("book names, paths, authors, and metadata values are never translated", () => {
  const preserved = [
    "《活着》",
    "Books/历史/活着.epub",
    "Sunny D",
    "2024-01-01",
    "第一章 关键论点",
    "zz_阅读与研究/阅读笔记",
    "978-7-1234-5678-9"
  ];
  for (const language of languages) {
    setLanguage(language);
    for (const value of preserved) {
      assert.equal(t(value), value, `${value} must stay unchanged in ${language}`);
    }
  }
});

test("language dropdown labels follow the active UI language", () => {
  setLanguage("en");
  assert.equal(t("English"), "English");
  assert.equal(t("简体中文"), "Simplified Chinese");
  assert.equal(t("繁體中文"), "Traditional Chinese");
  assert.equal(t("Français"), "Français");
  setLanguage("fr");
  assert.equal(t("English"), "Anglais");
  assert.equal(t("简体中文"), "Chinois simplifié");
  assert.equal(t("繁體中文"), "Chinois traditionnel");
  assert.equal(t("Français"), "Français");
});

test("LocalizedNotice sends the translated message through the Obsidian notice path", () => {
  const expectations: Array<[UiLanguage, string]> = [
    ["zh-CN", "书签已添加。"],
    ["en", "Bookmark added."],
    ["fr", "Signet ajouté."]
  ];
  for (const [language, expected] of expectations) {
    Notice.reset();
    setLanguage(language);
    new LocalizedNotice("书签已添加。", 4000);
    assert.equal(Notice.instances.length, 1);
    assert.equal(Notice.instances[0].message, expected, `notice message in ${language}`);
    assert.equal(Notice.instances[0].timeout, 4000);
  }
  Notice.reset();
  setLanguage("fr");
  new LocalizedNotice("图书馆刷新完成：检查 12 本，新发现 3 本，耗时 1.2 秒。");
  assert.equal(
    Notice.instances[0].message,
    "Actualisation de la bibliothèque terminée : 12 livres vérifiés, 3 nouveaux livres trouvés, en 1.2 s."
  );
});

test("every setText call with CJK content goes through t()", async () => {
  const srcDir = new URL("../../src/", import.meta.url);
  const files = (await readdir(srcDir)).filter((file) => file.endsWith(".ts"));
  assert.ok(files.length > 0, "expected to find TypeScript sources");
  for (const file of files) {
    const content = await readFile(new URL(file, srcDir), "utf8");
    const lines = content.split(/\r?\n/);
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index].trim();
      if (!line.includes(".setText(") || !/[\u4e00-\u9fff]/.test(line)) continue;
      const argument = line.replace(/^.*\.setText\(/, "");
      assert.ok(
        argument.includes("t("),
        `${file}:${index + 1} setText call with CJK content is not localized: ${line}`
      );
    }
  }
});
