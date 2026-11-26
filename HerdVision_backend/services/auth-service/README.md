# HerdVision — Auth Service (MS1)

Microsserviço de **identidade**: cadastro, login, emissão de **JWT (RS256)**, perfis (`admin` / `user`) e gestão de usuários.

## Executar localmente

```bash
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan jwt:generate-keys      # gera storage/jwt/private.pem e public.pem
php artisan migrate --seed
php artisan serve                  # http://localhost:8000
```

Testes: `php artisan test` · Estilo: `vendor/bin/pint --test`

## Usuários de demonstração (seeder)

| Perfil | E-mail | Senha |
|---|---|---|
| admin | `admin@herdvision.com` | `Admin@1234` |
| user | `user@herdvision.com` | `User@1234` |

> Senhas públicas, somente para ambiente local/avaliação. Não execute o seeder em produção.

No container (Docker/Render), defina `SEED_DEMO_USERS=true` para o `docker-entrypoint.sh` rodar o seeder a cada inicialização. Ele é idempotente: só cria os usuários que ainda não existem.

## Endpoints

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/api/auth/register` | público | Cria conta (sempre com perfil `user`) e devolve o JWT |
| POST | `/api/auth/login` | público | Autentica e devolve o JWT |
| GET | `/api/auth/me` | autenticado | Dados do usuário logado |
| POST | `/api/auth/logout` | autenticado | Revoga o token atual |
| GET | `/api/users` | **admin** | Lista usuários. Query: `search`, `role`, `per_page` (1–100) |

Autenticação: `Authorization: Bearer <access_token>`. Registro e login têm limite de 10 requisições/minuto.

Resposta de `register`/`login`:

```json
{
  "user": { "id": 1, "name": "…", "email": "…", "role": "user", "created_at": "…" },
  "access_token": "eyJ…",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

## Como o JWT funciona

- **Assinatura RS256**: só o auth-service tem a **chave privada** e emite tokens.
  Os demais microsserviços (herd, monitoring) precisam apenas da **chave pública** (`storage/jwt/public.pem`) para validar a assinatura localmente.
- Claims: `iss`, `sub` (id do usuário), `role`, `name`, `email`, `iat`, `nbf`, `exp`, `jti`.
- O algoritmo é fixado no servidor (o `alg` do header do token não é confiável).
- Dentro do auth-service, o **perfil é lido do banco**, não do claim — rebaixar/excluir um usuário vale imediatamente.
- **Logout** coloca o `jti` em uma lista de revogação (cache) até o token expirar.
  Limitação: os outros serviços validam só assinatura/expiração e não enxergam essa lista; por isso o TTL é curto (`JWT_TTL`, padrão 60 min).

### Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `JWT_PRIVATE_KEY_PATH` / `JWT_PUBLIC_KEY_PATH` | Caminho dos PEM (relativo à raiz do projeto ou absoluto) |
| `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` | Alternativa: conteúdo PEM na variável (`\n` nas quebras). Tem precedência sobre o caminho |
| `JWT_ISSUER` | Valor do claim `iss` (padrão: `APP_URL`). Deve ser igual em todos os serviços |
| `JWT_TTL` | Validade em minutos (padrão 60) |
| `JWT_LEEWAY` | Tolerância de relógio em segundos (padrão 10) |
| `CORS_ALLOWED_ORIGINS` | Origens do frontend, separadas por vírgula (padrão `http://localhost:5173`) |

`storage/jwt/` está no `.gitignore`: **nunca versione a chave privada**.

Os demais serviços validam o token com a **chave pública** (`storage/jwt/public.pem`) e devem usar o mesmo `JWT_ISSUER` (veja o README do [herd-service](../herd-service/README.md)).
