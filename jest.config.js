/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  collectCoverageFrom: ['lib/**/*.js', 'src/**/*.js'],
  coverageDirectory: 'coverage',
};
