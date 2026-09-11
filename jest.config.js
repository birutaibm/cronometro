export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/unit'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.tsx?$': 'esbuild-jest',
  },
  modulePaths: ['<rootDir>'],
  modulePathIgnorePatterns: ['node_modules'],
};
