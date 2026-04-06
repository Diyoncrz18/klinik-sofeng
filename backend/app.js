const express = require("express");
const cors = require("cors");
const { FRONTEND_ORIGIN } = require("./config/env");
const routes = require("./routes");
const { notFoundHandler } = require("./middlewares/notFoundHandler");
const { errorHandler } = require("./middlewares/errorHandler");

function createApp() {
  const app = express();

  app.use(
    cors({
      origin: FRONTEND_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json());

  app.use(routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp,
};
