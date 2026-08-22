import * as fs from "fs";
import * as path from "path";

const HIGHLIGHT_CSS_PATH = require.resolve("highlight.js/styles/github.css");
const MERMAID_JS_PATH = require.resolve("mermaid/dist/mermaid.min.js");

export function wrapInHtml(bodyHtml: string): string {
  const stylePath = path.join(__dirname, "..", "assets", "style.css");
  const customCss = fs.readFileSync(stylePath, "utf-8");
  const highlightCss = fs.readFileSync(HIGHLIGHT_CSS_PATH, "utf-8");
  const mermaidJs = fs.readFileSync(MERMAID_JS_PATH, "utf-8");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>${highlightCss}</style>
  <style>${customCss}</style>
  <script>${mermaidJs}</script>
  <script>
    mermaid.initialize({ startOnLoad: false, theme: 'default' });
  </script>
</head>
<body>
  ${bodyHtml}
  <script>
    (async () => {
      try {
        const mermaidDivs = document.querySelectorAll('.mermaid');
        if (mermaidDivs.length > 0) {
          await mermaid.run({ nodes: mermaidDivs, suppressErrors: true });
        }
      } catch (e) {
        console.error('mermaid rendering failed', e);
      } finally {
        window.__mermaidRendered = true;
      }
    })();
  </script>
</body>
</html>`;
}
