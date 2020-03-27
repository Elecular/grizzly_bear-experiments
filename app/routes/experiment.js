/**
 * This API is used for creating and accessing experiments
 */

let express = require("express");
let experimentController = require("../controllers/experiment");

let router = express.Router();

/**
 * Creates a new project under the user
 */
router.post("/", async function (req, res, next) {
    try {
        res.status(201);
        res.json(
            await experimentController.addExperiment(
                req.headers["ownerid"],
                req.body,
            ),
        );
    } catch (err) {
        next(err);
    }
});

module.exports = router;
