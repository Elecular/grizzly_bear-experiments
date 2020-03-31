let assert = require("assert");
let mongo = require("../../db/mongodb");
let projectController = require("../../controllers/project");
let experimentController = require("../../controllers/experiment");

let ownerId = "testOwner";
let projectName = "testProject";

beforeEach(async () => {
    let db = await mongo.connect();
    let collections = await db.listCollections().toArray();
    for (let collection of collections) {
        await db.collection(collection.name).deleteMany({});
    }
    await projectController.addProject(ownerId, projectName);
});

afterAll(async () => {
    await mongo.disconnect();
});

describe("Experiment Controller", () => {
    it("cannot add an experiment when unauthorized", async () => {
        let projects = await projectController.getProjectsByOwner(ownerId);

        try {
            await experimentController.addExperiment(
                "invalid owner",
                mockExperiment(projects[0]._id.toString()),
            );
        } catch (err) {
            assert.equal(
                err.message,
                "Not Authorized to create experiment under given project",
            );
        }
    });

    it("can add an experiment without start/end time", async () => {
        let projects = await projectController.getProjectsByOwner(ownerId);

        let addedExperiment = await experimentController.addExperiment(
            ownerId,
            mockExperiment(projects[0]._id.toString()),
        );

        assert.equal(addedExperiment._id.projectId, projects[0]._id.toString());
        assert.ok(
            Math.abs(addedExperiment.startTime - new Date().getTime()) < 10000,
        );
        assert.equal(addedExperiment.endTime, null);
    });

    it("can add an experiment with only start time", async () => {
        let projects = await projectController.getProjectsByOwner(ownerId);

        let startTime = new Date().getTime() + 10000;
        let addedExperiment = await experimentController.addExperiment(
            ownerId,
            mockExperiment(projects[0]._id.toString(), startTime),
        );

        assert.equal(addedExperiment._id.projectId, projects[0]._id.toString());
        assert.equal(addedExperiment.startTime, startTime);
        assert.equal(addedExperiment.endTime, null);
    });

    it("can add an experiment with only end time", async () => {
        let projects = await projectController.getProjectsByOwner(ownerId);

        let endTime = new Date().getTime() + 30000;
        let addedExperiment = await experimentController.addExperiment(
            ownerId,
            mockExperiment(projects[0]._id.toString(), undefined, endTime),
        );

        assert.equal(addedExperiment._id.projectId, projects[0]._id.toString());
        assert.ok(
            Math.abs(addedExperiment.startTime - new Date().getTime()) < 10000,
        );
        assert.equal(addedExperiment.endTime, endTime);
    });

    it("can add an experiment with both start and end time", async () => {
        let projects = await projectController.getProjectsByOwner(ownerId);

        let startTime = new Date().getTime() + 10000;
        let endTime = new Date().getTime() + 30000;
        let addedExperiment = await experimentController.addExperiment(
            ownerId,
            mockExperiment(projects[0]._id.toString(), startTime, endTime),
        );

        assert.equal(addedExperiment._id.projectId, projects[0]._id.toString());
        assert.equal(addedExperiment.startTime, startTime);
        assert.equal(addedExperiment.endTime, endTime);
    });

    it("cannot add an experiment if unauthorized", async () => {
        let projects = await projectController.getProjectsByOwner(ownerId);

        try {
            await experimentController.addExperiment(
                "invalid user id",
                mockExperiment(projects[0]._id.toString()),
            );
            assert.fail();
        } catch (err) {
            assert.equal(
                err.message,
                "Not Authorized to create experiment under given project",
            );
        }
    });

    it("cannot add an experiment with start time before current time", async () => {
        let projects = await projectController.getProjectsByOwner(ownerId);

        try {
            let startTime = new Date().getTime() - 10000;
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(projects[0]._id.toString(), startTime),
            );
            assert.fail();
        } catch (err) {
            assert.equal(
                err.message,
                "Invalid start/endtime. startTime cannot be in the past",
            );
        }
    });

    it("cannot add an experiment with end time before start time", async () => {
        let projects = await projectController.getProjectsByOwner(ownerId);

        try {
            let startTime = new Date().getTime() + 20000;
            let endTime = new Date().getTime() + 10000;
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(projects[0]._id.toString(), startTime, endTime),
            );
            assert.fail();
        } catch (err) {
            assert.equal(
                err.message,
                "Invalid start/endtime. endtime has to be after start time",
            );
        }
    });

    it("cannot add an experiment with end time before current time", async () => {
        let projects = await projectController.getProjectsByOwner(ownerId);

        try {
            let endTime = new Date().getTime() - 10000;
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(projects[0]._id.toString(), undefined, endTime),
            );
            assert.fail();
        } catch (err) {
            assert.equal(
                err.message,
                "Invalid start/endtime. endtime has to be after start time",
            );
        }
    });

    it("cannot add an experiment with less than 2 variations", async () => {
        let projects = await projectController.getProjectsByOwner(ownerId);

        try {
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(
                    projects[0]._id.toString(),
                    undefined,
                    undefined,
                    [
                        {
                            variationName: "variation1",
                        },
                    ],
                ),
            );
            assert.fail();
        } catch (err) {
            assert.equal(err.message, "There must be atleast 2 variations");
        }
    });

    it("cannot add an experiment with duplicate variation names", async () => {
        let projects = await projectController.getProjectsByOwner(ownerId);

        try {
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(
                    projects[0]._id.toString(),
                    undefined,
                    undefined,
                    [
                        {
                            variationName: "variation1",
                        },
                        {
                            variationName: "variation1",
                        },
                    ],
                ),
            );
            assert.fail();
        } catch (err) {
            assert.equal(err.message, "Variations must have unique names");
        }
    });

    it("cannot add an experiment with undefined variation name", async () => {
        let projects = await projectController.getProjectsByOwner(ownerId);

        try {
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(
                    projects[0]._id.toString(),
                    undefined,
                    undefined,
                    [
                        {},
                        {
                            variationName: "variation1",
                        },
                    ],
                ),
            );
            assert.fail();
        } catch (err) {
            assert.ok(
                err.message.includes("Variations must have unique names"),
            );
        }
    });

    it("cannot add an experiment with traffic less than 100%", async () => {
        let projects = await projectController.getProjectsByOwner(ownerId);

        try {
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(
                    projects[0]._id.toString(),
                    undefined,
                    undefined,
                    [
                        {
                            variationName: "variation2",
                            normalizedTrafficAmount: 0.4,
                        },
                        {
                            variationName: "variation1",
                            normalizedTrafficAmount: 0.5,
                        },
                    ],
                ),
            );
            assert.fail();
        } catch (err) {
            assert.equal(
                err.message,
                "Traffic of all variations must add up to 100%",
            );
        }
    });

    it("cannot add an experiment with inconsistent variables", async () => {
        let projects = await projectController.getProjectsByOwner(ownerId);

        try {
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(
                    projects[0]._id.toString(),
                    undefined,
                    undefined,
                    [
                        {
                            variationName: "variation2",
                            normalizedTrafficAmount: 0.4,
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
                            variationName: "variation1",
                            normalizedTrafficAmount: 0.6,
                            variables: [
                                {
                                    variableName: "var2",
                                    variableType: "String",
                                    variableValue: "test",
                                },
                                {
                                    variableName: "var3",
                                    variableType: "String",
                                    variableValue: "test",
                                },
                            ],
                        },
                    ],
                ),
            );
            assert.fail();
        } catch (err) {
            assert.equal(
                err.message,
                "Variables names and types must be the same accross all variations",
            );
        }
    });

    it("cannot add an experiment with different amount of variables", async () => {
        let projects = await projectController.getProjectsByOwner(ownerId);

        try {
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(
                    projects[0]._id.toString(),
                    undefined,
                    undefined,
                    [
                        {
                            variationName: "variation2",
                            normalizedTrafficAmount: 0.4,
                            variables: [
                                {
                                    variableName: "var2",
                                    variableType: "String",
                                    variableValue: "test",
                                },
                            ],
                        },
                        {
                            variationName: "variation1",
                            normalizedTrafficAmount: 0.6,
                            variables: [
                                {
                                    variableName: "var2",
                                    variableType: "String",
                                    variableValue: "test",
                                },
                                {
                                    variableName: "var3",
                                    variableType: "String",
                                    variableValue: "test",
                                },
                            ],
                        },
                    ],
                ),
            );
            assert.fail();
        } catch (err) {
            assert.equal(
                err.message,
                "Variables names and types must be the same accross all variations",
            );
        }
    });

    it("0 variables are not allowed", async () => {
        let projects = await projectController.getProjectsByOwner(ownerId);
        try {
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(
                    projects[0]._id.toString(),
                    undefined,
                    undefined,
                    [
                        {
                            variationName: "variation2",
                            normalizedTrafficAmount: 0.4,
                            variables: [],
                        },
                        {
                            variationName: "variation1",
                            normalizedTrafficAmount: 0.6,
                            variables: [],
                        },
                    ],
                ),
            );
        } catch (err) {
            assert.equal(err.message, "There must be atleast 1 variable");
        }
    });
});

const mockExperiment = (projectId, startTime, endTime, variations) => {
    return {
        _id: {
            projectId: projectId,
            experimentName: "exp2",
        },
        ...(!variations && {
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
        }),
        ...(variations && { variations }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
    };
};
