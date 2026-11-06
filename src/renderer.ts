import puppeteer, { Browser } from "puppeteer";
import * as fs from "fs";
import htmlToDocx = require("html-to-docx");
import { Margins, PageSize } from "./types";
import { DEFAULT_MARGINS } from "./margins";

const TWIPS_PER_MM = 1440 / 25.4;

/** Paper size of each output format: A4 for PDF, html-to-docx's US Letter for DOCX. */
export const PAGE_SIZES: Record<"pdf" | "docx", PageSize> = {
  pdf: { width: 210, height: 297 },
  docx: { width: 215.9, height: 279.4 },
};

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

  fs.writeFileSync(outputPath, Buffer.from(buffer));
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
