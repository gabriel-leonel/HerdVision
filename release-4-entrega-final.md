# HerdVision --- Release 4 (Encontro 4): Entrega final

## 1. Objetivo da release

Fechar o HerdVision para a avaliação final, a partir da Release 3
(`v0.3`), que entregou o produto completo: CRUDs, relacionamentos, RN01,
perfis, busca e paginação, as 11 telas contra a API real e o Swagger.

A Release 4 tem duas frentes:

1. **CI/CD:** testes automáticos em cada push e deploy só quando os testes
    passam. É o último ponto de complexidade previsto (3 pontos) e leva o
    projeto a **9 pontos**, acima do mínimo de 8.
2. **Entregáveis finais** da §14 de `herdvision_planning.md`: URL
    pública validada, README completo (com checklist de avaliação e uso
    de IA) e a tag `v1.0`.

Não entram funcionalidades novas nem melhorias além do CI/CD (§4). A única
mudança de dados é a troca de um nome no seed de demonstração (R4-03).

## 2. Escopo e requisitos da Release 4

| ID | Requisito | Descrição | Critério de aceite |
|---|---|---|---|
| R4-01 | CI no GitHub Actions | Validar cada push e pull request na `main` com lint, testes e build dos três serviços e do frontend. | O workflow roda em cada push/PR, e um teste quebrado deixa o check vermelho. |
| R4-02 | Deploy condicionado aos testes | Publicar no Render e na Vercel só depois que o CI passar. | Um push com teste quebrado não gera deploy em nenhum dos quatro destinos; um push verde publica os quatro. |
| R4-03 | Ajuste no seed | Renomear o animal BUF001 de "Negão" para "Bravo". | O seed do herd e o roteiro E2E usam "Bravo"; nenhuma ocorrência de "Negão" no repositório. |
| R4-04 | README raiz | README completo, com produto, arquitetura, execução local e usuários de teste. | `README.md` na raiz cobre todos os itens da §14.3 do planejamento. |
| R4-05 | Checklist de avaliação | Mostrar no README o atendimento à métrica mínima e aos pontos de complexidade. | Cada critério (RNF11 a RNF22) e cada um dos 9 pontos tem uma evidência: tela, rota, link ou quantidade de testes. |
| R4-06 | Uso de IA | Seção no README descrevendo como a IA foi usada. | A seção cobre planejamento, desenvolvimento, documentação e testes. |
| R4-07 | Regressão final | Validar a versão final em produção. | Roteiro E2E (`release-3-testes-e2e.md`) com 87/87 em produção, `php artisan test` verde nos três serviços e `npm test` verde no frontend. |
| R4-08 | Versionamento | Registrar a entrega final. | Tag anotada `v1.0` no commit final, enviada ao repositório remoto. |

## 3. Ponto de partida (`v0.3`)

**Já entregue:**

- Três microsserviços Laravel 13 (PHP 8.3) no Render e frontend React/Vite
    na Vercel, com JWT RS256.
- 334 testes no backend (auth 47, herd 161, monitoring 126), `pint` limpo,
    e 21 testes no frontend (Vitest).
- Swagger em `/docs/api` nos três serviços.
- Roteiro E2E com 87 casos, executado com sucesso em produção.

**Lacunas para esta release:**

- Não existe `.github/`: nenhum teste roda automaticamente.
- O deploy hoje é direto por push, sem validação:
    - Render: auto-deploy a cada commit na `main`. O herd e o auth só
        redeployam quando o commit toca o diretório deles (filtro de
        caminho); o monitoring redeploya em qualquer commit.
    - Vercel: integração com o GitHub publica a `main` em produção.
        `HerdVision_frontend/vercel.json` só tem a regra de rewrite da SPA.
- Não há README na raiz (só os READMEs de cada serviço e do frontend).

**Fatos úteis para o CI:**

- Os Dockerfiles usam `php:8.3-cli`; o CI deve usar a mesma versão.
- Os testes do backend usam SQLite em memória (`phpunit.xml`) e geram um
    par RSA efêmero em `tests/TestCase.php`, então não precisam de
    segredos. Só precisam de um `.env` com `APP_KEY`.
- O frontend tem os scripts `typecheck`, `test` e `build` no
    `package.json`, e não tem lint configurado.

## 4. Decisões tomadas para esta release

| Tema | Decisão |
|---|---|
| Natureza da release | A R4 é a **entrega final**: tag `v1.0`, sem release posterior. |
| Estratégia de CI/CD | GitHub Actions roda os testes. O Render usa **"Auto-Deploy: After CI Checks Pass"** e a Vercel publica **pelo próprio workflow**, depois dos testes (§5). |
| Persistência | O SQLite segue **efêmero** no Render free, sem custo. Os dados voltam ao seed a cada deploy ou reinício, e o README avisa isso. |
| Melhorias extras | **Nenhuma.** Com o CI/CD o projeto fecha 9 pontos (mínimo 8). Os achados menores do E2E e os itens de qualidade ficam fora do escopo (§9). |
| Login social | Segue fora do produto, por decisão da R3. Era um ponto de complexidade opcional, não um requisito obrigatório. |
| Seed | O animal BUF001 passa a se chamar **"Bravo"**. |

## 5. Desenho do CI/CD

### 5.1. Fluxo

```text
push / PR na main
        │
        ▼
GitHub Actions — workflow "CI" (.github/workflows/ci.yml)
  ├─ backend (matriz): auth-service · herd-service · monitoring-service
  │     composer install → .env + key:generate → pint --test → php artisan test
  ├─ frontend:  npm ci → typecheck → npm test → build
  └─ deploy-frontend (só em push na main; needs: backend + frontend)
        vercel pull → vercel build --prod → vercel deploy --prebuilt --prod
        │
        ▼
Checks verdes no commit
  └─ Render (3 serviços, "After CI Checks Pass") inicia o deploy
```

Se qualquer job de teste falhar, o commit fica com check vermelho: o
Render não implanta e o job da Vercel nem começa.

### 5.2. Workflow `.github/workflows/ci.yml`

- **Gatilhos:** `push` e `pull_request` na `main`. O job de deploy roda
    só em `push` (`if: github.event_name == 'push'`).
- **Job `backend`:** matriz com os três serviços.
    `defaults.run.working-directory` aponta para
    `HerdVision_backend/services/${{ matrix.service }}`. Usar
    `shivammathur/setup-php` (PHP 8.3, extensões `pdo_sqlite`,
    `openssl`) e cache do diretório do Composer por `composer.lock`.
- **Job `frontend`:** `actions/setup-node` (Node 20 LTS, cache npm por
    `package-lock.json`), em `HerdVision_frontend`.
- **Job `deploy-frontend`:** `needs: [backend, frontend]`, com a Vercel CLI.
    As variáveis `VITE_*` de produção vêm do `vercel pull` (já estão
    configuradas no projeto na Vercel), então não precisam ser copiadas
    para o GitHub.
- **Secrets no GitHub:** `VERCEL_TOKEN`, `VERCEL_ORG_ID` (time
    `catateras-projects`) e `VERCEL_PROJECT_ID` (`herdvision-frontend`).

### 5.3. Configuração no Render

Nos três serviços (`auth-service`, `herd-service`, `monitoring-service`),
trocar o auto-deploy de "On Commit" para **"After CI Checks Pass"**
(Settings → Build & Deploy, ou pela API do Render). O filtro de caminho
do herd e do auth continua valendo.

### 5.4. Configuração na Vercel

Em `HerdVision_frontend/vercel.json`, desligar o deploy pela integração
com o Git, mantendo o rewrite:

```json
{
  "git": { "deploymentEnabled": false },
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

A partir daí, só o job `deploy-frontend` publica em produção.

### 5.5. Validação do CI/CD

1. Abrir um PR com um teste quebrado de propósito: o check fica vermelho
    e nada é publicado.
2. Corrigir e fazer o merge: os quatro jobs ficam verdes, o Render
    redeploya o que mudou e a Vercel publica o frontend.
3. Registrar os links das execuções (uma vermelha, uma verde) no README,
    como evidência do ponto de complexidade.

## 6. Pontos de complexidade

| Item (enunciado) | Pontos | Release | Evidência |
|---|---|---|---|
| Backend em microsserviços | 3 | R3 | auth, herd e monitoring publicados no Render |
| Testes automatizados (mín. 10) | 2 | R3 | 334 no backend + 21 no frontend |
| Documentação da API (Swagger/OpenAPI) | 1 | R3 | `/docs/api` nos três serviços |
| CI/CD: deploy automático a cada push | 3 | **R4** | workflow "CI" + deploy condicionado (§5) |
| **Total** | **9** | | mínimo exigido: 8 |

## 7. README raiz: esqueleto

1. **HerdVision:** descrição do produto e público-alvo (propriedades de
    corte e leite, de 200 a 2.000 animais) e badge do workflow CI.
2. **Acesso:** URL pública, usuários de teste (`admin@herdvision.com` /
    `Admin@1234`, `user@herdvision.com` / `User@1234`) e aviso de que os
    dados voltam ao seed a cada deploy e de que o primeiro acesso pode
    levar até 1 minuto (Render free).
3. **Arquitetura:** diagrama do frontend e dos três serviços, papel de
    cada um, JWT RS256 (só o auth assina), validação entre serviços
    (monitoring → herd), um SQLite por serviço.
4. **Tecnologias:** Laravel 13 / PHP 8.3, React 18 / Vite / TypeScript,
    SQLite, Render, Vercel, GitHub Actions, Scramble (Swagger), PHPUnit,
    Vitest e Playwright (E2E).
5. **Execução local:** pré-requisitos, chaves JWT, `.env`, migrations e
    seeders de cada serviço, portas 8000/8001/8002/5173 e o modo mock do
    front (com links para os READMEs de cada serviço).
6. **Documentação da API:** os três links do Swagger e a coleção do
    Insomnia.
7. **Testes:** como rodar as suítes e o roteiro E2E.
8. **Checklist de avaliação:** tabela com RNF11 a RNF22 e os 9 pontos,
    cada linha com a evidência.
9. **Uso de IA:** ferramentas usadas e em que etapas (planejamento dos
    releases, implementação, revisão, testes E2E com Playwright,
    documentação), com o que foi revisado pela equipe.
10. **Equipe** e licença.

## 8. Riscos

| Risco | Mitigação |
|---|---|
| O Render só implanta se os checks do commit estiverem verdes; um job de deploy da Vercel falhando também deixa o commit vermelho. | Manter o job da Vercel separado dos testes e reexecutá-lo pelo GitHub se falhar só por instabilidade. |
| Cold start do Render free na demonstração ao vivo. | Abrir `/up` nos três serviços alguns minutos antes. |
| Dados efêmeros: o que for criado na demo some no próximo deploy. | Não fazer push durante a avaliação; o seed já cobre todos os fluxos. |
| Token da Vercel exposto. | Guardar só como secret do GitHub, com escopo no time do projeto. |
| Tempo do CI (três `composer install`). | Cache do Composer e do npm, e jobs em paralelo. |

## 9. Entrega e versionamento

A Release 4 (entrega final) estará concluída quando houver:

- [ ] Workflow "CI" rodando em push e PR, com os três serviços e o
    frontend.
- [ ] Render com "After CI Checks Pass" nos três serviços.
- [ ] Vercel publicando só pelo workflow, depois dos testes.
- [ ] CI/CD validado com um check vermelho (sem deploy) e um verde (com
    deploy).
- [ ] Seed com "Bravo" no lugar de "Negão", e roteiro E2E atualizado.
- [ ] README raiz completo, com checklist de avaliação e uso de IA.
- [ ] Regressão final: 87/87 no E2E em produção e suítes verdes.
- [ ] Tag Git `v1.0` criada e enviada ao repositório remoto.

Comandos sugeridos, após validar e commitar:

```bash
git status
git tag -a v1.0 -m "HerdVision 1.0 — entrega final"
git push origin main
git push origin v1.0
```

### Fora do escopo

Por decisão da equipe, ficam fora da entrega final:

- Achados menores do E2E: o rótulo "Animal 1" para BUF001, o texto
    "1 lote cadastrado" com filtro, a remoção de associação sem
    confirmação na tela de protocolos e os textos que divergem do roteiro.
- Revisão geral de telas de erro, ajustes visuais finos e responsividade.
- Revogação de logout propagada para o herd e o monitoring (hoje eles
    aceitam o token até ele expirar).
- Persistência real do SQLite em produção (disco persistente ou
    Postgres).
- Suporte a várias propriedades com isolamento de dados.
- Login social.

------------------------------------------------------------------------

**Status:** documento de escopo da Release 4 --- Entrega final.\
**Versão prevista do sistema:** `v1.0`.\
**Entrega:** URL pública, repositório com tag `v1.0` e README.
