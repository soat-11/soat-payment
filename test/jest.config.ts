import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  rootDir: '..',
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@payment/(.*)$': '<rootDir>/src/modules/payment/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
    '^test/(.*)$': '<rootDir>/test/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/infra/consumers/**',
    '!src/core/infra/http/transformers/**',
    '!src/**/*.test.ts',
    '!src/**/__tests__/**',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/index.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.type.ts',
    '!src/**/*.enum.ts',
    '!src/core/infra/instrumentation/**',
    '!src/**/controllers/**',
    '!src/**/filters/**',

    '!src/**/docs/**',

    '!src/**/*.decorator.ts',
    '!test/**',
    '!src/**/application/strategies/payment-processing.strategy.ts',
    '!src/**/application/use-cases/*/*.use-case.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
};

export default config;
