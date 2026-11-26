# HerdVision --- Release 2 (Encontro 2): Fundação

## 1. Objetivo da release

Estabelecer a fundação técnica do HerdVision, garantindo que frontend,
backend e banco de dados estejam integrados e que os principais fluxos
iniciais possam ser demonstrados de ponta a ponta.

A Release 2 deve entregar uma aplicação funcional em sua estrutura
básica. O foco não é concluir todas as funcionalidades do produto, mas
validar a arquitetura, a persistência, a autenticação, o primeiro CRUD e
o processo inicial de publicação.

## 2. Escopo e requisitos da Release 2

  --------------------------------------------------------------------------
  ID                Requisito          Descrição         Critério de aceite
  ----------------- ------------------ ----------------- -------------------
  R2-01             Integração         O frontend deve   Uma ação realizada
                    frontend/backend   consumir as APIs  na interface chega
                                       do backend por    à API e recebe uma
                                       meio de           resposta tratada
                                       requisições HTTP. pelo frontend.

  R2-02             Persistência no    Os serviços devem Os dados criados
                    banco              estar conectados  pela aplicação
                                       aos seus          permanecem
                                       respectivos       armazenados após
                                       bancos SQLite.    reiniciar os
                                                         serviços.

  R2-03             Modelagem do banco Criar as tabelas, As migrations
                                       atributos, chaves representam o
                                       e relacionamentos modelo definido
                                       de todas as       neste documento e
                                       entidades         podem ser
                                       previstas para o  executadas sem
                                       MVP.              erros.

  R2-04             Cadastro           Permitir que um   O cadastro é
                                       usuário crie uma  concluído pela
                                       conta informando  interface, validado
                                       nome, e-mail e    pela API e
                                       senha.            persistido no
                                                         banco.

  R2-05             Senha segura       Armazenar senhas  A senha persistida
                                       usando algoritmo  é um hash e a
                                       de hash           autenticação
                                       apropriado, nunca verifica a senha
                                       em texto puro.    usando o mecanismo
                                                         de hash do
                                                         framework.

  R2-06             Login              Permitir que um   Credenciais válidas
                                       usuário           permitem acesso;
                                       cadastrado entre  credenciais
                                       no sistema com    inválidas recebem
                                       e-mail e senha.   resposta de erro
                                                         adequada.

  R2-07             Logout             Permitir que o    Após o logout, a
                                       usuário encerre a credencial/sessão
                                       sessão            utilizada deixa de
                                       autenticada.      permitir acesso às
                                                         rotas protegidas,
                                                         conforme o
                                                         mecanismo de
                                                         autenticação
                                                         adotado.

  R2-08             Primeiro CRUD      Implementar um    É possível criar,
                    completo           CRUD completo de  listar, consultar,
                                       uma entidade de   editar e excluir
                                       negócio,          registros pela
                                       incluindo         interface, com
                                       interface, API e  persistência
                                       banco.            confirmada no
                                                         banco.

  R2-09             Layout base        Criar a estrutura As telas iniciais
                                       visual            utilizam um layout
                                       compartilhada da  consistente, com
                                       aplicação.        cabeçalho/área
                                                         principal e
                                                         elementos comuns
                                                         definidos pelo
                                                         projeto.

  R2-10             Navegação          Implementar       Os links e ações de
                                       navegação entre   navegação levam às
                                       as telas já       telas corretas,
                                       disponíveis.      respeitando o
                                                         estado de
                                                         autenticação.

  R2-11             Deploy inicial     Publicar uma      A URL publicada
                                       primeira versão   abre a aplicação e
                                       acessível do      permite validar os
                                       sistema, mesmo    fluxos implantados.
                                       que ainda         
                                       incompleta.       

  R2-12             Versionamento da   Registrar a       Existe uma tag
                    release            entrega por meio  `v0.2` apontando
                                       de uma tag Git.   para o commit
                                                         correspondente à
                                                         Release 2.

  R2-13             Demonstração       Preparar uma      A equipe consegue
                                       demonstração ao   demonstrar os
                                       vivo dos itens    fluxos
                                       entregues.        implementados no
                                                         ambiente local ou
                                                         publicado.
  --------------------------------------------------------------------------

## 3. Entidades do sistema

O modelo inicial prevê uma entidade de identidade e cinco entidades de
negócio. As entidades devem ser criadas nesta release, mesmo que nem
todas tenham CRUD ou telas concluídas.

### 3.1. Identity Service --- autenticação e usuários

#### Usuário (`users`)

  Campo          Tipo sugerido   Restrições / finalidade
  -------------- --------------- -------------------------------------------------
  `id`           Identificador   Chave primária.
  `name`         Texto           Obrigatório; nome do usuário.
  `email`        Texto           Obrigatório e único; utilizado no login.
  `password`     Texto           Obrigatório; armazenar somente o hash da senha.
  `role`         Texto           Obrigatório; perfil `admin` ou `user`.
  `created_at`   Data/hora       Data de criação.
  `updated_at`   Data/hora       Data da última atualização.

**Responsabilidade:** cadastro, autenticação, logout, identificação do
usuário e perfil de acesso.

### 3.2. Herd Service --- gestão do rebanho

#### Lote (`lots`)

  Campo           Tipo sugerido   Restrições / finalidade
  --------------- --------------- ------------------------------
  `id`            Identificador   Chave primária.
  `name`          Texto           Obrigatório; nome do lote.
  `description`   Texto           Opcional; descrição do lote.
  `created_at`    Data/hora       Data de criação.
  `updated_at`    Data/hora       Data da última atualização.

#### Animal (`animals`)

  -----------------------------------------------------------------------
  Campo                   Tipo sugerido           Restrições / finalidade
  ----------------------- ----------------------- -----------------------
  `id`                    Identificador           Chave primária.

  `identification`        Texto                   Obrigatório;
                                                  identificação única do
                                                  animal.

  `name`                  Texto                   Opcional; nome ou
                                                  identificação amigável.

  `species`               Texto                   Obrigatório; espécie.

  `breed`                 Texto                   Opcional; raça.

  `birth_date`            Data                    Opcional; data de
                                                  nascimento.

  `status`                Texto                   Obrigatório; situação
                                                  atual do animal.

  `lot_id`                Identificador           Chave estrangeira para
                                                  `lots.id`; pode ser
                                                  nulo se animais sem
                                                  lote forem permitidos.

  `created_at`            Data/hora               Data de criação.

  `updated_at`            Data/hora               Data da última
                                                  atualização.
  -----------------------------------------------------------------------

#### Protocolo de Manejo (`management_protocols`)

  Campo           Tipo sugerido   Restrições / finalidade
  --------------- --------------- ------------------------------------------------
  `id`            Identificador   Chave primária.
  `name`          Texto           Obrigatório; nome do protocolo.
  `description`   Texto           Opcional; descrição e orientações.
  `type`          Texto           Obrigatório; categoria do protocolo.
  `active`        Booleano        Obrigatório; indica se o protocolo está ativo.
  `created_at`    Data/hora       Data de criação.
  `updated_at`    Data/hora       Data da última atualização.

#### Associação entre Animal e Protocolo (`animal_management_protocol`)

Esta tabela implementa o relacionamento muitos-para-muitos entre animais
e protocolos.

  -------------------------------------------------------------------------------
  Campo                      Tipo sugerido           Restrições / finalidade
  -------------------------- ----------------------- ----------------------------
  `animal_id`                Identificador           Chave estrangeira para
                                                     `animals.id`.

  `management_protocol_id`   Identificador           Chave estrangeira para
                                                     `management_protocols.id`.

  `start_date`               Data                    Data de início da
                                                     associação.

  `status`                   Texto                   Situação da associação.

  `created_at`               Data/hora               Data de criação do vínculo.

  `updated_at`               Data/hora               Data da última atualização.
  -------------------------------------------------------------------------------

Para a primeira versão, pode ser utilizada uma chave primária composta
por `animal_id` e `management_protocol_id`, caso não seja necessário
registrar aplicações repetidas do mesmo protocolo ao mesmo animal. Se
for necessário manter esse histórico, a tabela deverá receber um
identificador próprio.

### 3.3. Monitoring Service --- monitoramento e alertas

#### Leitura de Monitoramento (`monitoring_readings`)

  -----------------------------------------------------------------------
  Campo                   Tipo sugerido           Restrições / finalidade
  ----------------------- ----------------------- -----------------------
  `id`                    Identificador           Chave primária.

  `animal_id`             Identificador externo   Identificador do animal
                                                  no Herd Service. Não é
                                                  chave estrangeira
                                                  local, pois os serviços
                                                  possuem bancos
                                                  independentes.

  `temperature`           Decimal                 Opcional; temperatura
                                                  registrada.

  `activity_level`        Texto ou decimal        Opcional; nível de
                                                  atividade observado.

  `feeding_level`         Texto ou decimal        Opcional; nível de
                                                  alimentação observado.

  `recorded_at`           Data/hora               Obrigatório; momento da
                                                  leitura.

  `created_at`            Data/hora               Data de criação do
                                                  registro.

  `updated_at`            Data/hora               Data da última
                                                  atualização.
  -----------------------------------------------------------------------

#### Alerta (`alerts`)

  -------------------------------------------------------------------------
  Campo                     Tipo sugerido           Restrições / finalidade
  ------------------------- ----------------------- -----------------------
  `id`                      Identificador           Chave primária.

  `animal_id`               Identificador externo   Identificador do animal
                                                    no Herd Service.

  `monitoring_reading_id`   Identificador local     Referência à leitura
                                                    relacionada, quando
                                                    houver.

  `type`                    Texto                   Obrigatório; tipo do
                                                    alerta.

  `description`             Texto                   Obrigatório; descrição
                                                    da condição
                                                    identificada.

  `severity`                Texto                   Obrigatório; nível de
                                                    gravidade.

  `status`                  Texto                   Obrigatório;
                                                    `Pendente`,
                                                    `Em análise` ou
                                                    `Resolvido`.

  `created_at`              Data/hora               Data de criação do
                                                    alerta.

  `updated_at`              Data/hora               Data da última
                                                    atualização.
  -------------------------------------------------------------------------

**Regra inicial:** todo alerta deve ser criado com status `Pendente`. O
fluxo previsto é `Pendente` → `Em análise` → `Resolvido`. As transições
deverão ser validadas no backend nas próximas etapas de implementação.

## 4. Relacionamentos

### 4.1. Relacionamentos dentro do Herd Service

  -------------------------------------------------------------------------------------
  Origem            Relacionamento    Destino           Implementação
  ----------------- ----------------- ----------------- -------------------------------
  Lote              1:N               Animal            `animals.lot_id` referencia
                                                        `lots.id`.

  Animal            N:N               Protocolo de      Tabela associativa
                                      Manejo            `animal_management_protocol`.
  -------------------------------------------------------------------------------------

Representação:

``` text
Lote 1 ───────── N Animal

Animal N ──────── N Protocolo de Manejo
          |
          └── animal_management_protocol
```

### 4.2. Relacionamentos dentro do Monitoring Service

  ---------------------------------------------------------------------------------------
  Origem            Relacionamento    Destino           Implementação
  ----------------- ----------------- ----------------- ---------------------------------
  Animal            1:N lógico        Leitura de        `monitoring_readings.animal_id`
                                      Monitoramento     armazena o ID do animal no Herd
                                                        Service.

  Animal            1:N lógico        Alerta            `alerts.animal_id` armazena o ID
                                                        do animal no Herd Service.

  Leitura de        1:N lógico        Alerta            `alerts.monitoring_reading_id`
  Monitoramento                                         referencia uma leitura do próprio
                                                        Monitoring Service, quando
                                                        houver.
  ---------------------------------------------------------------------------------------

### 4.3. Limites entre microsserviços

Cada microsserviço possui seu próprio banco SQLite. Portanto:

-   O Identity Service mantém os dados de usuários.
-   O Herd Service mantém lotes, animais, protocolos e suas associações.
-   O Monitoring Service mantém leituras e alertas.
-   Não criar chaves estrangeiras físicas entre arquivos SQLite de
    serviços diferentes.
-   Referências a registros de outros serviços devem ser tratadas por
    identificadores e validadas por comunicação entre APIs quando
    necessário.

## 5. Primeiro CRUD da Release 2

**CRUD recomendado: Lotes (`lots`).**

A entidade Lote é uma boa candidata para o primeiro CRUD porque possui
estrutura simples e permite validar todo o caminho técnico sem depender
inicialmente de relacionamentos complexos.

Operações esperadas:

  Operação         Método HTTP sugerido   Endpoint sugerido
  ---------------- ---------------------- -------------------
  Listar lotes     GET                    `/api/lots`
  Consultar lote   GET                    `/api/lots/{id}`
  Criar lote       POST                   `/api/lots`
  Atualizar lote   PUT/PATCH              `/api/lots/{id}`
  Excluir lote     DELETE                 `/api/lots/{id}`

O CRUD deve funcionar pelo fluxo completo:

``` text
Tela do frontend
      |
      v
Requisição HTTP
      |
      v
API do Herd Service
      |
      v
Validação e regra de aplicação
      |
      v
Banco SQLite do Herd Service
      |
      v
Resposta da API
      |
      v
Atualização da interface
```

**Critério de conclusão:** todas as cinco operações devem ser
executáveis pela interface, e as alterações devem permanecer no banco
após reiniciar a aplicação.

Se a equipe preferir iniciar pelo CRUD de Animais, deverá implementar
primeiro a entidade Lote e definir como tratar a associação `lot_id`.

## 6. Autenticação: fluxo esperado

A Release 2 deve entregar cadastro, login e logout de ponta a ponta.

### Cadastro

1.  O usuário preenche nome, e-mail e senha no frontend.
2.  O frontend envia os dados ao Identity Service.
3.  A API valida os campos e verifica se o e-mail já está cadastrado.
4.  A senha é armazenada por meio de hash seguro.
5.  O usuário é persistido no banco SQLite do Identity Service.
6.  A API retorna uma resposta adequada, sem expor a senha ou seu hash.

### Login

1.  O usuário informa e-mail e senha.
2.  O frontend envia as credenciais ao Identity Service.
3.  A API verifica as credenciais.
4.  A API estabelece a autenticação conforme o mecanismo definido para o
    projeto.
5.  O frontend passa a reconhecer o usuário autenticado e permite
    acessar as áreas protegidas.

### Logout

1.  O usuário solicita sair pelo frontend.
2.  O frontend aciona o endpoint de logout.
3.  O Identity Service invalida a credencial ou encerra a sessão,
    conforme o mecanismo adotado.
4.  O frontend limpa o estado de autenticação e redireciona para o
    login.
5.  As rotas protegidas deixam de aceitar a credencial encerrada.

**Atenção à arquitetura:** o planejamento geral exige autenticação JWT.
Laravel Sanctum utiliza tokens próprios e não emite JWT por padrão. A
implementação escolhida deve cumprir explicitamente o requisito JWT; não
considerar Sanctum, isoladamente, como comprovação desse requisito.

## 7. Layout base e navegação

A estrutura visual inicial deverá contemplar:

-   Layout compartilhado para as páginas autenticadas.
-   Identificação visual do HerdVision.
-   Menu ou navegação principal.
-   Área de conteúdo das páginas.
-   Acesso às ações de login e logout conforme o estado de autenticação.
-   Rotas públicas para login e cadastro.
-   Rotas protegidas para as funcionalidades autenticadas.
-   Tratamento de estados básicos de carregamento e erro nas
    requisições.

A Release 2 não exige que todas as telas finais estejam implementadas. O
objetivo é estabelecer a estrutura que será reutilizada nas próximas
releases.

## 8. Deploy inicial

Publicar uma versão inicial acessível, mesmo que incompleta.

Checklist:

-   [ ] Frontend publicado.
-   [ ] Backend publicado ou acessível por uma infraestrutura
    compatível.
-   [ ] Frontend configurado para consumir a URL correta da API.
-   [ ] Variáveis de ambiente configuradas no ambiente publicado.
-   [ ] Banco e persistência compatíveis com o ambiente de deploy.
-   [ ] Cadastro e login testados no ambiente publicado, se já estiverem
    incluídos na publicação.
-   [ ] URL registrada no README.

**Atenção ao SQLite em produção:** o arquivo SQLite precisa estar em
armazenamento persistente. Não presumir que o sistema de arquivos de uma
hospedagem serverless seja persistente. Validar a infraestrutura antes
de considerar o deploy concluído.

## 9. Entrega e versionamento

A Release 2 será considerada entregue quando houver:

-   [ ] Frontend e backend integrados.
-   [ ] Serviços conectados aos respectivos bancos SQLite.
-   [ ] Todas as entidades e relacionamentos modelados por migrations.
-   [ ] Cadastro funcional de ponta a ponta.
-   [ ] Login funcional de ponta a ponta.
-   [ ] Logout funcional de ponta a ponta.
-   [ ] Senhas armazenadas com hash seguro.
-   [ ] Um CRUD completo pela interface, API e banco.
-   [ ] Layout base implementado.
-   [ ] Navegação entre as telas disponíveis.
-   [ ] Deploy inicial publicado e acessível.
-   [ ] Demonstração ao vivo preparada.
-   [ ] Tag Git `v0.2` criada e enviada ao repositório remoto.

Comandos sugeridos para versionar a entrega, após validar e commitar as
alterações:

``` bash
git status
git add .
git commit -m "feat: implement release 2 foundation"
git tag -a v0.2 -m "HerdVision Release 2"
git push origin <branch>
git push origin v0.2
```

Substituir `<branch>` pelo nome da branch utilizada no repositório.

## 10. Fora do escopo obrigatório desta release

Salvo se a equipe decidir antecipar algum item, não é necessário
concluir nesta release:

-   CRUD completo de Animais e Protocolos de Manejo.
-   Telas completas de monitoramento e alertas.
-   Fluxo completo de tratamento de alertas.
-   Google SSO.
-   Dashboard com todos os indicadores.
-   Documentação Swagger completa.
-   Cobertura ampliada de testes automatizados.
-   Deploy final de produção.

Esses itens permanecem no planejamento geral e devem ser distribuídos
nas releases seguintes.

------------------------------------------------------------------------

**Status:** documento de escopo da Release 2 --- Fundação.\
**Versão prevista do sistema:** `v0.2`.\
**Entrega:** demonstração ao vivo e tag Git `v0.2`.
