export interface ConvertOptions {
  format: "pdf" | "docx";
  outputDir?: string;
  recursive?: boolean;
}

export interface FileEntry {
  inputPath: string;   // absolute path to .md file
  outputPath: string;  // absolute path to output file
}
