import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  rootDir: '..',
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true, tsconfig: 'tsconfig.json' }],
  },
  transformIgnorePatterns: ['/node_modules/(?!@faker-js/)'],
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@user/(.*)$': '<rootDir>/src/modules/user/$1',
    '^@session/(.*)$': '<rootDir>/src/modules/session/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
    '^test/(.*)$': '<rootDir>/test/$1',
  },
};

export default config;
