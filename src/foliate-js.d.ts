declare module "foliate-js/view.js" {
  export function makeBook(file: File): Promise<unknown>;
}

declare module "foliate-js/overlayer.js" {
  export class Overlayer {
    static highlight(rects: unknown[], options?: { color?: string; padding?: number }): SVGElement;
  }
}

declare module "pdfjs-dist/legacy/build/pdf.worker.mjs";
