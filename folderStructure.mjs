// @ts-check
import { createFolderStructure } from 'eslint-plugin-project-structure';

// Builder para pastas finais com testes unitários
const folderWithTests = (filePattern) => ({
  children: [
    { name: '__tests__', ruleId: 'tests_folder' },
    { name: filePattern },
  ],
});

export const folderStructureConfig = createFolderStructure({
  structure: [
    { name: 'src', ruleId: 'src_folder' },
    { name: 'test', ruleId: 'root_test_folder' },
  ],

  rules: {
    // Pasta de testes (usada em todo lugar)
    tests_folder: {
      children: [
        { name: '{kebab-case}.spec.ts' },
        { name: '{kebab-case}.{kebab-case}.spec.ts' },
        { name: '{kebab-case}.{kebab-case}.{kebab-case}.spec.ts' },
        { name: '{kebab-case}.int-spec.ts' },
        { name: '{kebab-case}.e2e-spec.ts' },
        { name: '{kebab-case}.integration.spec.ts' },
      ],
    },

    // Pasta test/ na raiz
    root_test_folder: {
      children: [
        { name: '{kebab-case}.spec.ts' },
        { name: '{kebab-case}.e2e-spec.ts' },
        { name: 'app.e2e-spec.ts' },
        { name: 'jest-e2e.json' },
        { name: 'setup.ts' },
        { name: 'jest.config.ts' },
        { name: 'arbitraries', ruleId: 'test_helpers_folder' },
        { name: 'dsl', ruleId: 'test_helpers_folder' },
        { name: 'fakes', ruleId: 'test_fakes_folder' },
      ],
    },

    // Pasta de helpers de teste
    test_helpers_folder: {
      children: [
        { name: '{kebab-case}.ts' },
        { name: '{kebab-case}.{kebab-case}.ts' },
        { name: 'index.ts' },
      ],
    },

    // Pasta de fakes
    test_fakes_folder: {
      children: [
        { name: 'fake-{kebab-case}.ts' },
        { name: 'fake-{kebab-case}.{kebab-case}.ts' },
        { name: 'index.ts' },
      ],
    },

    // Pasta genérica com arquivos .ts
    generic_ts_folder: {
      children: [
        { name: '{kebab-case}.ts' },
        { name: '{kebab-case}.{kebab-case}.ts' },
        { name: 'index.ts' },
      ],
    },

    // Estrutura principal src/
    src_folder: {
      enforceExistence: ['main.ts', 'app.module.ts', 'modules', 'core'],
      children: [
        { name: 'core', ruleId: 'core_folder' },
        { name: 'modules', ruleId: 'modules_folder' },
        { name: 'main.ts' },
        { name: 'app.module.ts' },
      ],
    },

    // ========================
    // CORE
    // ========================
    core_folder: {
      enforceExistence: ['domain', 'core.module.ts'],
      children: [
        { name: 'domain', ruleId: 'core_domain_folder' },
        { name: 'events', ruleId: 'core_events_folder' },
        { name: 'infra', ruleId: 'core_infra_folder' },
        { name: 'utils', ruleId: 'core_utils_folder' },
        { name: 'core.module.ts' },
      ],
    },

    core_domain_folder: {
      enforceExistence: ['aggregate-root.ts', 'default-entity.ts', 'result.ts'],
      children: [
        { name: 'aggregate-root.ts' },
        { name: 'default-entity.ts' },
        { name: 'result.ts' },
        { name: 'unit-of-work.ts' },
        { name: 'exceptions', ruleId: 'exceptions_folder' },
        { name: 'value-objects', ruleId: 'value_objects_folder' },
        { name: 'mapper', ruleId: 'mapper_folder' },
        { name: 'service', ruleId: 'service_folder' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    core_events_folder: {
      children: [
        { name: '{kebab-case}.ts' },
        { name: '{kebab-case}.spec.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    core_infra_folder: {
      children: [
        { name: 'database', ruleId: 'core_database_folder' },
        { name: 'filters', ruleId: 'filters_folder' },
        { name: 'grafana', ruleId: 'grafana_folder' },
        { name: 'http', ruleId: 'core_http_folder' },
        { name: 'instrumentation', ruleId: 'instrumentation_folder' },
        { name: 'logger', ruleId: 'logger_folder' },
        { name: 'middleware', ruleId: 'middleware_folder' },
        { name: 'sqs', ruleId: 'sqs_folder' },
        { name: 'persistence', ruleId: 'generic_ts_with_tests_folder' },
        { name: 'typeorm', ruleId: 'generic_ts_with_tests_folder' },
      ],
    },

    core_database_folder: {
      children: [
        { name: 'mongodb', ruleId: 'generic_ts_with_tests_folder' },
        { name: 'persistence', ruleId: 'generic_ts_with_tests_folder' },
        { name: 'typeorm', ruleId: 'generic_ts_with_tests_folder' },
        { name: '{kebab-case}.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    core_http_folder: {
      children: [
        { name: '{kebab-case}.ts' },
        { name: '{kebab-case}-{kebab-case}.mapper.ts' },
        { name: 'dtos', ruleId: 'dtos_folder' },
        { name: 'client', ruleId: 'generic_ts_with_tests_folder' },
        { name: 'transformers', ruleId: 'generic_ts_with_tests_folder' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    core_utils_folder: {
      children: [
        { name: '{kebab-case}.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    // ========================
    // MODULES
    // ========================
    modules_folder: {
      children: [{ name: 'payment', ruleId: 'module_folder' }],
    },

    module_folder: {
      enforceExistence: ['domain', 'application', 'infra'],
      children: [
        { name: 'domain', ruleId: 'module_domain_folder' },
        { name: 'application', ruleId: 'module_application_folder' },
        { name: 'infra', ruleId: 'module_infra_folder' },
        { name: 'presentation', ruleId: 'module_presentation_folder' },
        { name: '{kebab-case}.module.ts' },
      ],
    },

    module_domain_folder: {
      children: [
        { name: 'entities', ruleId: 'entities_folder' },
        { name: 'value-objects', ruleId: 'value_objects_folder' },
        { name: 'exceptions', ruleId: 'exceptions_folder' },
        { name: 'enum', ruleId: 'enum_folder' },
        { name: 'events', ruleId: 'events_folder' },
        { name: 'gateways', ruleId: 'gateways_folder' },
        { name: 'service', ruleId: 'service_folder' },
        { name: 'repositories', ruleId: 'repositories_folder' },
        { name: 'factories', ruleId: 'factories_folder' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    module_application_folder: {
      children: [
        { name: 'use-cases', ruleId: 'use_cases_folder' },
        { name: 'services', ruleId: 'service_folder' },
        { name: 'strategies', ruleId: 'strategies_folder' },
        { name: 'application.module.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    module_infra_folder: {
      enforceExistence: ['infra.module.ts'],
      children: [
        { name: 'persistence', ruleId: 'persistence_folder' },
        { name: 'acl', ruleId: 'acl_folder' },
        { name: 'publishers', ruleId: 'publishers_folder' },
        { name: 'gateways', ruleId: 'gateways_impl_folder' },
        { name: 'consumers', ruleId: 'consumers_folder' },
        { name: 'infra.module.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    module_presentation_folder: {
      children: [
        { name: 'controllers', ruleId: 'controllers_folder' },
        { name: 'consumers', ruleId: 'consumers_folder' },
        { name: 'dto', ruleId: 'presentation_dto_folder' },
        { name: 'docs', ruleId: 'docs_folder' },
        { name: 'filters', ruleId: 'filters_folder' },
        { name: 'presentation.module.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    // ========================
    // PASTAS REUTILIZÁVEIS
    // ========================
    generic_ts_with_tests_folder: {
      children: [
        { name: '{kebab-case}.ts' },
        { name: '{kebab-case}.{kebab-case}.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    entities_folder: {
      children: [
        { name: '{kebab-case}.entity.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    value_objects_folder: {
      children: [
        { name: '{kebab-case}.vo.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    exceptions_folder: {
      children: [
        { name: '{kebab-case}.exception.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    enum_folder: {
      children: [{ name: '{kebab-case}.enum.ts' }],
    },

    events_folder: {
      children: [
        { name: '{kebab-case}.event.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    gateways_folder: {
      children: [
        { name: '{kebab-case}.gateway.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    gateways_impl_folder: {
      children: [
        { name: '{kebab-case}.gateway.ts' },
        { name: 'http-{kebab-case}.gateway.ts' },
        { name: 'dtos', ruleId: 'dtos_folder' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },
    dtos_folder: {
      children: [
        { name: '{kebab-case}.dto.ts' },
        { name: 'index.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    service_folder: {
      children: [
        { name: '{kebab-case}.service.ts' },
        { name: '{kebab-case}-{kebab-case}.service.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    repositories_folder: {
      children: [
        { name: '{kebab-case}.repository.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    factories_folder: {
      children: [
        { name: '{kebab-case}.factory.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    use_cases_folder: {
      children: [{ name: '{kebab-case}', ruleId: 'use_case_folder' }],
    },

    use_case_folder: {
      children: [
        { name: '{kebab-case}.use-case.ts' },
        { name: '{kebab-case}-impl.use-case.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    strategies_folder: {
      children: [
        { name: '{kebab-case}.strategy.ts' },
        { name: '{kebab-case}.ts' },
        { name: 'index.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    persistence_folder: {
      children: [
        { name: 'repositories', ruleId: 'persistence_repositories_folder' },
        { name: 'entities', ruleId: 'persistence_entities_folder' },
        { name: 'datasource', ruleId: 'datasource_folder' },
        { name: 'mapper', ruleId: 'mapper_folder' },
        { name: '{kebab-case}.types.ts' },
        { name: '{kebab-case}-{kebab-case}.types.ts' },
        { name: '{kebab-case}-{kebab-case}-{kebab-case}.types.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    persistence_repositories_folder: {
      children: [
        { name: '{kebab-case}.repository.ts' },
        { name: '{kebab-case}-impl.repository.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    persistence_entities_folder: {
      children: [
        { name: '{kebab-case}.entity.ts' },
        { name: '{kebab-case}-{kebab-case}.entity.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    datasource_folder: {
      children: [
        { name: '{kebab-case}.datasource.ts' },
        { name: '{kebab-case}.{kebab-case}.ts' },
        { name: '{kebab-case}.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    mapper_folder: {
      children: [
        { name: '{kebab-case}.mapper.ts' },
        { name: '{kebab-case}.mapper.factory.ts' },
        { name: '{kebab-case}.mapper.interface.ts' },
        { name: '{kebab-case}.factory.ts' },
        { name: '{kebab-case}.interface.ts' },
        { name: 'abstract.mapper.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    acl_folder: {
      children: [{ name: '{kebab-case}', ruleId: 'acl_gateway_folder' }],
    },

    acl_gateway_folder: {
      children: [
        { name: '{kebab-case}', ruleId: 'acl_provider_folder' },
        { name: '{kebab-case}.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    acl_provider_folder: {
      children: [
        { name: '{kebab-case}', ruleId: 'acl_subprovider_folder' },
        { name: '{kebab-case}.ts' },
        { name: '{kebab-case}-{kebab-case}.gateway.ts' },
        { name: '{kebab-case}-{kebab-case}-{kebab-case}.gateway.ts' },
        { name: 'dtos', ruleId: 'dtos_folder' },
        { name: 'signature', ruleId: 'signature_folder' },
        { name: 'publishers', ruleId: 'publishers_folder' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    acl_subprovider_folder: {
      children: [
        { name: '{kebab-case}.ts' },
        { name: '{kebab-case}.gateway.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    signature_folder: {
      children: [
        { name: '{kebab-case}.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    publishers_folder: {
      children: [
        { name: '{kebab-case}.publish.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    consumers_folder: {
      children: [
        { name: '{kebab-case}.ts' },
        { name: 'sqs-{kebab-case}.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    controllers_folder: {
      children: [
        { name: '{kebab-case}.controller.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    presentation_dto_folder: {
      children: [
        { name: 'request', ruleId: 'dtos_folder' },
        { name: 'response', ruleId: 'dtos_folder' },
      ],
    },

    dtos_folder: {
      children: [
        { name: '{kebab-case}.dto.ts' },
        { name: 'index.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    docs_folder: {
      children: [{ name: '{kebab-case}', ruleId: 'doc_folder' }],
    },

    doc_folder: {
      children: [{ name: '{kebab-case}.doc.ts' }],
    },

    filters_folder: {
      children: [
        { name: '{kebab-case}.filter.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    instrumentation_folder: {
      children: [{ name: '{kebab-case}.ts' }, { name: 'index.ts' }],
    },

    logger_folder: {
      children: [
        { name: '{kebab-case}.ts' },
        { name: '{kebab-case}.{kebab-case}.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    middleware_folder: {
      children: [
        { name: '{kebab-case}.middleware.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    sqs_folder: {
      children: [
        { name: '{kebab-case}.ts' },
        { name: '__tests__', ruleId: 'tests_folder' },
      ],
    },

    grafana_folder: {
      children: [{ name: '{kebab-case}.yml' }, { name: '{kebab-case}.json' }],
    },
  },
});
