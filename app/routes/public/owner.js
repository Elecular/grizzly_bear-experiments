let express = require("express");
let router = express.Router();
let owner = require("../../controllers/owner");
const checkJwt = require("../../middleware/checkJwt").checkJwt;

router.get("/:ownerId/termsOfUse/accept/status", checkJwt, async function (
    req,
    res,
    next,
) {
    try {
        res.json(await owner.hasOwnerAcceptedTermsOfUse(req.params.ownerId));
    } catch (err) {
        next(err);
    }
});

router.post("/:ownerId/termsOfUse/accept", checkJwt, async function (
    req,
    res,
    next,
) {
    try {
        res.json(await owner.acceptTermsOfCondition(req.params.ownerId));
    } catch (err) {
        next(err);
    }
});

module.exports = router;
