/**
 * This API is used for creating and accessing proojectcs
 */

const express = require("express");
const projectController = require("../../controllers/project");
const experimentController = require("../../controllers/experiment");
const router = express.Router();
const checkJwt = require("../../middleware/checkJwt").checkJwt;
const {
    checkPermissions,
    Permissions,
} = require("../../middleware/checkPermissions");
const { check, validationResult, checkSchema } = require("express-validator");

/**
 * Creates a new project under the user
 */
//First verifies json web token and then does some validation on provided fields
router.post(
    "/",
    checkJwt,
    [
        check("projectName").isString(),
        check("projectId").optional().isString().isLength(24),
    ],
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

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
    },
);

/**
 * Gets all the projects that is owned by the user
 */
router.get("/", checkJwt, checkPermissions, async (req, res, next) => {
    try {
        if (req.query["all"] === "true") {
            if (req.hasPermission(Permissions.READ_ALL_PROJECTS)) {
                res.json(await projectController.GetAllProjects());
                res.status(200);
            } else {
                res.status(403).json({ message: "Forbidden" });
            }
            return;
        }
        res.json(await projectController.getProjectsByOwner(req.user.sub));
        res.status(200);
    } catch (err) {
        next(err);
    }
});

/**
 * Creates a new experiment under the given projectid
 */
//First verifies json web token and then does some validation on provided fields
router.post(
    "/:projectId/experiments",
    checkJwt,
    [
        checkSchema({
            "_id.projectId": {
                isString: true,
                isLength: 24,
                custom: {
                    options: (value, { req }) => value === req.params.projectId,
                },
            },
            "_id.experimentName": {
                isString: true,
                isEmpty: {
                    negated: true,
                },
            },
            startTime: {
                optional: true,
                isNumeric: true,
                toInt: true,
            },
            endTime: {
                optional: true,
                isNumeric: true,
                toInt: true,
            },
            variations: {
                isArray: true,
            },
        }),
    ],
    async function (req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            await projectController.validateOwner(
                req.user.sub,
                req.params["projectId"],
            );
            res.status(201);
            res.json(await experimentController.addExperiment(req.body));
        } catch (err) {
            next(err);
        }
    },
);

/**
 * Gets experiment with given project id
 */
router.get("/:projectId/experiments", checkJwt, async function (
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
            await experimentController.findExperiment(req.params.projectId),
        );
    } catch (err) {
        next(err);
    }
});

/**
 * Gets experiment with given project id
 */
router.get("/:projectId/experiments/:experimentName", async function (
    req,
    res,
    next,
) {
    try {
        res.status(200);
        res.json(
            await experimentController.findExperiment(
                req.params.projectId,
                req.params.experimentName,
            ),
        );
    } catch (err) {
        next(err);
    }
});

/**
 * Stops the experiment
 */
router.post(
    "/:projectId/experiments/:experimentName/stop",
    checkJwt,
    async function (req, res, next) {
        try {
            await projectController.validateOwner(
                req.user.sub,
                req.params.projectId,
            );
            await experimentController.stopExperiment(
                req.params.projectId,
                req.params.experimentName,
            );
            res.status(201);
            res.json({
                message: "Experiment is stopped",
            });
        } catch (err) {
            next(err);
        }
    },
);

/**
 * Gets the variation for given project, experiment and user
 */
router.get(
    "/:projectId/experiments/:experimentName/variations",
    [check("userId", "Add userId as query parameter").isString()],
    async function (req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            res.status(200);
            res.json(
                await experimentController.getVariationForSingleUser(
                    req.params.projectId,
                    req.params.experimentName,
                    req.query.userId,
                ),
            );
        } catch (err) {
            next(err);
        }
    },
);

module.exports = router;
