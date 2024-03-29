let express = require("express");
let router = express.Router();
let owner = require("../../controllers/owner");
const { parsePermissions } = require("../../middleware/parsePermissions");
const checkJwt = require("../../middleware/checkJwt").checkJwt;

router.get("/termsOfUse/accept/status", checkJwt, async function (
    req,
    res,
    next,
) {
    try {
        res.json(await owner.hasOwnerAcceptedTermsOfUse(req.user.sub));
    } catch (err) {
        next(err);
    }
});

router.post("/termsOfUse/accept", checkJwt, async function (req, res, next) {
    try {
        res.json(await owner.acceptTermsOfCondition(req.user.sub));
    } catch (err) {
        next(err);
    }
});

router.get("/scope", checkJwt, parsePermissions, (req, res, next) => {
    try {
        res.status(200);
        res.json({ scope: req.scopeClaims });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
