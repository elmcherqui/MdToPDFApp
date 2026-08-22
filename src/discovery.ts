import * as fs from "fs";
import * as path from "path";
import { ConvertOptions, FileEntry } from "./types";

export function discoverFiles(
  inputPath: string,
  options: ConvertOptions
): FileEntry[] {
  const resolved = path.resolve(inputPath);

  if (!fs.existsSync(resolved)) {
    throw new Error(`Input path does not exist: ${resolved}`);
  }

  const stat = fs.statSync(resolved);

  if (stat.isFile()) {
    if (!resolved.endsWith(".md")) {
      throw new Error(`Input file is not a markdown file: ${resolved}`);
    }
    return [buildFileEntry(resolved, options)];
  }

  if (stat.isDirectory()) {
    return findMarkdownFiles(resolved, options, options.recursive ?? false);
  }

  throw new Error(`Input path is neither a file nor a directory: ${resolved}`);
}

function findMarkdownFiles(
  dir: string,
  options: ConvertOptions,
  recursive: boolean
): FileEntry[] {
  const entries: FileEntry[] = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isFile() && item.name.endsWith(".md")) {
      entries.push(buildFileEntry(fullPath, options));
    } else if (item.isDirectory() && recursive) {
      entries.push(...findMarkdownFiles(fullPath, options, true));
    }
  }

  return entries;
}

function buildFileEntry(
  inputPath: string,
  options: ConvertOptions
): FileEntry {
  const ext = options.format === "docx" ? ".docx" : ".pdf";
  const baseName = path.basename(inputPath, ".md") + ext;
  const outputDir = options.outputDir
    ? path.resolve(options.outputDir)
    : path.dirname(inputPath);
  return {
    inputPath,
    outputPath: path.join(outputDir, baseName),
  };
}
