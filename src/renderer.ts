import puppeteer, { Browser } from "puppeteer";
import * as fs from "fs";
import htmlToDocx = require("html-to-docx");
import JSZip from "jszip";
import { Margins, PageSize } from "./types";
import { DEFAULT_MARGINS } from "./margins";

const TWIPS_PER_MM = 1440 / 25.4;

/** A4, the paper size of both PDF and DOCX output. */
export const PAGE_SIZE: PageSize = { width: 210, height: 297 };

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await puppeteer.launch({ headless: true });
  }
  return browser;
}

export async function renderPdf(
  html: string,
  outputPath: string,
  margins: Margins = DEFAULT_MARGINS
): Promise<void> {
  const b = await getBrowser();
  const page = await b.newPage();

  await page.setContent(html, { waitUntil: "domcontentloaded" });

  // Wait for mermaid diagrams to render (if any)
  const hasMermaid = await page.evaluate(
    () => document.querySelectorAll(".mermaid").length > 0
  );
  if (hasMermaid) {
    await page.waitForFunction(
      () => (window as any).__mermaidRendered === true,
      { timeout: 30000 }
    );
  }

  await page.pdf({
    path: outputPath,
    format: "A4",
    margin: {
      top: `${margins.top}mm`,
      right: `${margins.right}mm`,
      bottom: `${margins.bottom}mm`,
      left: `${margins.left}mm`,
    },
    printBackground: true,
  });

  await page.close();
}

export async function renderDocx(
  html: string,
  outputPath: string,
  margins: Margins = DEFAULT_MARGINS
): Promise<void> {
  // html-to-docx replaces a numeric 0 with its default, so zero goes in as "0px"
  const toTwips = (mm: number) => Math.round(mm * TWIPS_PER_MM) || "0px";
  const buffer = await htmlToDocx(html, null, {
    // html-to-docx defaults to US Letter
    pageSize: {
      width: toTwips(PAGE_SIZE.width),
      height: toTwips(PAGE_SIZE.height),
    },
    // The library does not merge partial margins with its defaults, so every
    // key is required; a missing one is written as "undefined" and Word
    // refuses to open the file
    margins: {
      top: toTwips(margins.top),
      right: toTwips(margins.right),
      bottom: toTwips(margins.bottom),
      left: toTwips(margins.left),
      header: 720,
      footer: 720,
      gutter: toTwips(0),
    },
    table: { row: { cantSplit: true } },
    footer: false,
    header: false,
  });

  fs.writeFileSync(outputPath, await roundTableColumnWidths(buffer));
}

/**
 * html-to-docx splits the text width evenly between table columns without
 * rounding (e.g. w:w="3590.666"), but OOXML only allows whole twips. Round
 * down so the columns never add up to more than the text width.
 */
async function roundTableColumnWidths(docx: Buffer): Promise<Buffer> {
  const zip = await JSZip.loadAsync(docx);
  const documentXml = zip.file("word/document.xml");
  if (!documentXml) return Buffer.from(docx);
  const xml = await documentXml.async("string");
  const rounded = xml.replace(
    /(<w:gridCol w:w=")(\d+\.\d+)"/g,
    (_, prefix: string, width: string) => `${prefix}${Math.floor(Number(width))}"`
  );
  if (rounded === xml) return Buffer.from(docx);
  zip.file("word/document.xml", rounded);
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
