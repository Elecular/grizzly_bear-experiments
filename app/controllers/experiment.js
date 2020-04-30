const mongo = require("../db/mongodb");
const ObjectID = require("mongodb").ObjectID;
const logger = require("log4js").getLogger();
const createError = require("http-errors");
const seedrandom = require("seedrandom");
const md5 = require("md5");
const Decimal = require("decimal.js");

/**
 * Adds a new experiment to the database
 *
 * @async
 * @param {Experiment} experiment
 * @returns {Promise<Experiment>}
 */
module.exports.addExperiment = async (experiment) => {
    const db = await mongo.connect();
    const { projectId } = experiment._id;

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
            startTime: experiment.startTime ? experiment.startTime : Date.now(),
            endTime: experiment.endTime ? experiment.endTime : null,
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
 * Finds experiment with given parameters
 *
 * @async
 * @param {string} projectId
 * @param {string} [experimentName=undefined]
 * @returns {Promise<Array<Experiment>>} list of experiments
 */
module.exports.findExperiment = async (
    projectId,
    experimentName = undefined,
) => {
    const db = await mongo.connect();

    if (!projectId || !ObjectID.isValid(projectId))
        throw createError(400, "Invalid Project Id");

    const searchQuery = experimentName
        ? {
              _id: {
                  projectId: ObjectID(projectId),
                  experimentName,
              },
          }
        : {
              projectId: ObjectID(projectId),
          };
    try {
        return await db.collection("experiments").find(searchQuery).toArray();
    } catch (err) {
        logger.error(err);
        throw new createError(500);
    }
};

/**
 * Gets variation for given user.
 * If Experiment is not running during current time, it will return the cotrol group
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
    const experiments = await this.findExperiment(projectId, experimentName);
    const experiment = experiments[0];
    if (experiment == undefined) {
        throw new createError(400, "Invalid Experiment");
    }
    if (!isExperimentRunningDuringTimestamp(experiment, Date.now())) {
        return {
            ...getControlGroup(experiment),
            notice:
                "Experiment is NOT running at the moment. Hence, returning control group",
        };
    }
    return getVariation(experiment, md5(userId), true);
};

/**
 * Gets all experiments that were running during the given time range
 *
 * @async
 * @param {numer} startTime Unix timestamp in miliseconds
 * @param {number} endTime Unix timestamp in milliseconds
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
                    { endTime: { $gte: Number(startTime) } },
                ],
                startTime: {
                    $lte: Number(endTime),
                },
            })
            .toArray();
    } catch (err) {
        logger.error(err);
        throw new createError(500);
    }
};

/**
 * Gets variation for given experiments and user ids. THE PROVIDED USER ID MUST BE MD5 HASHED
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
    if (!userId.match(/^[a-f0-9]{32}$/))
        throw createError(500, "userId must be md5 hahsed");

    const value = new Decimal(
        seedrandom(experiment._id.experimentName + userId).quick(),
    );
    const variations = experiment.variations.sort((x, y) =>
        x.variationName >= y.variationName ? 1 : -1,
    );

    let currentValue = new Decimal(0);
    for (const variation of variations) {
        currentValue = currentValue.plus(variation.normalizedTrafficAmount);
        if (value.lessThanOrEqualTo(currentValue)) {
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
 *
 * @param {Experiment} experiment
 */
const getControlGroup = (experiment) =>
    experiment.variations.find((variation) => variation.controlGroup);

/**
 *
 * @param {Experiment} experiment
 * @param {number} timestamp
 */
const isExperimentRunningDuringTimestamp = (experiment, timestamp) =>
    timestamp >= experiment.startTime &&
    (!experiment.endTime || timestamp <= experiment.endTime);

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
    validateVariationsHaveExactlyOneControlGroup(variations);
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
        !variations
            .reduce((v1, v2) =>
                Decimal.add(
                    v1.normalizedTrafficAmount || 0,
                    v2.normalizedTrafficAmount || 0,
                ),
            )
            .equals(1)
    ) {
        throw new createError(
            400,
            "Traffic of all variations must add up to 100%",
        );
    }
};

/**
 * Checks if there is exactly one control group
 *
 * @param {Array<Variation>} variations
 */
const validateVariationsHaveExactlyOneControlGroup = (variations) => {
    if (variations.filter((variation) => variation.controlGroup).length !== 1) {
        throw new createError(400, "There must be exactly one control group");
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
