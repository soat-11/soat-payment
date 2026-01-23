## Quality

[![SonarQube Cloud](https://sonarcloud.io/images/project_badges/sonarcloud-dark.svg)](https://sonarcloud.io/summary/new_code?id=soat-11_soat-payment)

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=soat-11_soat-payment&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=soat-11_soat-payment)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=soat-11_soat-payment&metric=coverage)](https://sonarcloud.io/summary/new_code?id=soat-11_soat-payment)
[![Coverage %](https://img.shields.io/sonar/coverage/soat-11_soat-payment?server=https%3A%2F%2Fsonarcloud.io&label=Coverage%20%25)](https://sonarcloud.io/summary/new_code?id=soat-11_soat-payment)
[![Tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/soat-11/9602f1854adbdfe1b00b5e881a123b55/raw/soat-payment-tests.json)](https://github.com/soat-11/soat-payment/actions)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=soat-11_soat-payment&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=soat-11_soat-payment)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=soat-11_soat-payment&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=soat-11_soat-payment)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=soat-11_soat-payment&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=soat-11_soat-payment)
![CI](https://github.com/soat-11/soat-payment/actions/workflows/ci.yml/badge.svg)

## Description

API de pagamentos do sistema SOAT implementada com DDD, Clean Architecture e OpenTelemetry para observabilidade completa.

## Project setup

```bash
$ yarn install
```

## Compile and run the project

```bash
# production mode
$ yarn run start:prod
```

## Docker - Ambientes e Observabilidade

O projeto usa **Docker Compose moderno (v2.20+)** com `include` para carregar automaticamente todos os arquivos de serviços. Use os scripts npm/yarn ou comandos diretos com profiles:

### 🚀 Subir TUDO (App + MongoDB + Observabilidade Completa)

```bash
# Sobe: App, MongoDB single, Jaeger, Prometheus, Loki, Grafana
$ yarn docker:all
```

### 🔧 Desenvolvimento Básico (sem observabilidade)

```bash
# Apenas app + MongoDB single
$ yarn docker:dev
```

### 📊 Desenvolvimento com Observabilidade Completa

```bash
# App + MongoDB + OTEL Stack (Jaeger, Prometheus, Loki, Grafana)
$ yarn docker:dev:otel
```

### 🔁 Replica Set + Observabilidade

```bash
# App com MongoDB Replica Set + OTEL Stack
$ yarn docker:replica:otel
```

### 🔍 Apenas Stack de Observabilidade (para testes)

```bash
# Sobe apenas: OTEL Collector, Jaeger, Prometheus, Loki, Grafana
$ yarn docker:otel:only
```

### 📝 Ver logs dos containers

```bash
# Acompanhar logs de todos os containers em tempo real
$ yarn docker:logs
```

### ⏹️ Parar containers

```bash
# Parar todos os containers
$ yarn docker:down

# Parar e remover volumes (limpa dados)
$ yarn docker:down:volumes
```

> **Nota:** Todos os comandos `up` sobem em modo **detached** (`-d`), liberando o terminal. Use `yarn docker:logs` para ver os logs.

## 📊 Acessar Dashboards

Após subir com observabilidade (`docker:all` ou `docker:dev:otel`):

| Serviço           | URL                            | Descrição                               |
| ----------------- | ------------------------------ | --------------------------------------- |
| **API**           | http://localhost:3010          | Aplicação NestJS                        |
| **Swagger**       | http://localhost:3010/api/docs | Documentação da API                     |
| **Grafana**       | http://localhost:3001          | Visualização de logs, métricas e traces |
| **Jaeger**        | http://localhost:16686         | Distributed tracing                     |
| **Prometheus**    | http://localhost:9090          | Métricas                                |
| **Mongo Express** | http://localhost:8081          | Interface do MongoDB                    |

**Credenciais Grafana:** `admin` / `admin`

## 🔍 Observabilidade com OpenTelemetry

A aplicação possui **instrumentação automática** que captura:

- ✅ **Traces** - Requisições HTTP, queries de DB, propagação de contexto
- ✅ **Logs** - Correlacionados com trace_id/span_id via Pino
- ✅ **Métricas** - HTTP requests, latência, taxa de erro, métricas de sistema

### Arquitetura

```
App (NestJS)
   ↓ OTLP gRPC/HTTP
OTEL Collector
   ├→ Jaeger (traces)
   ├→ Prometheus (metrics)
   └→ Loki (logs)
```

Todos visualizados de forma unificada no **Grafana** com correlação automática entre traces e logs.

## Run tests
![coverage](image.png)
```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ yarn install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
