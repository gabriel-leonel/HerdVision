# HerdVision --- Release 3 (Encontro 3): Funcionalidades

## 1. Objetivo da release

Concluir as funcionalidades de negócio do HerdVision sobre a fundação
entregue na Release 2 (`v0.2`), deixando o produto completo em termos
de dados, regras e telas.

A Release 3 deve entregar todos os CRUDs obrigatórios e seus
relacionamentos, os perfis de acesso aplicados no backend, a regra de
negócio principal (RN01 --- fluxo de tratamento de alertas), busca/filtro
e paginação, as telas mínimas funcionando contra a API real e pelo menos
metade dos pontos de complexidade.

O frontend já foi construído contra os contratos previstos (modo mock).
O trabalho desta release é, portanto, majoritariamente de **backend**:
expor no herd-service e no monitoring-service as rotas que as telas já
consomem, publicar o monitoring-service e ligar o frontend a ele.

## 2. Escopo e requisitos da Release 3

  --------------------------------------------------------------------------
  ID                Requisito          Descrição         Critério de aceite
  ----------------- ------------------ ----------------- -------------------
  R3-01             CRUD de Animais    Expor no Herd     Criar, listar,
                                       Service o CRUD    consultar, editar e
                                       completo de       excluir animais
                                       animais, com      pela interface, com
                                       vínculo           persistência no
                                       obrigatório a um  banco.
                                       lote (1:N).       

  R3-02             CRUD de Protocolos Expor no Herd     Criar, listar,
                    de Manejo          Service o CRUD    consultar, editar,
                                       completo de       desativar e excluir
                                       protocolos.       protocolos pela
                                                         interface.

  R3-03             Associação         Expor a API da    É possível aplicar
                    Animal ↔ Protocolo tabela            um protocolo a um
                    (N:N)              `animal_manage-   animal (pela tela
                                       ment_protocol`.   do animal e pela
                                                         do protocolo),
                                                         concluir/reabrir e
                                                         desvincular.

  R3-04             Monitoring Service Criar a API do    O monitoring-
                    no ar              terceiro          service valida o
                                       microsserviço,    JWT, responde em
                                       com JWT, CORS e   URL pública e o
                                       deploy.           frontend o consome.

  R3-05             Leituras de        Registrar e       O registro de
                    monitoramento      consultar         leitura pela tela
                                       leituras por      do animal persiste
                                       animal.           e aparece no
                                                         histórico.

  R3-06             Geração de alertas Ao registrar uma  Uma leitura fora da
                                       leitura, aplicar  referência gera
                                       regras simples    alerta `Pendente`
                                       que criam         com tipo, gravidade
                                       alertas.          e descrição.

  R3-07             Regra de negócio   Implementar as    Transições válidas
                    RN01               transições        são aceitas;
                                       `Pendente` →      inválidas recebem
                                       `Em análise` →    422; a reabertura
                                       `Resolvido` e a   só funciona a
                                       reabertura        partir de
                                       explícita.        `Resolvido`.

  R3-08             Histórico de       Registrar cada    O detalhe do alerta
                    status do alerta   mudança de status mostra quem mudou,
                                       com data e        de qual status para
                                       usuário.          qual e quando.

  R3-09             Perfis e rotas     Aplicar a matriz  Requisições sem
                    protegidas         de permissões     token recebem 401;
                                       (§5) em todos os  perfil sem
                                       endpoints dos     permissão recebe
                                       três serviços.    403, mesmo
                                                         chamando a API
                                                         diretamente.

  R3-10             Busca, filtro e    Oferecer busca e  Listagens de
                    paginação          filtros nas       animais,
                                       listagens, com    protocolos,
                                       paginação do      alertas, lotes e
                                       Laravel.          usuários filtram e
                                                         paginam pela API.

  R3-11             Telas mínimas      As telas          Nenhuma tela exibe
                                       planejadas        "Recurso ainda não
                                       funcionam contra  disponível" no
                                       a API real.       ambiente publicado.

  R3-12             Remoção do Google  Retirar os botões Login e cadastro
                    SSO                "Entrar/Cadastrar não exibem mais
                                       com Google".      opção de login
                                                         social.

  R3-13             Pontos de          Concluir pelo     Pelo menos 4 pontos
                    complexidade       menos metade dos  funcionando na
                                       pontos (§10).     demonstração.

  R3-14             Testes             Cobrir os novos   `php artisan test`
                    automatizados      endpoints e a     passa nos três
                                       RN01 com testes.  serviços e
                                                         `npm test` passa no
                                                         frontend.

  R3-15             Versionamento da   Registrar a       Existe uma tag
                    release            entrega com tag   `v0.3` apontando
                                       Git.              para o commit da
                                                         Release 3.

  R3-16             Demonstração       Preparar a        A equipe demonstra
                                       demonstração ao   os fluxos com os
                                       vivo.             perfis admin e
                                                         user na URL
                                                         pública.
  --------------------------------------------------------------------------

## 3. Levantamento: rotas consumidas pelo frontend × backend atual

Levantamento feito comparando `HerdVision_frontend/src/api/resources.ts`
(e o backend simulado em `src/api/mock/server.ts`, que define o contrato
esperado) com os `routes/api.php` de cada serviço na tag `v0.2`.

### 3.1. Auth Service (porta 8000) --- completo para a R3

  Método   Rota                   Perfil         Situação
  -------- ---------------------- -------------- ------------
  POST     `/api/auth/register`   público        ✅ existe
  POST     `/api/auth/login`      público        ✅ existe
  POST     `/api/auth/logout`     autenticado    ✅ existe
  GET      `/api/auth/me`         autenticado    ✅ existe
  GET      `/api/users`           admin          ✅ existe (busca, filtro `role`, paginação)

### 3.2. Herd Service (porta 8001) --- só Lotes existe

  Método        Rota                          Situação
  ------------- ----------------------------- ----------------------
  GET           `/api/lots`                   ✅ existe
  GET           `/api/lots/{id}`              ✅ existe
  POST          `/api/lots`                   ✅ existe
  PUT/PATCH     `/api/lots/{id}`              ✅ existe
  DELETE        `/api/lots/{id}`              ✅ existe (409 com animais)
  GET           `/api/animals`                ❌ falta
  GET           `/api/animals/{id}`           ❌ falta
  POST          `/api/animals`                ❌ falta
  PUT/PATCH     `/api/animals/{id}`           ❌ falta
  DELETE        `/api/animals/{id}`           ❌ falta
  GET           `/api/protocols`              ❌ falta
  GET           `/api/protocols/{id}`         ❌ falta
  POST          `/api/protocols`              ❌ falta
  PUT/PATCH     `/api/protocols/{id}`         ❌ falta
  DELETE        `/api/protocols/{id}`         ❌ falta
  GET           `/api/animal-protocols`       ❌ falta
  POST          `/api/animal-protocols`       ❌ falta
  PATCH         `/api/animal-protocols/{id}`  ❌ falta
  DELETE        `/api/animal-protocols/{id}`  ❌ falta

Models, migrations e factories de `animals`, `management_protocols` e
`animal_management_protocol` já existem; faltam Requests, Resources,
Controllers, rotas e testes.

### 3.3. Monitoring Service (porta 8002) --- sem API

  Método   Rota                         Situação
  -------- ---------------------------- -----------
  GET      `/api/readings`              ❌ falta
  GET      `/api/readings/{id}`         ❌ falta
  POST     `/api/readings`              ❌ falta
  GET      `/api/alerts`                ❌ falta
  GET      `/api/alerts/{id}`           ❌ falta
  PATCH    `/api/alerts/{id}/status`    ❌ falta
  POST     `/api/alerts/{id}/reopen`    ❌ falta

Também faltam no monitoring-service: `routes/api.php` registrado no
`bootstrap/app.php`, middlewares `jwt` e `role` (copiar a variante do
herd-service, que lê o perfil do claim), `config/jwt.php`, `config/cors.php`,
`lang/pt_BR` de validação com atributos novos, Dockerfile e serviço no
Render.

### 3.4. Configuração e deploy

-   Vercel: falta a variável `VITE_MONITORING_API_URL` (hoje só existem
    `VITE_AUTH_API_URL` e `VITE_HERD_API_URL`).
-   Render: falta o serviço `monitoring-service` (só auth e herd estão
    publicados).
-   Monitoring precisa de `HERD_API_URL` para validar animais (§7.3).

**Resumo do gap** (contando PUT e PATCH como uma rota só): o frontend
consome 30 rotas e 9 existem (auth 4, lotes 5). Faltam 21: 14 no Herd
Service (animais 5, protocolos 5, associações 4) e 7 no Monitoring
Service (leituras 3, alertas 4).

## 4. Decisões tomadas para esta release

  -----------------------------------------------------------------------------
  Tema                     Decisão
  ------------------------ ----------------------------------------------------
  Permissões do `user`     Padrão dos lotes: consulta livre para autenticados;
                           criar/editar para admin e user; excluir animal e
                           protocolo só admin (§5).

  Histórico de alertas     Nova tabela `alert_status_changes` no Monitoring
                           Service, devolvida como `history` no alerta.

  Validação entre serviços O Monitoring Service consulta o Herd Service via
                           HTTP (`GET /api/animals/{id}`), repassando o
                           Bearer do usuário, antes de aceitar uma leitura.

  Login social             **Removido do escopo.** Os botões de Google saem
                           das telas de login e cadastro. Login social é
                           apenas um ponto de complexidade opcional no
                           enunciado, não um requisito obrigatório.

  Pontos de complexidade   Alvo final: microsserviços (3) + testes ≥ 10 (2)
                           + Swagger (1) + CI/CD (3) = 9 pontos (§10).

  Valores semânticos       Adotar os valores já usados pelo frontend
                           (`src/lib/semantics.ts`) e validá-los no backend
                           com `in:` (§6.4).
  -----------------------------------------------------------------------------

## 5. Matriz de permissões (aplicada no backend)

  Funcionalidade                               Admin   User   Sem token
  -------------------------------------------- ------- ------ -----------
  Consultar lotes, animais, protocolos         Sim     Sim    401
  Criar/editar lotes, animais, protocolos      Sim     Sim    401
  Excluir lote, animal, protocolo              Sim     403    401
  Aplicar/concluir/desvincular protocolo       Sim     Sim    401
  Consultar e registrar leituras               Sim     Sim    401
  Consultar alertas                            Sim     Sim    401
  Alterar status / reabrir alerta              Sim     Sim    401
  Listar usuários                              Sim     403    401

O frontend já esconde os botões de exclusão para `user`, mas a regra
vale pelo endpoint: um `DELETE` feito direto na API por um `user` deve
receber 403. Cada combinação acima deve ter teste de feature.

## 6. CRUDs e relacionamentos (Herd Service)

Seguir as convenções da Release 2 (`LotController` é a referência):
Resources com `{data: ...}`, paginação Laravel (`per_page` 1--100,
padrão 15), updates parciais em PUT e PATCH, mensagens em
`lang/pt_BR/validation.php`, 404 com mensagem genérica.

### 6.1. Animais (`/api/animals`)

  -------------------------------------------------------------------------
  Item               Regra
  ------------------ ------------------------------------------------------
  Listagem           `search` em `identification`, `name` e `breed`;
                     filtros `lot_id` e `status`; ordenação por
                     `identification`.

  Resposta           Campos da tabela + `lot: {id, name}`.

  Validação          `identification` obrigatório, único, máx. 255;
                     `species` obrigatório; `status` obrigatório e em
                     `ativo`, `em tratamento`, `inativo`; `lot_id`
                     obrigatório e existente; `birth_date` data no formato
                     `Y-m-d` e não futura; `name` e `breed` opcionais,
                     máx. 255.

  Exclusão           Só admin. Apaga em cascata as associações com
                     protocolos (FK já é `cascadeOnDelete`). Leituras e
                     alertas do Monitoring Service ficam preservados com o
                     `animal_id` lógico (o frontend exibe "Animal #id").
  -------------------------------------------------------------------------

### 6.2. Protocolos de Manejo (`/api/protocols`)

  -------------------------------------------------------------------------
  Item               Regra
  ------------------ ------------------------------------------------------
  Listagem           `search` em `name` e `description`; filtros `type` e
                     `active`; ordenação por `name`.

  Resposta           Campos da tabela + `animals_count` (animais distintos
                     com o protocolo aplicado).

  Validação          `name` obrigatório, máx. 255; `type` obrigatório e em
                     `sanitário`, `nutricional`, `reprodutivo`; `active`
                     booleano (padrão `true`); `description` opcional,
                     máx. 5000.

  Exclusão           Só admin. Protocolo já aplicado a algum animal → 409
                     com `animals_count` e mensagem orientando a
                     desativar. Tratar a corrida com `QueryException`
                     (FK `restrictOnDelete`), como em Lotes.
  -------------------------------------------------------------------------

### 6.3. Associação Animal ↔ Protocolo (`/api/animal-protocols`)

  -------------------------------------------------------------------------
  Item               Regra
  ------------------ ------------------------------------------------------
  Listagem           Filtros `animal_id` e `management_protocol_id`;
                     ordenação por `start_date` desc, depois `id` desc.

  Resposta           Campos da tabela + `animal: {id, identification,
                     name}` e `protocol: {id, name, type, active}`.

  Criação            `animal_id` e `management_protocol_id` obrigatórios e
                     existentes; protocolo **inativo não pode ser
                     associado** (422); `status` obrigatório e em
                     `em andamento`, `concluído`; `start_date` obrigatório
                     (coluna é `NOT NULL`).

  Edição             PATCH só de `start_date` e `status`.

  Exclusão           Admin e user (desvincular não apaga o animal nem o
                     protocolo).
  -------------------------------------------------------------------------

### 6.4. Valores semânticos validados no backend

  Campo                               Valores aceitos
  ----------------------------------- -----------------------------------------
  `animals.status`                    `ativo`, `em tratamento`, `inativo`
  `animals.species`                   `Bovino`, `Bubalino`, `Ovino`, `Caprino`, `Equino`
  `management_protocols.type`         `sanitário`, `nutricional`, `reprodutivo`
  `animal_management_protocol.status` `em andamento`, `concluído`
  `alerts.severity`                   `alta`, `média`, `baixa`
  `alerts.type`                       `temperatura`, `atividade`, `alimentação`

Centralizar em enums PHP por serviço, espelhando `src/lib/semantics.ts`.

### 6.5. Relacionamentos entregues

``` text
Lote 1 ───────── N Animal                 (herd, FK RESTRICT)
Animal N ──────── N Protocolo de Manejo   (herd, tabela com id próprio)
Animal 1 ─ ─ ─ ─ N Leitura                (lógico, entre serviços)
Animal 1 ─ ─ ─ ─ N Alerta                 (lógico, entre serviços)
Leitura 1 ─────── N Alerta                (monitoring, FK nullOnDelete)
Alerta 1 ──────── N Mudança de status     (monitoring, nova tabela)
```

## 7. Monitoring Service e regra de negócio principal

### 7.1. Leituras (`/api/readings`)

  -------------------------------------------------------------------------
  Item               Regra
  ------------------ ------------------------------------------------------
  Listagem           Filtro `animal_id`; ordenação por `recorded_at` desc;
                     paginação.

  Criação            `animal_id` obrigatório e existente no Herd Service
                     (§7.3); `recorded_at` obrigatório e não futuro
                     (tolerância de 1 min); `temperature` entre 30 e 45;
                     `activity_level` e `feeding_level` entre 0 e 100;
                     ao menos um indicador informado.

  Resposta           `201` com `{data: leitura, alerts_created: n}`.
  -------------------------------------------------------------------------

**Ajuste de schema:** `activity_level` e `feeding_level` foram criados
como `string` na Release 2, mas o frontend envia índices numéricos
0--100 e a regra de alertas compara números. Criar migration alterando
as duas colunas para `decimal(5,2)` nulável.

### 7.2. Geração de alertas (regra simples, dados manuais)

Executada na mesma transação da criação da leitura. Cada condição gera
um alerta `Pendente` ligado à leitura (`monitoring_reading_id`):

  Condição                         Tipo           Gravidade
  -------------------------------- -------------- -------------------------
  `temperature` > 39,5 °C          `temperatura`  `alta` se ≥ 40,0; senão `média`
  `activity_level` < 40            `atividade`    `alta` se < 25; senão `média`
  `feeding_level` < 40             `alimentação`  `alta` se < 25; senão `média`

Descrições em pt_BR no mesmo texto do mock (ex.: "Temperatura de
40,2 °C, acima da referência de 39,5 °C. Recomenda-se avaliação."). Os
limites ficam em `config/monitoring.php` para ajuste sem mexer no
código. Alertas indicam condições que merecem avaliação; não são
diagnóstico veterinário.

### 7.3. Validação do animal entre serviços

-   O Monitoring Service chama `GET {HERD_API_URL}/api/animals/{id}`
    repassando o `Authorization: Bearer` da requisição original.
-   `200` → aceita; `404` → 422 "O animal informado não existe no
    rebanho."; falha de rede/timeout (5 s) → 503 com mensagem clara, sem
    gravar a leitura.
-   Encapsular em uma classe `HerdClient` e usar `Http::fake()` nos
    testes.
-   Nenhuma FK física entre bancos (regra da Release 2 mantida).

### 7.4. RN01 --- fluxo de tratamento de alertas (`/api/alerts`)

  -------------------------------------------------------------------------
  Endpoint                       Regra
  ------------------------------ ------------------------------------------
  `GET /api/alerts`              `search` em `description` e `type`;
                                 filtros `status`, `severity`,
                                 `animal_id`; ordenação por `created_at`
                                 desc; `meta.total` é usado nos contadores
                                 do dashboard, da sidebar e das abas.

  `GET /api/alerts/{id}`         Alerta + `history` ordenado por data.

  `PATCH /api/alerts/{id}/status` Body `{status}`. Só aceita a próxima
                                 transição: `Pendente` → `Em análise` →
                                 `Resolvido`. Qualquer outra (pular etapa,
                                 voltar, repetir) → 422 "Transição de
                                 status inválida: de "X" para "Y"."

  `POST /api/alerts/{id}/reopen` Ação explícita (RN01 regra 4): só de
                                 `Resolvido` para `Pendente`; outro
                                 status → 422.
  -------------------------------------------------------------------------

Implementação:

-   Regras de transição no enum `AlertStatus` (`canTransitionTo()`),
    para serem testadas de forma unitária.
-   `status` continua fora do `$fillable`; só muda pelo serviço de
    transição.
-   Não há criação, edição ou exclusão manual de alertas pela API: eles
    nascem das leituras. O alerta não é um dos 3 CRUDs obrigatórios.

### 7.5. Histórico de status (`alert_status_changes`)

  Campo           Tipo            Finalidade
  --------------- --------------- -----------------------------------------
  `id`            Identificador   Chave primária.
  `alert_id`      FK              `alerts.id`, `cascadeOnDelete`.
  `from_status`   Texto, nulo     Status anterior (`null` na criação).
  `to_status`     Texto           Novo status.
  `user_id`       Inteiro, nulo   `sub` do JWT (ID lógico do auth-service).
  `user_name`     Texto, nulo     `name` do JWT, gravado para exibição.
  `created_at`    Data/hora       Momento da mudança.

-   Criação do alerta grava a linha `null → Pendente` (sem usuário).
-   Cada transição e reabertura grava uma linha na mesma transação.
-   A API devolve `history: [{from, to, user_name, changed_at}]`, formato
    já esperado pelo frontend (`AlertHistoryEntry`).
-   O token do auth-service já traz os claims `sub`, `name` e `role`
    (`JwtService`), então não há mudança no auth.

## 8. Busca, filtro e paginação

  Listagem      Busca (`search`)                    Filtros                    Paginação
  ------------- ----------------------------------- -------------------------- ------------
  Lotes         nome, descrição                     ---                        ✅ (R2)
  Usuários      nome, e-mail                        `role`                     ✅ (R2)
  Animais       identificação, nome, raça           `lot_id`, `status`         R3
  Protocolos    nome, descrição                     `type`, `active`           R3
  Alertas       descrição, tipo                     `status`, `severity`,      R3
                                                    `animal_id`
  Leituras      ---                                 `animal_id`                R3

Todos os filtros validados no `index` (`nullable|string|max:100`,
`per_page` 1--100), como em `LotController@index`.

## 9. Telas

O frontend já tem 11 telas (mínimo exigido: 8). Na Release 3 elas
precisam funcionar contra a API real no ambiente publicado:

  Nº   Tela                         Depende de                       Situação na v0.2
  ---- ---------------------------- -------------------------------- ------------------------
  1    Login                        auth                             ✅ funciona
  2    Cadastro                     auth                             ✅ funciona
  3    Dashboard                    herd (lotes) + monitoring        parcial (sem alertas)
  4    Listagem de animais          herd `/animals` + monitoring     "não disponível"
  5    Cadastro/edição de animal    herd `/animals`, `/lots`         "não disponível"
  6    Detalhe do animal            herd + monitoring                "não disponível"
  7    Listagem de lotes            herd `/lots`                     ✅ funciona
  8    Cadastro/edição de lote      herd `/lots`                     ✅ funciona
  9    Protocolos de manejo         herd `/protocols`, associações   "não disponível"
  10   Central de alertas           monitoring `/alerts`             "não disponível"
  11   Usuários (admin)             auth `/users`                    ✅ funciona

Ajustes de frontend nesta release:

-   Remover os botões "Entrar com Google" e "Cadastrar com Google" (e o
    separador "ou") de `LoginPage.tsx` e `RegisterPage.tsx`; remover
    `GoogleLogo` se ficar sem uso; atualizar `DESIGN.md` §13.2 item 5.
-   Remover os comentários "prevista" / 🕓 de `src/api/client.ts` e
    `resources.ts` conforme as rotas forem entregues.
-   Ajustar `src/api/types.ts` se o contrato real divergir do mock (ex.:
    `activity_level` numérico).
-   Configurar `VITE_MONITORING_API_URL` na Vercel.

Ajustes visuais finos podem ficar para a Release 4.

## 10. Pontos de complexidade

Alvo final da equipe: **9 pontos** (mínimo 8). A Release 3 precisa de
pelo menos 4 concluídos.

  Item (enunciado)                        Pontos   Release   Situação
  --------------------------------------- -------- --------- -------------------------------------
  Backend em microsserviços               3        R3        ✅ três serviços no ar (Render)
  Testes automatizados (mín. 10)          2        R3        ✅ 334 no backend + 21 no front
  Documentação da API (Swagger/OpenAPI)   1        R3        ✅ `/docs/api` nos três serviços
  CI/CD: deploy automático a cada push    3        R4        auto-deploy existe, sem validação
  **Total**                               **9**

**Na Release 3: 6 pontos** (microsserviços, testes e Swagger), acima
da meta de 4.

### 10.1. Swagger/OpenAPI (R3)

-   Gerar OpenAPI 3 em cada serviço (ex.: `dedoc/scramble`, que lê
    Requests e Resources do Laravel sem anotações manuais) e servir a UI
    em `/docs/api`.
-   Documentar o esquema Bearer JWT e as respostas 401/403/404/409/422.
-   Linkar as três URLs de documentação no README.

### 10.2. CI/CD (planejado para a R4)

GitHub Actions com testes dos três serviços e do frontend em cada push;
deploy no Render e na Vercel só depois dos testes passarem (desligar o
auto-deploy direto e usar deploy hooks). Fica registrado aqui para não
perder o prazo; não é meta da R3.

## 11. Testes automatizados

Novos testes de feature/unitários, seguindo `tests/TestCase.php` do
herd (`asAdmin()`, `asUser()`, par RSA efêmero):

-   **Herd:** CRUD de animais (incluindo identificação duplicada, lote
    inexistente, data futura, filtros e busca); CRUD de protocolos
    (incluindo 409 com associações e filtro `active`); associações
    (protocolo inativo, cascata ao excluir animal); 401/403 por perfil
    em cada rota; `LangParityTest` atualizado.
-   **Monitoring:** JWT e roles (copiar os testes do herd); leitura
    válida/inválida; animal inexistente e herd fora do ar (`Http::fake`);
    geração de alertas por condição e gravidade; RN01 --- cada transição
    válida, cada inválida, reabertura; histórico gravado com usuário.
-   **Unitário:** `AlertStatus::canTransitionTo()` para todos os pares.
-   **Frontend:** manter `npm test` verde após remover o Google.

## 12. Deploy

Checklist:

-   [x] Dockerfile e `docker-entrypoint.sh` do monitoring-service (mesmo
    padrão de auth/herd).
-   [x] Serviço `monitoring-service` no Render, auto-deploy da `main`,
    com `JWT_PUBLIC_KEY`, `JWT_ISSUER`, `HERD_API_URL`,
    `CORS_ALLOWED_ORIGINS`, `APP_DEBUG=false`.
-   [x] `VITE_MONITORING_API_URL` configurada na Vercel e novo deploy do
    frontend.
-   [x] Seeders de demonstração no herd (lotes, animais, protocolos,
    associações) e no monitoring (leituras e alertas em vários status),
    ligados por variável de ambiente como o `SEED_DEMO_USERS` do auth.
    Necessário porque o SQLite do Render free é efêmero: os dados voltam
    ao estado do seed a cada deploy/reinício.
-   [x] Fluxos validados na URL pública com admin e user.
-   [x] Coleção do Insomnia (`insomnia/`) atualizada com as novas rotas.

**Atenção:** os IDs de animais do seed do monitoring precisam bater com
os do seed do herd. Semear o herd primeiro e usar IDs fixos.

## 13. Entrega e versionamento

A Release 3 será considerada entregue quando houver:

-   [x] CRUD completo de Lotes, Animais e Protocolos pela interface.
-   [x] Relacionamentos 1:N (Lote → Animal) e N:N (Animal ↔ Protocolo)
    funcionando pela interface.
-   [x] Monitoring Service publicado e consumido pelo frontend.
-   [x] Registro de leituras com geração automática de alertas.
-   [x] RN01 validada no backend, com reabertura explícita e histórico.
-   [x] Matriz de permissões aplicada e testada em todos os endpoints.
-   [x] Busca/filtro e paginação nas listagens.
-   [x] As 11 telas funcionando contra a API real.
-   [x] Botões de Google SSO removidos.
-   [x] Swagger publicado nos três serviços.
-   [x] Testes passando nos três serviços e no frontend.
-   [ ] Demonstração ao vivo preparada (admin e user).
-   [ ] Tag Git `v0.3` criada e enviada ao repositório remoto.

Comandos sugeridos, após validar e commitar:

``` bash
git status
git tag -a v0.3 -m "HerdVision Release 3"
git push origin main
git push origin v0.3
```

## 14. Fora do escopo desta release

Ficam para a Release 4:

-   CI/CD com deploy automático condicionado aos testes (3 pontos).
-   Revisão geral de validações e tratamento de erros ("nenhuma tela de
    erro do servidor para o usuário").
-   Ajustes visuais finos e responsividade.
-   README final (arquitetura, execução local, usuários de teste,
    checklist da métrica, seção "Uso de IA").
-   Persistência real do SQLite em produção (disco persistente), se a
    equipe decidir que o seed efêmero não basta para a demo final.
-   Revogação de logout propagada para herd e monitoring (hoje só o
    auth-service rejeita o `jti` revogado; os outros aceitam até o token
    expirar).

Fora do produto: login social (Google SSO), por decisão da equipe.

------------------------------------------------------------------------

**Status:** documento de escopo da Release 3 --- Funcionalidades.\
**Versão prevista do sistema:** `v0.3`.\
**Entrega:** demonstração ao vivo e tag Git `v0.3`.
