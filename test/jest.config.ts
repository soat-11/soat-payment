import { createRequire } from 'module';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import type { Config } from '@jest/types';

// @ts-expect-error - import.meta is valid in ESM, Jest runs this as ESM
const __dirname = dirname(fileURLToPath(import.meta.url));
// @ts-expect-error - import.meta is valid in ESM
const _require = createRequire(import.meta.url);
const coverageConfig = _require('../config/coverage.config.json');

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
