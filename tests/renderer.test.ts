import { describe, it, expect, afterAll } from "vitest";
import { renderPdf, renderDocx, closeBrowser } from "../src/renderer";
import * as fs from "fs";
import * as path from "path";

const tmpDir = path.join(__dirname, "tmp-renderer");

afterAll(async () => {
  await closeBrowser();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("renderPdf", () => {
  it("generates a PDF file from HTML", async () => {
    fs.mkdirSync(tmpDir, { recursive: true });
    const outputPath = path.join(tmpDir, "test.pdf");
    const html = `<!DOCTYPE html><html><body><h1>Hello</h1></body></html>`;
    await renderPdf(html, outputPath);
    expect(fs.existsSync(outputPath)).toBe(true);
    const content = fs.readFileSync(outputPath);
    expect(content.length).toBeGreaterThan(0);
    // PDF files start with %PDF
    expect(content.toString("ascii", 0, 4)).toBe("%PDF");
  }, 30000);
});

describe("renderDocx", () => {
  it("generates a DOCX file from HTML", async () => {
    fs.mkdirSync(tmpDir, { recursive: true });
    const outputPath = path.join(tmpDir, "test.docx");
    const html = `<!DOCTYPE html><html><body><h1>Hello</h1></body></html>`;
    await renderDocx(html, outputPath);
    expect(fs.existsSync(outputPath)).toBe(true);
    const content = fs.readFileSync(outputPath);
    expect(content.length).toBeGreaterThan(0);
    // DOCX files are ZIP archives starting with PK
    expect(content.toString("ascii", 0, 2)).toBe("PK");
  }, 30000);
});
