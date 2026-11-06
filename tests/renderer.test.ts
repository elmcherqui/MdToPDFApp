import { describe, it, expect, afterAll } from "vitest";
import { renderPdf, renderDocx, closeBrowser } from "../src/renderer";
import { Margins } from "../src/types";
import * as fs from "fs";
import * as path from "path";
import { pdfMargins, PDF_MARGIN_TOLERANCE_MM } from "./helpers/pdf";
import { docxPageMargins } from "./helpers/docx";

const tmpDir = path.join(__dirname, "tmp-renderer");
const html = `<!DOCTYPE html><html><body><h1>Hello</h1></body></html>`;
const margins: Margins = { top: 10, right: 15, bottom: 20, left: 25 };

afterAll(async () => {
  await closeBrowser();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("renderPdf", () => {
  it("generates a PDF file from HTML", async () => {
    fs.mkdirSync(tmpDir, { recursive: true });
    const outputPath = path.join(tmpDir, "test.pdf");
    await renderPdf(html, outputPath, margins);
    expect(fs.existsSync(outputPath)).toBe(true);
    const content = fs.readFileSync(outputPath);
    expect(content.length).toBeGreaterThan(0);
    // PDF files start with %PDF
    expect(content.toString("ascii", 0, 4)).toBe("%PDF");
  }, 30000);

  it("lays out the page inside the given margins", async () => {
    fs.mkdirSync(tmpDir, { recursive: true });
    const outputPath = path.join(tmpDir, "margins.pdf");
    await renderPdf(html, outputPath, margins);
    const actual = pdfMargins(fs.readFileSync(outputPath));
    for (const side of ["top", "right", "bottom", "left"] as const) {
      expect(Math.abs(actual[side] - margins[side]), side).toBeLessThan(PDF_MARGIN_TOLERANCE_MM);
    }
  }, 30000);});

describe("renderDocx", () => {
  it("generates a DOCX file from HTML", async () => {
    fs.mkdirSync(tmpDir, { recursive: true });
    const outputPath = path.join(tmpDir, "test.docx");
    await renderDocx(html, outputPath, margins);
    expect(fs.existsSync(outputPath)).toBe(true);
    const content = fs.readFileSync(outputPath);
    expect(content.length).toBeGreaterThan(0);
    // DOCX files are ZIP archives starting with PK
    expect(content.toString("ascii", 0, 2)).toBe("PK");
  }, 30000);

  it("sets the page margins in twips", async () => {
    fs.mkdirSync(tmpDir, { recursive: true });
    const outputPath = path.join(tmpDir, "margins.docx");
    await renderDocx(html, outputPath, margins);
    const pgMar = await docxPageMargins(outputPath);
    // 1mm = 1440 / 25.4 twips
    expect(pgMar).toMatchObject({ top: "567", right: "850", bottom: "1134", left: "1417" });
  }, 30000);

  it("writes a whole number of twips for every page margin attribute", async () => {
    // Word refuses to open a file with e.g. w:header="undefined"
    fs.mkdirSync(tmpDir, { recursive: true });
    const outputPath = path.join(tmpDir, "valid.docx");
    await renderDocx(html, outputPath, margins);
    const pgMar = await docxPageMargins(outputPath);
    expect(Object.keys(pgMar).sort()).toEqual(
      ["bottom", "footer", "gutter", "header", "left", "right", "top"]
    );
    for (const [name, value] of Object.entries(pgMar)) {
      expect(value, name).toMatch(/^\d+$/);
    }
  }, 30000);

  it("keeps zero margins at zero", async () => {
    fs.mkdirSync(tmpDir, { recursive: true });
    const outputPath = path.join(tmpDir, "zero.docx");
    await renderDocx(html, outputPath, { top: 0, right: 5, bottom: 0, left: 0 });
    const pgMar = await docxPageMargins(outputPath);
    expect(pgMar).toMatchObject({ top: "0", right: "283", bottom: "0", left: "0" });
  }, 30000);
});
