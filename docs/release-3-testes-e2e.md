# HerdVision --- Release 3: Roteiro de testes E2E (Playwright)

Roteiro de testes de ponta a ponta para validar a Release 3 no ambiente
publicado, cobrindo os casos de uso do produto e os critérios de aceite de
`release-3-funcionalidades.md` (R3-01 a R3-16). Foi escrito para ser
executado pelo **Playwright MCP** (o Claude dirige o navegador seguindo os
passos), mas cada caso também serve de especificação para um teste
`@playwright/test` no futuro.

## 1. Ambiente

| Item | Valor |
|---|---|
| Frontend | https://herdvision-frontend.vercel.app |
| Auth Service | https://auth-service-od2h.onrender.com |
| Herd Service | https://herd-service-dy54.onrender.com |
| Monitoring Service | https://monitoring-service-gm4u.onrender.com |
| Swagger | `{serviço}/docs/api` nos três serviços |
| Admin | `admin@herdvision.com` / `Admin@1234` |
| User | `user@herdvision.com` / `User@1234` |

Para rodar localmente, troque as URLs por `http://localhost:5173`, `:8000`,
`:8001` e `:8002`, com os seeders executados (`php artisan db:seed` no auth,
no herd e no monitoring).

## 2. Prontidão para a execução

Situação conferida em 2026-11-26:

| # | Pré-requisito | Situação |
|---|---|---|
| P1 | Playwright MCP disponível e abrindo a URL pública | ✅ navegador abre `/login` |
| P2 | Frontend de produção no commit da R3 (`19d405d`) | ✅ deploy READY na Vercel |
| P3 | Bundle aponta para o monitoring (`VITE_MONITORING_API_URL`) | ✅ URL presente no JS |
| P4 | Modo mock desligado em produção | ✅ sem banner "Modo demonstração" |
| P5 | Botões de Google removidos | ✅ só o botão "Entrar" no login |
| P6 | Usuários demo no auth (`SEED_DEMO_USERS`) | ✅ login de admin e user funciona |
| P7 | Seed do herd (`SEED_DEMO_DATA`) | ✅ 12 animais, 5 protocolos |
| P8 | Swagger dos três serviços | ✅ `/docs/api` responde 200 |
| P9 | CORS do monitoring para a Vercel | ✅ `Access-Control-Allow-Origin` correto |
| P10 | `JWT_PUBLIC_KEY` no monitoring-service (Render) | ✅ configurado em 2026-11-26; rotas autenticadas respondem 200 |
| P11 | Seed do monitoring (`SEED_DEMO_DATA`) | ✅ 4 Pendentes, 2 Em análise, 1 Resolvido |
| P12 | `.playwright-mcp/` no `.gitignore` | ✅ adicionado na raiz |

**P10 bloqueia** todos os casos marcados com 🛰 (dependem do monitoring).
Sem ele, só os blocos AUTH, LOT, ANI (exceto o detalhe), PRO, USR, API-herd
e DOC podem rodar.

### 2.1. Antes de cada rodada

1. **Resetar os dados:** o SQLite do Render é efêmero. Um redeploy (ou
   reinício) do herd e do monitoring devolve o banco ao seed. Rode o roteiro
   sobre um estado recém-semeado para que as contagens da §3 batam.
2. **Acordar os serviços:** o plano free do Render hiberna. Abra
   `{serviço}/up` nos três serviços e espere 200 (o primeiro acesso pode
   levar ~60 s). Durante a execução, use timeouts de pelo menos 60 s para
   a primeira requisição de cada serviço.
3. **Prefixo de dados de teste:** tudo o que o roteiro cria usa o prefixo
   `E2E` mais um carimbo curto (ex.: `E2E-1126A`), para não confundir com
   o seed. Os casos destrutivos agem sobre esses registros, nunca sobre o
   seed, exceto onde o caso diz o contrário.
4. **Novo contexto por perfil:** ao trocar de admin para user, faça logout
   (ou limpe o `localStorage`) para não reaproveitar a sessão.

### 2.2. Como executar com o Playwright MCP

- Para cada caso: `browser_navigate`, depois `browser_snapshot` para obter
  as referências, e as ações com `browser_click` / `browser_fill_form`.
  Confira o resultado esperado em um novo snapshot.
- Localize os elementos pelos **textos e rótulos visíveis** citados nos
  passos (ex.: botão "Registrar leitura", campo "Identificação").
- Os casos **API-** usam `browser_evaluate` com `fetch` a partir da página
  logada. O token fica em
  `JSON.parse(localStorage.getItem('herdvision.session')).token`.
- Em caso de falha: `browser_take_screenshot`, `browser_console_messages` e
  `browser_network_requests`, e anote o ID do caso na tabela de resultados
  (§5).

## 3. Dados do seed (referência para as asserções)

| Entidade | Conteúdo |
|---|---|
| Lotes | Engorda Norte (4 animais), Cria Sul (4), Leiteiras (4) |
| Animais | BR1001 Trovão, BR1002, BR1003 Pintado (em tratamento), BR1004 · BR2001 Mimosa, BR2002 Estrela, BR2003, BR2004 Bonita (inativo) · BR3001 Malhada, BR3002 Princesa (em tratamento), BR3003 Jóia, BUF001 Bravo (Bubalino) |
| Protocolos | Vacinação contra febre aftosa (3 animais), Vermifugação (2), Suplementação mineral (2), IATF (2), Ração de transição (**inativo**, 1) |
| Alertas 🛰 | Pendente 4 · Em análise 2 · Resolvido 1 |
| Alerta reaberto 🛰 | BR3001 Malhada, temperatura 40,1 °C: histórico Pendente → Em análise (Usuário Demo) → Resolvido (Administrador Demo) → Pendente (Usuário Demo) |
| Animal com mais eventos 🛰 | BR1003 Pintado: alerta de temperatura **Em análise** e alerta de atividade **Resolvido** |

## 4. Casos de teste

Legenda: **Perfil** = quem executa · 🛰 = depende do monitoring-service ·
**Req.** = requisito da Release 3 coberto.

### 4.1. Autenticação (AUTH)

| ID | Perfil | Passos | Resultado esperado | Req. |
|---|---|---|---|---|
| AUTH-01 | --- | Abrir `/login`. | Título "Entrar · HerdVision"; campos "E-mail" e "Senha"; botão "Entrar"; link "Criar conta". **Nenhum** botão ou texto "Google" e nenhum divisor "ou". | R3-12 |
| AUTH-02 | --- | Abrir `/cadastro`. | Campos "Nome", "E-mail", "Senha", requisitos de senha e botão "Criar conta"; **nenhuma** opção de Google. | R3-12 |
| AUTH-03 | admin | Login com as credenciais de admin. | Redireciona para `/` (Painel); menu lateral mostra Painel, Animais, Lotes, Protocolos, Alertas **e Usuários**. | R3-09 |
| AUTH-04 | user | Login com as credenciais de user. | Redireciona para o Painel; o menu **não** mostra "Usuários". | R3-09 |
| AUTH-05 | --- | Login com senha errada. | Permanece em `/login` com "Credenciais inválidas. Confira o e-mail e a senha."; não cria sessão. | --- |
| AUTH-06 | --- | Clicar em "Entrar" com os campos vazios. | Mensagens de campo obrigatório em E-mail e Senha; nenhuma requisição concluída com sucesso. | --- |
| AUTH-07 | --- | Cadastrar `E2E <carimbo>` com e-mail `e2e+<carimbo>@herdvision.dev` e senha `Senha@1234`. | Toast "Conta criada. Bem-vindo à HerdVision!"; entra no Painel com perfil Usuário (sem menu Usuários). | --- |
| AUTH-08 | --- | Repetir o cadastro com o mesmo e-mail. | Erro no campo E-mail (e-mail já em uso); permanece na tela. | --- |
| AUTH-09 | --- | Cadastro com senha fraca (ex.: `abc`). | Requisitos de senha pendentes destacados e erro de validação; conta não criada. | --- |
| AUTH-10 | --- | Sem sessão, abrir `/animais` diretamente. | Redireciona para `/login`. | R3-09 |
| AUTH-11 | admin | Clicar em "Sair". | Volta para `/login`; `localStorage['herdvision.session']` removido; voltar para `/` redireciona ao login. | --- |

### 4.2. Painel (DASH)

| ID | Perfil | Passos | Resultado esperado | Req. |
|---|---|---|---|---|
| DASH-01 | admin | Abrir `/`. | Título "Painel do rebanho"; indicadores "Animais monitorados" = 12, "Lotes" = 3. | R3-11 |
| DASH-02 🛰 | admin | Ver indicadores de alertas. | "Alertas pendentes" = 4 e "Em análise" = 2 (estado do seed); **não** aparece "Monitoramento indisponível no momento.". | R3-04, R3-11 |
| DASH-03 🛰 | admin | Ver "Animais em atenção" e "Alertas de hoje". | Lista animais com alertas abertos (ex.: BR1003, BUF001, BR2002); "Ver na central" leva a `/alertas`. | R3-11 |
| DASH-04 | admin | Ver "Animais por lote". | Três lotes com 4 animais cada. | R3-01 |
| DASH-05 🛰 | admin | Conferir o contador do item "Alertas" no menu lateral. | Mostra o total de Pendentes (4 no seed). | R3-10 |

### 4.3. Lotes (LOT)

| ID | Perfil | Passos | Resultado esperado | Req. |
|---|---|---|---|---|
| LOT-01 | user | Abrir `/lotes`. | Lista "Lotes" com os 3 lotes do seed; **sem** ícones de excluir. | R3-09 |
| LOT-02 | user | Buscar "Cria" em "Buscar lote". | Apenas "Cria Sul". "Limpar filtros" restaura a lista. | R3-10 |
| LOT-03 | user | "Novo lote" → "Nome do lote" = `E2E-Lote <carimbo>`, "Descrição" qualquer → "Salvar lote". | Toast "`E2E-Lote …` criado."; aparece na lista. | R3-01 |
| LOT-04 | user | Salvar lote com nome vazio. | Erro "O campo nome é obrigatório."; nada é criado. | --- |
| LOT-05 | user | Abrir o lote E2E → alterar a descrição → "Salvar alterações". | Toast "… atualizado."; nova descrição na lista. | R3-01 |
| LOT-06 | user | Abrir o lote E2E. | Botão "Excluir lote" desabilitado com "Disponível apenas para administradores.". | R3-09 |
| LOT-07 | admin | Na lista, excluir "Engorda Norte" (seed, tem animais). | Diálogo de bloqueio: "Este lote possui 4 animais. Mova ou remova os animais antes de excluir."; o lote continua na lista. | R3-01 |
| LOT-08 | admin | Excluir o lote E2E (vazio) e confirmar "Excluir lote". | Toast "… excluído."; some da lista. | R3-01 |
| LOT-09 | admin | Em "Itens por página", escolher o menor valor e navegar com "Próxima página". | Paginação funciona e o total não muda. | R3-10 |

### 4.4. Animais (ANI)

| ID | Perfil | Passos | Resultado esperado | Req. |
|---|---|---|---|---|
| ANI-01 | user | Abrir `/animais`. | "Animais" com 12 registros no total, ordenados por identificação; colunas Animal, Espécie · Raça, Lote, Nascimento, Status, Situação. | R3-01, R3-11 |
| ANI-02 | user | "Buscar animal" = `Malhada`; depois `Holandês`; depois `BUF`. | 1 resultado cada: BR3001; BR3001 e BR3002 (raça); BUF001. | R3-10 |
| ANI-03 | user | Filtro "Lote" = Cria Sul; depois "Status" = em tratamento (sem lote). | 4 animais da Cria Sul; depois BR1003 e BR3002. | R3-10 |
| ANI-04 | user | Lista sem ícone de excluir. | Nenhum botão "Excluir …" para user. | R3-09 |
| ANI-05 | user | "Novo animal" → Identificação `E2E-<carimbo>`, Nome `Teste`, Espécie Bovino, Raça Nelore, Data de nascimento passada, Status Ativo, Lote Leiteiras → "Salvar animal". | Toast "… cadastrado."; abre o detalhe/aparece na lista com o lote Leiteiras. | R3-01 |
| ANI-06 | user | Novo animal com a identificação `BR1001`. | Erro "Já existe um animal com esta identificação."; nada criado. | R3-01 |
| ANI-07 | user | Novo animal com data de nascimento amanhã. | Erro "A data de nascimento não pode estar no futuro." | R3-01 |
| ANI-08 | user | Novo animal sem Identificação, Espécie, Status e Lote. | Erros de obrigatório nos quatro campos. | R3-01 |
| ANI-09 | user | Editar o animal E2E: mover para "Cria Sul", Status "em tratamento" → "Salvar alterações". | Toast "… atualizado."; detalhe mostra o novo lote e status; filtro por Cria Sul passa a incluí-lo. | R3-01 |
| ANI-10 🛰 | user | Abrir o detalhe de BR1003 Pintado. | Mostra lote Engorda Norte, "Última leitura", "Histórico de monitoramento" com leituras, seção "Alertas" com um alerta Em análise e um Resolvido, e "Protocolos aplicados ao animal" com Vacinação (concluído) e Vermifugação (em andamento). | R3-05, R3-11 |
| ANI-11 | user | Detalhe de qualquer animal. | Sem botão "Excluir animal". | R3-09 |
| ANI-12 | admin | Detalhe do animal E2E → "Excluir animal" → confirmar. | Toast "… excluído."; some da lista; associações do animal somem (ver ASSOC-05). | R3-01 |
| ANI-13 | --- | Abrir `/animais/99999`. | Estado "Não encontrado"; nunca "Recurso ainda não disponível". | R3-11 |

### 4.5. Protocolos de manejo (PRO)

| ID | Perfil | Passos | Resultado esperado | Req. |
|---|---|---|---|---|
| PRO-01 | user | Abrir `/protocolos`. | "Protocolos de manejo" com 5 protocolos, colunas Protocolo, Tipo, Situação; "Ração de transição" como Inativo. | R3-02, R3-11 |
| PRO-02 | user | "Buscar protocolo" = `cocho`; depois filtro "Tipo" = reprodutivo. | "Suplementação mineral" (pela descrição); depois só "IATF". | R3-10 |
| PRO-03 | user | "Novo protocolo" → Nome `E2E-Prot <carimbo>`, Tipo Sanitário, Descrição, "Protocolo ativo" marcado → salvar. | Toast "… criado."; aparece ativo com 0 animais. | R3-02 |
| PRO-04 | user | Salvar protocolo sem Nome e sem Tipo. | Erros de obrigatório em Nome e Tipo. | R3-02 |
| PRO-05 | user | Editar o protocolo E2E (mudar descrição) → salvar. | Toast "… atualizado."; nova descrição no painel. | R3-02 |
| PRO-06 | user | No painel do protocolo E2E, associar o animal `BR1001` (campo "Animal", "Data de início"). | Toast "BR1001 … associado a E2E-Prot …"; aparece em "Animais com este protocolo". | R3-03 |
| PRO-07 | user | Desmarcar "Protocolo ativo" no E2E e salvar. | Situação "Inativo"; painel mostra "Protocolo inativo. Ative-o para associar a novos animais." e não permite nova associação. | R3-02, R3-03 |
| PRO-08 | admin | Excluir "Vacinação contra febre aftosa" (seed). | Diálogo de bloqueio: "Este protocolo foi aplicado a 3 animais. Desative-o em vez de excluir." (com "Desativar protocolo", **não** clicar). | R3-02 |
| PRO-09 | admin | Excluir o protocolo E2E (que tem 1 associação). | Bloqueio 409 semelhante ao PRO-08; o protocolo permanece. | R3-02 |
| PRO-10 | admin | Remover a associação do E2E (PRO-06), depois excluir o protocolo E2E. | Toast "Associação removida." e depois "… excluído."; some da lista. | R3-02, R3-03 |
| PRO-11 | user | Lista de protocolos. | Sem ícone de excluir para user. | R3-09 |

### 4.6. Associação animal ↔ protocolo pela tela do animal (ASSOC)

| ID | Perfil | Passos | Resultado esperado | Req. |
|---|---|---|---|---|
| ASSOC-01 | user | Detalhe de um animal E2E (crie outro se o da ANI-12 já foi excluído) → "Associar protocolo" → Protocolo "Vermifugação", Data de início hoje, Status em andamento → "Associar". | Toast "Protocolo associado."; linha em "Protocolos aplicados ao animal" com Início = hoje e status Em andamento. | R3-03 |
| ASSOC-02 | user | Abrir o diálogo "Associar protocolo" e listar as opções de "Protocolo". | "Ração de transição" (inativo) **não** aparece; os 4 ativos aparecem. A recusa no backend é coberta pela API-06. | R3-03 |
| ASSOC-03 | user | Na linha da associação, "Marcar como concluído"; depois "Marcar como em andamento". | Status alterna entre Concluído e Em andamento. | R3-03 |
| ASSOC-04 | user | "Remover associação" → confirmar "Remover". | Toast "Associação removida."; animal e protocolo continuam existindo. | R3-03 |
| ASSOC-05 | admin | Associar um protocolo ao animal E2E e depois excluir o animal (ANI-12). | Na aba do protocolo, o animal não aparece mais em "Animais com este protocolo" (cascata). | R3-01, R3-03 |

### 4.7. Leituras e geração de alertas (READ) 🛰

| ID | Perfil | Passos | Resultado esperado | Req. |
|---|---|---|---|---|
| READ-01 🛰 | user | Detalhe de BR1001 → "Registrar leitura" → Data e hora agora, Temperatura 38,6, Atividade 72, Alimentação 80 → salvar. | Toast "Leitura registrada." (sem alertas); leitura no topo do "Histórico de monitoramento" e em "Última leitura". | R3-05 |
| READ-02 🛰 | user | BR1001 → registrar Temperatura 40,3, Atividade 22, Alimentação 70. | Toast "Leitura registrada. 2 novos alertas…"; seção "Alertas" do animal ganha dois Pendentes de gravidade alta (temperatura e atividade). | R3-06 |
| READ-03 🛰 | user | BR1002 → registrar Temperatura 39,8 apenas. | 1 alerta de temperatura com gravidade média ("Atenção"). | R3-06 |
| READ-04 🛰 | user | Registrar com todos os indicadores vazios. | Erro "Informe ao menos um indicador." (validação da tela) e nada é gravado. | R3-05 |
| READ-05 🛰 | user | Temperatura 29 e Atividade 120. | Erros de faixa (30–45 °C e 0–100). | R3-05 |
| READ-06 🛰 | user | Data e hora daqui a 1 hora. | Erro "A leitura não pode estar no futuro." | R3-05 |
| READ-07 🛰 | user | Abrir a Central de alertas depois do READ-02. | O alerta de temperatura do BR1001 aparece com a descrição "Temperatura de 40,3 °C, acima da referência de 39,5 °C. Recomenda-se avaliação." | R3-06 |

### 4.8. Central de alertas e RN01 (ALR) 🛰

| ID | Perfil | Passos | Resultado esperado | Req. |
|---|---|---|---|---|
| ALR-01 🛰 | user | Abrir `/alertas`. | "Central de alertas" com lista e painel "Selecione um alerta"; sem "Recurso ainda não disponível". | R3-11 |
| ALR-02 🛰 | user | Filtro "Status" = Pendente; depois Em análise; depois Resolvido. | Contagens coerentes com o estado atual (seed: 4 / 2 / 1, somando o que READ criou). | R3-10 |
| ALR-03 🛰 | user | Filtro "Gravidade" = alta; depois busca por `cocho`. | Só alertas de gravidade alta; a busca retorna apenas alertas de alimentação (descrição "… Vale observar o cocho."; no seed, BR3002 e BUF001). | R3-10 |
| ALR-04 🛰 | user | Abrir um alerta Pendente criado no READ-02. | Painel de detalhe com histórico de 1 linha (criação, sem usuário) e **um único** botão de ação: "Iniciar análise". | R3-07, R3-08 |
| ALR-05 🛰 | user | Clicar "Iniciar análise". | Toast "Análise iniciada."; status Em análise; histórico ganha "Pendente → Em análise" com "Usuário Demo" e horário. Botão passa a ser "Marcar como resolvido". | R3-07, R3-08 |
| ALR-06 🛰 | admin | No mesmo alerta, "Marcar como resolvido". | Toast "Alerta marcado como resolvido."; histórico "Em análise → Resolvido" com "Administrador Demo". Botão passa a ser "Reabrir alerta". | R3-07, R3-08 |
| ALR-07 🛰 | user | "Reabrir alerta" → confirmar no diálogo "Reabrir alerta?". | Toast "Alerta reaberto como Pendente."; histórico com 4 linhas, a última "Resolvido → Pendente". | R3-07, R3-08 |
| ALR-08 🛰 | user | Abrir o alerta de temperatura de BR3001 Malhada (seed). | Histórico com 4 linhas na ordem da §3 e nomes Usuário Demo / Administrador Demo. | R3-08 |
| ALR-09 🛰 | admin | Depois do ALR-05 a ALR-07, voltar ao Painel. | Indicadores "Alertas pendentes" / "Em análise" e o contador do menu refletem as mudanças. | R3-10 |

### 4.9. Usuários (USR)

| ID | Perfil | Passos | Resultado esperado | Req. |
|---|---|---|---|---|
| USR-01 | admin | Abrir `/usuarios`. | "Usuários" com indicadores "Usuários" e "Administradores"; lista com Nome, E-mail, Perfil, Cadastrado em. | R3-11 |
| USR-02 | admin | "Buscar usuário" = `user@`; depois filtro "Perfil" = Administrador. | Apenas "Usuário Demo"; depois apenas administradores. | R3-10 |
| USR-03 | user | Abrir `/usuarios` pela URL. | Estado "Acesso restrito" ("Você não tem permissão para acessar este recurso."). | R3-09 |

### 4.10. Permissões e regras direto na API (API)

Executar com `browser_evaluate` a partir da página logada com o perfil
indicado. `T` = token da sessão; `H`, `M`, `A` = URLs do herd, monitoring e
auth.

| ID | Perfil | Chamada | Esperado | Req. |
|---|---|---|---|---|
| API-01 | --- | `GET H/api/animals`, `GET M/api/alerts`, `GET A/api/users` sem `Authorization`. | 401 nos três (o do monitoring é 🛰). | R3-09 |
| API-02 | user | `DELETE H/api/animals/{id de um animal E2E}`. | **403** e o animal continua existindo. | R3-09 |
| API-03 | user | `DELETE H/api/lots/{id}` e `DELETE H/api/protocols/{id}`. | 403 nos dois. | R3-09 |
| API-04 | user | `GET A/api/users`. | 403. | R3-09 |
| API-05 | user | `POST H/api/animals` com `status: "doente"` e `species: "Dragão"`. | 422 com erros em `status` e `species`. | R3-01 |
| API-06 | user | `POST H/api/animal-protocols` com o protocolo inativo (id 5). | 422 em `management_protocol_id`. | R3-03 |
| API-07 🛰 | user | Num alerta Pendente: `PATCH M/api/alerts/{id}/status` com `{"status":"Resolvido"}`. | **422** "Transição de status inválida: de \"Pendente\" para \"Resolvido\"."; status inalterado. | R3-07 |
| API-08 🛰 | user | Num alerta Pendente: `POST M/api/alerts/{id}/reopen`. | 422 (só alertas resolvidos podem ser reabertos). | R3-07 |
| API-09 🛰 | user | `POST M/api/readings` com `animal_id: 99999`. | 422 "O animal informado não existe no rebanho." | R3-05 |
| API-10 🛰 | user | `POST M/api/alerts`, `DELETE M/api/alerts/{id}`. | 405 (alertas não são criados nem excluídos manualmente). | R3-07 |

Modelo de chamada:

```js
async () => {
  const T = JSON.parse(localStorage.getItem('herdvision.session')).token;
  const r = await fetch('https://herd-service-dy54.onrender.com/api/animals/1', {
    method: 'DELETE',
    headers: { Accept: 'application/json', Authorization: `Bearer ${T}` },
  });
  return { status: r.status, body: await r.text() };
}
```

### 4.11. Navegação e documentação (NAV, DOC)

| ID | Perfil | Passos | Resultado esperado | Req. |
|---|---|---|---|---|
| NAV-01 | admin | Visitar as 11 telas: `/login`, `/cadastro`, `/`, `/animais`, `/animais/novo`, `/animais/1`, `/lotes`, `/lotes/novo`, `/protocolos`, `/alertas`, `/usuarios`. | Nenhuma mostra "Recurso ainda não disponível" nem erro de servidor; console sem erros de rede 5xx. | R3-11 |
| NAV-02 | admin | Abrir `/painel` e `/rota-inexistente`. | `/painel` redireciona para `/`; a outra mostra "Página não encontrada". | --- |
| DOC-01 | --- | Abrir `/docs/api` nos três serviços. | Interface carrega com os títulos "HerdVision · Auth/Herd/Monitoring Service API". | R3-13 |
| DOC-02 | --- | Abrir `/docs/api.json` do herd e do monitoring. | Esquema `bearerAuth`; `DELETE /animals/{animal}` documenta 401/403; `POST /readings` documenta 503. | R3-13 |

## 5. Registro de execução

Preencher a cada rodada (✅ passou, ❌ falhou, ⏭ não executado):

| Data | Ambiente | Commit | Executado por | Resultado | Falhas (IDs) |
|---|---|---|---|---|---|
| 2026-11-26 (03:25–03:47 BRT) | produção | `19d405d` | Claude (Playwright MCP) | 85 ✅ · 1 ⚠ · 1 ❌ de 87 casos | ANI-06 ❌ · ALR-03 ⚠ |
| 2026-11-26 (12:30 BRT, reteste) | produção | `fcecc00` | Claude (Playwright MCP) | ANI-06 ✅ · ALR-03 ✅ (87 de 87) | --- |
| 2026-11-26 (13:05–13:30 BRT, regressão completa) | produção | `6b68fd5` | Claude (Playwright MCP, scripts) | 87 ✅ de 87 | --- |
| 2026-11-26 (14:55–15:20 BRT, regressão final da R4) | produção | `7789d75` | Claude (Playwright MCP, scripts) | 87 ✅ de 87 | --- |

### 5.1. Rodada de 2026-11-26: detalhes

Pré-condições: P10 resolvido (monitoring responde 200 nas rotas
autenticadas); herd e monitoring redeployados antes da rodada; P11
conferido (4 Pendentes, 2 Em análise, 1 Resolvido). Carimbo `1126A`.
Registros criados: lote 4, animal 13 (`E2E-1126A`), protocolo 6, conta
`e2e+1126a@herdvision.dev`. Ao final, herd e monitoring foram redeployados
de novo para voltar ao seed. A conta E2E continua no auth, que não foi
reiniciado.

**Falhas**

| ID | Observado | Causa provável | Sugestão |
|---|---|---|---|
| ANI-06 ❌ | Erro no campo Identificação em inglês: "The identification has already been taken." | O herd-service em produção responde as mensagens nativas do Laravel em inglês (`The species field is required.`, `The selected status is invalid.`…). As regras próprias (ex.: API-06) saem em português. O auth-service tem o mesmo comportamento; o monitoring-service responde em pt_BR. Os arquivos `lang/pt_BR` estão no repositório e `config/app.php` usa `pt_BR` como padrão, então o mais provável é a variável `APP_LOCALE` (ou `APP_FALLBACK_LOCALE`) estar como `en` no Render para herd e auth. | Conferir/remover `APP_LOCALE` nos env vars do herd-service e do auth-service no Render (deixar `pt_BR`) e redeployar. Reexecutar ANI-06 e API-05. |
| ALR-03 ⚠ | O filtro "Gravidade = alta" funciona (6 alertas, todos Crítico). A Central de alertas **não tem campo de busca**, então não dá para "buscar por cocho" na tela. | O backend aceita `?search=` (`GET /api/alerts?search=cocho` retorna BUF001 e BR3002, como esperado), mas o `AlertsPage.tsx` não expõe esse campo. | Adicionar "Buscar alerta" na Central ou ajustar o caso de teste para cobrir a busca só pela API. |

**Correções (2026-11-26, depois da rodada)**

- ANI-06: `APP_LOCALE=pt_BR` definido no Render para o herd-service e o auth-service (redeploy automático). Os dois passaram a responder as validações em português. ANI-06 reexecutado pela tela em produção: "Já existe um animal com esta identificação." ✅. Efeito colateral: o redeploy do auth zerou o banco de usuários e recriou só os demos, então a conta E2E sumiu.
- ALR-03: campo "Buscar alerta" adicionado à Central (`AlertsPage.tsx`, parâmetro `?busca=` → `search` da API). Ele filtra a lista e as contagens dos chips e é limpo por "Limpar filtros". Na mesma mudança, a seleção automática do primeiro alerta (telas ≥ 1200 px) passou a esperar a lista do filtro atual; antes, ao trocar de filtro, ela podia abrir um alerta da lista anterior. Validado no modo mock e, depois do deploy de `fcecc00`, em produção: "cocho" retorna BUF001 e BR3002 (chips 2 / 1 Pendente / 1 Em análise) e o detalhe abre o primeiro da lista filtrada; "Gravidade = alta" retorna 4 alertas, todos Crítico.

**Passou, com divergência de texto ou adaptação** (atualizar o roteiro ou a tela):

- DASH-03: o link para a central se chama "Ver todos" (e "Ver mais 1"), não "Ver na central".
- DASH-03/ALR: o ladrilho e o título do alerta usam só os dígitos da identificação (`animalNumber`): BUF001 aparece como "1" e o alerta como "Animal 1 com alteração na alimentação". Isso é ambíguo para animais sem dígitos significativos.
- LOT-02: "Limpar filtros" só aparece no estado vazio; com resultado, a busca é limpa pelo próprio campo. O cabeçalho diz "1 lote cadastrado" com o filtro aplicado.
- LOT-04 / PRO-04: a validação ocorre na tela ("Informe o nome do lote.", "Informe o nome do protocolo.", "Selecione o tipo."), não com o texto do backend citado.
- LOT-09: o menor "Itens por página" é 15 e há só 3 lotes. A paginação foi validada com `/lotes?por_pagina=1` (1–1, 2–2, 3–3 de 3; "Próxima página" desabilitada no fim).
- ANI-08: Espécie e Status já vêm preenchidos (Bovino/Ativo) e não têm opção vazia; só Identificação e Lote mostram erro de obrigatório.
- ANI-12: o botão no detalhe se chama "Excluir"; o diálogo confirma com "Excluir animal".
- PRO-09: como o protocolo E2E já estava inativo, o diálogo de bloqueio mostra só "Fechar" (sem "Desativar protocolo").
- PRO-10: na tela do protocolo, "Remover associação de …" remove direto, sem diálogo de confirmação (na tela do animal há confirmação).
- ALR-04 a 08: o histórico é exibido do mais recente para o mais antigo.
- NAV-01: `/login` e `/cadastro` com sessão ativa redirecionam para `/` (o conteúdo delas foi validado sem sessão em AUTH-01/02). Nenhuma resposta 5xx; o console só tem os dois avisos de *future flags* do React Router.

**Regressão completa (6b68fd5)**

Os 87 casos foram reexecutados sobre o seed recém-implantado (carimbo
`1126B`) com scripts Playwright em 4 partes (AUTH/DASH; LOT/ANI/PRO/ASSOC/
API do user; READ/ALR/RN01; exclusões do admin, USR e NAV), mais DOC por
`curl`. Todos passaram. Na mesma data, `php artisan test` passou nos três
serviços (auth 47, herd 161, monitoring 126) com `pint` limpo, e `npm test`
passou no frontend (21). Ao final, herd e monitoring foram redeployados
para voltar ao seed; a conta `e2e+1126b@herdvision.dev` ficou no auth.

**Resultado por caso (primeira rodada, 19d405d)**

| Bloco | Casos |
|---|---|
| AUTH | 01 ✅ 02 ✅ 03 ✅ 04 ✅ 05 ✅ 06 ✅ 07 ✅ 08 ✅ 09 ✅ 10 ✅ 11 ✅ |
| DASH | 01 ✅ (12 / 3) 02 ✅ (4 / 2) 03 ✅ 04 ✅ 05 ✅ (4) |
| LOT | 01 ✅ 02 ✅ 03 ✅ 04 ✅ 05 ✅ 06 ✅ 07 ✅ 08 ✅ 09 ✅ |
| ANI | 01 ✅ 02 ✅ 03 ✅ 04 ✅ 05 ✅ 06 ❌ 07 ✅ 08 ✅ 09 ✅ 10 ✅ 11 ✅ 12 ✅ 13 ✅ |
| PRO | 01 ✅ 02 ✅ 03 ✅ 04 ✅ 05 ✅ 06 ✅ 07 ✅ 08 ✅ 09 ✅ 10 ✅ 11 ✅ |
| ASSOC | 01 ✅ 02 ✅ 03 ✅ 04 ✅ 05 ✅ |
| READ | 01 ✅ 02 ✅ (2 alertas altos) 03 ✅ (1 médio) 04 ✅ 05 ✅ 06 ✅ 07 ✅ |
| ALR | 01 ✅ 02 ✅ (7 / 2 / 1) 03 ⚠ 04 ✅ 05 ✅ 06 ✅ 07 ✅ 08 ✅ 09 ✅ (7 / 2, menu 7) |
| USR | 01 ✅ 02 ✅ 03 ✅ |
| API | 01 ✅ (401×3) 02 ✅ (403, animal mantido) 03 ✅ 04 ✅ 05 ✅ (422; mensagens em inglês, ver ANI-06) 06 ✅ 07 ✅ 08 ✅ 09 ✅ 10 ✅ (405×2) |
| NAV | 01 ✅ 02 ✅ |
| DOC | 01 ✅ 02 ✅ (`bearerAuth`; DELETE animal 401/403; POST readings 503) |

## 6. Rastreabilidade

| Requisito | Casos |
|---|---|
| R3-01 CRUD de Animais | ANI-01, 05--09, 12, LOT-07, API-05 |
| R3-02 CRUD de Protocolos | PRO-01, 03--10 |
| R3-03 Associação N:N | PRO-06, PRO-07, PRO-10, ASSOC-01--05, API-06 |
| R3-04 Monitoring no ar | DASH-02, todos os 🛰 |
| R3-05 Leituras | READ-01, 04--06, ANI-10, API-09 |
| R3-06 Geração de alertas | READ-02, 03, 07 |
| R3-07 RN01 | ALR-04--07, API-07, 08, 10 |
| R3-08 Histórico | ALR-04--08 |
| R3-09 Perfis e rotas protegidas | AUTH-03, 04, 10, LOT-01, 06, ANI-04, 11, PRO-11, USR-03, API-01--04 |
| R3-10 Busca, filtro e paginação | LOT-02, 09, ANI-02, 03, PRO-02, ALR-02, 03, USR-02, DASH-05, ALR-09 |
| R3-11 Telas contra a API real | NAV-01, DASH-01, ANI-01, 13, PRO-01, ALR-01, USR-01 |
| R3-12 Remoção do Google SSO | AUTH-01, AUTH-02 |
| R3-13 Pontos de complexidade (Swagger) | DOC-01, DOC-02 |

R3-14 (testes automatizados) e R3-15 (tag) são verificados fora do
navegador. R3-16 (demonstração) usa este roteiro como base.
