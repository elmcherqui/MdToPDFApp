#!/usr/bin/env node

const originalEmitWarning = process.emitWarning;
process.emitWarning = ((warning: any, ...args: any[]) => {
  if (typeof warning === "string" && warning.includes("punycode")) return;
  return originalEmitWarning.call(process, warning, ...args);
}) as typeof process.emitWarning;

import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { discoverFiles } from "./discovery";
import { parseMarkdown } from "./parser";
import { embedImages } from "./images";
import { wrapInHtml } from "./template";
import { renderPdf, renderDocx, closeBrowser } from "./renderer";
import { ConvertOptions } from "./types";

const pkg = require("../package.json");

const program = new Command();

program
  .name("mdtopdf")
  .description("Convert Markdown files to PDF or DOCX")
  .version(pkg.version)
  .argument("<input>", "Path to a .md file or a folder containing .md files")
  .option("-f, --format <format>", "Output format: pdf or docx", "pdf")
  .option("-o, --output <dir>", "Output directory")
  .option("-r, --recursive", "Process subfolders recursively", false)
  .action(async (input: string, opts: Record<string, string | boolean>) => {
    const format = opts.format as "pdf" | "docx";
    if (format !== "pdf" && format !== "docx") {
      console.error(`Error: Invalid format "${format}". Use "pdf" or "docx".`);
      process.exit(1);
    }

    const options: ConvertOptions = {
      format,
      outputDir: opts.output as string | undefined,
      recursive: opts.recursive as boolean,
    };

    try {
      const files = discoverFiles(input, options);

      if (files.length === 0) {
        console.error("No markdown files found.");
        process.exit(1);
      }

      console.log(`Found ${files.length} markdown file(s).`);
      let hasErrors = false;

      for (const file of files) {
        try {
          console.log(
            `Converting: ${path.basename(file.inputPath)} → ${path.basename(file.outputPath)}`
          );

          // Ensure output directory exists
          const outDir = path.dirname(file.outputPath);
          if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
          }

          // Pipeline: read → parse → embed images → wrap → render
          const markdown = fs.readFileSync(file.inputPath, "utf-8");
          const bodyHtml = parseMarkdown(markdown);
          const baseDir = path.dirname(file.inputPath);
          const withImages = await embedImages(bodyHtml, baseDir);
          const fullHtml = wrapInHtml(withImages);

          if (format === "pdf") {
            await renderPdf(fullHtml, file.outputPath);
          } else {
            await renderDocx(fullHtml, file.outputPath);
          }

          console.log(`  Done: ${file.outputPath}`);
        } catch (err) {
          hasErrors = true;
          console.error(
            `  Error converting ${file.inputPath}: ${(err as Error).message}`
          );
        }
      }

      await closeBrowser();

      if (hasErrors) {
        process.exit(1);
      }
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program.parse();
