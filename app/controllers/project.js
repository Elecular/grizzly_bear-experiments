const mongo = require("../db/mongodb");
const ObjectID = require("mongodb").ObjectID;
const logger = require("log4js").getLogger();
const createError = require("http-errors");
const ownerController = require("./owner");
/**
 * Adds a new project to the database
 *
 * @param {string} projectName
 * @param {string} ownerId
 * @param {string} [projectId] Optional
 * @returns {Promise<Project>}
 */
module.exports.addProject = async (
    ownerId,
    projectName,
    projectId = undefined,
) => {
    const db = await mongo.connect();

    if (projectId && !ObjectID.isValid(projectId)) {
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
 * @returns {Promise<Array<Project>>}
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

/**
 * Checks if the given owner owns this project. Throws error if it is not owner
 *
 * @async
 * @param {string} ownerId
 * @param {string} projectId
 */
module.exports.validateOwner = async (ownerId, projectId) => {
    if (!projectId || !ObjectID.isValid(projectId)) {
        throw new createError(400, "Invalid projectId");
    }

    const db = await mongo.connect();
    let project = null;

    try {
        project = await db.collection("projects").findOne({
            _id: ObjectID(projectId),
            ownerId,
        });
    } catch (err) {
        logger.error(err);
        throw new createError(500);
    }

    if (project === null) {
        throw new createError(403, "Forbidden");
    }
};

/**
 * Gets list of all projects
 *
 * @returns {Promise<Project>}
 */
module.exports.GetAllProjects = async () => {
    const db = await mongo.connect();
    const projects = await db.collection("projects").find({});
    return await projects.toArray();
};

/**
 * Gets details about given project
 *
 * @param {string} projectId
 * @returns {Promise<Project>}
 */
module.exports.GetProject = async (projectId) => {
    const db = await mongo.connect();
    const project = await db.collection("projects").findOne({
        _id: ObjectID(projectId),
    });

    if (project == null) {
        throw new createError(404, "Project Not Found");
    }

    try {
        project.owner = await ownerController.getOwner(project.ownerId);
    } catch (err) {
        logger.warn("Could not find owner from id: " + project.ownerId);
    }

    return project;
};
