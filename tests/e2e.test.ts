import { describe, it, expect, afterAll } from "vitest";
import { execSync, spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { pdfMargins, PDF_MARGIN_TOLERANCE_MM } from "./helpers/pdf";
import { docxPageMargins } from "./helpers/docx";

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
    expect(output).toContain("--margin");
  });

  it("uses 10mm PDF margins by default", () => {
    const outDir = path.join(outputDir, "default-margin");
    execSync(`node "${CLI}" "${path.join(fixtureDir, "sample.md")}" -o "${outDir}"`, {
      timeout: 60000,
    });
    const margins = pdfMargins(fs.readFileSync(path.join(outDir, "sample.pdf")));
    for (const side of ["top", "right", "bottom", "left"] as const) {
      expect(Math.abs(margins[side] - 10), side).toBeLessThan(PDF_MARGIN_TOLERANCE_MM);
    }
  }, 60000);

  it("applies --margin to PDF output", () => {
    const outDir = path.join(outputDir, "custom-margin");
    execSync(
      `node "${CLI}" "${path.join(fixtureDir, "sample.md")}" -o "${outDir}" --margin "5mm 30mm"`,
      { timeout: 60000 }
    );
    const margins = pdfMargins(fs.readFileSync(path.join(outDir, "sample.pdf")));
    expect(Math.abs(margins.top - 5)).toBeLessThan(PDF_MARGIN_TOLERANCE_MM);
    expect(Math.abs(margins.bottom - 5)).toBeLessThan(PDF_MARGIN_TOLERANCE_MM);
    expect(Math.abs(margins.left - 30)).toBeLessThan(PDF_MARGIN_TOLERANCE_MM);
    expect(Math.abs(margins.right - 30)).toBeLessThan(PDF_MARGIN_TOLERANCE_MM);
  }, 60000);

  it("applies --margin to DOCX output", async () => {
    const outDir = path.join(outputDir, "docx-margin");
    execSync(
      `node "${CLI}" "${path.join(fixtureDir, "sample.md")}" -f docx -o "${outDir}" -m 1in`,
      { timeout: 60000 }
    );
    const pgMar = await docxPageMargins(path.join(outDir, "sample.docx"));
    expect(pgMar).toMatchObject({ top: "1440", right: "1440", bottom: "1440", left: "1440" });
  }, 60000);

  it("rejects an invalid --margin before converting anything", () => {
    const outDir = path.join(outputDir, "bad-margin");
    const result = spawnSync(
      "node",
      [CLI, path.join(fixtureDir, "sample.md"), "-o", outDir, "--margin", "abc"],
      { timeout: 10000, encoding: "utf-8" }
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Invalid margin "abc"');
    expect(fs.existsSync(outDir)).toBe(false);
  });

  it.each(["pdf", "docx"])("rejects a %s margin larger than the page before converting anything", (format) => {
    const outDir = path.join(outputDir, `huge-margin-${format}`);
    const result = spawnSync(
      "node",
      [CLI, path.join(fixtureDir, "sample.md"), "-f", format, "-o", outDir, "--margin", "150mm"],
      { timeout: 10000, encoding: "utf-8" }
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/must be less than the page (width|height)/);
    expect(fs.existsSync(outDir)).toBe(false);
  });
});
