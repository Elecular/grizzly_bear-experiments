const express = require("express");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const log4js = require("log4js").getLogger();
const indexRouter = require("./routes/index");
const projectRouter = require("./routes/project");
const experimentRouter = require("./routes/experiment");

const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/", indexRouter);
app.use("/project/", projectRouter);
app.use("/experiment/", experimentRouter);

log4js.level = process.env.LOG_LEVEL || "debug";

module.exports = app;
