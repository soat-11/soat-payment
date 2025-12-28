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
    '!src/**/*.test.ts',
    '!src/**/__tests__/**',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/index.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.type.ts',
    '!src/**/*.enum.ts',
    '!src/**/*.decorator.ts',
    '!test/**',

    // Interfaces e Symbols de domínio
    '!src/**/application/strategies/payment-processing.strategy.ts',
    '!src/**/application/use-cases/*/*.use-case.ts',
    '!src/**/domain/gateways/*.ts',
    '!src/**/domain/repositories/*.ts',
    '!src/**/domain/factories/*.ts',

    // Infraestrutura core (abstrações, HTTP, SQS, database)
    '!src/core/domain/mapper/**',
    '!src/core/infra/http/**',
    '!src/core/infra/sqs/**',
    '!src/core/infra/database/**',
    '!src/core/infra/instrumentation/**',
    '!src/core/infra/middleware/**',

    // Controllers, consumers, filters, docs
    '!src/**/controllers/**',
    '!src/**/filters/**',
    '!src/**/docs/**',

    // Persistência e ACL signatures
    '!src/**/infra/persistence/**',
    '!src/**/infra/gateways/**',
    '!src/**/infra/consumers/**',
    '!src/**/signature/payment-signature.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'coverage',
        outputName: 'junit.xml',
      },
    ],
  ],
};

export default config;
