let express = require("express");
let router = express.Router();
const projectController = require("../../controllers/project");
const ownerController = require("../../controllers/owner");
const checkJwt = require("../../middleware/checkJwt").checkJwt;
const {
    checkPermissions,
    Permissions,
} = require("../../middleware/checkPermissions");

/**
 * Gets all the projects made in Elecular
 */
router.get("/projects", checkJwt, checkPermissions, async function (req, res) {
    if (req.hasPermission(Permissions.READ_ALL_PROJECTS)) {
        res.json(await projectController.GetAllProjects());
        res.status(200);
    } else {
        res.status(403).json({ message: "Forbidden" });
    }
});

/**
 * Get details about all users
 */
router.get("/owners", checkJwt, checkPermissions, async function (req, res) {
    if (req.hasPermission(Permissions.READ_ALL_OWNERS)) {
        res.json(await ownerController.getAllOwners());
        res.status(200);
    } else {
        res.status(403).json({ message: "Forbidden" });
    }
});

module.exports = router;
