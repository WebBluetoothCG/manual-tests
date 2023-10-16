import express from "express";
import { Server } from "http";
import { serverPort } from "./const";

const app = express();
let server: Server;

/**
 * Runs a simple static web server to serve assets for tests
 */
export const runServer = (filePath: string) => {
  app.use(express.static(filePath));
  server = app.listen(serverPort);
};

export const stopServer = () => {
  server.close();
};
