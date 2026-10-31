# HerdVision — Planejamento de Requisitos do Aplicativo Web

## 1. Objetivo

Este documento organiza os requisitos funcionais, não funcionais e a proposta inicial de modelagem para o MVP web da **HerdVision**, uma plataforma de pecuária de precisão que busca transformar dados do rebanho em decisões inteligentes.

A proposta considera os requisitos acadêmicos informados e o contexto do Trabalho 1. A solução deve permitir o gerenciamento do rebanho, o acompanhamento de informações de monitoramento e o tratamento de alertas.

## 2. Requisitos funcionais

Requisitos funcionais descrevem as ações e os comportamentos que o sistema deverá oferecer aos usuários.

| ID | Requisito | Descrição | Prioridade |
|---|---|---|---|
| RF01 | Cadastro de usuários | Permitir que novos usuários criem uma conta com nome, e-mail e senha. | Alta |
| RF02 | Autenticação | Permitir login com e-mail e senha usando autenticação baseada em JWT. | Alta |
| RF03 | Login social | Permitir autenticação por meio de provedores sociais. Google SSO é um dos provedores previstos. | Média |
| RF04 | Controle de acesso | Diferenciar os perfis `admin` e `user` e restringir funcionalidades e endpoints conforme as permissões. | Alta |
| RF05 | Dashboard | Exibir indicadores gerais do rebanho, como quantidade de animais e resumo dos alertas. | Alta |
| RF06 | Gerenciamento de animais | Permitir criar, listar, consultar, editar e excluir animais. | Alta |
| RF07 | Gerenciamento de lotes | Permitir criar, listar, consultar, editar e excluir lotes de animais. | Alta |
| RF08 | Gerenciamento de protocolos de manejo | Permitir criar, listar, consultar, editar e excluir protocolos de manejo. | Alta |
| RF09 | Associação de animais a lotes | Permitir organizar os animais em lotes. | Alta |
| RF10 | Associação de protocolos a animais | Permitir associar vários protocolos a um animal e um protocolo a vários animais. | Média |
| RF11 | Registro de monitoramento | Permitir registrar e consultar dados de monitoramento de um animal, como temperatura, movimentação e alimentação. | Alta |
| RF12 | Gerenciamento de alertas | Permitir consultar alertas relacionados a alterações nos indicadores dos animais. | Alta |
| RF13 | Fluxo de tratamento de alertas | Permitir alterar o status de um alerta de `Pendente` para `Em análise` e depois para `Resolvido`, respeitando as transições permitidas. | Alta |
| RF14 | Busca e paginação | Permitir pesquisar e paginar os registros nas telas de listagem. | Alta |
| RF15 | Validação de dados | Validar campos obrigatórios, formatos, valores permitidos e regras de integridade no backend. | Alta |
| RF16 | Documentação da API | Disponibilizar documentação interativa dos endpoints por meio do Swagger. | Alta |
| RF17 | Gestão de usuários | Permitir que administradores consultem e gerenciem usuários, respeitando as regras de autorização. | Média |

### 2.1. Observações

- As entidades **Animal**, **Lote** e **Protocolo de Manejo** foram escolhidas para possuir CRUD completo pela interface.
- A exclusão deve respeitar os relacionamentos existentes. Por exemplo, um lote com animais associados não deve ser excluído sem que as associações sejam tratadas.
- A geração de alertas pode começar com regras simples e dados simulados. Um modelo de IA treinado e sensores físicos não são necessários para a primeira demonstração.
- Os alertas indicam condições que merecem avaliação; não devem ser apresentados como diagnóstico veterinário.

## 3. Requisitos não funcionais e restrições técnicas

Requisitos não funcionais descrevem características técnicas, arquiteturais e de qualidade. Alguns itens da lista original são mais precisamente restrições quantitativas ou requisitos funcionais de segurança; foram mantidos aqui para que todos os critérios da atividade fiquem rastreáveis.

### 3.1. Arquitetura e desenvolvimento

| ID | Requisito | Descrição |
|---|---|---|
| RNF01 | Arquitetura de microsserviços | Organizar o backend em três microsserviços com responsabilidades definidas. |
| RNF02 | Persistência | Utilizar banco de dados persistente para armazenar usuários e entidades de negócio. |
| RNF03 | Controle de versão | Utilizar Git e um repositório remoto para versionar o código. |
| RNF04 | Documentação técnica | Documentar os endpoints, parâmetros, respostas e autenticação por meio do Swagger. |
| RNF05 | Testes automatizados | Implementar pelo menos dois testes automatizados de comportamentos relevantes. |
| RNF06 | CI/CD | Configurar integração e entrega contínuas para validar e implantar a aplicação. |
| RNF07 | Hospedagem | Implantar a aplicação web na Vercel, conforme exigido. |
| RNF08 | Segurança de credenciais | Armazenar senhas com hash seguro e configurar segredos por variáveis de ambiente. |
| RNF09 | Segurança de endpoints | Validar autenticação e permissões no backend para endpoints protegidos. |
| RNF10 | Manutenibilidade | Modularizar o código e separar responsabilidades entre os serviços. |

### 3.2. Critérios quantitativos da atividade

| ID | Critério | Meta |
|---|---|---|
| RNF11 | Telas distintas | Pelo menos 8 telas distintas. Login e cadastro contam; modais e pop-ups não contam. |
| RNF12 | Entidades de negócio | Pelo menos 4 entidades de negócio persistidas além de Usuário. |
| RNF13 | CRUD completo | Pelo menos 3 entidades com criar, listar, editar e excluir pela interface. |
| RNF14 | Relacionamento 1:N | Implementar pelo menos um relacionamento de um para muitos. |
| RNF15 | Relacionamento N:N | Implementar pelo menos um relacionamento de muitos para muitos. |
| RNF16 | Regra de negócio | Implementar pelo menos uma funcionalidade além do CRUD. |
| RNF17 | Busca e paginação | Oferecer busca e paginação nas listagens. |
| RNF18 | Cadastro, JWT e perfis | Implementar cadastro, autenticação JWT e os perfis `admin` e `user`, com endpoints restritos. |
| RNF19 | Testes | Implementar pelo menos dois testes automatizados. |
| RNF20 | Login social | Implementar os provedores de login social exigidos no enunciado. |
| RNF21 | Deploy | Publicar a aplicação na Vercel. |
| RNF22 | Deploy automático (extra) | Automatizar a implantação a cada push, após as validações necessárias. |

**Ponto a confirmar no enunciado:** a lista menciona “2 login social (Google SSO)”. Isso pode significar dois provedores sociais, ou dois mecanismos/fluxos de login. Confirmar a interpretação com o professor antes de fechar o escopo. Até essa confirmação, Google SSO é o único provedor explicitamente identificado.

### 3.3. Observação sobre a Vercel

A Vercel é adequada para o frontend e para backends compatíveis com funções serverless. Microsserviços que exigem processos contínuos ou tarefas em segundo plano podem precisar de outra infraestrutura. A arquitetura de implantação deve ser escolhida conforme as tecnologias e as limitações de hospedagem adotadas.

## 4. Arquitetura inicial proposta

| Serviço | Responsabilidade | Recursos principais |
|---|---|---|
| **MS1 — Identity Service** | Autenticação, autorização e usuários. | Cadastro, login, JWT, perfis e gestão de usuários. |
| **MS2 — Herd Service** | Gestão do rebanho. | Animais, lotes e protocolos de manejo. |
| **MS3 — Monitoring Service** | Monitoramento e alertas. | Leituras, indicadores e alertas. |

A divisão deve evitar microsserviços sem responsabilidade clara. A documentação Swagger deve cobrir os endpoints dos serviços de forma acessível e consistente.

## 5. Modelo de entidades

A proposta inclui cinco entidades de negócio além de Usuário, superando o mínimo de quatro.

| Entidade | Finalidade | Atributos principais sugeridos |
|---|---|---|
| **Usuário** | Representar as pessoas que acessam o sistema. | `id`, `nome`, `email`, `password_hash`, `perfil` |
| **Animal** | Armazenar dados individuais do animal. | `id`, `identificacao`, `nome`, `especie`, `raca`, `data_nascimento`, `status`, `lote_id` |
| **Lote** | Agrupar animais para facilitar o manejo. | `id`, `nome`, `descricao`, `data_criacao` |
| **ProtocoloManejo** | Representar procedimentos ou protocolos de manejo. | `id`, `nome`, `descricao`, `tipo`, `ativo` |
| **LeituraMonitoramento** | Registrar dados observados ou coletados sobre um animal. | `id`, `animal_id`, `temperatura`, `nivel_atividade`, `nivel_alimentacao`, `data_hora` |
| **Alerta** | Registrar alterações que demandem atenção. | `id`, `animal_id`, `leitura_id`, `tipo`, `descricao`, `gravidade`, `status`, `data_hora` |

Os atributos são uma proposta inicial e deverão ser refinados durante a modelagem e a implementação.

### 5.1. Relacionamentos 1:N

**Lote e Animal**

```text
Lote 1 ───────── N Animal
```

Um lote pode possuir vários animais; cada animal fica associado a um lote por vez. `Animal.lote_id` referencia `Lote.id`.

**Animal e LeituraMonitoramento**

```text
Animal 1 ───────── N LeituraMonitoramento
```

Um animal pode ter várias leituras ao longo do tempo. `LeituraMonitoramento.animal_id` referencia `Animal.id`.

**Animal e Alerta**

```text
Animal 1 ───────── N Alerta
```

Um animal pode gerar vários alertas. Cada alerta pertence a um animal e pode referenciar uma leitura relacionada.

### 5.2. Relacionamento N:N

**Animal e ProtocoloManejo**

```text
Animal N ───────── N ProtocoloManejo
```

Um animal pode estar associado a vários protocolos e um protocolo pode ser aplicado a vários animais. Em banco relacional, o relacionamento será implementado por uma tabela associativa `AnimalProtocolo`.

| Campo | Finalidade |
|---|---|
| `animal_id` | Referência ao animal. |
| `protocolo_id` | Referência ao protocolo. |
| `data_inicio` | Data de início da associação. |
| `status` | Situação da associação. |

Se o sistema precisar manter o histórico de aplicações repetidas do mesmo protocolo ao mesmo animal, a tabela associativa deverá ter identificador próprio e campos de data adequados, em vez de usar apenas a chave composta por animal e protocolo.

A tabela associativa é uma estrutura de relacionamento; não é necessário contá-la como entidade de negócio para atingir o mínimo solicitado.

## 6. Regra de negócio principal: fluxo de tratamento de alertas

### RN01 — Transição de status de alertas

**Objetivo:** permitir que os usuários acompanhem a situação dos alertas e registrem seu tratamento.

Estados previstos:

- `Pendente`
- `Em análise`
- `Resolvido`

Fluxo padrão:

```text
PENDENTE
    |
    v
EM ANÁLISE
    |
    v
RESOLVIDO
```

Regras:

1. Um alerta é criado com status `Pendente`.
2. Um usuário autorizado pode mudar o status para `Em análise`.
3. Após a avaliação, o usuário pode marcar o alerta como `Resolvido`.
4. Um alerta resolvido não deve voltar diretamente para `Pendente`. Caso seja necessário reabri-lo, deverá existir uma ação explícita de reabertura e uma regra correspondente.
5. Todas as transições devem ser validadas no backend.
6. Apenas usuários autenticados e autorizados podem alterar o status.
7. O sistema deve registrar a data da alteração e, idealmente, o usuário responsável.

Exemplo de funcionamento:

1. Uma leitura de monitoramento é registrada.
2. Uma regra identifica uma condição que merece atenção.
3. O sistema cria um alerta.
4. O produtor consulta o alerta.
5. O alerta é colocado em análise.
6. Após a verificação, o usuário registra a resolução.

Na primeira versão, a geração de alertas poderá usar regras simples e dados simulados. Isso permite demonstrar a funcionalidade sem depender de sensores físicos ou de um modelo de IA treinado.

## 7. Planejamento das telas

A proposta é planejar dez telas, ultrapassando o mínimo de oito.

| Nº | Tela | Funcionalidades principais |
|---|---|---|
| 1 | Login | Autenticação com e-mail e senha e acesso ao login social. |
| 2 | Cadastro | Criação de conta e validação dos campos. |
| 3 | Dashboard | Indicadores do rebanho e resumo dos alertas. |
| 4 | Listagem de animais | Pesquisa, paginação, filtros e acesso aos detalhes. |
| 5 | Cadastro/edição de animal | Formulário para criar ou editar um animal. |
| 6 | Detalhes do animal | Dados individuais, lote, histórico de monitoramento e alertas. |
| 7 | Listagem de lotes | Consulta, pesquisa, paginação e gerenciamento dos lotes. |
| 8 | Cadastro/edição de lote | Formulário para criar ou editar um lote. |
| 9 | Protocolos de manejo | Listagem, criação, edição, exclusão e associação de protocolos. |
| 10 | Central de alertas | Listagem, filtros, detalhes e tratamento de alertas. |

Para assegurar o CRUD completo, as telas de animais, lotes e protocolos devem permitir as operações de criar, listar, editar e excluir. A contagem final de telas deve refletir as telas efetivamente implementadas; modais e pop-ups não contam como telas distintas.

## 8. Matriz inicial de permissões

A matriz abaixo é uma proposta inicial de autorização. As permissões ainda precisam ser confirmadas conforme o escopo desejado.

| Funcionalidade | Admin | User |
|---|---|---|
| Acessar dashboard | Sim | Sim |
| Consultar animais e lotes | Sim | Sim |
| Cadastrar e editar animais | Sim | Conforme política definida |
| Excluir animais | Sim | Não |
| Gerenciar protocolos | Sim | Conforme política definida |
| Consultar alertas | Sim | Sim |
| Alterar status de alertas | Sim | Sim |
| Gerenciar usuários | Sim | Não |

O backend deverá aplicar as permissões independentemente do que a interface exibe. Ocultar um botão no frontend não substitui a autorização no endpoint.

## 9. Estratégia de testes

Para cumprir o mínimo de dois testes automatizados, recomenda-se começar por testes de regras críticas.

| Teste | Tipo sugerido | Resultado esperado |
|---|---|---|
| Transição válida de alerta | Teste unitário ou de integração | Um alerta `Pendente` pode passar para `Em análise`. |
| Transição inválida de alerta | Teste unitário ou de integração | Uma transição não permitida é rejeitada pelo backend. |

Depois, ampliar a cobertura para autenticação JWT, autorização por perfil, validações de cadastro e operações CRUD.

## 10. Estratégia inicial de CI/CD

O pipeline deve, idealmente, executar:

1. Instalação das dependências.
2. Verificações estáticas e lint.
3. Testes automatizados.
4. Build da aplicação.
5. Deploy quando as etapas anteriores forem concluídas com sucesso.

O deploy automático a cada push é um requisito extra informado na atividade. Deve ser configurado de forma que falhas nas validações impeçam uma implantação inválida, conforme a estratégia escolhida.

## 11. Prioridades de implementação

Uma sequência sugerida para reduzir riscos:

### Etapa 1 — Fundação
- Definir stack e estrutura do repositório.
- Configurar Git, frontend, backend e banco de dados.
- Definir os três microsserviços e suas responsabilidades.
- Criar a modelagem inicial das entidades.

### Etapa 2 — Identidade e segurança
- Implementar cadastro e login.
- Implementar JWT.
- Implementar perfis `admin` e `user`.
- Proteger os endpoints.
- Adicionar validações no backend.

### Etapa 3 — CRUDs e relacionamentos
- Implementar CRUD de animais.
- Implementar CRUD de lotes.
- Implementar CRUD de protocolos de manejo.
- Implementar relacionamentos 1:N e N:N.
- Implementar busca e paginação.

### Etapa 4 — Monitoramento e regra de negócio
- Implementar registros de monitoramento.
- Implementar criação e consulta de alertas.
- Implementar fluxo de status.
- Adicionar indicadores ao dashboard.

### Etapa 5 — Qualidade e entrega
- Criar documentação Swagger.
- Implementar testes automatizados.
- Implementar login social conforme o escopo confirmado.
- Configurar CI/CD.
- Implantar a aplicação e validar os fluxos no ambiente publicado.

## 12. Decisões pendentes

Antes de iniciar a implementação, é importante confirmar:

- **Stack:** framework frontend, linguagem e framework backend, banco de dados e ORM.
- **Login social:** confirmar o significado exato do requisito “2 login social (Google SSO)”.
- **Infraestrutura:** definir onde cada um dos três microsserviços será executado, considerando as limitações da Vercel.
- **Escopo dos usuários:** decidir se os usuários pertencem a uma única propriedade ou se o sistema deverá suportar várias propriedades e isolamento de dados entre elas.
- **Permissões:** fechar a matriz de permissões para cada operação.
- **Dados de monitoramento:** decidir como serão inseridos os dados na primeira versão — manualmente, por simulação ou por integração real.
- **Histórico de status:** decidir se será necessária uma entidade adicional para registrar todas as mudanças de status dos alertas.

## 13. Resumo dos critérios de aceitação

Antes da entrega, verificar que:

- [ ] Existem pelo menos 8 telas distintas implementadas.
- [ ] Existem pelo menos 4 entidades de negócio persistidas, além de Usuário.
- [ ] Pelo menos 3 entidades possuem CRUD completo pela interface.
- [ ] Existe ao menos um relacionamento 1:N.
- [ ] Existe ao menos um relacionamento N:N.
- [ ] Existe ao menos uma regra de negócio além do CRUD.
- [ ] As listagens possuem busca e paginação.
- [ ] O cadastro e a autenticação JWT funcionam.
- [ ] Os perfis `admin` e `user` possuem permissões distintas.
- [ ] Os endpoints protegidos validam as permissões no backend.
- [ ] Os dados são validados no backend.
- [ ] O backend está dividido em três microsserviços.
- [ ] A API está documentada no Swagger.
- [ ] Existem pelo menos dois testes automatizados.
- [ ] O login social atende à interpretação confirmada do enunciado.
- [ ] A aplicação está publicada na Vercel, conforme o escopo.
- [ ] O deploy automático a cada push está configurado, caso seja implementado o requisito extra.

---

**Status do documento:** planejamento inicial. As entidades, telas, permissões, arquitetura e regras apresentadas são propostas para o MVP e devem ser confirmadas antes da implementação.


## 14. Entregáveis finais

Ao término do desenvolvimento, deverão ser entregues os seguintes materiais:

### 14.1. Sistema publicado
- URL pública do sistema funcionando e acessível para avaliação.

### 14.2. Repositório Git
- Link do repositório remoto contendo o código-fonte completo.
- Tag de versão `v1.0`, identificando a versão final entregue.

### 14.3. README.md

O repositório deverá possuir um README completo, contendo:

- **Descrição do produto e público-alvo:** apresentação da HerdVision, seus objetivos e os usuários aos quais se destina.
- **Tecnologias e arquitetura:** descrição das tecnologias utilizadas, estrutura do projeto e divisão dos três microsserviços.
- **Execução local:** instruções para instalação das dependências, configuração do ambiente e execução do projeto localmente.
- **Usuários de teste:** disponibilização de credenciais de demonstração, com pelo menos um usuário para cada perfil (`admin` e `user`).
- **Checklist de avaliação:** demonstração do atendimento à métrica mínima exigida e aos pontos de complexidade do trabalho.
- **Uso de IA:** seção descrevendo como ferramentas de Inteligência Artificial foram utilizadas durante o planejamento, desenvolvimento, documentação e testes do projeto.

### 14.4. Apresentação
- Slides contendo a apresentação da HerdVision, problema identificado, solução proposta, funcionalidades implementadas, tecnologias utilizadas e demonstração dos resultados.

### 14.5. Vídeo de demonstração
- Vídeo demonstrando o funcionamento do sistema, com duração máxima de 3 minutos.
- O vídeo será utilizado como plano B para apresentação e avaliação, caso necessário.