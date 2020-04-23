/**
 * This API is an internal API that can only be accessed through other services and NOT available to the public
 */

const express = require("express");
const experimentController = require("../../controllers/experiment");
const router = express.Router();

/**
 * Gets all running experiments with given date
 */
router.get("/timerange/:startTime/:endTime", async function (req, res, next) {
    try {
        res.status(200);
        res.json(
            await experimentController.getRunningExperimentsInTimeRange(
                req.params.startTime,
                req.params.endTime,
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

/**
 * Checks if the given owner id is the actual owner of the given project
 */
router.get("/validateOwner", async (req, res, next) => {
    try {
        await experimentController.validateOwner(
            req.body.ownerId,
            req.body.projectId,
        );
        res.json({ isOwner: true });
    } catch (err) {
        if (err.statusCode === 401) res.json({ isOwner: false });
        else next(err);
    }
});

module.exports = router;
