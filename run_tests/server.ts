import express from "express";

const app = express();

export const runServer = (filePath: string) => {
  app.use(express.static(filePath));
  app.listen(3000);
};
