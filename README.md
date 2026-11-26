# HerdVision

[![CI](https://github.com/gabriel-leonel/HerdVision/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/gabriel-leonel/HerdVision/actions/workflows/ci.yml)

Plataforma web de **pecuária de precisão** para acompanhar o rebanho: lotes, animais, protocolos de manejo, leituras de monitoramento (temperatura, atividade, alimentação) e uma central de alertas com fluxo de tratamento.

**Público-alvo:** propriedades de corte e de leite, de 200 a 2.000 animais, que precisam enxergar rapidamente quais animais exigem atenção e registrar o que foi feito.

Trabalho acadêmico (MVP), versão final **`v1.0`**.

## Sumário

1. [Acesso](#acesso)
2. [Arquitetura](#arquitetura)
3. [Tecnologias](#tecnologias)
4. [Execução local](#execução-local)
5. [Documentação da API](#documentação-da-api)
6. [Testes](#testes)
7. [CI/CD](#cicd)
8. [Checklist de avaliação](#checklist-de-avaliação)
9. [Uso de IA](#uso-de-ia)
10. [Equipe e licença](#equipe-e-licença)

## Acesso

**Aplicação:** https://herdvision-frontend.vercel.app

| Perfil | E-mail | Senha |
|---|---|---|
| admin | `admin@herdvision.com` | `Admin@1234` |
| user | `user@herdvision.com` | `User@1234` |

Também é possível criar uma conta em **Cadastro** (sempre com perfil `user`).

> [!NOTE]
> - Os serviços rodam no plano gratuito do Render: depois de um tempo parados, o **primeiro acesso pode levar até 1 minuto**.
> - O banco SQLite de cada serviço é **efêmero**: a cada deploy ou reinício os dados voltam ao seed de demonstração (3 lotes, 12 animais, 5 protocolos, leituras e alertas). O que for criado durante um teste pode sumir.

| Serviço | URL | Saúde |
|---|---|---|
| auth-service | https://auth-service-od2h.onrender.com | [`/up`](https://auth-service-od2h.onrender.com/up) |
| herd-service | https://herd-service-dy54.onrender.com | [`/up`](https://herd-service-dy54.onrender.com/up) |
| monitoring-service | https://monitoring-service-gm4u.onrender.com | [`/up`](https://monitoring-service-gm4u.onrender.com/up) |

## Arquitetura

```text
                        ┌──────────────────────────────┐
                        │  Frontend (React + Vite)     │
                        │  Vercel · 11 telas           │
                        └──────┬──────────┬──────────┬─┘
                  login/cadastro│  Bearer  │  Bearer  │
                               ▼          ▼          ▼
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────────┐
│ auth-service (MS1)   │ │ herd-service (MS2)   │ │ monitoring-service (MS3) │
│ usuários, perfis,    │ │ lotes, animais,      │ │ leituras, alertas, RN01, │
│ emite o JWT (RS256)  │ │ protocolos, N:N      │ │ histórico de status      │
│ chave privada        │ │ chave pública        │ │ chave pública            │
│ SQLite               │ │ SQLite               │ │ SQLite                   │
└──────────────────────┘ └──────────────────────┘ └────────────┬─────────────┘
                                   ▲                           │
                                   └─── GET /api/animals/{id} ─┘
                                        (valida o animal da leitura)
```

- **auth-service** (porta 8000): cadastro, login, logout, `me` e listagem de usuários (admin). É o **único que assina** tokens, com a chave privada RSA.
- **herd-service** (porta 8001): CRUD de lotes, animais e protocolos de manejo, e a associação animal ↔ protocolo.
- **monitoring-service** (porta 8002): leituras de monitoramento, geração automática de alertas e o fluxo de status **RN01** (Pendente → Em análise → Resolvido, com reabertura e histórico).
- **JWT RS256:** herd e monitoring validam o token com a **chave pública**; o perfil (`admin`/`user`) vem do token.
- **Comunicação entre serviços:** ao registrar uma leitura, o monitoring consulta o herd com o token do usuário para validar o `animal_id` (animal inexistente → 422; herd fora do ar → 503).
- **Banco:** um SQLite por serviço, sem chave estrangeira entre serviços (`animal_id` no monitoring é um ID lógico).

### Estrutura do repositório

```text
.github/workflows/ci.yml        CI/CD (testes + deploy)
HerdVision_backend/services/
  auth-service/                 MS1 — Laravel 13
  herd-service/                 MS2 — Laravel 13
  monitoring-service/           MS3 — Laravel 13
HerdVision_frontend/            React + Vite + TypeScript
insomnia/                       coleção de requisições da API
herdvision_planning.md          planejamento (RF, RNF, entidades, telas, RN01)
release-*.md                    escopo de cada release e roteiro de testes E2E
```

## Tecnologias

| Camada | Tecnologias |
|---|---|
| Backend | PHP 8.3, Laravel 13, firebase/php-jwt (RS256), SQLite |
| Frontend | React 18, TypeScript 5, Vite 5, React Router 6 (sem biblioteca de UI) |
| Documentação da API | Scramble (OpenAPI 3.1 / Swagger UI) |
| Testes | PHPUnit, Laravel Pint, Vitest, Playwright (E2E) |
| Deploy | Render (backend, Docker), Vercel (frontend) |
| CI/CD | GitHub Actions |

## Execução local

**Pré-requisitos:** PHP 8.3 (extensões `pdo_sqlite` e `openssl`), Composer 2, Node 20+ e npm.

Rode os serviços nesta ordem, cada um em um terminal. O auth-service vem primeiro porque gera o par de chaves do JWT.

```bash
# 1) auth-service — http://localhost:8000
cd HerdVision_backend/services/auth-service
composer install
cp .env.example .env && php artisan key:generate
touch database/database.sqlite
php artisan jwt:generate-keys          # storage/jwt/private.pem e public.pem
php artisan migrate --seed             # cria admin@herdvision.com e user@herdvision.com
php artisan serve --port=8000
```

```bash
# 2) herd-service — http://localhost:8001
cd HerdVision_backend/services/herd-service
composer install
cp .env.example .env && php artisan key:generate
touch database/database.sqlite
mkdir -p storage/jwt && cp ../auth-service/storage/jwt/public.pem storage/jwt/
php artisan migrate --seed             # 3 lotes, 12 animais, 5 protocolos
php artisan serve --port=8001
```

```bash
# 3) monitoring-service — http://localhost:8002
cd HerdVision_backend/services/monitoring-service
composer install
cp .env.example .env && php artisan key:generate
touch database/database.sqlite
mkdir -p storage/jwt && cp ../auth-service/storage/jwt/public.pem storage/jwt/
php artisan migrate --seed             # leituras e alertas dos animais do seed
php artisan serve --port=8002
```

```bash
# 4) frontend — http://localhost:5173
cd HerdVision_frontend
npm install
cp .env.example .env                   # URLs dos três serviços (padrão: localhost)
npm run dev
```

Sem backend, o frontend também roda em **modo demonstração**, com uma API simulada no navegador: `npm run dev:mock` (usuários `admin@herdvision.dev` e `usuario@herdvision.dev`, senha `herdvision123`).

Variáveis de ambiente e detalhes de cada parte:
[auth-service](HerdVision_backend/services/auth-service/README.md) ·
[herd-service](HerdVision_backend/services/herd-service/README.md) ·
[monitoring-service](HerdVision_backend/services/monitoring-service/README.md) ·
[frontend](HerdVision_frontend/README.md)

## Documentação da API

Swagger gerado pelo Scramble a partir das rotas, Form Requests e Resources. Público, sem login.

| Serviço | Swagger UI | OpenAPI (JSON) |
|---|---|---|
| auth-service | [/docs/api](https://auth-service-od2h.onrender.com/docs/api) | [/docs/api.json](https://auth-service-od2h.onrender.com/docs/api.json) |
| herd-service | [/docs/api](https://herd-service-dy54.onrender.com/docs/api) | [/docs/api.json](https://herd-service-dy54.onrender.com/docs/api.json) |
| monitoring-service | [/docs/api](https://monitoring-service-gm4u.onrender.com/docs/api) | [/docs/api.json](https://monitoring-service-gm4u.onrender.com/docs/api.json) |

Localmente, o mesmo caminho em `http://localhost:8000`, `:8001` e `:8002`.

A coleção do Insomnia em [insomnia/herdvision-r3.insomnia.json](insomnia/herdvision-r3.insomnia.json) tem as requisições dos três serviços, com ambientes local e produção.

## Testes

| Suíte | Comando | Testes |
|---|---|---|
| auth-service | `php artisan test` | 47 |
| herd-service | `php artisan test` | 161 |
| monitoring-service | `php artisan test` | 126 |
| frontend | `npm test` (Vitest) | 21 |
| **Total** | | **355** |

Os testes do backend usam SQLite em memória e geram um par RSA efêmero, então não precisam de banco nem de chaves. O estilo do PHP é verificado com `vendor/bin/pint --test`, e o TypeScript com `npm run typecheck`.

**Testes E2E:** o roteiro [release-3-testes-e2e.md](release-3-testes-e2e.md) tem **87 casos** (telas, permissões, RN01 e chamadas diretas à API), executados com o Playwright contra a produção. Última rodada: **87/87**.

## CI/CD

O workflow [CI](.github/workflows/ci.yml) roda em cada push e pull request na `main`:

```text
push / PR na main
  ├─ backend (matriz): auth · herd · monitoring
  │     composer install → .env + key:generate → pint --test → php artisan test
  ├─ frontend: npm ci → typecheck → npm test → build
  └─ deploy-frontend (só push na main, depois dos dois jobs acima)
        vercel pull → vercel build --prod → vercel deploy --prebuilt --prod
```

- **Render:** os três serviços usam *Auto-Deploy: After CI Checks Pass*. Só implantam quando os checks do commit estão verdes.
- **Vercel:** o deploy pela integração com o Git está desligado (`"git": { "deploymentEnabled": false }` em [vercel.json](HerdVision_frontend/vercel.json)); a produção só é publicada pelo job `deploy-frontend`.

Um teste quebrado deixa o commit vermelho: nada é publicado em nenhum dos quatro destinos.

**Evidências:**
- Execução vermelha (teste quebrado, sem deploy): _link a preencher_
- Execução verde (com deploy): _link a preencher_

## Checklist de avaliação

### Métrica mínima

| Critério | Situação | Evidência |
|---|---|---|
| RNF11 · ≥ 8 telas | ✅ 11 telas | Login, Cadastro, Painel, Animais (lista, formulário, detalhe), Lotes (lista, formulário), Protocolos, Central de alertas, Usuários |
| RNF12 · ≥ 4 entidades além de Usuário | ✅ 6 | Lote, Animal, Protocolo de manejo, Animal ↔ Protocolo, Leitura de monitoramento, Alerta (+ histórico de status) |
| RNF13 · ≥ 3 CRUDs completos pela interface | ✅ 3 | Lotes (`/lotes`), Animais (`/animais`), Protocolos (`/protocolos`) |
| RNF14 · Relacionamento 1:N | ✅ | Lote → Animais (`animals.lot_id`; excluir lote com animais → 409) |
| RNF15 · Relacionamento N:N | ✅ | Animais ↔ Protocolos (`/api/animal-protocols`, tela do animal) |
| RNF16 · Regra de negócio além do CRUD | ✅ | RN01: alertas gerados por leituras fora da faixa e fluxo Pendente → Em análise → Resolvido, com reabertura e histórico (`PATCH /api/alerts/{id}/status`, `POST /api/alerts/{id}/reopen`) |
| RNF17 · Busca e paginação | ✅ | `search` e `per_page` em todas as listagens; campos de busca e paginação nas telas de lotes, animais, protocolos, alertas e usuários |
| RNF18 · Cadastro, JWT e perfis | ✅ | `POST /api/auth/register`, JWT RS256, perfis `admin`/`user` (ex.: excluir e `GET /api/users` só admin → 403 para `user`) |
| RNF19 · ≥ 2 testes automatizados | ✅ 355 | 334 no backend + 21 no frontend, rodando no CI |
| RNF20 · Login social | ❌ fora do escopo | Removido por decisão da equipe na Release 3; no enunciado é ponto de complexidade opcional |
| RNF21 · Deploy na Vercel | ✅ | https://herdvision-frontend.vercel.app |
| RNF22 · Deploy automático (extra) | ✅ | Workflow CI: deploy só depois dos testes, no Render e na Vercel |

### Pontos de complexidade

| Item | Pontos | Evidência |
|---|---|---|
| Backend em microsserviços | 3 | auth, herd e monitoring, publicados separadamente no Render ([Arquitetura](#arquitetura)) |
| Testes automatizados (mín. 10) | 2 | 355 testes ([Testes](#testes)) |
| Documentação da API (Swagger/OpenAPI) | 1 | `/docs/api` nos três serviços ([links](#documentação-da-api)) |
| CI/CD: deploy automático a cada push | 3 | [workflow CI](.github/workflows/ci.yml) + deploy condicionado ([CI/CD](#cicd)) |
| **Total** | **9** | mínimo exigido: 8 |

## Uso de IA

A equipe usou o **Claude** (Anthropic), principalmente pelo **Claude Code** no terminal e no VS Code, como assistente em todas as etapas. Toda saída da IA foi revisada pela equipe antes de entrar no repositório; as decisões de produto e de escopo foram da equipe.

| Etapa | Como a IA foi usada | O que a equipe revisou ou decidiu |
|---|---|---|
| Planejamento | Redação dos documentos de escopo (`herdvision_planning.md`, `release-*.md`): requisitos, entidades, matriz de permissões, divisão em releases e riscos. | Escopo de cada release, prioridades, cortes (ex.: login social e persistência real fora do produto) e critérios de aceite. |
| Desenvolvimento | Geração e refatoração de código dos três serviços Laravel (rotas, Form Requests, Resources, middlewares JWT, RN01) e das telas React, seguindo o `DESIGN.md`. | Leitura de cada mudança, padrões de API, mensagens em pt_BR e permissões por perfil. |
| Testes | Escrita dos testes PHPUnit e Vitest, e execução do roteiro E2E com o Playwright (via MCP) contra a produção, com registro dos resultados. | Casos do roteiro, análise dos achados e decisão do que corrigir. |
| Deploy e CI/CD | Dockerfiles, configuração do Render e da Vercel, e o workflow do GitHub Actions. | Variáveis e segredos de produção (configurados pela equipe) e validação do deploy. |
| Documentação | READMEs, Swagger (anotações para o Scramble), coleção do Insomnia e este README. | Conteúdo e precisão das instruções. |

## Equipe e licença

| Integrante | Papel |
|---|---|
| Gabriel Leonel | Product Owner |
| João Mateus | Frontend |
| Lucas Winicius | Backend |
| Caio Cunha | Banco de dados e deploy |

Licença [MIT](LICENSE).
