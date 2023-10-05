import * as path from "path";
import t from "tap";
import { BrowserDriver } from "./driver";

const serverBaseUrl = "http://localhost:3000";

export const runSingleTest = (
  testPath: string,
  browserDriver: BrowserDriver,
) => {
  t.test(testPath, async function (t) {
    await browserDriver.createSession(
      path.join(serverBaseUrl, testPath, "index.html"),
    );
    // await browserDriver.uploadDeviceCode();
    const output = await browserDriver.runInBrowserTest();
    t.debug(output.logs);
    t.equal(output.result, "PASS");
    t.end();
  });
};
