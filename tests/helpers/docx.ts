import * as fs from "fs";
import JSZip from "jszip";

/** Read the `<w:pgMar>` attributes (twips, as strings) from a DOCX file. */
export async function docxPageMargins(docxPath: string): Promise<Record<string, string>> {
  const zip = await JSZip.loadAsync(fs.readFileSync(docxPath));
  const xml = await zip.file("word/document.xml")!.async("string");
  const pgMar = /<w:pgMar\b[^>]*>/.exec(xml)?.[0];
  if (!pgMar) throw new Error("No <w:pgMar> found in DOCX");
  const attrs: Record<string, string> = {};
  for (const [, name, value] of pgMar.matchAll(/w:(\w+)="([^"]*)"/g)) {
    attrs[name] = value;
  }
  return attrs;
}
