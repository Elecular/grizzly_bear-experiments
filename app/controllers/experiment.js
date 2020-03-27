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
 * Checks if the end time is bigger than the start time
 *
 * @param {Object} experiment
 * @returns {boolean}
 */
const validateStartAndEndTime = (experiment) => {
    if (experiment.endTime <= experiment.startTime) return false;
    // if start time is before 2020/01/01
    if (experiment.startTime < 1577836800000) return false;

    experiment.startDate = Timestamp.fromNumber(
        new Date(experiment.startTime).setUTCHours(0, 0, 0, 0),
    );
    experiment.endDate = Timestamp.fromNumber(
        new Date(experiment.endTime).setUTCHours(0, 0, 0, 0),
    );
    experiment.startTime = Timestamp.fromNumber(experiment.startTime);
    experiment.endTime = Timestamp.fromNumber(experiment.endTime);
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
        if (names[variation.variationName]) return false;
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
        (v1, v2) => v1.normalizedTrafficAmount + v2.normalizedTrafficAmount,
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
    for (let variable of variables) {
        if (names[variable.variableName]) return false;
        names[variable.variableName] = true;
    }
    return true;
};
