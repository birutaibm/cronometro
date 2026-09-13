export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/unit'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'vue'],
  moduleNameMapper: {
    '^.+\\.vue$': '<rootDir>/tests/unit/__mocks__/vue-component.js',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
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