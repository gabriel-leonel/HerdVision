# HerdVision

> Sistema de monitoramento inteligente de rebanhos para apoiar a gestão e a tomada de decisões na pecuária.

## 1. Equipe e definição de papéis

A equipe será responsável pelo planejamento, desenvolvimento, testes e documentação da plataforma HerdVision.

| Integrante | Papel | Responsabilidades |
|---|---|---|
| Gabriel Leonel | Product Owner | Organização do backlog, priorização dos requisitos e acompanhamento das entregas. |
| Joao Mateus | Front-end | Desenvolvimento das interfaces e integração com os serviços do sistema. |
| Lucas Winicius | Back-end | Desenvolvimento das APIs, regras de negócio e autenticação. |
| Caio Cunha | Banco de dados / Deploy | Modelagem dos dados, configuração da persistência e publicação do sistema. |

## 2. Problema, público-alvo e nome do produto

### Nome do produto

**HerdVision**

### Problema identificado

A gestão de rebanhos exige acompanhamento constante das condições dos animais. Entretanto, a identificação de alterações de saúde, comportamento, alimentação e atividade pode depender de observações manuais, dificultando a detecção antecipada de possíveis problemas.

A ausência de informações centralizadas também pode prejudicar a tomada de decisões e aumentar o tempo necessário para identificar situações que exigem atenção.

### Solução proposta

A HerdVision é uma plataforma de monitoramento inteligente de rebanhos que busca centralizar informações dos animais e auxiliar os produtores na identificação de possíveis alterações por meio de indicadores e alertas.

A proposta considera o uso de dispositivos de monitoramento associados a recursos de Inteligência Artificial para analisar dados como:

- Temperatura corporal;
- Nível de atividade e movimentação;
- Padrões de alimentação;
- Indicadores de possíveis alterações comportamentais;
- Alertas relacionados à saúde e ao manejo dos animais.

A plataforma disponibilizará essas informações em um painel de controle, permitindo acompanhar os animais, consultar registros e gerenciar alertas.

### Público-alvo

O público-alvo inicial são propriedades rurais de pecuária de corte ou leite, especialmente aquelas que possuem aproximadamente **200 a 2.000 animais** e apresentam algum nível de digitalização dos processos de gestão.

Os principais usuários do sistema serão:

- Produtores rurais;
- Gerentes de propriedades;
- Responsáveis pelo manejo do rebanho;
- Profissionais envolvidos no acompanhamento dos animais.

## 3. Backlog — Histórias de usuário

As funcionalidades serão organizadas em histórias de usuário, considerando as necessidades dos diferentes perfis de utilização.

| ID | História de usuário | Prioridade |
|---|---|---|
| US01 | Como usuário, quero criar uma conta para acessar a plataforma. | Alta |
| US02 | Como usuário, quero realizar login para acessar as funcionalidades do sistema. | Alta |
| US03 | Como administrador, quero gerenciar os usuários para controlar o acesso à plataforma. | Alta |
| US04 | Como usuário, quero visualizar um dashboard para acompanhar os principais indicadores do rebanho. | Alta |
| US05 | Como usuário, quero cadastrar animais para manter um registro individual do rebanho. | Alta |
| US06 | Como usuário, quero consultar, editar e excluir animais para manter seus dados atualizados. | Alta |
| US07 | Como usuário, quero cadastrar lotes para organizar os animais da propriedade. | Alta |
| US08 | Como usuário, quero associar animais a lotes para facilitar o gerenciamento do rebanho. | Alta |
| US09 | Como usuário, quero cadastrar protocolos de manejo para documentar os procedimentos utilizados na propriedade. | Média |
| US10 | Como usuário, quero associar protocolos aos animais para registrar os procedimentos aplicáveis a cada um. | Média |
| US11 | Como usuário, quero visualizar registros de monitoramento para acompanhar as condições dos animais. | Alta |
| US12 | Como usuário, quero receber alertas sobre possíveis alterações nos indicadores dos animais para identificar situações que exigem atenção. | Alta |
| US13 | Como usuário, quero alterar o status dos alertas para acompanhar seu tratamento. | Alta |
| US14 | Como usuário, quero pesquisar e filtrar registros para localizar informações com mais facilidade. | Média |
| US15 | Como administrador, quero visualizar e gerenciar os usuários cadastrados para administrar os acessos. | Média |

*As prioridades poderão ser revisadas conforme a evolução do projeto e as decisões da equipe.*

## 4. Checklist de requisitos obrigatórios e extras

O desenvolvimento será organizado para atender aos critérios mínimos de avaliação do projeto, além de incluir funcionalidades que agreguem complexidade e valor à solução.

### 4.1. Requisitos obrigatórios

- [ ] Implementar pelo menos 3 microsserviços no back-end.
- [ ] Implementar persistência de dados.
- [ ] Utilizar Git para controle de versão, com participação de todos os integrantes.
- [ ] Documentar as APIs utilizando Swagger.
- [ ] Implementar pelo menos 2 testes automatizados.
- [ ] Configurar um processo de CI/CD.
- [ ] Realizar o deploy da aplicação na Vercel.
- [ ] Implementar autenticação e autorização utilizando JWT.
- [ ] Implementar pelo menos dois perfis de acesso.
- [ ] Implementar autenticação social conforme a especificação da disciplina.
- [ ] Disponibilizar pelo menos 8 telas funcionais.
- [ ] Implementar pelo menos 4 entidades de negócio persistidas, além de User.
- [ ] Implementar pelo menos 3 entidades com CRUD completo pela interface.
- [ ] Implementar relacionamento 1:N.
- [ ] Implementar relacionamento N:N.
- [ ] Implementar pelo menos uma regra de negócio além das operações básicas de CRUD.
- [ ] Implementar mecanismos de pesquisa e paginação.

### 4.2. Extras e pontos de complexidade escolhidos

A equipe pretende agregar os seguintes recursos ao projeto:

- [ ] Dashboard com indicadores gerais do rebanho.
- [ ] Centralização e classificação de alertas por tipo e gravidade.
- [ ] Fluxo de acompanhamento de alertas, com estados de pendente, em análise e resolvido.
- [ ] Histórico de monitoramento individual por animal.
- [ ] Associação de protocolos de manejo a múltiplos animais.
- [ ] Controle de permissões por perfil de usuário.
- [ ] Validação de regras de negócio no back-end.
- [ ] Registro do histórico de alterações dos alertas.

### 4.3. Critério de validação

Cada requisito será acompanhado durante o desenvolvimento e marcado como concluído somente após sua implementação e validação.

A equipe utilizará o backlog para acompanhar as tarefas e verificar o atendimento dos critérios obrigatórios antes da entrega final.