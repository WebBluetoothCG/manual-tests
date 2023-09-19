import { BrowserDriver, BrowserNames } from "../driver";

export const chromeDriver: BrowserDriver = {
  name: BrowserNames.CHROME,
  initialize: () => {
    console.log("chrome driver initialize");
  },
  createSession: () => {
    console.log("chrome driver createSession");
  },
  uploadDeviceCode: () => {
    console.log("chrome driver uploadDeviceCode");
  },
  endSession: () => {
    console.log("chrome driver endSession");
  },
  shutdown: () => {
    console.log("chrome driver shutdown");
  },
};
