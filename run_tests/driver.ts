import { BrowserNames } from "./const";
import { chromeDriver } from "./chrome";

export type BrowserDriver = {
  /**
   * The name of the browser used by this driver
   */
  name: BrowserNames;
  /**
   * Set up browser. Called once before test suite starts.
   */
  initialize: () => Promise<void>;
  /**
   * Open the provided webpage. Called at the beginning of every test.
   */
  createSession: (url: string) => Promise<void>;
  /**
   * Runs the test in the opened page.
   * @returns A tuple of the test result (either `PASS` or `FAIL`) and the logs printed out during the test.
   */
  operateTestPage: (
    deviceName: string,
  ) => Promise<{ result: string; logs: string }>;
  /**
   * Close webpages. Called at the end of every test.
   */
  endSession: () => Promise<void>;
  /**
   * Shutdown and clean up browser. Called at the end of the test suite.
   */
  shutdown: () => Promise<void>;
};

/**
 * Returns the `BrowserDriver` object corresponding to the provided browser name
 */
export const getBrowserDriver = (name: BrowserNames): BrowserDriver => {
  switch (name) {
    case BrowserNames.CHROME:
      return chromeDriver;
    case BrowserNames.FIREFOX:
    case BrowserNames.SAFARI:
      throw `Driver for ${name} is currently unimplemented`;
  }
};
