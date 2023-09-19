import t from "tap";

export const runSingleTest = (name: string) => {
  t.before(() => {
    console.log("individual test setup goes here");
  });
  t.test(name, (t) => {
    t.pass("this passes");
    t.fail("this fails");
    t.end();
  });
  t.after(() => {
    console.log("individual test teardown goes here");
  });
};
