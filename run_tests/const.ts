import path from "path";

/**
 * Directory names of tests that aren't supported by this automation script
 * Reasons documented in the [README](./README.md) "Exceptions" section.
 * These tests will not be run as part of this automation.
 */
export const testDirsToSkip = [
  "get_devices",
  "watch_advertisements",
  "forget_device",
];

/**
 * Directory containing all test directories
 */
export const exampleFoldersDir = path.parse(__dirname).dir;

/**
 * Port used by static server
 */
export const serverPort = 3000;

/**
 * Enum of possible browsers
 */
export enum BrowserNames {
  CHROME = "chrome",
  FIREFOX = "firefox",
  SAFARI = "safari",
}
