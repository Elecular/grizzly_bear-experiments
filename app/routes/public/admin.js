let express = require("express");
let router = express.Router();
const projectController = require("../../controllers/project");
const checkJwt = require("../../middleware/checkJwt").checkJwt;
//var ManagementClient = require('auth0').ManagementClient;

const {
    checkPermissions,
    Permissions,
} = require("../../middleware/checkPermissions");

router.get("/projects", checkJwt, checkPermissions, async function (req, res) {
    if (req.hasPermission(Permissions.READ_ALL_PROJECTS)) {
        res.json(await projectController.GetAllProjects());
        res.status(200);
    } else {
        res.status(403).json({ message: "Forbidden" });
    }
});

module.exports = router;
