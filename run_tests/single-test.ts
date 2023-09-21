import * as path from "path";
import t from "tap";
import { BrowserDriver } from "./driver";

const serverBaseUrl = "http://localhost:3000";

export const runSingleTest = (
  testPath: string,
  browserDriver: BrowserDriver,
) => {
  t.test(testPath, (t) => {
    t.before(async () => {
      await browserDriver.createSession(
        path.join(serverBaseUrl, testPath, "index.html"),
      );
      await browserDriver.uploadDeviceCode();
    });
    t.after(async () => {
      await browserDriver.endSession();
    });

    t.pass("this passes");
    t.end();
  });
};
