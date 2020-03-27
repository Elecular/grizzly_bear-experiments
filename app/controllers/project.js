const mongo = require("../db/mongodb");
const logger = require("log4js").getLogger();
var createError = require("http-errors");

/**
 * Adds a new project to the database
 *
 * @param {string} projectName
 * @param {string} ownerId
 * @returns {Promise<Object>}
 */
module.exports.addProject = async (ownerId, projectName) => {
    let db = await mongo.connect();
    try {
        const response = await db.collection("projects").insertOne({
            projectName,
            ownerId,
        });
        return response.ops[0];
    } catch (err) {
        logger.error(err);
        throw new createError(err.code == 121 ? 400 : 500);
    }
};

/**
 * Gets all projects that are owned by given ownerId
 *
 * @param {string} ownerId
 * @returns {Promise<Array<Object>>}
 */
module.exports.getProjectsByOwner = async (ownerId) => {
    let db = await mongo.connect();
    try {
        return await db.collection("projects").find({ ownerId }).toArray();
    } catch (err) {
        logger.error(err);
        throw new createError(500);
    }
};
