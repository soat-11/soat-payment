import { createFolderStructure } from 'eslint-plugin-project-structure';

export const folderStructureConfig = createFolderStructure({
  structure: [
    { name: 'src', ruleId: 'src_folder' },
    {
      name: '__tests__',
      ruleId: 'test_folder',
      children: [
        { name: '{kebab-case}.spec.ts' },
        { name: '{kebab-case}.e2e-spec.ts' },
      ],
    },
    {
      name: 'test',
      ruleId: 'test_folder',
      children: [
        { name: '{kebab-case}.spec.ts' },
        { name: '{kebab-case}.e2e-spec.ts' },
        ,
        { name: 'jest-e2e.json' },
        { name: 'setup.ts' },
        { name: 'jest.config.ts' },
        { name: 'factories', children: [{ name: '*' }] },
      ],
    },
  ],

  rules: {
    nested_folder: {
      children: [
        { name: '{kebab-case}', ruleId: 'nested_folder' },
        { name: '{kebab-case}.ts' },
        { name: '{kebab-case}.{kebab-case}.ts' },
      ],
    },
    nested_test_folder: {
      children: [
        { name: 'fakes', children: [{ name: '*.fake.ts' }] },
        { name: '{kebab-case}', ruleId: 'nested_test_folder' },
        { name: '{kebab-case}.spec.ts' },
        { name: '{kebab-case}.e2e-spec.ts' },
        ,
      ],
    },
    test_folder: {
      name: '__tests__',
      ruleId: 'nested_test_folder',
    },
    src_folder: {
      name: 'src',
      enforceExistence: ['main.ts', 'app.module.ts', 'modules', 'core'],
      children: [
        { name: 'core', ruleId: 'core_folder' },
        { name: 'modules', ruleId: 'modules_folder' },
        { name: 'main.ts' },
        { name: 'app.module.ts' },
      ],
    },

    core_folder: {
      name: 'core',
      enforceExistence: ['domain', 'core.module.ts'],
      children: [
        { name: 'domain', ruleId: 'core_domain_folder' },
        { name: 'events', ruleId: 'core_events_folder' },
        { name: 'infra', ruleId: 'core_infra_folder' },

        { name: 'core.module.ts' },
        { ruleId: 'test_folder' },
      ],
    },

    core_domain_folder: {
      name: 'domain',
      enforceExistence: [
        'aggregate-root.ts',
        'default-entity.ts',
        'result.ts',
        'value-objects',
        'exceptions',
        'mapper',
      ],
      children: [
        {
          name: 'exceptions',
          ruleId: 'core_domain_exceptions_folder',
          enforceExistence: ['domain.exception.ts'],
        },
        { name: 'aggregate-root.ts' },
        { name: 'result.ts' },
        { name: 'value-objects', ruleId: 'core_domain_value_objects_folder' },
        { name: 'mapper', ruleId: 'core_mapper_folder' },
        { name: 'default-entity.ts' },
        {
          name: 'service',
          children: [{ name: '*.service.ts' }, { ruleId: 'test_folder' }],
        },
        { ruleId: 'test_folder' },
      ],
    },

    core_events_folder: {
      name: 'domain-events',
      children: [{ name: '*.event.ts' }, { ruleId: 'test_folder' }],
    },

    core_domain_exceptions_folder: {
      name: '*',

      children: [{ name: '*.exception.ts' }, { ruleId: 'test_folder' }],
    },

    core_domain_value_objects_folder: {
      name: '*',
      children: [{ name: '*.vo.ts' }, { ruleId: 'test_folder' }],
    },

    core_mapper_folder: {
      name: 'mapper',
      children: [{ name: '*.mapper.ts' }, { ruleId: 'test_folder' }],
    },

    core_events_folder: {
      name: 'events',
      children: [{ name: '*.ts' }, { ruleId: 'test_folder' }],
    },

    core_infra_folder: {
      name: '*',
      children: [
        {
          name: 'database',
          children: [
            {
              name: '*',
              children: [
                { name: '*.ts' },
                {
                  ruleId: 'test_folder',
                },
              ],
            },
          ],
        },
        {
          name: 'logger',
          children: [
            { name: '*' },
            {
              ruleId: 'test_folder',
            },
          ],
        },
        {
          name: 'http',
          children: [{ name: '*.ts' }, { ruleId: 'test_folder' }],
        },
        { ruleId: 'test_folder' },
      ],
    },

    core_logger_folder: {
      ruleId: 'test_folder',
      name: '*',
    },

    modules_folder: {
      name: 'modules',
      children: [
        { name: '{kebab-case}', ruleId: 'module_folder' },
        { ruleId: 'test_folder' },
      ],
    },

    module_folder: {
      name: '*',
      enforceExistence: ['domain', 'application', 'infra'],
      children: [
        { name: 'domain', ruleId: 'module_domain_folder' },
        { name: 'application', ruleId: 'module_application_folder' },
        { name: 'infra', ruleId: 'module_infra_folder' },
        { name: 'presentation', ruleId: 'module_presentation_folder' },
        { name: '*.module.ts' },
        { ruleId: 'test_folder' },
      ],
    },
    module_application_folder: {
      name: '*',
      children: [
        {
          name: 'use-cases',
          children: [
            {
              name: '*',

              children: [
                {
                  name: '*.use-case.ts',
                },
                {
                  name: '*-impl.use-case.ts',
                },
                { ruleId: 'test_folder' },
              ],
            },
          ],
        },
        {
          name: 'services',
          children: [
            { name: '{kebab-case}.service.ts' },
            { ruleId: 'test_folder' },
          ],
        },
        { ruleId: 'test_folder' },
      ],
    },
    module_presentation_folder: {
      name: '*',
      children: [
        {
          name: 'controllers',
          children: [
            { name: '{kebab-case}.controller.ts' },
            { ruleId: 'test_folder' },
          ],
        },
        {
          name: 'dto',
          children: [{ name: '*.dto.ts' }, { ruleId: 'test_folder' }],
        },
        {
          name: 'docs',
          children: [
            {
              name: '*',
              children: [{ name: '*.doc.ts' }, { ruleId: 'test_folder' }],
            },
            { ruleId: 'test_folder' },
          ],
        },
        { ruleId: 'test_folder' },
      ],
    },
    module_domain_folder: {
      name: '*',
      children: [
        { name: 'entities', ruleId: 'module_entities_folder' },
        { name: 'value-objects', ruleId: 'module_value_objects_folder' },
        { name: 'exceptions', ruleId: 'module_exceptions_folder' },
        { name: 'enum', children: [{ name: '*.enum.ts' }] },
        { name: 'domain-events', ruleId: 'core_events_folder' },
        {
          name: 'service',
          children: [{ name: '*.service.ts' }, { ruleId: 'test_folder' }],
        },
        {
          name: 'repositories',
          children: [
            { name: '{kebab-case}.repository.ts' },
            { ruleId: 'test_folder' },
          ],
        },
        { ruleId: 'test_folder' },
      ],
    },

    module_infra_folder: {
      name: '*',
      enforceExistence: ['infra.module.ts'],
      children: [
        {
          name: 'logger',
          children: [{ name: '*.ts' }, { ruleId: 'test_folder' }],
        },
        { name: 'persistence', ruleId: 'module_persistence_folder' },
        { name: 'infra.module.ts' },
        { ruleId: 'test_folder' },
      ],
    },

    module_persistence_folder: {
      name: '*',
      enforceExistence: ['repositories', 'entities', 'datasource'],
      children: [
        {
          name: 'repositories',
          children: [
            { name: '{kebab-case}-impl.repository.ts' },
            {
              name: '{kebab-case}.*.ts',
            },
            { ruleId: 'test_folder' },
          ],
        },
        {
          name: 'datasource',
          children: [{ name: '*' }, { ruleId: 'test_folder' }],
        },
        {
          name: 'entities',
          children: [
            { name: '{kebab-case}.entity.ts' },
            { ruleId: 'test_folder' },
          ],
        },
        {
          name: 'mapper',
          ruleId: 'module_mapper_folder',
        },
        { ruleId: 'test_folder' },
      ],
    },

    module_entities_folder: {
      name: '*',
      children: [{ name: '*.entity.ts' }, { ruleId: 'test_folder' }],
    },

    module_value_objects_folder: {
      name: 'value-objects',
      children: [{ name: '*.vo.ts' }, { ruleId: 'test_folder' }],
    },

    module_exceptions_folder: {
      name: 'exceptions',
      children: [{ name: '*.exception.ts' }, { ruleId: 'test_folder' }],
    },

    module_mapper_folder: {
      name: 'mapper',
      children: [{ name: '*.mapper.ts' }, { ruleId: 'test_folder' }],
    },
  },
});
