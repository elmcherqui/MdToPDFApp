import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
};

export async function embedImages(
  html: string,
  baseDir: string
): Promise<string> {
  const imgRegex = /<img\s+[^>]*src="([^"]+)"[^>]*>/g;
  const matches = [...html.matchAll(imgRegex)];

  let result = html;

  for (const match of matches) {
    const src = match[1];

    // Skip data URIs
    if (src.startsWith("data:")) continue;

    try {
      let dataUri: string;
      if (src.startsWith("http://") || src.startsWith("https://")) {
        dataUri = await downloadAsDataUri(src);
      } else {
        dataUri = localFileToDataUri(src, baseDir);
      }
      result = result.replace(match[0], match[0].replace(src, dataUri));
    } catch (err) {
      console.error(`Warning: could not embed image "${src}": ${err}`);
    }
  }

  return result;
}

function localFileToDataUri(src: string, baseDir: string): string {
  const filePath = path.resolve(baseDir, src);
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] || "application/octet-stream";
  const data = fs.readFileSync(filePath);
  return `data:${mime};base64,${data.toString("base64")}`;
}

function downloadAsDataUri(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadAsDataUri(res.headers.location).then(resolve, reject);
      }
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => {
        const buffer = Buffer.concat(chunks);
        const contentType = res.headers["content-type"] || "image/png";
        resolve(`data:${contentType};base64,${buffer.toString("base64")}`);
      });
      res.on("error", reject);
    }).on("error", reject);
  });
}
