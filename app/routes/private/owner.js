/**
 * This API is an internal API that can only be accessed through other services and NOT available to the public
 */

const express = require("express");
const projectController = require("../../controllers/project");
const router = express.Router();

/**
 * Gets all projects under given owner
 */
router.get("/:ownerId/projects", async (req, res, next) => {
    try {
        res.json(
            await projectController.getProjectsByOwner(req.params.ownerId),
        );
        res.status(200);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
