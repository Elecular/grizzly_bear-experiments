/**
 * This API is used for creating and accessing experiments. This is a Public API
 */

const express = require("express");
const experimentController = require("../../controllers/experiment");
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
 * Gets experiment with given project id
 */
router.get("/projectId/:projectId", async function (req, res, next) {
    try {
        res.status(200);
        await experimentController.validateOwner(
            req.headers.ownerid,
            req.params.projectId,
        );
        res.json(
            await experimentController.getExperimentsByProjectId(
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
router.get("/projectId/:projectId/name/:name", async function (req, res, next) {
    try {
        res.status(200);
        await experimentController.validateOwner(
            req.headers.ownerid,
            req.params.projectId,
        );
        res.json(
            await experimentController.getExperimentByName(
                req.params.projectId,
                req.params.name,
            ),
        );
    } catch (err) {
        next(err);
    }
});

module.exports = router;
