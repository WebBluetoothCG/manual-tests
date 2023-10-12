import * as fs from "fs";
import * as path from "path";
import { tap } from "@tapjs/core";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { BrowserNames, exampleFoldersDir, testDirsToSkip } from "./const";
import { runServer, stopServer } from "./server";
import { runSingleTest } from "./single-test";
import { BrowserDriver, getBrowserDriver } from "./driver";

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
  deviceName: string,
) => {
  const t = tap();
  t.plan(dirs.length);
  t.jobs = 1;
  t.before(async () => {
    await browserDriver.initialize();
  });
  t.afterEach(async () => {
    await browserDriver.endSession();
  });
  t.after(async () => {
    await browserDriver.shutdown();
    stopServer();
  });
  for (let d of dirs) {
    if (testDirsToSkip.some((td) => td == d)) {
      t.skip(d, () => {});
    } else {
      runSingleTest(d, browserDriver, deviceName);
    }
  }
};

const argParser = async () => {
  return await yargs(hideBin(process.argv)).options({
    browser: {
      choices: Object.values(BrowserNames),
      default: BrowserNames.CHROME,
      alias: "b",
      description: "Which browser to run tests with",
    },
    deviceName: {
      type: "string",
      demandOption: true,
      alias: "d",
      description:
        "Name of bluetooth device to utilize in tests. This device should be powered on and within range of the machine running this test",
    },
  }).argv;
};

const run = async () => {
  const args = await argParser();
  const exDirs = getExampleDirectories(exampleFoldersDir);
  const browserDriver = getBrowserDriver(args.browser);
  runServer(exampleFoldersDir);
  runTestSuite(exDirs, browserDriver, args.deviceName);
};

run();
