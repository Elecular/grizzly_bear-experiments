var atob = require("atob");

/*
 * parses the permissions of the bearer token
 * Only add after checkJwt in the middleware chain
 */
module.exports.parsePermissions = (req, res, next) => {
    let token = req.headers["authorization"];
    if (token === undefined || token === null) {
        next();
        return;
    }
    var claims = JSON.parse(atob(token.split(".")[1]));
    req.scopeClaims = claims.scope ? claims.scope : "";
    req.hasPermission = (permission) => req.scopeClaims.includes(permission);
    next();
};

module.exports.Permissions = {
    ADMIN: {
        READ: {
            PROJECTS: "admin.read:projects",
            OWNERS: "admin.read:owners",
        },
    },
};
