const { Permissions } = require("./parsePermissions");
const createHttpError = require("http-errors");

/*
 * Only allows access to admin
 * Only add after parsePermissions in the middleware chain
 */
module.exports.adminAccessOnly = (req, res, next) => {
    if (
        !req.hasPermission(Permissions.ADMIN.READ.PROJECTS) ||
        !req.hasPermission(Permissions.ADMIN.READ.OWNERS)
    ) {
        next(createHttpError(403, "Forbidden"));
    } else {
        next();
    }
};
