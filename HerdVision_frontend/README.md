# HerdVision — Frontend

Aplicação web da HerdVision (React 18 + TypeScript + Vite + React Router). Segue o [DESIGN.md](DESIGN.md) (tokens, componentes e as 11 telas) e consome os três microsserviços descritos em `herdvision_planning.md` e `release-2-fundacao.md`.

## Executar

```bash
npm install
cp .env.example .env      # ajuste as URLs dos serviços, se necessário
npm run dev               # http://localhost:5173 (origem liberada no CORS dos serviços)
```

### Modo demonstração (sem backend)

```bash
npm run dev:mock
```

Usa um backend simulado no navegador (dados em `localStorage`) que reproduz os contratos da API: paginação do Laravel, erros `{message, errors}`, 401/403/404/409/422/429 e a regra RN01. Usuários: `admin@herdvision.dev` e `usuario@herdvision.dev`, senha `herdvision123`. No build `live` esse código é removido do bundle.

## Variáveis de ambiente

| Variável | Padrão | Uso |
|---|---|---|
| `VITE_API_MODE` | `live` | `live` consome os serviços; `mock` usa o backend simulado |
| `VITE_AUTH_API_URL` | `http://localhost:8000` | auth-service (login, cadastro, logout, usuários) |
| `VITE_HERD_API_URL` | `http://localhost:8001` | herd-service (lotes, animais, protocolos) |
| `VITE_MONITORING_API_URL` | `http://localhost:8002` | monitoring-service (leituras, alertas) |

## Scripts

| Script | O que faz |
|---|---|
| `npm run dev` / `dev:mock` | Servidor de desenvolvimento |
| `npm run build` / `build:mock` | Type-check + build de produção em `dist/` |
| `npm run typecheck` | Só o TypeScript |
| `npm test` | Testes (Vitest): formatação pt-BR, RN01, paginação e backend simulado |

## Rotas da API

Rotas existentes (✅) e previstas (🕓) ficam centralizadas em [src/api/client.ts](src/api/client.ts). Quando o backend publicar as previstas com outro caminho, ajuste só esse arquivo.

| Recurso | Rota | Situação |
|---|---|---|
| Auth | `POST /api/auth/login`, `/register`, `/logout` | ✅ |
| Usuários (admin) | `GET /api/users?search&role&per_page` | ✅ |
| Lotes | `GET/POST /api/lots`, `GET/PATCH/DELETE /api/lots/{id}` | ✅ |
| Animais | `/api/animals` (CRUD, filtros `search`, `lot_id`, `status`) | 🕓 |
| Protocolos | `/api/protocols` (CRUD, filtro `type`) | 🕓 |
| Animal ↔ protocolo | `/api/animal-protocols` (filtros `animal_id`, `management_protocol_id`) | 🕓 |
| Leituras | `GET/POST /api/readings`, `GET /api/readings/{id}` | 🕓 |
| Alertas | `GET /api/alerts`, `PATCH /api/alerts/{id}/status`, `POST /api/alerts/{id}/reopen` | 🕓 |

No modo `live`, telas cujo endpoint ainda não existe mostram "Recurso ainda não disponível" em vez de quebrar.

## Estrutura

```
src/
  api/          clientes por recurso, tipos, consultas cruzadas e backend simulado (mock/)
  auth/         sessão JWT, rotas protegidas
  components/   componentes do DESIGN.md §6 (botões, campos, badges, tabela, diálogo…)
  layouts/      barra lateral (área autenticada) e painel de marca (Login/Cadastro)
  lib/          cliente HTTP, formatação pt-BR, mapeamentos semânticos (§8)
  pages/        as 11 telas
  styles/       tokens, base, componentes e layout
```

## Decisões e pontos a confirmar

- **Sessão:** o token (`access_token`) e o usuário ficam em `localStorage`; a sessão expira em `expires_in` ou em qualquer 401, voltando ao Login com "Sua sessão expirou".
- **Permissões na interface:** excluir (lotes, animais, protocolos) e o menu Usuários só aparecem para `admin`. O backend continua sendo a fonte da verdade.
- **Valores a confirmar** (DESIGN.md §13.2), centralizados em [src/lib/semantics.ts](src/lib/semantics.ts): `animals.status` (`ativo`, `em tratamento`, `inativo`), tipos de protocolo, status da associação, faixa de temperatura (37,5–39,5 °C) e limite de atividade/alimentação (40).
- **Histórico do alerta:** exibido se a API devolver `history`; caso contrário, mostra criação e última alteração.
- **Login social:** fora do escopo do produto (decisão da Release 3); entrada só por e-mail e senha.
- **Deploy (Vercel):** `vercel.json` redireciona todas as rotas para o `index.html` (SPA).
