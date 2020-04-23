/**
 * This API is an internal API that can only be accessed through other services and NOT available to the public
 */

const express = require("express");
const projectController = require("../../controllers/project");
const router = express.Router();

/**
 * Checks if the given owner id is the actual owner of the given project
 */
router.get("/:projectId/validateOwner/:ownerId", async (req, res, next) => {
    try {
        await projectController.validateOwner(
            req.params.ownerId,
            req.params.projectId,
        );
        res.json({ isOwner: true });
    } catch (err) {
        if (err.statusCode === 401) res.json({ isOwner: false });
        else next(err);
    }
});

module.exports = router;
