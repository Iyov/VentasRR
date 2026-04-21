/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  // Permite importar módulos .gs como CommonJS desde los tests
  transform: {},
  // Cobertura de código
  collectCoverageFrom: ['src/**/*.gs'],
  coverageDirectory: 'coverage',
  verbose: true,
};

module.exports = config;
