let index = 0;
let mockValues = [0]

/**
 * Used for mocking seedrandom
 */
module.exports = () => ({
    quick: () => {
        const value = mockValues[index % mockValues.length];
        index++;
        return value;
    },
    /**
     * Sets the next random values returned
     * 
     * @param {Array<number>} values 
     */
    mockRandomValues: (values) => {
        mockValues = values;
        index = 0;
    }
})