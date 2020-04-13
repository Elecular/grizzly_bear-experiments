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
    describe("Can get experiment by project id", () => {
        it("When given project id", async () => {
            await projectController.addProject(ownerId, "testProject2");
            const projects = await projectController.getProjectsByOwner(
                ownerId,
            );
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(projects[0]._id, "exp1"),
            );
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(projects[0]._id, "exp2"),
            );
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(projects[1]._id, "exp3"),
            );

            const experiments = await experimentController.getExperimentsByProjectId(
                projects[0]._id,
            );
            assert.equal(experiments[0]._id.experimentName, "exp1");
            assert.equal(experiments[1]._id.experimentName, "exp2");
        });

        it("When no experiments are created", async () => {
            await projectController.addProject(ownerId, "testProject2");
            const projects = await projectController.getProjectsByOwner(
                ownerId,
            );

            const experiments = await experimentController.getExperimentsByProjectId(
                projects[1]._id,
            );
            assert.equal(experiments.length, 0);
        });
    });

    describe("Can get experiments within timerange", () => {
        it("if the experiment's start time is within timerange", async () => {
            const projects = await projectController.getProjectsByOwner(
                ownerId,
            );
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(
                    projects[0]._id,
                    "exp1",
                    1685473303000,
                    1685473307000,
                ),
            );

            const runningExperiments = await experimentController.getRunningExperimentsInTimeRange(
                1685473301000,
                1685473305000,
            );
            assert.equal(runningExperiments.length, 1);
        });

        it("if the experiment's start time and endtime encapsultes given date range", async () => {
            const projects = await projectController.getProjectsByOwner(
                ownerId,
            );
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(
                    projects[0]._id,
                    "exp1",
                    1685473303000,
                    1685473307000,
                ),
            );

            const runningExperiments = await experimentController.getRunningExperimentsInTimeRange(
                1685473304000,
                1685473306000,
            );
            assert.equal(runningExperiments.length, 1);
        });

        it("if the experiment's end is within timerange", async () => {
            const projects = await projectController.getProjectsByOwner(
                ownerId,
            );
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(
                    projects[0]._id,
                    "exp1",
                    1685473303000,
                    1685473307000,
                ),
            );

            const runningExperiments = await experimentController.getRunningExperimentsInTimeRange(
                1685473305000,
                1685473309000,
            );
            assert.equal(runningExperiments.length, 1);
        });

        it("if the experiment's endtime is null", async () => {
            const projects = await projectController.getProjectsByOwner(
                ownerId,
            );
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(projects[0]._id, "exp1", 1685473303000),
            );

            const runningExperiments = await experimentController.getRunningExperimentsInTimeRange(
                1685473305000,
                1685473309000,
            );
            assert.equal(runningExperiments.length, 1);
        });

        it("if the experiments start and end within timerange", async () => {
            const projects = await projectController.getProjectsByOwner(
                ownerId,
            );
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(
                    projects[0]._id,
                    "exp1",
                    1685473303000,
                    1685473307000,
                ),
            );

            const runningExperiments = await experimentController.getRunningExperimentsInTimeRange(
                1685473301000,
                1685473309000,
            );
            assert.equal(runningExperiments.length, 1);
        });

        it("if the experiments start date is equal to given end date", async () => {
            const projects = await projectController.getProjectsByOwner(
                ownerId,
            );
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(
                    projects[0]._id,
                    "exp1",
                    1685473307000,
                    1685473309000,
                ),
            );

            const runningExperiments = await experimentController.getRunningExperimentsInTimeRange(
                1685473301000,
                1685473307000,
            );
            assert.equal(runningExperiments.length, 1);
        });

        it("if the experiments end date is equal to given start date", async () => {
            const projects = await projectController.getProjectsByOwner(
                ownerId,
            );
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(
                    projects[0]._id,
                    "exp1",
                    1685473302000,
                    1685473305000,
                ),
            );

            const runningExperiments = await experimentController.getRunningExperimentsInTimeRange(
                1685473305000,
                1685473307000,
            );
            assert.equal(runningExperiments.length, 1);
        });

        it("if experiments falls within given timerange", async () => {
            const projects = await projectController.getProjectsByOwner(
                ownerId,
            );

            //All experiments within time range
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(
                    projects[0]._id,
                    "exp1",
                    1685473304000,
                    1685473306000,
                ),
            );
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(
                    projects[0]._id,
                    "exp2",
                    1685473301000,
                    1685473309000,
                ),
            );
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(
                    projects[0]._id,
                    "exp3",
                    1685473305000,
                    1685473309000,
                ),
            );

            //all experiments out of time range
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(
                    projects[0]._id,
                    "exp7",
                    1685473308000,
                    1685473309000,
                ),
            );
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(
                    projects[0]._id,
                    "exp8",
                    1685473301000,
                    1685473302000,
                ),
            );

            const runningExperiments = await experimentController.getRunningExperimentsInTimeRange(
                1685473303000,
                1685473307000,
            );
            assert.equal(runningExperiments.length, 3);
        });
    });

    describe("Cannot get experiments within timerange", () => {
        it("if the experiment's start time is after given end time", async () => {
            const projects = await projectController.getProjectsByOwner(
                ownerId,
            );
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(
                    projects[0]._id,
                    "exp1",
                    1685473307000,
                    1685473309000,
                ),
            );

            const runningExperiments = await experimentController.getRunningExperimentsInTimeRange(
                1685473301000,
                1685473305000,
            );
            assert.equal(runningExperiments.length, 0);
        });

        it("if the experiment's start time is after given end time and experiments end time is null", async () => {
            const projects = await projectController.getProjectsByOwner(
                ownerId,
            );
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(projects[0]._id, "exp1", 1685473307000),
            );

            const runningExperiments = await experimentController.getRunningExperimentsInTimeRange(
                1685473301000,
                1685473305000,
            );
            assert.equal(runningExperiments.length, 0);
        });

        it("if the experiment's end time is before given start time", async () => {
            const projects = await projectController.getProjectsByOwner(
                ownerId,
            );
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(
                    projects[0]._id,
                    "exp1",
                    1685473303000,
                    1685473305000,
                ),
            );

            const runningExperiments = await experimentController.getRunningExperimentsInTimeRange(
                1685473307000,
                1685473309000,
            );
            assert.equal(runningExperiments.length, 0);
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
