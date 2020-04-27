/**
 * This API is used for creating and accessing experiments. This is a Public API
 */

const express = require("express");
const experimentController = require("../../controllers/experiment");
const projectController = require("../../controllers/project");
const router = express.Router();
const checkJwt = require("../../middleware/checkJwt").checkJwt;

/**
 * Creates a new experiment under the given projectid
 */
router.post("/", checkJwt, async function (req, res, next) {
    try {
        res.status(201);
        res.json(
            await experimentController.addExperiment(req.user.sub, req.body),
        );
    } catch (err) {
        next(err);
    }
});

/**
 * Gets experiment with given project id
 */
router.get("/projectId/:projectId", checkJwt, async function (req, res, next) {
    try {
        res.status(200);
        await projectController.validateOwner(
            req.user.sub,
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
router.get("/projectId/:projectId/name/:name", checkJwt, async function (
    req,
    res,
    next,
) {
    try {
        res.status(200);
        await projectController.validateOwner(
            req.user.sub,
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

/**
 * Gets the variation for given project, experiment and user
 */
router.get(
    "/projectId/:projectId/name/:name/variation/:userId",
    async function (req, res, next) {
        try {
            res.status(200);
            res.json(
                await experimentController.getVariationForSingleUser(
                    req.params.projectId,
                    req.params.name,
                    req.params.userId,
                ),
            );
        } catch (err) {
            next(err);
        }
    },
);

module.exports = router;
