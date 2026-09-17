export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/unit'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'vue'],
  moduleNameMapper: {
    '^.+\\.vue$': '<rootDir>/tests/unit/__mocks__/vue-component.js',
    '^vuetify/components$': '<rootDir>/tests/unit/__mocks__/vuetify-components.js',
    '^vuetify/directives$': '<rootDir>/tests/unit/__mocks__/vuetify-directives.js',
    '^vuetify/styles$': '<rootDir>/tests/unit/__mocks__/style-mock.js',
    '\\.css$': '<rootDir>/tests/unit/__mocks__/style-mock.js',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  modulePaths: ['<rootDir>'],
  modulePathIgnorePatterns: ['node_modules'],
  transformIgnorePatterns: ['<rootDir>/node_modules/(?!vuetify/)'],
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
