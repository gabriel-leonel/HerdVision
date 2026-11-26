# HerdVision — Monitoring Service (MS3)

Microsserviço de **monitoramento**: leituras dos animais, geração automática de alertas e o fluxo de tratamento dos alertas (RN01).

Assim como o herd-service, **não emite nem guarda usuários**: valida os JWTs do [auth-service](../auth-service/README.md) com a chave pública.

## Executar localmente

Rode o auth-service (porta 8000) e o herd-service (porta 8001) antes:

```bash
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate
mkdir -p storage/jwt && cp ../auth-service/storage/jwt/public.pem storage/jwt/public.pem
php artisan serve --port=8002
```

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `JWT_PUBLIC_KEY_PATH` / `JWT_PUBLIC_KEY` | Chave pública do auth-service (arquivo ou PEM inline com `\n`) |
| `JWT_ISSUER` | Igual ao `JWT_ISSUER` do auth-service |
| `JWT_LEEWAY` | Tolerância de relógio em segundos (padrão 10) |
| `CORS_ALLOWED_ORIGINS` / `CORS_ALLOWED_ORIGINS_PATTERNS` | Origens do frontend |
| `HERD_API_URL` | URL do herd-service, usada para confirmar o animal (padrão `http://localhost:8001`) |
| `HERD_API_TIMEOUT` | Timeout da chamada ao herd em segundos (padrão 5) |
| `SEED_DEMO_DATA` | `true` no container roda o seeder de demonstração na inicialização |

## Endpoints

Todos exigem `Authorization: Bearer <token>` e aceitam os perfis admin e user. Sem token: **401**.

### Leituras (`/api/readings`)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/readings` | Filtro `animal_id`; mais recentes primeiro; paginação |
| GET | `/api/readings/{id}` | Consulta uma leitura |
| POST | `/api/readings` | Registra e gera alertas. Resposta `201` com `{data, alerts_created}` |

Validação do POST: `animal_id` (precisa existir no herd-service), `recorded_at` (data/hora ISO 8601, não futura, tolerância de 1 min), `temperature` (30–45 °C), `activity_level` e `feeding_level` (0–100). Pelo menos um indicador é obrigatório.

**Validação entre serviços:** o monitoring chama `GET {HERD_API_URL}/api/animals/{id}` repassando o Bearer do usuário. Animal inexistente → **422** *"O animal informado não existe no rebanho."*; herd fora do ar, lento ou com erro → **503**, sem gravar a leitura. Não há FK entre os bancos.

### Regra de geração de alertas

Cada condição fora da referência gera um alerta `Pendente` ligado à leitura (limites em `config/monitoring.php`):

| Condição | Tipo | Gravidade |
|---|---|---|
| temperatura > 39,5 °C | `temperatura` | `alta` se ≥ 40,0; senão `média` |
| atividade < 40 | `atividade` | `alta` se < 25; senão `média` |
| alimentação < 40 | `alimentação` | `alta` se < 25; senão `média` |

Alertas indicam condições que merecem avaliação; não são diagnóstico veterinário.

### Alertas e RN01 (`/api/alerts`)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/alerts` | `search` (descrição/tipo), filtros `status`, `severity`, `animal_id`; mais recentes primeiro. `meta.total` alimenta os contadores do frontend |
| GET | `/api/alerts/{id}` | Alerta + `history: [{from, to, user_name, changed_at}]` |
| PATCH | `/api/alerts/{id}/status` | Body `{"status": "..."}`. Só a **próxima** etapa: `Pendente` → `Em análise` → `Resolvido`. Pular, voltar ou repetir → **422** *Transição de status inválida: de "X" para "Y".* |
| POST | `/api/alerts/{id}/reopen` | Reabertura explícita, só de `Resolvido` para `Pendente`; outro status → **422** |

Alertas não são criados, editados nem excluídos manualmente: nascem das leituras. Cada mudança de status (inclusive a criação) grava uma linha em `alert_status_changes` com o usuário do JWT (`sub` e `name`).

## Documentação da API (Swagger/OpenAPI)

Gerada automaticamente pelo [Scramble](https://scramble.dedoc.co) a partir das rotas, Form Requests e Resources (OpenAPI 3.1). Pública, sem login:

| Ambiente | Interface | Especificação JSON |
|---|---|---|
| Local | http://localhost:8002/docs/api | http://localhost:8002/docs/api.json |
| Produção | https://MONITORING-SERVICE.onrender.com/docs/api | https://MONITORING-SERVICE.onrender.com/docs/api.json |

Para testar pela interface, use **Authorize** com o `access_token` de `POST /api/auth/login` (auth-service). As respostas 401/403 dos middlewares `jwt`/`role` também são documentadas.

## Dados de demonstração

`php artisan db:seed` cria leituras para os animais **1 a 12** do seed do herd-service e alertas em todos os status (incluindo um reaberto), passando pela regra e pelo fluxo reais. Idempotente.

## Banco de dados

SQLite próprio, sem FK para outros serviços (`animal_id` é um ID lógico do herd).

| Tabela | Observações |
|---|---|
| `monitoring_readings` | Leituras; indicadores numéricos e opcionais |
| `alerts` | `monitoring_reading_id` com `nullOnDelete`; `status` fora do `$fillable` |
| `alert_status_changes` | Histórico de status (`from_status`, `to_status`, `user_id`, `user_name`, `created_at`) |

Testes: `php artisan test` · Estilo: `vendor/bin/pint --test`
