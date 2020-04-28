const { HttpError } = require("http-errors");
const logger = require("log4js").getLogger();

const httpErrorHandler = (err, req, res, next) => {
    logger.error(err);
    if (!(err instanceof HttpError) || !err.status || !err.message) {
        next(err);
        return;
    }
    res.status(err.status).send(err.message);
};

module.exports = httpErrorHandler;
