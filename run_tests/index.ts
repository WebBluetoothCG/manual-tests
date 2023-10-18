import * as fs from "fs";
import * as path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { BrowserNames, exampleFoldersDir } from "./const";
import { runTestSuite } from "./test-suite";
import { getBrowserDriver } from "./driver";

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

const pathFromDirent = (dir: fs.Dirent): string => {
  return path.join(dir.path, dir.name);
};

/**
 * Gets all directories at repo root that have an `index.html`
 */
const getExampleDirectories = (
  directoryPath: string,
): ReadonlyArray<string> => {
  const exampleFolders = fs
    .readdirSync(directoryPath, {
      withFileTypes: true,
    })
    .filter(
      (f) =>
        f.isDirectory() &&
        fs.readdirSync(pathFromDirent(f)).includes("index.html"),
    )
    .map((f) => path.relative(exampleFoldersDir, pathFromDirent(f)));
  return exampleFolders;
};

const run = async () => {
  const args = await argParser();
  const exDirs = getExampleDirectories(exampleFoldersDir);
  const browserDriver = getBrowserDriver(args.browser);
  runTestSuite(exDirs, browserDriver, args.deviceName);
};

run();
