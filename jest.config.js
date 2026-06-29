/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Automatically reset mock state before every test.
  // This is equivalent to calling jest.resetAllMocks() before each test.
  resetMocks: true,
};
