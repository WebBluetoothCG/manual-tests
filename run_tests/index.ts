import * as fs from "fs";
import * as path from "path";

const pathFromDirent = (dir: fs.Dirent): string =>
  path.join(dir.path, dir.name);

const run = () => {
  const directoryPath = path.parse(__dirname).dir;
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
    });
  console.log(exampleFolders);
};

run();
