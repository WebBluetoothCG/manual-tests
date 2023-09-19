import * as fs from "fs";
import * as path from "path";
import { tap } from "@tapjs/core";
import { runSingleTest } from "./single-test";

const exampleFoldersDir = path.parse(__dirname).dir;

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
    .map((f) => pathFromDirent(f));
  return exampleFolders;
};

const runTestSuite = (dirs: ReadonlyArray<string>) => {
  const t = tap();
  t.jobs = 1;
  t.before(() => {
    console.log("test suite setup goes here");
  });
  t.after(() => {
    console.log("test suite teardown goes here");
  });
  for (let d of dirs) {
    runSingleTest(path.basename(d));
  }
};

const run = () => {
  const exDirs = getExampleDirectories(exampleFoldersDir);
  runTestSuite(exDirs);
};

run();
