import { describe, it, expect, afterAll } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const CLI = path.join(__dirname, "..", "dist", "index.js");
const fixtureDir = path.join(__dirname, "fixtures");
const outputDir = path.join(__dirname, "tmp-e2e");

afterAll(() => {
  fs.rmSync(outputDir, { recursive: true, force: true });
});

describe("CLI e2e", () => {
  it("converts a single .md file to PDF", () => {
    fs.mkdirSync(outputDir, { recursive: true });
    execSync(`node "${CLI}" "${path.join(fixtureDir, "sample.md")}" -f pdf -o "${outputDir}"`, {
      timeout: 60000,
    });
    const pdfPath = path.join(outputDir, "sample.pdf");
    expect(fs.existsSync(pdfPath)).toBe(true);
    const content = fs.readFileSync(pdfPath);
    expect(content.toString("ascii", 0, 4)).toBe("%PDF");
  }, 60000);

  it("converts a single .md file to DOCX", () => {
    execSync(`node "${CLI}" "${path.join(fixtureDir, "sample.md")}" -f docx -o "${outputDir}"`, {
      timeout: 60000,
    });
    const docxPath = path.join(outputDir, "sample.docx");
    expect(fs.existsSync(docxPath)).toBe(true);
    const content = fs.readFileSync(docxPath);
    expect(content.toString("ascii", 0, 2)).toBe("PK");
  }, 60000);

  it("shows error for nonexistent input", () => {
    expect(() =>
      execSync(`node "${CLI}" /nonexistent/path.md`, { timeout: 10000 })
    ).toThrow();
  });

  it("shows help text", () => {
    const output = execSync(`node "${CLI}" --help`, { timeout: 10000 }).toString();
    expect(output).toContain("mdtopdf");
    expect(output).toContain("--format");
  });
});
