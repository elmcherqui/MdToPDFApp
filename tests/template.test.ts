import { describe, it, expect, afterAll } from "vitest";
import puppeteer, { Browser } from "puppeteer";
import { wrapInHtml } from "../src/template";

let browser: Browser | undefined;

afterAll(async () => {
  await browser?.close();
});

describe("wrapInHtml", () => {
  it("lets content fill the whole printable area (page margins are the only spacing)", async () => {
    browser ??= await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 800 });
    await page.emulateMediaType("print");
    await page.setContent(wrapInHtml(`<p id="probe">text</p>`));

    const rect = await page.$eval("#probe", (el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, width: r.width };
    });

    expect(rect.left).toBe(0);
    expect(rect.width).toBe(1000);
  }, 30000);

  it("adds no space above a heading that opens the document", async () => {
    browser ??= await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.emulateMediaType("print");
    await page.setContent(wrapInHtml(`<h1 id="probe">Title</h1><p>text</p>`));

    const top = await page.$eval("#probe", (el) => el.getBoundingClientRect().top);

    expect(top).toBe(0);
  }, 30000);
});
