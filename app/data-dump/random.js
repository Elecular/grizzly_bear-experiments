/**
 * This script is used for dumping random data to user-activity service
 * Used for stress and batch testing
 *
 * These are the required arguments:
 *
 * projects: comma seperated list of ids
 * experiments-timerange: comma seperated list of time range in unix milliseconds
 *
 * Example usage:
node bin/data-dump/random.js \
    --ownerId testOwner
    --data '[{
        "projectId": "5e865ed82a2aeb6436f498dc",
        "experimentName": "exp1",
        "startTime": "79839129600000",
        "endTime": "79839129600005"
    }]'
 */

const argv = require("yargs").argv;
const projectController = require("../controllers/project");
const experimentController = require("../controllers/experiment");

//Parsing Args
const owner = argv.ownerId || "owner";
const mockExperimentsData = JSON.parse(argv.data);

//Returns an experiment object based on given params
const mockExperiment = (projectId, experimentName, startTime, endTime) => ({
    _id: {
        projectId: projectId,
        experimentName: experimentName,
    },
    startTime: startTime,
    endTime: endTime,
    variations: [
        {
            variationName: "variation1",
            normalizedTrafficAmount: 0.5,
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
            normalizedTrafficAmount: 0.5,
            variables: [
                {
                    variableName: "var1",
                    variableType: "String",
                    variableValue: "test",
                },
            ],
        },
    ],
});

module.exports = async () => {
    console.log("Adding Projects");
    for (const mockExperimentData of mockExperimentsData) {
        try {
            await projectController.addProject(
                owner,
                "name",
                mockExperimentData.projectId,
            );
        } catch (err) {
            console.log(`${err.statusCode}: ${err.message}`);
        }
    }

    console.log("Adding Experiments");
    for (const mockExperimentData of mockExperimentsData) {
        try {
            await experimentController.addExperiment(
                mockExperiment(
                    mockExperimentData.projectId,
                    mockExperimentData.experimentName,
                    Number(mockExperimentData.startTime),
                    Number(mockExperimentData.endTime),
                ),
            );
        } catch (err) {
            console.log(`${err.statusCode}: ${err.message}`);
        }
    }
};
