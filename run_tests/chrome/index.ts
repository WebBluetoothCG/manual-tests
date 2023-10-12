import puppeteer, { Browser, Page } from "puppeteer";
import { BrowserNames } from "../const";
import { BrowserDriver } from "../driver";
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

const operateEspruinoPage = async (page: Page, deviceName: string) => {
  // dismiss "welcome" modal
  await page.locator("#guiders_overlay").click();
  // have to wait for the overlay to transition out 😞
  await Promise.race([
    // should work based on page css
    page.waitForSelector(`#guiders_overlay[style*="display: none;"]`),
    // but in case not this might catch it
    new Promise((res) => setTimeout(res, 500)),
  ]);
  // click connect icon in top left
  await page.locator("#icon-connection").click();
  // click bluetooth button
  await page.locator('#portselector a[title="Web Bluetooth"]').click();
  //
  //
  // THIS CRASHES RIGHT NOW DUE TO https://github.com/puppeteer/puppeteer/issues/11072
  // -----------------------------------
  // click "Web Bluetooth" button in modal
  // const [devicePrompt] = await Promise.all([
  //   page.waitForDevicePrompt(),
  //   page.locator('#portselector a[title="Web Bluetooth"]').click(),
  // ]);
  // devicePrompt.select(
  //   await devicePrompt.waitForDevice(({ name }) => name.match(/puck/) !== null),
  // );
  // -----------------------------------
  //
  //
  const device = await page.evaluate(() => {
    return new Promise((res) => {
      navigator.bluetooth
        .requestDevice({
          filters: [{ name: deviceName }],
        })
        .then(res);
    });
  });
  console.log(device);
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
  uploadDeviceCode: async (deviceName: string) => {
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
    await operateEspruinoPage(espruinoPage, deviceName);
  },
  runInBrowserTest: async () => {
    const page = assertPage(mainPage);
    await page.bringToFront();
    // this button is actually not present on more involved tests
    // so we don't wait long for it to appear and then we move on
    const startButton = await page.waitForSelector("#btn_start_test", {
      timeout: 500,
    });
    if (!startButton) throw "no start test button found";
    startButton.click();
    // wait for result area to say PASS (or FAIL)
    await page.waitForFunction(
      `document.querySelector("#test_result").innerText.length > 0`,
    );
    // grab test output in page
    const result = await Promise.all([
      await page.$eval(
        "#test_result",
        (el): string => (el as HTMLElement).innerText,
      ),
      await page.$eval(
        "#status",
        (el): string => (el as HTMLElement).innerText,
      ),
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
