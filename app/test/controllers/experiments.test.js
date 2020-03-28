let assert = require("assert");
let mongo = require("../../db/mongodb");
let projectController = require("../../controllers/project");
let experimentController = require("../../controllers/experiment");

let ownerId = "testOwner";
let projectName = "testProject";

beforeEach(async () => {
    let db = await mongo.connect();
    let collections = await db.listCollections().toArray();
    collections.forEach(
        async (collection) =>
            await db.collection(collection.name).deleteMany({}),
    );
    await projectController.addProject(ownerId, projectName);
});

afterAll(async () => {
    await mongo.disconnect();
});

describe("Experiment Controller", () => {
    it("can add an experiment without start/end time", async () => {
        let projects = await projectController.getProjectsByOwner(ownerId);

        let addedExperiment = await experimentController.addExperiment(
            ownerId,
            mockExperiment(projects[0]["_id"]),
        );

        assert.equal(addedExperiment._id.projectId, projects[0]["_id"]);
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
            mockExperiment(projects[0]["_id"], startTime),
        );

        assert.equal(addedExperiment._id.projectId, projects[0]["_id"]);
        assert.equal(addedExperiment.startTime, startTime);
        assert.equal(addedExperiment.endTime, null);
    });

    it("can add an experiment with only end time", async () => {
        let projects = await projectController.getProjectsByOwner(ownerId);

        let endTime = new Date().getTime() + 30000;
        let addedExperiment = await experimentController.addExperiment(
            ownerId,
            mockExperiment(projects[0]["_id"], undefined, endTime),
        );

        assert.equal(addedExperiment._id.projectId, projects[0]["_id"]);
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
            mockExperiment(projects[0]["_id"], startTime, endTime),
        );

        assert.equal(addedExperiment._id.projectId, projects[0]["_id"]);
        assert.equal(addedExperiment.startTime, startTime);
        assert.equal(addedExperiment.endTime, endTime);
    });

    it("cannot add an experiment with start time before current time", async () => {
        let projects = await projectController.getProjectsByOwner(ownerId);

        try {
            let startTime = new Date().getTime() - 10000;
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(projects[0]["_id"], startTime),
            );
            assert.fail();
        } catch (err) {
            assert.ok(err.message.includes("Invalid start/endtime"));
        }
    });

    it("cannot add an experiment with end time before start time", async () => {
        let projects = await projectController.getProjectsByOwner(ownerId);

        try {
            let startTime = new Date().getTime() + 20000;
            let endTime = new Date().getTime() + 10000;
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(projects[0]["_id"], startTime, endTime),
            );
            assert.fail();
        } catch (err) {
            assert.ok(err.message.includes("Invalid start/endtime"));
        }
    });

    it("cannot add an experiment with end time before current time", async () => {
        let projects = await projectController.getProjectsByOwner(ownerId);

        try {
            let endTime = new Date().getTime() - 10000;
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(projects[0]["_id"], undefined, endTime),
            );
            assert.fail();
        } catch (err) {
            assert.ok(err.message.includes("Invalid start/endtime"));
        }
    });
});

const mockExperiment = (projectId, startTime, endTime) => {
    return {
        _id: {
            projectId: projectId,
            experimentName: "exp2",
        },
        variations: [
            {
                variationName: "variation1",
                normalizedTrafficAmount: 0.1,
                variables: [
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
                ],
            },
        ],
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
    };
};
