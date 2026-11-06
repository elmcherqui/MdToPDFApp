import * as zlib from "zlib";
import { Margins } from "../../src/types";

const MM_PER_PT = 25.4 / 72;
const A4 = { width: 210, height: 297 };

/**
 * Read the page margins (in mm) from the first page of a Chrome-generated A4
 * PDF. Chrome clips page content to the area inside the margins, emitting
 * `x y w h re` right after its page transform.
 *
 * This depends on Chrome's content-stream layout (checked with Puppeteer
 * 24.38 / Chrome 146); if it throws after an upgrade, update the regex below.
 */
export function pdfMargins(pdf: Buffer): Margins {
  let i = 0;
  while ((i = pdf.indexOf("stream", i)) !== -1) {
    if (pdf.subarray(i - 3, i).toString() === "end") {
      i += 6;
      continue;
    }
    let start = i + 6;
    if (pdf[start] === 13) start++;
    if (pdf[start] === 10) start++;
    const end = pdf.indexOf("endstream", start);
    i = end + 9;
    let text: string;
    try {
      text = zlib
        .inflateSync(pdf.subarray(start, end), { finishFlush: zlib.constants.Z_SYNC_FLUSH })
        .toString("latin1");
    } catch {
      continue;
    }
    const m = /^([\d.]+) 0 0 -[\d.]+ 0 [\d.]+ cm\s+q\s+([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+) re/.exec(text);
    if (m) {
      const [scale, x, y, w, h] = m.slice(1).map(Number);
      const toMm = (v: number) => v * scale * MM_PER_PT;
      return {
        top: toMm(y),
        right: A4.width - toMm(x) - toMm(w),
        bottom: A4.height - toMm(y) - toMm(h),
        left: toMm(x),
      };
    }
  }
  throw new Error("No content box found in PDF");
}

/** Chrome snaps each margin to whole CSS pixels (~0.26mm). */
export const PDF_MARGIN_TOLERANCE_MM = 0.5;
