module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: [ "**/__tests__/**/*.test.ts" ],
    clearMocks: true,
    coverageDirectory: "coverage", // Added
    coverageProvider: "v8",      // Added
};