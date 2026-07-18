interface WritableBackupFile {
  write(data: string): Promise<void>;
  close(): Promise<void>;
  abort?(): Promise<void>;
}

export interface BackupSaveFileHandle {
  name: string;
  getFile(): Promise<File>;
  createWritable(options?: { keepExistingData?: boolean }): Promise<WritableBackupFile>;
}

interface BackupOpenFileHandle {
  getFile(): Promise<File>;
}

interface BackupPickerWindow extends Window {
  showSaveFilePicker?: (options: {
    suggestedName: string;
    types: Array<{ description: string; accept: Record<string, string[]> }>;
    excludeAcceptAllOption: boolean;
  }) => Promise<BackupSaveFileHandle>;
  showOpenFilePicker?: (options: {
    multiple: boolean;
    types: Array<{ description: string; accept: Record<string, string[]> }>;
    excludeAcceptAllOption: boolean;
  }) => Promise<BackupOpenFileHandle[]>;
}

const JSON_FILE_TYPE = [{ description: "Local Book Reader 备份", accept: { "application/json": [".json"] } }];

function pickerWindow(): BackupPickerWindow {
  return window as BackupPickerWindow;
}

function wasCancelled(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export async function chooseNewBackupFile(suggestedName: string): Promise<BackupSaveFileHandle | undefined> {
  const host = pickerWindow();
  const picker = host.showSaveFilePicker;
  if (!picker) throw new Error("当前 Obsidian 环境不支持系统保存位置选择。 ");
  try {
    return await picker.call(host, { suggestedName, types: JSON_FILE_TYPE, excludeAcceptAllOption: true });
  } catch (error) {
    if (wasCancelled(error)) return undefined;
    throw error;
  }
}

export async function chooseBackupToRestore(): Promise<File | undefined> {
  const host = pickerWindow();
  const picker = host.showOpenFilePicker;
  if (!picker) throw new Error("当前 Obsidian 环境不支持系统文件选择。 ");
  try {
    const [handle] = await picker.call(host, { multiple: false, types: JSON_FILE_TYPE, excludeAcceptAllOption: true });
    return handle ? await handle.getFile() : undefined;
  } catch (error) {
    if (wasCancelled(error)) return undefined;
    throw error;
  }
}

/** The native save dialog makes any existing-file overwrite explicit to the user. */
export async function writeNewBackupFile(handle: BackupSaveFileHandle, contents: string): Promise<File> {
  const writer = await handle.createWritable({ keepExistingData: false });
  try {
    await writer.write(contents);
    await writer.close();
  } catch (error) {
    await writer.abort?.().catch(() => undefined);
    throw error;
  }
  return handle.getFile();
}
