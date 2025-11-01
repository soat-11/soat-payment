import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import _import from 'eslint-plugin-import';
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths';
import prettier from 'eslint-plugin-prettier';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import { projectStructurePlugin } from 'eslint-plugin-project-structure';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { folderStructureConfig } from './folderStructure.mjs';
import filenamesPlugin from './eslint-rules/filenames.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: [
      '**/.eslintrc.js',
      'eslint.config.mjs',
      'node_modules/**',
      'test/jest-e2e.json',
      'test/setup.ts',
      'test/jest.config.ts',
    ],
  },
  ...fixupConfigRules(
    compat.extends(
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:import/recommended',
      'plugin:import/typescript',
    ),
  ),
  {
    plugins: {
      '@typescript-eslint': fixupPluginRules(typescriptEslint),
      'no-relative-import-paths': noRelativeImportPaths,
      import: fixupPluginRules(_import),
      eslintPluginPrettierRecommended,
      prettier,
      'project-structure': projectStructurePlugin,
      'repo-filenames': filenamesPlugin,
    },

    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },

      parser: tsParser,
      ecmaVersion: 5,
      sourceType: 'module',

      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },

    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
      'project-structure/folder-structure-config-path':
        '.projectStructurerc.json',
    },

    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      'project-structure/folder-structure': ['error', folderStructureConfig],
      'repo-filenames/kebab-case-filenames': 'error',
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src/core',
              from: './src/modules',
              message:
                'Módulo core não deve depender de módulos de funcionalidade.',
            },
            {
              target: './src/modules/session',
              from: './src/modules/user',
              message:
                'Módulo de sessão não deve depender do módulo de usuário.',
            },
            {
              target: './src/modules/user',
              from: './src/modules/session',
              message:
                'Módulo de usuário não deve depender do módulo de sessão.',
            },
          ],
        },
      ],
    },
  },
];
