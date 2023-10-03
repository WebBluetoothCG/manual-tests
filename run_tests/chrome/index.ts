import puppeteer, { Browser, Page } from "puppeteer";
import { BrowserDriver, BrowserNames } from "../driver";
import assert from "assert";

let browser: Browser | null;
let mainPage: Page | null;

const assertBrowser = (browser: Browser | null): Browser => {
  assert(browser, "Browser not launched in time");
  return browser;
};
const assertPage = (page: Page | null): Page => {
  assert(page, "Page not opened in time");
  return page;
};

export const chromeDriver: BrowserDriver = {
  name: BrowserNames.CHROME,
  initialize: async () => {
    browser = await puppeteer.launch({
      headless: false,
    });
  },
  createSession: async (pageUrl: string) => {
    mainPage = await assertBrowser(browser).newPage();
    await mainPage.goto(pageUrl);
  },
  uploadDeviceCode: async () => {
    // open espruino tab
    await assertPage(mainPage).locator("#btn_load_code").click();
    const target = await assertBrowser(browser).waitForTarget(
      (t) => t.url().match(/espruino\.com/) !== null,
    );
    const espruinoPage = await target?.page();
    if (!espruinoPage) {
      throw "couldn't find loaded espruino page";
    }
    await espruinoPage.bringToFront();
    // bluetooth stuff
  },
  endSession: async () => {
    const openPages = await assertBrowser(browser).pages();
    await openPages.map((p) => p.close());
  },
  shutdown: async () => {
    await assertBrowser(browser).close();
  },
};
