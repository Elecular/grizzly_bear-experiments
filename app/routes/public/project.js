/**
 * This API is used for creating and accessing proojectcs
 */

const express = require("express");
const projectController = require("../../controllers/project");
const router = express.Router();
const checkJwt = require("../../middleware/checkJwt").checkJwt;

/**
 * Creates a new project under the user
 */
router.post("/", checkJwt, async (req, res, next) => {
    try {
        res.status(201);
        res.json(
            await projectController.addProject(
                req.user.sub,
                req.body.projectName,
                req.body.projectId,
            ),
        );
    } catch (err) {
        next(err);
    }
});

/**
 * Gets all the projects that is owned by the user
 */
router.get("/", checkJwt, async (req, res, next) => {
    try {
        res.json(await projectController.getProjectsByOwner(req.user.sub));
        res.status(200);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
