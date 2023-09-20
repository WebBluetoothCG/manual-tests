import puppeteer, { Browser, Page } from "puppeteer";
import { BrowserDriver, BrowserNames } from "../driver";
import assert from "assert";

let browser: Browser | null;
let page: Page | null;

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
    browser = await puppeteer.launch();
  },
  createSession: async (pageUrl: string) => {
    page = await assertBrowser(browser).newPage();
    await page.goto(`file:///${pageUrl}`);
  },
  uploadDeviceCode: () => {},
  endSession: async () => {
    await assertPage(page).close();
  },
  shutdown: async () => {
    await assertBrowser(browser).close();
  },
};
