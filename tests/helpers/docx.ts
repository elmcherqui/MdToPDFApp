import * as fs from "fs";
import JSZip from "jszip";

/** Read word/document.xml from a DOCX file. */
export async function docxDocumentXml(docxPath: string): Promise<string> {
  const zip = await JSZip.loadAsync(fs.readFileSync(docxPath));
  return zip.file("word/document.xml")!.async("string");
}

/** Read the `w:` attributes of the first `<tag>` element in a DOCX's document.xml. */
async function docxElementAttrs(docxPath: string, tag: string): Promise<Record<string, string>> {
  const xml = await docxDocumentXml(docxPath);
  const element = new RegExp(`<${tag}\\b[^>]*>`).exec(xml)?.[0];
  if (!element) throw new Error(`No <${tag}> found in DOCX`);
  const attrs: Record<string, string> = {};
  for (const [, name, value] of element.matchAll(/w:(\w+)="([^"]*)"/g)) {
    attrs[name] = value;
  }
  return attrs;
}

/** Read the `<w:pgMar>` attributes (twips, as strings) from a DOCX file. */
export function docxPageMargins(docxPath: string): Promise<Record<string, string>> {
  return docxElementAttrs(docxPath, "w:pgMar");
}

/** Read the `<w:pgSz>` attributes (twips, as strings) from a DOCX file. */
export function docxPageSize(docxPath: string): Promise<Record<string, string>> {
  return docxElementAttrs(docxPath, "w:pgSz");
}
