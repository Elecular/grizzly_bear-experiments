const mongo = require("../db/mongodb");
const ObjectID = require("mongodb").ObjectID;
const Timestamp = require("mongodb").Timestamp;
const logger = require("log4js").getLogger();
const createError = require("http-errors");
const seedrandom = require("seedrandom");

/**
 * Adds a new experiment to the database
 *
 * @async
 * @param {String} ownerId
 * @param {Experiment} experiment
 * @returns {Promise<Experiment>}
 */
module.exports.addExperiment = async (ownerId, experiment) => {
    const db = await mongo.connect();
    const { projectId } = experiment._id;

    await this.validateOwner(ownerId, projectId);
    validateStartAndEndTime(experiment);
    validateVariations(experiment.variations);

    try {
        const response = await db.collection("experiments").insertOne({
            ...experiment,
            _id: {
                ...experiment._id,
                projectId: ObjectID(projectId),
            },
            projectId: ObjectID(projectId),
            startTime: Timestamp.fromNumber(
                experiment.startTime ? experiment.startTime : Date.now(),
            ),
            endTime: experiment.endTime
                ? Timestamp.fromNumber(experiment.endTime)
                : null,
        });

        return response.ops[0];
    } catch (err) {
        if (err.code == 11000) {
            throw new createError(409, "Experiment already exists");
        }
        logger.error(err);
        throw new createError(err.code == 121 ? 400 : 500);
    }
};

/**
 * Gets all experiments under given project id.
 *
 * @async
 * @param {string} projectId
 * @returns {Promise<Array<Experiment>>} list of experiments
 */
module.exports.getExperimentsByProjectId = async (projectId) => {
    const db = await mongo.connect();

    try {
        return await db
            .collection("experiments")
            .find({
                projectId: ObjectID(projectId),
            })
            .toArray();
    } catch (err) {
        logger.error(err);
        throw new createError(500);
    }
};

/**
 * Gets experiment by project and name
 *
 * @async
 * @param {string} projectId
 * @param {string} experimentName
 * @returns {Promise<Experiment>}
 */
module.exports.getExperimentByName = async (projectId, experimentName) => {
    const db = await mongo.connect();

    try {
        return await db.collection("experiments").findOne({
            _id: {
                projectId: ObjectID(projectId),
                experimentName,
            },
        });
    } catch (err) {
        logger.error(err);
        throw new createError(500);
    }
};

/**
 *
 * @async
 * @param {String} projectId
 * @param {String} experimentName
 * @param {String} userId
 * @returns {Promise<Variation>}
 */
module.exports.getVariationForSingleUser = async (
    projectId,
    experimentName,
    userId,
) => {
    const experiment = await this.getExperimentByName(
        projectId,
        experimentName,
    );
    return getVariation(experiment, userId, true);
};

/**
 * Gets all experiments that were running during the given time range
 *
 * @async
 * @param {Timestamp} startTime Unix timestamp in miliseconds
 * @param {Timestamp} endTime Unix timestamp in milliseconds
 * @returns {Promise<Array<Experiment>>} list of experiments
 */
module.exports.getRunningExperimentsInTimeRange = async (
    startTime,
    endTime,
) => {
    const db = await mongo.connect();
    try {
        return await db
            .collection("experiments")
            .find({
                $or: [
                    { endTime: null },
                    { endTime: { $gte: Timestamp.fromNumber(startTime) } },
                ],
                startTime: {
                    $lte: Timestamp.fromNumber(endTime),
                },
            })
            .toArray();
    } catch (err) {
        logger.error(err);
        throw new createError(500);
    }
};

/**
 * Gets variation for given experiments and user ids
 *
 * @async
 * @param {Array<{
    projectId: String, 
    experimentName: String, 
    userId: String
}>} experimentToUserMapping
* @returns {Promise<Array<{
    projectId: String, 
    experimentName: String, 
    userId: String,
    variation: String
}>>}
 */
module.exports.getVariationForMultipleUsers = async (
    experimentToUserMapping,
) => {
    const db = await mongo.connect();

    //Calculating all ids needed for searching experiments
    let experimentIds = experimentToUserMapping.map((experimentToUser) => ({
        projectId: ObjectID(experimentToUser.projectId),
        experimentName: experimentToUser.experimentName,
    }));

    //Getting all the experiments
    let experiments = {};
    try {
        await db
            .collection("experiments")
            .find({
                _id: {
                    $in: experimentIds,
                },
            })
            .forEach(
                (experiment) =>
                    (experiments[
                        experiment.projectId.toString() +
                            experiment._id.experimentName
                    ] = experiment),
            );
    } catch (err) {
        logger.error(err);
        throw new createError(500);
    }

    //Getting variation for each project Id, Experiment Id, User Id combination
    return experimentToUserMapping.map((experimentToUser) => ({
        projectId: experimentToUser.projectId,
        experimentName: experimentToUser.experimentName,
        userId: experimentToUser.userId,
        variation: getVariation(
            experiments[
                experimentToUser.projectId + experimentToUser.experimentName
            ],
            experimentToUser.userId,
        ),
    }));
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
        throw new createError(
            401,
            "Not Authorized to create experiment under given project",
        );
    }
};

/*
 * * * * * * * * * * * * * * * * * * START UTILITY METHODS * * * * * * * * * * * * * * * * *
 */

/**
 * Gets the variation this user is allocated to
 *
 * @param {Experiment} experiment
 * @param {String} userId
 * @param {boolean} fullScope If set to true, it will return all details about variation. If set to false, it will only return the name
 * @returns {String|Variation}
 */
const getVariation = (experiment, userId, fullScope = false) => {
    if (!experiment) throw createError(400, "Invalid Experiment");
    const value = seedrandom(experiment._id.experimentName + userId).quick();
    const variations = experiment.variations.sort((x, y) =>
        x.variationName >= y.variationName ? 1 : -1,
    );
    let currentValue = 0;
    for (const variation of variations) {
        currentValue += variation.normalizedTrafficAmount;
        if (value <= currentValue) {
            return fullScope ? variation : variation.variationName;
        }
    }

    logger.error(
        `Could not find variation for user ${userId} in experiment ${experiment._id.experimentName}. Total traffic for this experiment amounts to ${currentValue}. This should ideally be equal to 1`,
    );
    throw new createError(
        `Could not find variation for user ${userId} in experiment ${experiment._id.experimentName}`,
    );
};

/**
 * Does validation on start and end times. Throws error if times are not avlid
 *
 * @param {Experiment} experiment
 */
const validateStartAndEndTime = (experiment) => {
    //Checks if start time is valid
    if (experiment.startTime && experiment.startTime < new Date().getTime()) {
        throw new createError(
            400,
            "Invalid start/endtime. startTime cannot be in the past",
        );
    }

    //Checks if endtime is valid
    if (
        experiment.endTime &&
        experiment.endTime <= (experiment.startTime || new Date().getTime())
    ) {
        throw new createError(
            400,
            "Invalid start/endtime. endtime has to be after start time",
        );
    }
};

/**
 * Checks if the given variations of an experiment are valid. Throws errors if the variations are not valid
 *
 * @param {Array<Variation>} variations
 */
const validateVariations = (variations) => {
    if (!Array.isArray(variations) || variations.length < 2) {
        throw new createError(400, "There must be atleast 2 variations");
    }
    validateVariationsHaveUniqueNames(variations);
    validateVariationsTrafficAddsUpTo1(variations);
    validateVariationsHaveSameVariables(variations);
};

/**
 * All variations must have unique names. Throws an error if the variations do not have unique names
 *
 * @param {Array<Variation>} variations
 */
const validateVariationsHaveUniqueNames = (variations) => {
    let names = {};
    for (let variation of variations) {
        let variationName = variation.variationName;
        if (!variationName || names[variationName]) {
            throw new createError(400, "Variations must have unique names");
        }
        names[variation.variationName] = true;
    }
};

/**
 * Total traffic on all variations must always add up to 1 in an experiment
 *
 * @param {Array<Variation>} variations
 */
const validateVariationsTrafficAddsUpTo1 = (variations) => {
    if (
        variations.reduce(
            (v1, v2) =>
                (v1.normalizedTrafficAmount || 0) +
                (v2.normalizedTrafficAmount || 0),
        ) != 1
    ) {
        throw new createError(
            400,
            "Traffic of all variations must add up to 100%",
        );
    }
};

/**
 * All variations must have the same variables. Throws error if this is not the case
 *
 * @param {Array<Variation>} variations
 */
const validateVariationsHaveSameVariables = (variations) => {
    //This is the variable set we are going to test against. If variables from other variations do not match, we return false.
    const testVariables = variations[0].variables;

    if (!Array.isArray(testVariables) || testVariables.length < 1) {
        throw new createError(400, "There must be atleast 1 variable");
    }
    if (!variablesHaveUniqueNames(testVariables)) {
        throw new createError(400, "Variables must have unique names");
    }

    //Checking if every variation has same variables as testVariables
    const variablesAreConsistent = variations.every(
        (variation) =>
            Array.isArray(variation.variables) &&
            //Checking length of testVariables to variation's variable
            variation.variables.length === testVariables.length &&
            //Checking if every variable in this variation is present in testVariables
            variation.variables.every((variable) =>
                testVariables.some(
                    (testVariable) =>
                        testVariable.variableName === variable.variableName &&
                        testVariable.variableType === variable.variableType,
                ),
            ),
    );

    if (!variablesAreConsistent) {
        throw new createError(
            400,
            "Variables names and types must be the same accross all variations",
        );
    }
};

/**
 * All variables in a variation must have unique names
 *
 * @param {Array<Variable>} variables
 * @returns {boolean}
 */
const variablesHaveUniqueNames = (variables) => {
    let names = {};
    for (let variable of variables) {
        let variableName = variable.variableName;
        if (!variableName || names[variableName]) return false;
        names[variableName] = true;
    }
    return true;
};

/*
 * * * * * * * * * * * * * * * * * * END UTILITY METHODS * * * * * * * * * * * * * * * * *
 */
