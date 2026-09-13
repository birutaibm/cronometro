export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/unit'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  modulePaths: ['<rootDir>'],
  modulePathIgnorePatterns: ['node_modules'],
  collectCoverageFrom: [
    'electron/**/*.ts',
    'src/**/*.ts',
    '!node_modules/**',
    '!dist/**',
    '!dist-electron/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};