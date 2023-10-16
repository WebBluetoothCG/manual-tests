import path from "path";

export const exampleFoldersDir = path.parse(__dirname).dir;
export const serverPort = 3000;
export const testDirsToSkip = [
  "get_devices",
  "watch_advertisements",
  "forget_device",
];
export enum BrowserNames {
  CHROME = "chrome",
  FIREFOX = "firefox",
  SAFARI = "safari",
}
