import * as fs from "fs";
import * as path from "path";

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

const run = () => {
  const exDirs = getExampleDirectories(exampleFoldersDir);
  console.log(exDirs);
};

run();
