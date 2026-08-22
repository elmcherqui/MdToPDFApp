import puppeteer, { Browser } from "puppeteer";
import * as fs from "fs";
import htmlToDocx = require("html-to-docx");

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await puppeteer.launch({ headless: true });
  }
  return browser;
}

export async function renderPdf(
  html: string,
  outputPath: string
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
    margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" },
    printBackground: true,
  });

  await page.close();
}

export async function renderDocx(
  html: string,
  outputPath: string
): Promise<void> {
  const buffer = await htmlToDocx(html, null, {
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
