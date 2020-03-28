const mongo = require("../db/mongodb");
const ObjectID = require("mongodb").ObjectID;
const Timestamp = require("mongodb").Timestamp;
const logger = require("log4js").getLogger();
var createError = require("http-errors");

/**
 * Adds a new experiment to the database
 *
 * @param {Object} experiment
 * @returns {Promise<Object>}
 */
module.exports.addExperiment = async (ownerId, experiment) => {
    let db = await mongo.connect();

    experiment["_id"]["projectId"] = ObjectID(experiment["_id"]["projectId"]);

    await validateOwner(ownerId, experiment["_id"]["projectId"]);
    await validateStartAndEndTime(experiment);
    validateVariations(experiment["variations"]);

    try {
        const response = await db
            .collection("experiments")
            .insertOne(experiment);

        return response.ops[0];
    } catch (err) {
        logger.error(err);
        throw new createError(err.code == 121 ? 400 : 500);
    }
};

/**
 * Gets all experiments under given project id. Can optionally provide experimentName
 *
 * @async
 * @param {string} projectId
 * @param {?string} experimentName
 * @returns {Array<Object>} list of experiments
 */
module.exports.getExperiments = async (projectId, experimentName) => {
    let db = await mongo.connect();
    try {
        return await db
            .collection("experiments")
            .find({
                _id: {
                    projectId,
                    ...(experimentName && { experimentName }),
                },
            })
            .toArray();
    } catch (err) {
        logger.error(err);
        throw new createError(500);
    }
};

/**
 * Gets all experiments that were running during the given time range
 *
 * @async
 * @param {Timestamp} startTime Unix timestamp in miliseconds
 * @param {Timestamp} endTime Unix timestamp in milliseconds
 * @returns {Array<Object>} list of experiments
 */
module.exports.getRunningExperimentsInTimeRange = async (
    startTime,
    endTime,
) => {
    let db = await mongo.connect();
    try {
        return await db
            .collection("experiments")
            .find({
                startTime: {
                    $lte: Timestamp.fromNumber(endTime),
                },
                $or: [
                    { endTime: null },
                    { endTime: { $gte: Timestamp.fromNumber(startTime) } },
                ],
            })
            .toArray();
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
 * @param {ObjectID} projectId
 */
const validateOwner = async (ownerId, projectId) => {
    let db = await mongo.connect();
    let project = null;
    try {
        project = await db.collection("projects").findOne({
            ownerId,
            _id: projectId,
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

/**
 * Does validation on start and end times. Throws error if times are not avlid
 *
 * @param {Object} experiment
 */
const validateStartAndEndTime = (experiment) => {
    //Checks if start time is valid
    if (!experiment.startTime) {
        experiment.startTime = new Date().getTime();
    } else if (experiment.startTime < new Date().getTime()) {
        throw new createError(
            400,
            "Invalid start/endtime. startTime cannot be in the past",
        );
    }
    experiment.startTime = Timestamp.fromNumber(experiment.startTime);

    //Checks if endtime is valid
    if (experiment.endTime) {
        if (experiment.endTime <= experiment.startTime) {
            throw new createError(
                400,
                "Invalid start/endtime. endtime has to be after start time",
            );
        }
        experiment.endTime = Timestamp.fromNumber(experiment.endTime);
    } else {
        experiment.endTime = null;
    }
};

/**
 * Checks if the given variations of an experiment are valid. Throws errors if the variations are not valid
 *
 * @param {Array<Object>} variations
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
 * All variations must have unique names
 *
 * @param {Array} variations
 * @returns {boolean}
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
 * @param {Array<Object>}
 * @returns {boolean}
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
 * @param {Array} variations
 */
const validateVariationsHaveSameVariables = (variations) => {
    //This is the variable set we are going to test against. If variables from other variations do not match, we return false.
    let testVariables = variations[0].variables;

    if (!Array.isArray(testVariables) || testVariables.length < 1) {
        throw new createError(400, "There must be atleast 1 variable");
    }
    if (!variablesHaveUniqueNames(testVariables)) {
        throw new createError(400, "Variables must have unique names");
    }

    //Checking if every variation has same variables as testVariables
    let variablesAreConsistent = variations.every(
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
 * @param {Array} variables
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
