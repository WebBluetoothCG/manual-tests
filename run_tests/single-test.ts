import t from "tap";

export const runSingleTest = (name: string) => {
  t.test(name, (t) => {
    t.before(() => {
      console.log("individual test setup goes here");
    });
    t.after(() => {
      console.log("individual test teardown goes here");
    });

    t.pass("this passes");
    t.fail("this fails");
    t.end();
  });
};
