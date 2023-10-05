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

const operateEspruinoPage = async (page: Page) => {
  // dismiss "welcome" modal
  await page.locator("#guiders_overlay").click();
  // have to wait ~250ms for the overlay to transition out 😞
  await new Promise((res) => setTimeout(res, 250));
  // click connect icon in top left
  await page.locator("#icon-connection").click();
  //
  //
  // THIS CRASHES RIGHT NOW DUE TO https://github.com/puppeteer/puppeteer/issues/11072
  // >>>>>>>
  // click "Web Bluetooth" button in modal
  const [devicePrompt] = await Promise.all([
    page.waitForDevicePrompt(),
    page.locator('#portselector a[title="Web Bluetooth"]').click(),
  ]);
  // >>>>>>>
  //
  //
  console.log(devicePrompt);
  devicePrompt.select(
    await devicePrompt.waitForDevice(({ name }) => name.match(/puck/) !== null),
  );
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
    await operateEspruinoPage(espruinoPage);
  },
  runInBrowserTest: async () => {
    const page = assertPage(mainPage);
    await page.bringToFront();
    await page.locator("#btn_start_test").click();
    // wait for result area to say PASS (or FAIL)
    await page.waitForFunction(
      `document.querySelector("#test_result").innerText.length > 0`,
    );
    // grab test output in page
    const result = await Promise.all([
      await page.$eval("#test_result", (el): string => el.innerText),
      await page.$eval("#status", (el): string => el.innerText),
    ]);
    return { result: result[0], logs: result[1] };
  },
  endSession: async () => {
    const openPages = await assertBrowser(browser).pages();
    await openPages.map((p) => p.close());
  },
  shutdown: async () => {
    await assertBrowser(browser).close();
  },
};
