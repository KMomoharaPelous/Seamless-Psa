module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['./jest.setup.js'],
    testPatchIgnorePatterns: ['/node_modules/', '/dist/'],
};