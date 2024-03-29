import puppeteer, { Browser, BrowserContext, Page } from "puppeteer";
import { BrowserNames, puppeteerInteractionTimeout } from "../const";
import { BrowserDriver } from "../driver";
import assert from "assert";

let browser: Browser | null;
let browserContext: BrowserContext | null;
let mainPage: Page | null;

const assertNotNull = <T>(subject: T | null): T => {
  assert(subject !== null, `${typeof subject} was null`);
  return subject;
};

const uploadDeviceCode = async (
  deviceNameMatcher: (deviceName: string) => boolean,
) => {
  // open espruino tab
  await assertNotNull(mainPage).locator("#btn_load_code").click();
  const target = await assertNotNull(browserContext).waitForTarget(
    (t) => t.url().match(/espruino\.com/) !== null,
  );
  const espruinoPage = await target?.page();
  if (!espruinoPage) {
    throw "couldn't find loaded espruino page";
  }
  espruinoPage.setDefaultTimeout(puppeteerInteractionTimeout);
  await espruinoPage.bringToFront();
  // dismiss "welcome" modal
  await espruinoPage.locator("#guiders_overlay").click();
  // have to wait for the overlay to transition out 😞
  await espruinoPage.waitForSelector("#guiders_overlay", { hidden: true });
  // wait a moment for the pages feature detection logic to run
  await espruinoPage.waitForFunction(() =>
    navigator.bluetooth.getAvailability(),
  );
  // click connect icon in top left
  await espruinoPage.locator("#icon-connection").click();

  // click "Web Bluetooth" button in modal
  const [devicePrompt] = await Promise.all([
    espruinoPage.waitForDevicePrompt(),
    espruinoPage.locator('#portselector a[title="Web Bluetooth"]').click(),
  ]);
  // find and select bluetooth device
  await devicePrompt.select(
    await devicePrompt.waitForDevice(({ name }) => deviceNameMatcher(name)),
  );

  // wait for connection to finish
  await Promise.all([
    espruinoPage.waitForFunction(
      () =>
        (document.querySelector(".status__message") as HTMLElement)?.innerText
          .toUpperCase()
          .startsWith("CONNECTED TO"),
    ),
    espruinoPage.waitForSelector("#portselector", { hidden: true }),
  ]);
  // select "flash" upload destination
  await espruinoPage.locator("#icon-deploy > .icon__more").click();
  await espruinoPage.locator('#sendmethod a[title="Flash"]').click();
  // wait for modal to go away
  await espruinoPage.waitForSelector("#sendmethod", { hidden: true });
  // click deploy button
  await espruinoPage.locator("#icon-deploy").click();
  // wait for status to say 'done'
  await espruinoPage.waitForFunction(
    () =>
      (
        document.querySelector(".status__message") as HTMLElement
      )?.innerText.toUpperCase() == "SENT",
  );
  await espruinoPage.close();
};

export const chromeDriver: BrowserDriver = {
  name: BrowserNames.CHROME,
  initialize: async () => {
    browser = await puppeteer.launch({
      headless: false,
      args: ["--no-startup-window", "--enable-features=WebBluetooth"],
      waitForInitialPage: false,
    });
  },
  createSession: async (pageUrl: string) => {
    browserContext =
      await assertNotNull(browser).createIncognitoBrowserContext();
    mainPage = await browserContext.newPage();
    mainPage.setDefaultTimeout(puppeteerInteractionTimeout);
    await mainPage.goto(pageUrl);
  },
  operateTestPage: async (
    deviceNameMatcher: (deviceName: string) => boolean,
  ) => {
    await uploadDeviceCode(deviceNameMatcher);
    const page = assertNotNull(mainPage);
    await page.bringToFront();

    // press "start test" button
    const [devicePrompt] = await Promise.all([
      page.waitForDevicePrompt(),
      page.locator("#btn_start_test").click(),
    ]);
    // find and connect to bluetooth device
    await devicePrompt.select(
      await devicePrompt.waitForDevice(({ name }) => deviceNameMatcher(name)),
    );

    // wait for result area to say PASS (or FAIL)
    await page.waitForFunction(
      () =>
        (document.querySelector("#test_result") as HTMLElement)?.innerText
          .length > 0,
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
    await assertNotNull(browserContext).close();
    browserContext = null;
  },
  shutdown: async () => {
    await assertNotNull(browser).close();
    browser = null;
  },
};
