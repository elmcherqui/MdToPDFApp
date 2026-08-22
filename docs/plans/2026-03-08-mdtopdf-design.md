# MdToPDF Design Document

## Overview

A Node.js CLI tool that converts Markdown files to PDF or Word (DOCX) format. Supports images (local + remote), emoji, syntax-highlighted code blocks, and Mermaid diagrams.

## Architecture

The tool follows a pipeline architecture:

1. **CLI Entry Point** — parse arguments (input path, format, output dir, recursive flag)
2. **File Discovery** — resolve single .md file or scan directory for .md files
3. **Markdown to HTML Pipeline**:
   - Parse markdown using `markdown-it` with emoji plugin
   - Download remote images and resolve local images to base64 data URIs
   - Apply syntax highlighting via `highlight.js`
   - Wrap in a styled HTML template
   - Mermaid code blocks become `<div class="mermaid">` elements
4. **Output Generation**:
   - **PDF**: Puppeteer loads the HTML, waits for mermaid.js to render diagrams, then calls `page.pdf()`
   - **DOCX**: Same HTML converted via `html-to-docx` library

A single Puppeteer browser instance is reused across multiple file conversions for performance.

## CLI Interface

```
mdtopdf <input> [options]

Arguments:
  input                 Path to a .md file or a folder containing .md files

Options:
  --format, -f          Output format: "pdf" or "docx" (default: "pdf")
  --output, -o          Output directory (default: same directory as input file)
  --recursive, -r       Process subfolders when input is a directory
  --version, -v         Show version
  --help, -h            Show help
```

- Output files named after input: `README.md` -> `README.pdf`
- Overwrites existing output files
- Exit code 0 on success, 1 on error
- Progress logged to stdout, errors to stderr
- Continues processing remaining files on error

## Styling

- GitHub-flavored markdown style baseline
- System sans-serif font stack, 14px base size
- Syntax-highlighted code blocks with background shading (highlight.js)
- A4 page size with 20mm margins for PDF
- Emoji rendered natively by Chrome's unicode glyph support

## Mermaid Rendering

Mermaid diagrams are rendered inside Puppeteer itself:
1. markdown-it parses fenced `mermaid` code blocks
2. HTML template includes mermaid.js from CDN or bundled
3. Puppeteer waits for `mermaid.run()` to complete
4. Diagrams become inline SVGs, captured in PDF output

## Image Handling

- Remote URLs: downloaded to temp dir, embedded as base64 data URIs
- Local paths: resolved relative to the markdown file's directory, embedded as base64
- HTML is fully self-contained before rendering

## Dependencies

| Package | Purpose |
|---|---|
| commander | CLI argument parsing |
| markdown-it | Markdown parsing |
| markdown-it-emoji | Emoji shortcode support |
| highlight.js | Syntax highlighting |
| puppeteer | Headless Chrome for PDF + Mermaid |
| html-to-docx | HTML to DOCX conversion |
| typescript | Type safety |

## Project Structure

```
MdToPDFApp/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts            # CLI entry point
│   ├── discovery.ts        # Find .md files from input path
│   ├── parser.ts           # Markdown to HTML conversion
│   ├── images.ts           # Download/embed images as base64
│   ├── renderer.ts         # Puppeteer PDF/DOCX generation
│   ├── template.ts         # HTML template with CSS
│   └── types.ts            # Shared types
├── assets/
│   └── style.css           # GFM-inspired stylesheet
└── dist/                   # Compiled output
```

## Distribution

- TypeScript compiled to `dist/`
- `bin` field in package.json for global install
- Install via `npm install -g` or run with `npx`
