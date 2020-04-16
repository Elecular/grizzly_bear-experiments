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
    --data '[{
        "projectId": "5e865ed82a2aeb6436f498dc",
        "experimentName": "exp1",
        "startTime": "79839129600000",
        "endTime": "79839129600005"
    }]'
 */

const axios = require("axios");
const argv = require("yargs").argv;

//Parsing Args
const owner = "owner";
const port = 80;
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

let addedProjects = 0;

for (const mockExperimentData of mockExperimentsData) {
    axios({
        method: "post",
        url: `http://localhost:${port}/project`,
        data: {
            projectName: "name",
            projectId: mockExperimentData.projectId,
        },
        headers: {
            ownerid: owner,
        },
    })
        .then(() => {
            addedProjects++;
            if (addedProjects === mockExperimentsData.length) {
                addExperiments();
            }
        })
        .catch((err) => {
            if (err.response.status === 409) {
                addedProjects++;
                if (addedProjects === mockExperimentsData.length) {
                    addExperiments();
                }
            } else {
                console.log("Error occured while creating projects");
            }
        });
}

const addExperiments = () => {
    for (const mockExperimentData of mockExperimentsData) {
        axios({
            method: "post",
            url: `http://localhost:${port}/experiment`,
            data: mockExperiment(
                mockExperimentData.projectId,
                mockExperimentData.experimentName,
                Number(mockExperimentData.startTime),
                Number(mockExperimentData.endTime),
            ),
            headers: {
                ownerid: owner,
            },
        })
            .then(() => {})
            .catch((err) => {
                if (err.response.status === 409) return;
                console.log(err);
            });
    }
};
