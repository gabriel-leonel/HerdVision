# HerdVision — Herd Service (MS2)

Microsserviço de **gestão do rebanho**: lotes, animais, protocolos de manejo e a associação entre animais e protocolos.

Este serviço **não emite nem guarda usuários**: ele apenas valida os JWTs emitidos pelo [auth-service](../auth-service/README.md).

## Executar localmente

Rode o **auth-service primeiro** (ele gera o par de chaves) e depois:

```bash
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate
php artisan serve --port=8001
```

### Passo obrigatório: chave pública do JWT

Para validar tokens, este serviço precisa da **chave pública** do auth-service. Copie o arquivo (a chave **privada** nunca deve sair do auth-service):

```bash
mkdir -p storage/jwt
cp ../auth-service/storage/jwt/public.pem storage/jwt/public.pem
```

Alternativa, útil em deploy: coloque o conteúdo do PEM na variável `JWT_PUBLIC_KEY` do `.env`, em uma linha, com `\n` nas quebras (ela tem precedência sobre o arquivo).

Sem a chave, as rotas protegidas respondem **500** com a mensagem *"Chave pública JWT não encontrada…"* (erro de configuração, e não 401).

`storage/jwt/` está no `.gitignore`.

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `JWT_PUBLIC_KEY_PATH` | Caminho do PEM público (relativo à raiz do projeto ou absoluto). Padrão: `storage/jwt/public.pem` |
| `JWT_PUBLIC_KEY` | Alternativa: conteúdo PEM na variável (`\n` nas quebras). Tem precedência sobre o caminho |
| `JWT_ISSUER` | Deve ser **igual** ao `JWT_ISSUER` do auth-service (por padrão, o `APP_URL` **dele**, `http://localhost:8000`). Não use o `APP_URL` deste serviço |
| `JWT_LEEWAY` | Tolerância de relógio em segundos (padrão 10) |
| `CORS_ALLOWED_ORIGINS` | Origens do frontend, separadas por vírgula (padrão `http://localhost:5173`) |

## Autenticação nas rotas

Envie `Authorization: Bearer <access_token>` (obtido em `POST /api/auth/login` no auth-service).

- Middleware `jwt`: valida assinatura (RS256), expiração, emissor e `sub`. Falhas respondem **401**.
- Middleware `role:admin` (ou `role:admin,user`): restringe por perfil. Perfil não permitido responde **403**.

### Limitações conhecidas

- O **perfil (`role`) vem do token** e vale até ele expirar. No auth-service o perfil é lido do banco; aqui não há banco de usuários.
- O **logout** revoga o token só no auth-service. Este serviço não enxerga a lista de revogação, então um token já revogado continua aceito aqui até expirar. O TTL do token é curto (`JWT_TTL`, padrão 60 min no auth-service).

## Endpoints

Todos exigem `Authorization: Bearer <token>`. Respostas de erro seguem `{"message": "..."}` (e `errors` nos 422).

Matriz de permissões: consultar = admin e user · criar/editar = admin e user · **excluir lote, animal e protocolo = só admin**. Listagens aceitam `per_page` (1–100, padrão 15) e devolvem paginação do Laravel (`data`, `links`, `meta`).

### Lotes (`/api/lots`)

| Método | Rota | Quem pode | Descrição |
|---|---|---|---|
| GET | `/api/lots` | admin, user | `search` (nome/descrição). Cada lote traz `animals_count` |
| GET | `/api/lots/{id}` | admin, user | Consulta um lote |
| POST | `/api/lots` | admin, user | `name` (obrigatório, máx. 255), `description` (opcional) |
| PUT/PATCH | `/api/lots/{id}` | admin, user | Atualização parcial (`"description": null` limpa) |
| DELETE | `/api/lots/{id}` | **admin** | 204. Lote com animais → **409** com `animals_count` |

### Animais (`/api/animals`)

| Método | Rota | Quem pode | Descrição |
|---|---|---|---|
| GET | `/api/animals` | admin, user | `search` (identificação, nome, raça), filtros `lot_id` e `status`. Traz `lot: {id, name}` |
| GET | `/api/animals/{id}` | admin, user | Consulta um animal |
| POST | `/api/animals` | admin, user | `identification` (obrigatório, único), `species` (`Bovino`, `Bubalino`, `Ovino`, `Caprino`, `Equino`), `status` (`ativo`, `em tratamento`, `inativo`), `lot_id` (existente), `birth_date` (`AAAA-MM-DD`, não futura), `name`/`breed` opcionais |
| PUT/PATCH | `/api/animals/{id}` | admin, user | Atualização parcial |
| DELETE | `/api/animals/{id}` | **admin** | 204. Apaga junto as aplicações de protocolo; leituras e alertas do monitoring ficam preservados |

### Protocolos de manejo (`/api/protocols`)

| Método | Rota | Quem pode | Descrição |
|---|---|---|---|
| GET | `/api/protocols` | admin, user | `search` (nome/descrição), filtros `type` e `active` (`true`/`false`). Traz `animals_count` (animais distintos) |
| GET | `/api/protocols/{id}` | admin, user | Consulta um protocolo |
| POST | `/api/protocols` | admin, user | `name`, `type` (`sanitário`, `nutricional`, `reprodutivo`), `description`, `active` (padrão `true`) |
| PUT/PATCH | `/api/protocols/{id}` | admin, user | Atualização parcial. Desativar = `"active": false` |
| DELETE | `/api/protocols/{id}` | **admin** | 204. Protocolo já aplicado → **409** (desative em vez de excluir) |

### Associação animal ↔ protocolo (`/api/animal-protocols`)

| Método | Rota | Quem pode | Descrição |
|---|---|---|---|
| GET | `/api/animal-protocols` | admin, user | Filtros `animal_id` e `management_protocol_id`; mais recentes primeiro. Traz `animal` e `protocol` |
| POST | `/api/animal-protocols` | admin, user | `animal_id`, `management_protocol_id`, `start_date`, `status` (`em andamento`, `concluído`). Protocolo **inativo → 422** |
| PATCH | `/api/animal-protocols/{id}` | admin, user | Só `start_date` e `status` (concluir/reabrir) |
| DELETE | `/api/animal-protocols/{id}` | admin, user | Desvincula (não apaga animal nem protocolo) |

Códigos: `401` sem token ou token inválido · `403` perfil sem permissão · `404` inexistente · `409` exclusão bloqueada · `422` validação.

## Documentação da API (Swagger/OpenAPI)

Gerada automaticamente pelo [Scramble](https://scramble.dedoc.co) a partir das rotas, Form Requests e Resources (OpenAPI 3.1). Pública, sem login:

| Ambiente | Interface | Especificação JSON |
|---|---|---|
| Local | http://localhost:8001/docs/api | http://localhost:8001/docs/api.json |
| Produção | https://herd-service-dy54.onrender.com/docs/api | https://herd-service-dy54.onrender.com/docs/api.json |

Para testar pela interface, use **Authorize** com o `access_token` de `POST /api/auth/login` (auth-service). As respostas 401/403 dos middlewares `jwt`/`role` também são documentadas.

## Dados de demonstração

`php artisan db:seed` cria 3 lotes, 12 animais (IDs **1 a 12**), 5 protocolos (1 inativo) e 10 aplicações. É idempotente (não faz nada se já houver lotes). No container, defina `SEED_DEMO_DATA=true`. O seed do monitoring-service usa esses IDs de animais.

## Banco de dados

SQLite próprio (`database/database.sqlite`), sem chaves estrangeiras para outros serviços.

| Tabela | Observações |
|---|---|
| `lots` | Lotes |
| `animals` | `lot_id` obrigatório; excluir um lote com animais é bloqueado |
| `management_protocols` | Protocolos de manejo (`active` padrão `true`) |
| `animal_management_protocol` | N:N com **id próprio**: o mesmo protocolo pode ser aplicado várias vezes ao mesmo animal |

Testes: `php artisan test` · Estilo: `vendor/bin/pint --test`
