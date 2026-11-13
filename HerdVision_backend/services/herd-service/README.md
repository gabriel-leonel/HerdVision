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

## Banco de dados

SQLite próprio (`database/database.sqlite`), sem chaves estrangeiras para outros serviços.

| Tabela | Observações |
|---|---|
| `lots` | Lotes |
| `animals` | `lot_id` obrigatório; excluir um lote com animais é bloqueado |
| `management_protocols` | Protocolos de manejo (`active` padrão `true`) |
| `animal_management_protocol` | N:N com **id próprio**: o mesmo protocolo pode ser aplicado várias vezes ao mesmo animal |

Testes: `php artisan test` · Estilo: `vendor/bin/pint --test`
