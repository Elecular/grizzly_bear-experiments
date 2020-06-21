var atob = require("atob");

/*
 * Checks the permissions of the bearer token
 * WARNING: DOES NOT VALIDATE THE TOKEN. Use checkJwt for validating token
 */
module.exports = (req, res, next) => {
    let token = req.headers["authorization"];
    if (token === undefined || token === null) {
        next();
        return;
    }
    var claims = JSON.parse(atob(token.split(".")[1]));
    req.scopeClaims = claims.scope ? claims.scope : "";
    next();
};
