declare module "markdown-it-emoji" {
  import MarkdownIt from "markdown-it";
  export const bare: MarkdownIt.PluginSimple;
  export const full: MarkdownIt.PluginSimple;
  export const light: MarkdownIt.PluginSimple;
}
