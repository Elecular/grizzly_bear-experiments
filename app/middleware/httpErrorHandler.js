const { HttpError } = require("http-errors");

const httpErrorHandler = (err, req, res, next) => {
    console.log(err);
    if (!(err instanceof HttpError) || !err.status || !err.message) {
        next();
        return;
    }
    res.status(err.status).send(err.message);
};

module.exports = httpErrorHandler;
