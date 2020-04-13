const mongo = require("../db/mongodb");
const ObjectID = require("mongodb").ObjectID;
const logger = require("log4js").getLogger();
const createError = require("http-errors");

/**
 * Adds a new project to the database
 *
 * @param {string} projectName
 * @param {string} ownerId
 * @param {string} projectId This is optional
 * @returns {Promise<Object>}
 */
module.exports.addProject = async (ownerId, projectName, projectId=undefined) => {
    const db = await mongo.connect();

    if(projectId && !ObjectID.isValid(projectId)) {
        throw createError(400, "Invalid project id provided");
    }

    try {
        const response = await db.collection("projects").insertOne({
            _id: ObjectID(projectId),
            projectName,
            ownerId,
        });
        return response.ops[0];
    } catch (err) {
        if (err.code == 11000) {
            throw new createError(409, "Project Id already exists");
        }
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
    const db = await mongo.connect();
    try {
        return await db.collection("projects").find({ ownerId }).toArray();
    } catch (err) {
        logger.error(err);
        throw new createError(500);
    }
};
