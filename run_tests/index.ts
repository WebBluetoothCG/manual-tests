import * as fs from "fs";
import * as path from "path";
import { tap } from "@tapjs/core";
import { runServer, stopServer } from "./server";
import { runSingleTest } from "./single-test";
import { BrowserDriver, BrowserNames, getBrowserDriver } from "./driver";

const exampleFoldersDir = path.parse(__dirname).dir;
// TODO: hook up to CLI arg / ENV
const browser = BrowserNames.CHROME;

const pathFromDirent = (dir: fs.Dirent): string => {
  return path.join(dir.path, dir.name);
};

const getExampleDirectories = (
  directoryPath: string,
): ReadonlyArray<string> => {
  const exampleFolders = fs
    .readdirSync(directoryPath, {
      withFileTypes: true,
    })
    .filter((f) => {
      return (
        f.isDirectory() &&
        fs.readdirSync(pathFromDirent(f)).some((file) => {
          return file === "index.html";
        })
      );
    })
    .map((f) => path.relative(exampleFoldersDir, pathFromDirent(f)));
  return exampleFolders;
};

const runTestSuite = (
  dirs: ReadonlyArray<string>,
  browserDriver: BrowserDriver,
) => {
  const t = tap();
  t.plan(dirs.length);
  t.jobs = 1;
  t.before(async () => {
    await browserDriver.initialize();
  });
  t.afterEach(async function () {
    await browserDriver.endSession();
  });
  t.after(async () => {
    await browserDriver.shutdown();
    stopServer();
  });
  for (let d of dirs) {
    runSingleTest(d, browserDriver);
  }
};

const run = () => {
  const exDirs = getExampleDirectories(exampleFoldersDir);
  const browserDriver = getBrowserDriver(browser);
  runServer(exampleFoldersDir);
  runTestSuite(exDirs, browserDriver);
};

run();
