/**
 * A variation is defined by a set of variables
 @typedef {{
    variableName: String,
    variableType: String,
    variableValue: String
 }} Variable
 */

/**
 * An experiment can have multiple variations of the same software
 @typedef {{
    variationName: String,
    normalizedTrafficAmount: number,
    variables: Array<Variable>,
    controlGroup: boolean
 }} Variation
 */

/**
 * An experiment
 @typedef {{
    _id: {
        projectId: String,
        experimentName: String
    },
    startTime: number,
    endTime: (number|undefined),
    variations: Array<Variation>
 }} Experiment
 */

/**
 * A Project
 @typedef {{
   _id: String,
   projectName: String,
   ownerId: String
}} Project
*/
