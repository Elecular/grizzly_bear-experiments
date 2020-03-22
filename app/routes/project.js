/**
 * This API is used for creating and accessing proojectcs
 */

let express = require("express");
let router = express.Router();

router.get("/", async function (req, res) {
    res.json({});
});

module.exports = router;
