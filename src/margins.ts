import { Margins, PageSize } from "./types";

export const DEFAULT_MARGIN = "10mm";
export const DEFAULT_MARGINS: Margins = { top: 10, right: 10, bottom: 10, left: 10 };

const MM_PER_UNIT: Record<string, number> = {
  mm: 1,
  cm: 10,
  in: 25.4,
  px: 25.4 / 96,
};

const VALUE_PATTERN = /^(\d+(?:\.\d+)?|\.\d+)(mm|cm|in|px)?$/i;

function toMillimetres(token: string, input: string): number {
  const match = VALUE_PATTERN.exec(token);
  if (!match) {
    throw new Error(
      `Invalid margin "${input}". Use 1 to 4 non-negative values in mm, cm, in or px (e.g. "10mm" or "10mm 15mm").`
    );
  }
  const unit = (match[2] ?? "mm").toLowerCase();
  return parseFloat(match[1]) * MM_PER_UNIT[unit];
}

/**
 * Parse a CSS-style margin shorthand ("10mm", "10mm 15mm", ...) into
 * per-side values in millimetres. Bare numbers are treated as mm.
 */
export function parseMargins(input: string): Margins {
  const tokens = input.trim().split(/\s+/).filter(Boolean);
  if (tokens.length < 1 || tokens.length > 4) {
    throw new Error(
      `Invalid margin "${input}". Use 1 to 4 values (e.g. "10mm" or "10mm 15mm").`
    );
  }

  const [top, right = top, bottom = top, left = right] = tokens.map((t) =>
    toMillimetres(t, input)
  );
  return { top, right, bottom, left };
}

/** Throw if the margins leave no room for content on the given page. */
export function assertMarginsFit(margins: Margins, page: PageSize): void {
  const horizontal = margins.left + margins.right;
  const vertical = margins.top + margins.bottom;
  if (horizontal >= page.width) {
    throw new Error(
      `Invalid margin: left + right (${horizontal}mm) must be less than the page width (${page.width}mm).`
    );
  }
  if (vertical >= page.height) {
    throw new Error(
      `Invalid margin: top + bottom (${vertical}mm) must be less than the page height (${page.height}mm).`
    );
  }
}
