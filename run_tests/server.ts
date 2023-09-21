import express from "express";
import { Server } from "http";

const app = express();
let server: Server;

export const runServer = (filePath: string) => {
  app.use(express.static(filePath));
  server = app.listen(3000);
};

export const stopServer = () => {
  server.close();
};
