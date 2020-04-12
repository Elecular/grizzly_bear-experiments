let index = 0;
let mockValues = [0]

module.exports = () => ({
    quick: () => {
        const value = mockValues[index % mockValues.length];
        index++;
        return value;
    },
    mockRandomValues: (values) => {
        mockValues = values;
        index = 0;
    }
})