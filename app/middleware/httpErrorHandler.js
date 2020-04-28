const { HttpError } = require("http-errors");

const httpErrorHandler = (err, req, res, next) => {
    if (!(err instanceof HttpError)) next();
    res.status(err.status).send(err.message);
};

module.exports = httpErrorHandler;
