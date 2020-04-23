const express = require("express");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const log4js = require("log4js").getLogger();
const publicIndexRouter = require("./routes/public/index");
const publicProjectRouter = require("./routes/public/project");
const publicExperimentRouter = require("./routes/public/experiment");
const privateExperimentRouter = require("./routes/private/experiment");

/* * * * * * * PUBLIC APP * * * * * * */

//Endpoints in the public app can be accessed by the world
const publicApp = express();

publicApp.use(logger("dev"));
publicApp.use(express.json());
publicApp.use(express.urlencoded({ extended: false }));
publicApp.use(cookieParser());

publicApp.use("/", publicIndexRouter);
publicApp.use("/project/", publicProjectRouter);
publicApp.use("/experiment/", publicExperimentRouter);

publicApp.set("port", 80);

/* * * * * * * PRIVATE APP * * * * * * */

//Endpoints in the private app can only be accessed by other services and is NOT available to public
const privateApp = express();

privateApp.use(logger("dev"));
privateApp.use(express.json());
privateApp.use("/experiment/", privateExperimentRouter);

privateApp.set("port", 8080);

log4js.level = process.env.LOG_LEVEL || "debug";

module.exports = {
    public: publicApp,
    private: privateApp,
};
