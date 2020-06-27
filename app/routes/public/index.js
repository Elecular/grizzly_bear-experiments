let express = require("express");
const { isConnected } = require("../../db/mongodb");
const createHttpError = require("http-errors");
let router = express.Router();

/* GET home page. */
router.get("/", async function (req, res) {
    res.send("This is the experiments API");
});

/**
 * Gets status of the service
 */
router.get("/status", async function (req, res, next) {
    try {
        const mongoStatus = await isConnected();
        res.json({
            status: mongoStatus,
        }).status(200);
    } catch (err) {
        next(new createHttpError(500, "Internal Server Error"));
    }
});

module.exports = router;
