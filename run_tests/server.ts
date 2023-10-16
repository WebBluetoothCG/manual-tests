import express from "express";
import { Server } from "http";

const app = express();
let server: Server;

export const runServer = (filePath: string) => {
  app.use(express.static(filePath));
  server = app.listen(serverPort);
};

export const stopServer = () => {
  server.close();
};
