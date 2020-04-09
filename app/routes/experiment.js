/**
 * This API is used for creating and accessing experiments
 */

const express = require("express");
const experimentController = require("../controllers/experiment");
const router = express.Router();

/**
 * Creates a new experiment under the given projectid
 */
router.post("/", async function (req, res, next) {
    try {
        res.status(201);
        res.json(
            await experimentController.addExperiment(
                req.headers.ownerid,
                req.body,
            ),
        );
    } catch (err) {
        next(err);
    }
});

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
 * Gets experiment with given project id
 */
router.get("/projectId/:projectId", async function (req, res, next) {
    try {
        res.status(200);
        res.json(
            await experimentController.getExperimentsByProjectId(
                req.headers.ownerid,
                req.params.projectId,
            ),
        );
    } catch (err) {
        next(err);
    }
});

/**
 * Gets experiment by given project id and name
 */
router.get("/variations", async function (req, res, next) {
    try {
        res.status(200);
        res.json(await experimentController.getVarationForUsers(req.body));
    } catch (err) {
        next(err);
    }
});

/**
 * Gets experiment by given project id and name
 */
router.get("/projectId/:projectId/name/:name/variation/:", async function (
    req,
    res,
    next,
) {
    try {
        res.status(200);
        res.json(
            await experimentController.getExperimentByName(
                req.headers.ownerid,
                req.params.projectId,
                req.params.name,
            ),
        );
    } catch (err) {
        next(err);
    }
});

module.exports = router;
