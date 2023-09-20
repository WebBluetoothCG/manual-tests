import * as path from "path";
import t from "tap";
import { BrowserDriver } from "./driver";

export const runSingleTest = (
  testPath: string,
  browserDriver: BrowserDriver,
) => {
  t.test(path.basename(testPath), (t) => {
    t.before(async () => {
      await browserDriver.createSession(path.join(testPath, "index.html"));
    });
    t.after(async () => {
      await browserDriver.endSession();
    });

    t.pass("this passes");
    t.end();
  });
};
