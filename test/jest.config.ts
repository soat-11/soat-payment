import { readFileSync } from 'fs';
import { join } from 'path';

import type { Config } from '@jest/types';

interface CoverageConfig {
  include: string[];
  exclude: string[];
}

// Use process.cwd() as Jest is always run from the project root
const coverageConfigPath = join(process.cwd(), 'config/coverage.config.json');
const coverageConfig: CoverageConfig = JSON.parse(
  readFileSync(coverageConfigPath, 'utf-8'),
);

const collectCoverageFrom = [
  ...coverageConfig.include,
  ...coverageConfig.exclude.map((pattern: string) => `!${pattern}`),
];

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
  collectCoverageFrom,
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
