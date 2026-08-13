import { App, Modal, Setting } from "obsidian";
import { LocalizedNotice as Notice, localizeTree } from "./i18n";

export interface ConfirmActionOptions {
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => Promise<void>;
}

/** A small, explicit confirmation step for actions that change reading data. */
export class ConfirmActionModal extends Modal {
  constructor(app: App, private readonly options: ConfirmActionOptions) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: this.options.title });
    contentEl.createEl("p", { text: this.options.message });

    const controls = new Setting(contentEl);
    controls.addButton((button) => button.setButtonText("取消").onClick(() => this.close()));
    controls.addButton((button) => button.setButtonText(this.options.confirmText).setWarning().onClick(() => {
      button.setDisabled(true);
      void this.options.onConfirm().then(() => this.close()).catch((error) => {
        console.error("Local Book Reader confirmed action failed", error);
        button.setDisabled(false);
        const detail = error instanceof Error && error.message ? `：${error.message}` : "。";
        new Notice(`操作未完成${detail} 现有阅读数据已保留。`);
      });
    }));
    localizeTree(contentEl);
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
