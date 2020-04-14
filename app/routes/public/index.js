let express = require("express");
let router = express.Router();

/* GET home page. */
router.get("/", async function (req, res) {
    res.send("This is the experiments API");
});

/**
 * Gets status of the service
 */
router.get("/status", async function (req, res) {
    res.status(200);
    res.send();
});

module.exports = router;
