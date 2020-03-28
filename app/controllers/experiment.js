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
    if (!(await validateOwner(ownerId, experiment["_id"]["projectId"]))) {
        throw new createError(
            401,
            "Not Authorized to create experiment under given project",
        );
    }

    if (!validateVariations(experiment["variations"])) {
        throw new createError(400, "Invalid variations");
    }

    if (!(await validateStartAndEndTime(experiment))) {
        throw new createError(
            400,
            "start/endTime are in Unixtimestamps (milliseconds) and endTime has to be bigger than startTime",
        );
    }

    try {
        console.log(experiment);
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
 * Checks if the given owner owns this project
 *
 * @async
 * @param {string} ownerId
 * @param {ObjectID} projectId
 *
 * @returns {Promise<boolean>}
 */
const validateOwner = async (ownerId, projectId) => {
    let db = await mongo.connect();
    try {
        return (
            (await db.collection("projects").findOne({
                ownerId,
                _id: projectId,
            })) !== null
        );
    } catch (err) {
        logger.error(err);
        throw new createError(500);
    }
};

/**
 * Does validation on start and end times
 *
 * @param {Object} experiment
 * @returns {boolean}
 */
const validateStartAndEndTime = (experiment) => {
    //Checks if start time is valid
    if (!experiment.startTime) {
        experiment.startTime = new Date().getTime();
    } else if (experiment.startTime < new Date().getTime()) {
        return false;
    }
    experiment.startTime = Timestamp.fromNumber(experiment.startTime);

    //Checks if endtime is valid
    if (experiment.endTime) {
        if (experiment.endTime <= experiment.startTime) return false;
        experiment.endTime = Timestamp.fromNumber(experiment.endTime);
    } else {
        experiment.endTime = null;
    }

    return true;
};

/**
 * Checks if the given variations of an experiment are valid
 *
 * @param {Array<Object>} variations
 * @returns {boolean}
 */
const validateVariations = (variations) => {
    return (
        Array.isArray(variations) &&
        validateVariationsTrafficAddsUpTo1(variations) &&
        validateVariationsHaveSameVariables(variations) &&
        validateVariationsHaveUniqueNames(variations)
    );
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
        if (!variationName || names[variationName]) return false;
        names[variation.variationName] = true;
    }
    return true;
};

/**
 * Total traffic on all variations must always add up to 1 in an experiment
 *
 * @param {Array<Object>}
 * @returns {boolean}
 */
const validateVariationsTrafficAddsUpTo1 = (variations) =>
    variations.reduce(
        (v1, v2) =>
            (v1.normalizedTrafficAmount || 0) +
            (v2.normalizedTrafficAmount || 0),
    ) == 1;

/**
 * All variations must have the same variables
 *
 * @param {Array} variations
 */
const validateVariationsHaveSameVariables = (variations) => {
    //This is the variable set we are going to test against. If variables from other variations do not match, we return false.
    let testVariables = variations[0].variables;
    if (!validateVariablesHaveUniqueNames(testVariables)) return false;

    //Checking if every variation has same variables as testVariables
    return variations.every(
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
};

/**
 * All variables in a variation must have unique names
 *
 * @param {Array} variables
 * @returns {boolean}
 */
const validateVariablesHaveUniqueNames = (variables) => {
    let names = {};
    if (!Array.isArray(variables)) return false;
    for (let variable of variables) {
        let variableName = variable.variableName;
        if (!variableName || names[variableName]) return false;
        names[variableName] = true;
    }
    return true;
};
