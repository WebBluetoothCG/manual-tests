import path from "path";

/**
 * Directory containing all test directories
 */
export const exampleFoldersDir = path.parse(__dirname).dir;

/**
 * Port used by static server
 */
export const serverPort = 3000;

/**
 * Directory names of tests that aren't supported by this automation script
 */
export const testDirsToSkip = [
  "get_devices",
  "watch_advertisements",
  "forget_device",
];

/**
 * Enum of possible browsers
 */
export enum BrowserNames {
  CHROME = "chrome",
  FIREFOX = "firefox",
  SAFARI = "safari",
}
