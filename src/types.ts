export interface ConvertOptions {
  format: "pdf" | "docx";
  outputDir?: string;
  recursive?: boolean;
}

/** Page margins in millimetres. */
export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Page dimensions in millimetres. */
export interface PageSize {
  width: number;
  height: number;
}

export interface FileEntry {
  inputPath: string;   // absolute path to .md file
  outputPath: string;  // absolute path to output file
}
