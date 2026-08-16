// Minimal Obsidian stub for the Node test bundle. The real Obsidian runtime
// is unavailable outside the host app, so tests only need the parts they use.
export class Notice {
  static instances: { message: string; timeout?: number }[] = [];
  static reset(): void {
    Notice.instances = [];
  }
  constructor(message: string, timeout?: number) {
    Notice.instances.push({ message, timeout });
  }
}
