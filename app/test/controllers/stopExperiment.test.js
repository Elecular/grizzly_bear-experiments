const assert = require("assert");
const mongo = require("../../db/mongodb");
const projectController = require("../../controllers/project");
const experimentController = require("../../controllers/experiment");

const ownerId = "testOwner";
const projectName = "testProject";

beforeEach(async () => {
    const db = await mongo.connect();
    const collections = await db.listCollections().toArray();
    for (let collection of collections) {
        await db.collection(collection.name).deleteMany({});
    }
    await projectController.addProject(ownerId, projectName);
});

afterAll(async () => {
    await mongo.disconnect();
});

describe("Experiment Controller", () => {
    it("can stop experiment", async () => {
        await projectController.addProject(ownerId, "testProject2");
        const projects = await projectController.getProjectsByOwner(ownerId);
        await experimentController.addExperiment(
            mockExperiment(projects[0]._id, "exp1"),
        );

        await experimentController.stopExperiment(projects[0]._id, "exp1");
        const [stoppedExperiment] = await experimentController.findExperiment(
            projects[0]._id,
            "exp1",
        );
        assert.ok(stoppedExperiment.endTime <= Date.now());
        assert.ok(stoppedExperiment.endTime >= Date.now() - 10000);
    });

    it("cannot stop experiment when already stopped", async () => {
        await projectController.addProject(ownerId, "testProject2");
        const projects = await projectController.getProjectsByOwner(ownerId);
        await experimentController.addExperiment(
            mockExperiment(projects[0]._id, "exp1"),
        );

        await experimentController.stopExperiment(projects[0]._id, "exp1");
        try {
            await experimentController.stopExperiment(projects[0]._id, "exp1");
            assert.fail();
        } catch (err) {
            assert(err.status === 409);
        }
    });

    it("can stop experiment if it is in future", async () => {
        await projectController.addProject(ownerId, "testProject2");
        const projects = await projectController.getProjectsByOwner(ownerId);
        await experimentController.addExperiment(
            mockExperiment(projects[0]._id, "exp1", 79839129600000),
        );

        await experimentController.stopExperiment(projects[0]._id, "exp1");
        const [stoppedExperiment] = await experimentController.findExperiment(
            projects[0]._id,
            "exp1",
        );
        assert.ok(stoppedExperiment.endTime === 79839129600001);
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
                controlGroup: true,
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
                controlGroup: false,
            },
        ],
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
    };
};
