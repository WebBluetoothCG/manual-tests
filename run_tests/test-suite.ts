import * as path from "path";
import { tap } from "@tapjs/core";
import { exampleFoldersDir, serverPort, testDirsToSkip } from "./const";
import { BrowserDriver } from "./driver";
import { runServer, stopServer } from "./server";

const serverBaseUrl = `http://localhost:${serverPort}`;
const t = tap();

/**
 * Iterates through all provided tests,
 * skipping those known to have unique unsupported UI patterns
 */
export const runTestSuite = (
  dirs: ReadonlyArray<string>,
  browserDriver: BrowserDriver,
  deviceName: string,
) => {
  t.setTimeout(480_000);
  t.plan(dirs.length);
  t.jobs = 1;

  t.before(async () => {
    runServer(exampleFoldersDir);
    await browserDriver.initialize();
  });
  t.after(async () => {
    await browserDriver.shutdown();
    stopServer();
  });

  for (let d of dirs) {
    t.test(d, async function (t) {
      t.setTimeout(30_000);
      t.before(async () => {
        await browserDriver.createSession(
          path.join(serverBaseUrl, d, "index.html"),
        );
      });
      t.after(async () => {
        await browserDriver.endSession();
      });
      const shouldSkip = testDirsToSkip.includes(d);
      t.test("In-browser test passes", { skip: shouldSkip }, async () => {
        const output = await browserDriver.operateTestPage(deviceName);
        t.comment(output.logs);
        t.equal(output.result, "PASS");
        t.end();
      });
    });
  }
};
