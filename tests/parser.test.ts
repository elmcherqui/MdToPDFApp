import { describe, it, expect } from "vitest";
import { parseMarkdown } from "../src/parser";

describe("parseMarkdown", () => {
  it("converts headings", () => {
    const result = parseMarkdown("# Hello");
    expect(result).toContain("<h1>Hello</h1>");
  });

  it("converts emoji shortcodes", () => {
    const result = parseMarkdown("Hello :smile:");
    expect(result).not.toContain(":smile:");
  });

  it("syntax-highlights code blocks", () => {
    const result = parseMarkdown('```js\nconst x = 1;\n```');
    expect(result).toContain("hljs");
  });

  it("converts mermaid blocks to div elements", () => {
    const result = parseMarkdown('```mermaid\ngraph TD\nA-->B\n```');
    expect(result).toContain('<div class="mermaid">');
    expect(result).toContain("graph TD");
    expect(result).not.toContain("<code");
  });

  it("escapes html-sensitive characters inside mermaid blocks", () => {
    const result = parseMarkdown('```mermaid\nclassDiagram\nclass Foo {\n<<AggregateRoot>>\n}\n```');
    expect(result).toContain("&lt;&lt;AggregateRoot&gt;&gt;");
    expect(result).not.toContain("<<AggregateRoot>>");
  });

  it("renders tables", () => {
    const md = "| A | B |\n|---|---|\n| 1 | 2 |";
    const result = parseMarkdown(md);
    expect(result).toContain("<table>");
  });
});
