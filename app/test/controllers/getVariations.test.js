jest.mock("seedrandom");

const seedrandom = require("seedrandom");
const assert = require("assert");
const mongo = require("../../db/mongodb");
const projectController = require("../../controllers/project");
const experimentController = require("../../controllers/experiment");
const md5 = require("md5");
require("../../controllers/typedef"); //Used for type definitions

const ownerId = "testOwner";

beforeEach(async () => {
    const db = await mongo.connect();
    const collections = await db.listCollections().toArray();
    for (let collection of collections) {
        await db.collection(collection.name).deleteMany({});
    }
    let projectId = (await projectController.addProject(ownerId, "project1"))
        ._id;
    let projectId2 = (await projectController.addProject(ownerId, "project2"))
        ._id;
    await experimentController.addExperiment(mockExperiment(projectId, "exp1"));
    await experimentController.addExperiment(mockExperiment(projectId, "exp2"));
    await experimentController.addExperiment(
        mockExperiment(projectId2, "exp1"),
    );
});

afterAll(async () => {
    await mongo.disconnect();
});

describe("Experiment Controller", () => {
    describe("Can get variations", () => {
        it("When zero elements are passed", async () => {
            let variations = await experimentController.getVariationForMultipleUsers(
                [],
            );
            assert.equal(variations.length, 0);
        });

        it("for a single user", async () => {
            const projects = await projectController.getProjectsByOwner(
                ownerId,
            );

            seedrandom().mockRandomValues([0.05, 0.11]);

            let variation = await experimentController.getVariationForSingleUser(
                projects[0]._id,
                "exp1",
                "user1",
            );
            assert.equal(variation.variationName, "variation1");
            assert.equal(variation.normalizedTrafficAmount, 0.1);
            assert.equal(variation.variables.length, 2);
        });

        it("When two different users are within same experiment", async () => {
            const projects = await projectController.getProjectsByOwner(
                ownerId,
            );

            seedrandom().mockRandomValues([0.05, 0.11]);

            let variations = await experimentController.getVariationForMultipleUsers(
                [
                    {
                        projectId: projects[0]._id,
                        experimentName: "exp1",
                        userId: md5("user1"),
                    },
                    {
                        projectId: projects[0]._id,
                        experimentName: "exp1",
                        userId: md5("user2"),
                    },
                ],
            );

            assert.deepStrictEqual(variations[0], {
                projectId: projects[0]._id,
                experimentName: "exp1",
                userId: md5("user1"),
                variation: "variation1",
            });

            assert.deepStrictEqual(variations[1], {
                projectId: projects[0]._id,
                experimentName: "exp1",
                userId: md5("user2"),
                variation: "variation2",
            });
        });

        it("When same user is in different experiments", async () => {
            const projects = await projectController.getProjectsByOwner(
                ownerId,
            );

            seedrandom().mockRandomValues([0.05, 0.11]);

            let variations = await experimentController.getVariationForMultipleUsers(
                [
                    {
                        projectId: projects[0]._id,
                        experimentName: "exp1",
                        userId: md5("user1"),
                    },
                    {
                        projectId: projects[0]._id,
                        experimentName: "exp2",
                        userId: md5("user1"),
                    },
                ],
            );

            assert.deepStrictEqual(variations[0], {
                projectId: projects[0]._id,
                experimentName: "exp1",
                userId: md5("user1"),
                variation: "variation1",
            });

            assert.deepStrictEqual(variations[1], {
                projectId: projects[0]._id,
                experimentName: "exp2",
                userId: md5("user1"),
                variation: "variation2",
            });
        });

        it("When users are in different projects", async () => {
            const projects = await projectController.getProjectsByOwner(
                ownerId,
            );

            seedrandom().mockRandomValues([0.05, 0.1, 1, 0]);

            let variations = await experimentController.getVariationForMultipleUsers(
                [
                    {
                        projectId: projects[0]._id,
                        experimentName: "exp1",
                        userId: md5("user1"),
                    },
                    {
                        projectId: projects[0]._id,
                        experimentName: "exp2",
                        userId: md5("user43"),
                    },
                    {
                        projectId: projects[1]._id,
                        experimentName: "exp1",
                        userId: md5("user1"),
                    },
                    {
                        projectId: projects[1]._id,
                        experimentName: "exp1",
                        userId: md5("user4"),
                    },
                ],
            );

            assert.deepStrictEqual(variations[0], {
                projectId: projects[0]._id,
                experimentName: "exp1",
                userId: md5("user1"),
                variation: "variation1",
            });

            assert.deepStrictEqual(variations[1], {
                projectId: projects[0]._id,
                experimentName: "exp2",
                userId: md5("user43"),
                variation: "variation1",
            });

            assert.deepStrictEqual(variations[2], {
                projectId: projects[1]._id,
                experimentName: "exp1",
                userId: md5("user1"),
                variation: "variation2",
            });

            assert.deepStrictEqual(variations[3], {
                projectId: projects[1]._id,
                experimentName: "exp1",
                userId: md5("user4"),
                variation: "variation1",
            });
        });
    });

    describe("Cannot get variations", () => {
        it("When wrong project id and experiment id is sent", async () => {
            const projects = await projectController.getProjectsByOwner(
                ownerId,
            );
            try {
                await experimentController.getVariationForMultipleUsers([
                    {
                        projectId: projects[0]._id,
                        experimentName: "exp1",
                        userId: md5("user1"),
                    },
                    {
                        projectId: projects[0]._id,
                        experimentName: "invalidexp",
                        userId: md5("user1"),
                    },
                ]);
                assert.fail();
            } catch (e) {
                assert.equal(e.message, "Invalid Experiment");
            }
        });

        it("When invalid hash sent", async () => {
            const projects = await projectController.getProjectsByOwner(
                ownerId,
            );
            try {
                await experimentController.getVariationForMultipleUsers([
                    {
                        projectId: projects[0]._id,
                        experimentName: "exp1",
                        userId: md5("user1"),
                    },
                    {
                        projectId: projects[0]._id,
                        experimentName: "exp2",
                        userId: "user43",
                    },
                ]);
                assert.fail();
            } catch (e) {
                assert.equal(e.message, "userId must be md5 hahsed");
            }
        });

        it("for single user when wrong project id and experiment id is sent", async () => {
            const projects = await projectController.getProjectsByOwner(
                ownerId,
            );
            try {
                await experimentController.getVariationForSingleUser(
                    projects[0]._id,
                    "invalidexp",
                    "user1",
                );
                assert.fail();
            } catch (e) {
                assert.equal(e.message, "Invalid Experiment");
            }
        });
    });
});

const mockExperiment = (projectId, expName, startTime, endTime) => {
    return {
        _id: {
            projectId: projectId,
            experimentName: expName,
        },
        variations: [
            {
                variationName: "variation1",
                normalizedTrafficAmount: 0.1,
                variables: [
                    {
                        variableName: "var2",
                        variableType: "String",
                        variableValue: "test",
                    },
                    {
                        variableName: "var1",
                        variableType: "String",
                        variableValue: "test",
                    },
                ],
            },
            {
                variationName: "variation2",
                normalizedTrafficAmount: 0.9,
                variables: [
                    {
                        variableName: "var1",
                        variableType: "String",
                        variableValue: "test",
                    },
                    {
                        variableName: "var2",
                        variableType: "String",
                        variableValue: "test",
                    },
                ],
            },
        ],
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
    };
};
