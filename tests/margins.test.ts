import { describe, it, expect } from "vitest";
import { parseMargins, assertMarginsFit, DEFAULT_MARGIN, DEFAULT_MARGINS } from "../src/margins";

describe("parseMargins", () => {
  it("applies a single value to all four sides", () => {
    expect(parseMargins("10mm")).toEqual({ top: 10, right: 10, bottom: 10, left: 10 });
  });

  it("uses two values as vertical and horizontal", () => {
    expect(parseMargins("10mm 15mm")).toEqual({ top: 10, right: 15, bottom: 10, left: 15 });
  });

  it("uses three values as top, horizontal, bottom", () => {
    expect(parseMargins("10mm 15mm 12mm")).toEqual({ top: 10, right: 15, bottom: 12, left: 15 });
  });

  it("uses four values as top, right, bottom, left", () => {
    expect(parseMargins("1mm 2mm 3mm 4mm")).toEqual({ top: 1, right: 2, bottom: 3, left: 4 });
  });

  it("converts cm, in and px to millimetres", () => {
    const m = parseMargins("1cm 1in 96px 0");
    expect(m.top).toBeCloseTo(10);
    expect(m.right).toBeCloseTo(25.4);
    expect(m.bottom).toBeCloseTo(25.4);
    expect(m.left).toBe(0);
  });

  it("treats a bare number as millimetres", () => {
    expect(parseMargins("12.5")).toEqual({ top: 12.5, right: 12.5, bottom: 12.5, left: 12.5 });
  });

  it("ignores surrounding whitespace and unit case", () => {
    expect(parseMargins("  5MM   8Mm ")).toEqual({ top: 5, right: 8, bottom: 5, left: 8 });
  });

  it("defaults to 10mm on every side", () => {
    expect(parseMargins(DEFAULT_MARGIN)).toEqual({ top: 10, right: 10, bottom: 10, left: 10 });
    expect(DEFAULT_MARGINS).toEqual(parseMargins(DEFAULT_MARGIN));
  });

  it.each([
    ["", "empty"],
    ["abc", "not a number"],
    ["10pt", "unknown unit"],
    ["-5mm", "negative"],
    ["1mm 2mm 3mm 4mm 5mm", "too many values"],
    ["10mm,15mm", "comma separated"],
  ])("rejects %j (%s)", (input) => {
    expect(() => parseMargins(input)).toThrow(/Invalid margin/);
  });
});

describe("assertMarginsFit", () => {
  const a4 = { width: 210, height: 297 };

  it("accepts margins that leave room for content", () => {
    expect(() => assertMarginsFit({ top: 140, right: 100, bottom: 140, left: 100 }, a4)).not.toThrow();
  });

  it("rejects left + right that fill the page width", () => {
    expect(() => assertMarginsFit({ top: 10, right: 105, bottom: 10, left: 105 }, a4)).toThrow(
      /left \+ right \(210mm\) must be less than the page width \(210mm\)/
    );
  });

  it("rejects top + bottom that fill the page height", () => {
    expect(() => assertMarginsFit({ top: 200, right: 10, bottom: 100, left: 10 }, a4)).toThrow(
      /top \+ bottom \(300mm\) must be less than the page height \(297mm\)/
    );
  });
});
