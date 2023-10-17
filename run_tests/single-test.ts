import * as path from "path";
import t from "tap";
import { serverPort } from "./const";
import { BrowserDriver } from "./driver";

const serverBaseUrl = `http://localhost:${serverPort}`;

/**
 * Runs a single test
 */
export const runSingleTest = (
  testPath: string,
  browserDriver: BrowserDriver,
  deviceName: string,
) => {
  t.test(testPath, async function (t) {
    t.setTimeout(2 * 60 * 1000);
    await browserDriver.createSession(
      path.join(serverBaseUrl, testPath, "index.html"),
    );
    await browserDriver.uploadDeviceCode(deviceName);
    const output = await browserDriver.runInBrowserTest();
    t.debug(output.logs);
    t.equal(output.result, "PASS");
    t.end();
  });
};
