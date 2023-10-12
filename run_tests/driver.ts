import { BrowserNames } from "./const";
import { chromeDriver } from "./chrome";

export type BrowserDriver = {
  name: BrowserNames;
  initialize: () => Promise<void>;
  createSession: (url: string) => Promise<void>;
  uploadDeviceCode: (deviceName: string) => Promise<void>;
  runInBrowserTest: () => Promise<{ result: string; logs: string }>;
  endSession: () => Promise<void>;
  shutdown: () => Promise<void>;
};

export const getBrowserDriver = (name: BrowserNames): BrowserDriver => {
  switch (name) {
    case BrowserNames.CHROME:
      return chromeDriver;
    case BrowserNames.FIREFOX:
    case BrowserNames.SAFARI:
      throw `Driver for ${name} is currently unimplemented`;
  }
};
