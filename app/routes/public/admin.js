let express = require("express");
let router = express.Router();
const projectController = require("../../controllers/project");
const ownerController = require("../../controllers/owner");
const checkJwt = require("../../middleware/checkJwt").checkJwt;
const { parsePermissions } = require("../../middleware/parsePermissions");
const { adminAccessOnly } = require("../../middleware/adminAccessOnly");

/**
 * Gets all the projects made in Elecular
 */
router.get(
    "/projects",
    checkJwt,
    parsePermissions,
    adminAccessOnly,
    async function (req, res) {
        res.json(await projectController.GetAllProjects());
        res.status(200);
    },
);

/**
 * Gets detail about given project
 */
router.get(
    "/project/:projectId",
    checkJwt,
    parsePermissions,
    adminAccessOnly,
    async function (req, res, next) {
        try {
            res.json(
                await projectController.GetProject(req.params["projectId"]),
            );
            res.status(200);
        } catch (err) {
            next(err);
        }
    },
);

/**
 * Get details about all users
 */
router.get(
    "/owners",
    checkJwt,
    parsePermissions,
    adminAccessOnly,
    async function (req, res) {
        res.json(await ownerController.getAllOwners());
        res.status(200);
    },
);

module.exports = router;
