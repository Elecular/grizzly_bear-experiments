//ts-check
const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");
const logger = require("log4js").getLogger();

const url = `mongodb://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_URL}:${process.env.MONGODB_PORT}`;
const dbName = process.env.MONGODB_DATABASE;
let db = null;

const client = new MongoClient(url, {
    poolSize: 10,
    useUnifiedTopology: true,
});

module.exports = {
    /**
     * Async function that returns a db object. This db object can be used to query MongoDB
     */
    connect: async () => {
        if (db !== null) return db;

        client.connect(function (err) {
            assert.equal(
                null,
                err,
                `An error occured while connected to the database: ${err}`,
            );
            logger.info("Connected to Mongo Database");

            db = client.db(dbName);
            return db;
        });
    },

    /**
     * Async function that disconnects the mongoDB
     *
     * @async
     * @returns {Promise}
     */
    disconnect: async () => {
        client.close(() => {
            return;
        });
    },
};
