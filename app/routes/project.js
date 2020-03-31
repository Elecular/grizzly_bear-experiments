/**
 * This API is used for creating and accessing proojectcs
 */

let express = require("express");
let projectController = require("../controllers/project");

let router = express.Router();

/**
 * Creates a new project under the user
 */
router.post("/", async function (req, res, next) {
    try {
        res.status(201);
        res.json(
            await projectController.addProject(
                req.headers.ownerid,
                req.body.projectName,
            ),
        );
    } catch (err) {
        next(err);
    }
});

/**
 * Gets all the projects that is owned by the user
 */
router.get("/", async function (req, res, next) {
    try {
        res.json(
            await projectController.getProjectsByOwner(req.headers.ownerid),
        );
        res.status(200);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
