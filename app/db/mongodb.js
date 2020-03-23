const mongodb = require("mongodb");
const Db = require("mongodb").Db; // eslint-disable-line no-unused-vars
const logger = require("log4js").getLogger();
const readdir = require("recursive-readdir");
const path = require("path");
const fs = require("fs");

const MongoClient = mongodb.MongoClient;

const url = `mongodb://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_URL}:${process.env.MONGODB_PORT}`;
const dbName = process.env.MONGODB_DATABASE;
let db = null;

const client = new MongoClient(url, {
    poolSize: 10,
    useUnifiedTopology: true,
});

/**
 * Async function that returns a db object. This db object can be used to query MongoDB
 *
 * @async
 * @returns {Promise<Db>}
 */
module.exports.connect = async () => {
    if (db !== null) return db;

    await client.connect();
    logger.info("Connected to Mongo Database");

    db = client.db(dbName);
    await setup(db);

    return db;
};

/**
 * Closes the connection to db
 *
 * @async
 * @returns {Promise}
 */
module.exports.disconnect = async () => {
    await client.close();
};

/**
 * Creates all the collections on Mongodb
 *
 * @param {Db} db
 * @returns {Promise}
 */
const setup = async (db) => {
    const files = await readdir(path.join(__dirname, "../mongodb_schemas/"));
    for (let count = 0; count < files.length; count++) {
        const file = files[count];
        const collectionName = path.basename(file).replace(".json", "");
        const schema = JSON.parse(fs.readFileSync(file));

        await db.createCollection(collectionName, {
            validator: {
                $jsonSchema: schema,
            },
        });

        logger.info(`${collectionName} collection is initialised`);
    }
};
