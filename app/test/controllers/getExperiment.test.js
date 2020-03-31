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
    describe("Can get experiments within timerange", () => {
        it("if the experiment's start time is within timerange", async () => {
            let projects = await projectController.getProjectsByOwner(ownerId);
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(
                    projects[0]._id,
                    "exp1",
                    1685473303000,
                    1685473307000,
                ),
            );

            let runningExperiments = await experimentController.getRunningExperimentsInTimeRange(
                1685473301000,
                1685473305000,
            );
            assert.equal(runningExperiments.length, 1);
        });

        it("if the experiment's start time and endtime encapsultes given date range", async () => {
            let projects = await projectController.getProjectsByOwner(ownerId);
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(
                    projects[0]._id,
                    "exp1",
                    1685473303000,
                    1685473307000,
                ),
            );

            let runningExperiments = await experimentController.getRunningExperimentsInTimeRange(
                1685473304000,
                1685473306000,
            );
            assert.equal(runningExperiments.length, 1);
        });

        it("if the experiment's end is within timerange", async () => {
            let projects = await projectController.getProjectsByOwner(ownerId);
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(
                    projects[0]._id,
                    "exp1",
                    1685473303000,
                    1685473307000,
                ),
            );

            let runningExperiments = await experimentController.getRunningExperimentsInTimeRange(
                1685473305000,
                1685473309000,
            );
            assert.equal(runningExperiments.length, 1);
        });

        it("if the experiment's endtime is null", async () => {
            let projects = await projectController.getProjectsByOwner(ownerId);
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(projects[0]._id, "exp1", 1685473303000),
            );

            let runningExperiments = await experimentController.getRunningExperimentsInTimeRange(
                1685473305000,
                1685473309000,
            );
            assert.equal(runningExperiments.length, 1);
        });

        it("if the experiments start and end within timerange", async () => {
            let projects = await projectController.getProjectsByOwner(ownerId);
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(
                    projects[0]._id,
                    "exp1",
                    1685473303000,
                    1685473307000,
                ),
            );

            let runningExperiments = await experimentController.getRunningExperimentsInTimeRange(
                1685473301000,
                1685473309000,
            );
            assert.equal(runningExperiments.length, 1);
        });

        it("if the experiments start date is equal to given end date", async () => {
            let projects = await projectController.getProjectsByOwner(ownerId);
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(
                    projects[0]._id,
                    "exp1",
                    1685473307000,
                    1685473309000,
                ),
            );

            let runningExperiments = await experimentController.getRunningExperimentsInTimeRange(
                1685473301000,
                1685473307000,
            );
            assert.equal(runningExperiments.length, 1);
        });

        it("if the experiments end date is equal to given start date", async () => {
            let projects = await projectController.getProjectsByOwner(ownerId);
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(
                    projects[0]._id,
                    "exp1",
                    1685473302000,
                    1685473305000,
                ),
            );

            let runningExperiments = await experimentController.getRunningExperimentsInTimeRange(
                1685473305000,
                1685473307000,
            );
            assert.equal(runningExperiments.length, 1);
        });

        it("if experiments falls within given timerange", async () => {
            let projects = await projectController.getProjectsByOwner(ownerId);

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

            let runningExperiments = await experimentController.getRunningExperimentsInTimeRange(
                1685473303000,
                1685473307000,
            );
            assert.equal(runningExperiments.length, 3);
        });
    });

    describe("Cannot get experiments within timerange", () => {
        it("if the experiment's start time is after given end time", async () => {
            let projects = await projectController.getProjectsByOwner(ownerId);
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(
                    projects[0]._id,
                    "exp1",
                    1685473307000,
                    1685473309000,
                ),
            );

            let runningExperiments = await experimentController.getRunningExperimentsInTimeRange(
                1685473301000,
                1685473305000,
            );
            assert.equal(runningExperiments.length, 0);
        });

        it("if the experiment's start time is after given end time and experiments end time is null", async () => {
            let projects = await projectController.getProjectsByOwner(ownerId);
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(projects[0]._id, "exp1", 1685473307000),
            );

            let runningExperiments = await experimentController.getRunningExperimentsInTimeRange(
                1685473301000,
                1685473305000,
            );
            assert.equal(runningExperiments.length, 0);
        });

        it("if the experiment's end time is before given start time", async () => {
            let projects = await projectController.getProjectsByOwner(ownerId);
            await experimentController.addExperiment(
                ownerId,
                mockExperiment(
                    projects[0]._id,
                    "exp1",
                    1685473303000,
                    1685473305000,
                ),
            );

            let runningExperiments = await experimentController.getRunningExperimentsInTimeRange(
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
