import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { discoverFiles } from "../src/discovery";
import * as fs from "fs";
import * as path from "path";

const tmpDir = path.join(__dirname, "tmp-discovery");

beforeAll(() => {
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.mkdirSync(path.join(tmpDir, "sub"), { recursive: true });
  fs.writeFileSync(path.join(tmpDir, "a.md"), "# A");
  fs.writeFileSync(path.join(tmpDir, "b.md"), "# B");
  fs.writeFileSync(path.join(tmpDir, "c.txt"), "not md");
  fs.writeFileSync(path.join(tmpDir, "sub", "d.md"), "# D");
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("discoverFiles", () => {
  it("returns single file when given a .md file path", () => {
    const files = discoverFiles(path.join(tmpDir, "a.md"), {
      format: "pdf",
    });
    expect(files).toHaveLength(1);
    expect(files[0].inputPath).toContain("a.md");
    expect(files[0].outputPath).toContain("a.pdf");
  });

  it("returns all .md files in directory (non-recursive)", () => {
    const files = discoverFiles(tmpDir, { format: "pdf" });
    expect(files).toHaveLength(2); // a.md, b.md — not sub/d.md
  });

  it("returns all .md files recursively", () => {
    const files = discoverFiles(tmpDir, { format: "pdf", recursive: true });
    expect(files).toHaveLength(3); // a.md, b.md, sub/d.md
  });

  it("uses custom output directory", () => {
    const files = discoverFiles(path.join(tmpDir, "a.md"), {
      format: "docx",
      outputDir: "/tmp/out",
    });
    expect(files[0].outputPath).toBe(path.join(path.resolve("/tmp/out"), "a.docx"));
  });

  it("throws if input path does not exist", () => {
    expect(() =>
      discoverFiles("/nonexistent/path.md", { format: "pdf" })
    ).toThrow();
  });
});
