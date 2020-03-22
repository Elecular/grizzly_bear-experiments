const db = require("../db/mongodb");

const collectionName = "projects";
const schema = {
    bsonType: "object",
    required: ["projectName", "ownerId"],
    properties: {
        projectName: {
            bsonType: "string",
            description: "Name of the project",
        },
        ownerId: {
            bsonType: "objectId",
            description: "Id of the project owner",
        },
    },
};

let controller = {
    addProject: async () => {
        let connection = await db.connect();
        console.log(connection[collectionName].insertOne);
    },

    init: async () => {
        let connection = await db.connect();
        await connection.createCollection(collectionName, {
            validator: {
                $jsonSchema: schema,
            },
        });
    },
};

module.exports = controller;
