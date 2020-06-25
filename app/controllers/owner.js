const mongo = require("../db/mongodb");
const logger = require("log4js").getLogger();
const createError = require("http-errors");
const ManagementClient = require("auth0").ManagementClient;

const auth0 = new ManagementClient({
    domain: process.env.AUTH_MANAGEMENT_DOMAIN,
    clientId: process.env.AUTH_CLIENT_ID,
    clientSecret: process.env.AUTH_CLIENT_SECRET,
    scope: "read:users",
});

/**
 * Checks if the owner accepted terms of condition
 *
 * @param {string} ownerId
 * @returns {Promise<Project>}
 */
module.exports.hasOwnerAcceptedTermsOfUse = async (ownerId) => {
    const db = await mongo.connect();

    if (ownerId == null || ownerId === "") {
        throw createError(400, "Invalid owner id provided");
    }

    try {
        const response = await db.collection("termsOfUseActions").findOne({
            _id: ownerId,
        });
        return {
            accepted: response !== null,
        };
    } catch (err) {
        logger.error(err);
        throw new createError(500);
    }
};

/**
 * Call when the owner accepts the terms of conditions
 *
 * @param {string} ownerId
 * @returns {Promise<Project>}
 */
module.exports.acceptTermsOfCondition = async (ownerId) => {
    const db = await mongo.connect();

    if (ownerId == null || ownerId === "") {
        throw createError(400, "Invalid owner id provided");
    }

    try {
        await db.collection("termsOfUseActions").insertOne({
            _id: ownerId,
            timestamp: Date.now(),
        });
        return {
            accepted: true,
        };
    } catch (err) {
        if (err.code === 11000) {
            return {
                accepted: true,
            };
        }
        logger.error(err);
        throw new createError(500);
    }
};

module.exports.getAllOwners = async () => {
    try {
        return await auth0.getUsers();
    } catch (err) {
        throw new createError(500);
    }
};
