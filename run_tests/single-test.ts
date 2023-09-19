import t from "tap";
import { BrowserDriver } from "./driver";

export const runSingleTest = (name: string, browserDriver: BrowserDriver) => {
  t.test(name, (t) => {
    t.before(() => {
      browserDriver.createSession();
    });
    t.after(() => {
      browserDriver.endSession();
    });

    t.pass("this passes");
    t.fail("this fails");
    t.end();
  });
};
