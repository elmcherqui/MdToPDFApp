import { describe, it, expect } from "vitest";
import { embedImages } from "../src/images";
import * as path from "path";
import * as fs from "fs";

const tmpDir = path.join(__dirname, "tmp-images");

describe("embedImages", () => {
  it("converts local image paths to base64 data URIs", async () => {
    // Create a tiny 1x1 PNG for testing
    fs.mkdirSync(tmpDir, { recursive: true });
    const pngBytes = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );
    fs.writeFileSync(path.join(tmpDir, "test.png"), pngBytes);

    const html = `<img src="test.png">`;
    const result = await embedImages(html, tmpDir);
    expect(result).toContain("data:image/png;base64,");
    expect(result).not.toContain('src="test.png"');

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("leaves data URIs untouched", async () => {
    const html = `<img src="data:image/png;base64,abc123">`;
    const result = await embedImages(html, "/tmp");
    expect(result).toBe(html);
  });
});
