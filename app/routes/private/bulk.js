/**
 * This API is an internal API that can only be accessed through other services and NOT available to the public
 */

const express = require("express");
const experimentController = require("../../controllers/experiment");
const router = express.Router();

/**
 * Gets all running experiments with given date
 */
router.get("/experiments", async function (req, res, next) {
    try {
        res.status(200);
        res.json(
            await experimentController.getRunningExperimentsInTimeRange(
                req.query.startTime,
                req.query.endTime,
            ),
        );
    } catch (err) {
        next(err);
    }
});

/**
 * Gets all variations of given combination of projectId, experimentId and userId
 */
router.post("/variations", async function (req, res, next) {
    try {
        res.status(200);
        res.json(
            await experimentController.getVariationForMultipleUsers(req.body),
        );
    } catch (err) {
        next(err);
    }
});

module.exports = router;
