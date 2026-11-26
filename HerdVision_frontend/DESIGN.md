# HerdVision — DESIGN.md

> Documento de design do aplicativo web da HerdVision. Descreve identidade visual, fundamentos, componentes, padrões de layout e cada tela do MVP. A fonte visual é o protótipo do Figma **"HerdVision — Identidade Visual · App" (Brand Guidelines v1.0 e Biblioteca de componentes v1.0)**. As telas seguem o arquivo de planejamento (`herdvision_planning.md`) e as rotas existentes no backend (`auth-service`, `herd-service`, `monitoring-service`).
>
> Este documento não contém código. Ele descreve o que a interface deve ser; a implementação fica a cargo do frontend.

---

## Sumário

1. Princípios de design
2. Marca
3. Cores
4. Tipografia
5. Fundamentos: espaçamento, forma, elevação, grade e ícones
6. Componentes
7. Estrutura do app (layout base e navegação)
8. Mapeamentos semânticos (severidade, status e perfis)
9. Telas
10. Estados, erros e respostas da API
11. Acessibilidade
12. Voz e microtexto
13. Extensões feitas sobre o Figma e pontos a confirmar

---

## 1. Princípios de design

A HerdVision transforma dados do rebanho em decisões. A interface deve ajudar o produtor a **entender a situação em segundos e agir cedo**.

| Princípio | O que significa na prática |
|---|---|
| **Clareza antes de densidade** | Um número em destaque, uma frase objetiva e uma ação. Evitar painéis lotados. |
| **Natural e confiável** | Paleta terrosa (verdes de pasto e mata, argila, ocre e areia). Nada de neon, gradientes ou brilho tecnológico. |
| **Estado nunca só pela cor** | Todo status combina cor, ponto/ícone e texto. |
| **Objetivo como uma conversa no curral** | Alertas no formato *animal + comportamento + recomendação*, validado em entrevista. |
| **Alvos confortáveis** | Uso em campo, com luva, sol e pressa: alvos de toque de no mínimo 44 × 44, botões de 52 de altura nos fluxos principais. |
| **Alerta não é diagnóstico** | A interface sempre trata alertas como "condições que merecem avaliação", nunca como diagnóstico veterinário. |

---

## 2. Marca

### 2.1 Logotipo

- **Símbolo:** chifres e um olho/pin de localização. Representa a visão de precisão sobre cada animal. Fica dentro de um quadrado de cantos arredondados (raio proporcional a ~25% do lado).
- **Palavra-marca:** "Herd" + "Vision" em **Fraunces SemiBold**. "Herd" na cor do texto do fundo e "Vision" em **ocre** (ver ponto a confirmar no §13).
- **Assinatura de marca:** "Dados do rebanho em decisões inteligentes."

### 2.2 Variações

| Variação | Fundo | Símbolo | "Herd" | "Vision" |
|---|---|---|---|---|
| Principal · fundo claro | Branco ou sand 50 | Quadrado forest 900, chifres e cabeça brancos, pin ocre | bark 900 | ochre 500 |
| Reverso · fundo marca | forest 700 ou forest 900 | Quadrado branco/sand 50, chifres e cabeça forest 900, pin ocre | sand 50 | ochre 500 |
| Principal · fundo argila suave | clay 100 | Igual à principal | bark 900 | ochre 500 |
| Símbolo isolado | sand 100 | 72 px (uso padrão) e 32 px (mínimo) | — | — |

### 2.3 Regras de uso

- **Área de respiro:** ao redor do logo, um espaço igual à altura da letra "H".
- **Tamanho mínimo:** 32 px de altura do símbolo em telas e 12 mm em impressos.
- **Usos incorretos:** não distorcer, não girar, não trocar as cores do símbolo e não aplicar sombras.
- No app, a barra lateral usa a **versão reverso** sobre forest 900, com símbolo de 36 px. As telas de acesso usam símbolo de 44 px.
- Usar sempre o arquivo vetorial oficial exportado do Figma. As telas do canvas trazem uma aproximação vetorial do símbolo apenas como referência.

### 2.4 Motivo gráfico "órbitas"

Do cabeçalho do brand guidelines: três círculos concêntricos em traço fino (sand 200 com ~55% de opacidade, 1–1,2 px) sobre forest 900, com um núcleo sólido ocre e pequenos pontos em forest 300 e clay 300 sobre as órbitas. Simboliza os animais monitorados ao redor de um centro de decisão.

Uso: somente em superfícies de marca (painel lateral das telas de Login e Cadastro, capas e materiais de apresentação). Nunca atrás de dados ou texto corrido.

---

## 3. Cores

> **Paleta terrosa e natural.** Verdes de pasto e mata como base de confiança, argila e ocre para calor e destaque, areia como fundo acolhedor. Cada cor tem uma função clara na interface.

### 3.1 Verde Floresta — marca e ações principais

| Token | Hex | Função |
|---|---|---|
| forest 900 | `#1F3324` | Fundo profundo (barra lateral, painel de marca, hero), estado pressionado do botão primário |
| forest 700 | `#2F4A33` | **Primária**: botões primários, links, foco, chip selecionado, item ativo do menu |
| forest 500 | `#54784B` | Sucesso, variação positiva, ponto do badge "Saudável", barras de gráfico |
| forest 300 | `#A3B98F` | Apoio: ícones inativos do menu, textos auxiliares sobre forest 900, barras secundárias |
| forest 100 | `#E1E9D6` | Fundo sutil: badge "Saudável", botão tonal, linha selecionada, aviso de sucesso |

### 3.2 Argila — destaque e calor

| Token | Hex | Função |
|---|---|---|
| clay 700 | `#8F4A25` | Texto de destaque: overlines de seção, ícone do alerta de atenção, iniciais de avatar |
| clay 500 | `#B5683A` | Destaque pontual (ilustrações, marcadores). Não usar em texto pequeno sobre branco |
| clay 300 | `#E0AE8C` | Apoio: pontos do motivo "órbitas" |
| clay 100 | `#F6E2D3` | Fundo sutil: avatar, cartão de tipografia, fundo da variação "argila suave" do logo |

### 3.3 Ocre — atenção e indicadores

| Token | Hex | Função |
|---|---|---|
| ochre 500 | `#D9A441` | Atenção: ponto do badge "Atenção", "Vision" no logo, ícone do item ativo no menu, núcleo das órbitas. **Nunca como cor de texto sobre fundo claro.** |
| ochre 100 | `#FAEFD0` | Fundo de atenção: badge "Atenção", ícone do cartão de alerta, aviso informativo do formulário |

### 3.4 Areia — fundos e superfícies

| Token | Hex | Função |
|---|---|---|
| sand 50 | `#FBF7EE` | **Fundo do app**, cabeçalho de tabela, rodapé de formulário |
| sand 100 | `#F5EEDF` | Fundo neutro: containers de seção, barra de filtros, tag de fluxo, trilha de barras |
| sand 200 | `#E9DFC9` | Bordas de cartões e divisores, fundo de botão desabilitado |
| sand 300 | `#D2C4A6` | Bordas fortes: campos de texto, chip não selecionado, botões de paginação |

### 3.5 Casca — textos

| Token | Hex | Função |
|---|---|---|
| bark 900 | `#2B2118` | Texto principal |
| bark 700 | `#4A3B2D` | Texto secundário: descrições, rótulos de KPI, cabeçalhos de tabela |
| bark 500 | `#7A6A58` | Texto auxiliar: ajuda de campo, carimbos de tempo, placeholders, texto desabilitado |

### 3.6 Status — alertas do rebanho

| Token | Hex | Função |
|---|---|---|
| red 600 | `#B23A2A` | Crítico: ponto do badge, ícone de alerta crítico, borda e mensagem de erro, botão destrutivo, variação negativa |
| red 100 | `#F8DDD6` | Fundo crítico: badge "Crítico", banner de erro, contador de alertas no menu |
| sky 600 | `#3F7482` | Informação: ponto do badge "Informação", ícone do alerta informativo |
| sky 100 | `#DCEBEE` | Fundo info: badge "Informação", tag "Em análise" |

### 3.7 Neutros fixos

| Uso | Valor |
|---|---|
| Superfície de cartão, campo e diálogo | Branco `#FFFFFF` |
| Scrim de diálogo | forest 900 com 55% de opacidade |

### 3.8 Pares de contraste aprovados (WCAG 2.1)

| Par | Contraste | Nível |
|---|---|---|
| bark 900 sobre sand 50 (texto principal sobre fundo do app) | 14,7:1 | AAA |
| bark 700 sobre branco (texto secundário) | 10,7:1 | AAA |
| bark 500 sobre branco (texto auxiliar) | 5,2:1 | AA |
| Branco sobre forest 700 (botão primário) | 9,1:1 | AAA |
| clay 700 sobre clay 100 (destaque sobre argila suave) | 5,3:1 | AA |
| red 600 sobre red 100 (crítico sobre fundo crítico) | 4,6:1 | AA |

Regras derivadas:
- Texto de badges usa **bark 900** sobre o fundo 100 (contraste AAA). A cor de status vai só no ponto.
- **ochre 500, clay 300, forest 300 e sand 300 não são cores de texto** sobre fundos claros.
- Sobre forest 900, usar sand 50 (títulos), sand 200 (texto) e forest 300 (auxiliar).

---

## 4. Tipografia

### 4.1 Famílias

| Família | Papel | Pesos |
|---|---|---|
| **Fraunces** (serifada, orgânica) | Personalidade humana e rural: títulos, números de destaque e marca | SemiBold (600) e Bold (700) |
| **DM Sans** (sem serifa) | Leitura limpa e confiável: interface, alertas, listas, rótulos e formulários | Regular (400), Medium (500) e SemiBold (600) |

Ambas estão no Google Fonts. Fallbacks: serif e sans-serif do sistema.

### 4.2 Escala

| Estilo | Família · peso | Tamanho / altura de linha | Uso no app |
|---|---|---|---|
| Display/Hero | Fraunces SemiBold | 56 / 64 | Assinatura no painel de marca do Login e Cadastro |
| Display/Large | Fraunces SemiBold | 36 / 44 | Título dos formulários de acesso ("Entrar", "Criar conta") |
| Heading/H1 | Fraunces SemiBold | 28 / 36 | Título da página ("Painel do rebanho", "Animais") |
| Heading/H2 | Fraunces SemiBold | 22 / 30 | Cabeçalho de seção ("Alertas de hoje"), título de diálogo e painel |
| Heading/H3 | DM Sans SemiBold | 18 / 26 | Título do cartão de alerta, legenda de grupo de formulário |
| Numeric/KPI | Fraunces Bold | 32 / 38 | Número do cartão de indicador |
| Body/Large | DM Sans Regular | 16 / 24 | Descrição principal do alerta, subtítulo de acesso |
| Body/Medium | DM Sans Regular | 14 / 20 | Texto padrão de tabelas, listas e descrições |
| Body/Small | DM Sans Regular | 12 / 16 | Ajuda de campo, carimbo de tempo, rodapés |
| Label/Large | DM Sans SemiBold | 14 / 20 | Rótulos de campo, ações textuais ("Ver todos"), botões compactos |
| Label/Small | DM Sans SemiBold | 12 / 16 | Texto de badge, cabeçalho de tabela, "Lote B · Pasto 3" |
| Overline | DM Sans SemiBold | 11 / 16, caixa alta, espaçamento de 0,08 em | Categoria da página ("REBANHO", "MONITORAMENTO") em clay 700 |

Botões usam DM Sans SemiBold 15–16.

### 4.3 Regras

- Fraunces só em títulos e números. Nunca em parágrafos, tabelas ou rótulos.
- Uma única H1 por tela.
- Números grandes usam o separador de milhar brasileiro ("1.248") e vírgula decimal ("40,3 °C").
- Datas no formato dd/mm/aaaa; horas no formato 24 h.

---

## 5. Fundamentos

### 5.1 Espaçamento — base 8

Escala: **4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48**.

| Contexto | Valor |
|---|---|
| Entre ícone e texto | 6–8 |
| Entre rótulo e campo; campo e ajuda | 6–8 |
| Entre campos de um formulário | 16–20 |
| Padding interno de cartões | 20–24 (cartão de alerta 20; cabeçalho do animal 24–28) |
| Padding de containers de seção (sand 100) | 24 |
| Entre blocos de uma página | 24–32 |
| Margem do conteúdo (desktop) | 32 no topo, 40 nas laterais, 48 na base |

### 5.2 Raios de borda

| Raio | Uso |
|---|---|
| 8 | Tag de fluxo, tag de categoria |
| 12 | Campos de texto, selects, botões de ícone, botões de paginação, banners, ladrilho de ID na tabela |
| 16 | **Botões**, cartões, ladrilho de ID do cabeçalho do animal, painéis |
| 24 | Containers de seção (fundo sand 100), cartão de cabeçalho do animal, diálogo |
| Total (pílula) | Badges, chips de filtro, avatar, contador do menu, interruptor |

### 5.3 Elevação

| Nível | Uso | Descrição |
|---|---|---|
| Elevation/0 | Containers sand 100 | Sem sombra |
| Elevation/1 · cartões | Cartões brancos, tabelas | Borda sand 200 de 1 px e sombra muito suave e curta, em tom de casca (bark 900 com 6% de opacidade, deslocamento de 1–2 px) |
| Elevation/2 · menus e modais | Painel lateral de edição, detalhe do alerta, diálogo, menus suspensos | Sombra mais difusa e maior (bark 900 com 8–18% de opacidade, desfoque de 24–32 px, deslocamento de 8–12 px) |

A elevação é sempre quente (cor casca), nunca cinza ou preta.

### 5.4 Grade

**Mobile (definida no Figma):**
- Tela de referência: 390 × 844.
- Margens laterais de 20 e grade de 4 colunas com gutter de 16.
- Alvos de toque de no mínimo 44 × 44.
- Barra de status de 54 e indicador inicial de 34 respeitados.

**Desktop e tablet (extensão para o app web):**
- Barra lateral fixa de 256 de largura.
- Conteúdo fluido com largura máxima de 1180, centralizado.
- Grade de 12 colunas com gutter de 24 dentro do conteúdo.
- Indicadores em grade automática com colunas de no mínimo 220.

**Pontos de quebra:**

| Faixa | Comportamento |
|---|---|
| ≥ 1200 | Barra lateral + conteúdo em duas colunas (lista + detalhe, formulário + painel) |
| 820–1199 | Barra lateral + conteúdo em uma coluna; painéis laterais descem para baixo do conteúdo principal |
| < 820 | Barra lateral vira topo empilhado (ou menu recolhível); tabelas rolam horizontalmente dentro do cartão; barras de ferramentas quebram linha; botões ocupam a largura total |

### 5.5 Iconografia

Traço de 2 px, pontas e junções arredondadas, base de 24 px, sem preenchimento. Tamanhos no app: 20 (menu, ícone de cartão), 18 (botões de ícone e botões com texto), 14–16 (dentro de badges, tags e variações).

Conjunto do Figma e onde cada ícone é usado:

| Ícone | Uso |
|---|---|
| home | Menu "Painel" |
| bell | Menu "Alertas" |
| chart | Indicadores e relatórios |
| list | Menu "Animais" |
| user | Perfil "Usuário", avatar sem foto |
| thermo | Alerta e leitura de temperatura |
| activity | Alerta e leitura de atividade; variação neutra do KPI |
| chevR / chevL | Abrir item, trilha, paginação |
| search | Campo de busca; tag "Em análise" |
| warn | Alerta crítico genérico, banner de erro, diálogo de bloqueio |
| sun | Reservado (clima/condições do pasto) |
| heart | Reservado (bem-estar) |
| utensils | Alerta e leitura de alimentação |
| check | Sucesso, regras de senha atendidas |
| trend | Variação positiva (seta para cima) e negativa (seta para baixo) |
| filter | Filtros avançados |
| pin | Localização (pasto) |
| clock | Carimbo de tempo; tag "Pendente"; histórico |
| mail | Campo de e-mail |
| lock | Áreas restritas a administradores |
| tag | Tag de categoria do protocolo |

Ícones complementares no mesmo estilo (adicionados para o app): layers (Lotes), clipboard (Protocolos), users (Usuários), plus, pencil (editar), trash (excluir), log-out (sair), eye (mostrar senha / ver), link (associar), x (fechar/remover), shield (Administrador), calendar (datas), info (aviso).

Ícone sozinho (sem texto) sempre tem um rótulo acessível ("Editar", "Excluir lote", "Página anterior").

---

## 6. Componentes

Todos os componentes usam apenas os tokens acima. Medidas em px.

### 6.1 Botão

Quatro tipos e três estados. Altura de **52** (alvo de toque confortável), raio de **16**, texto DM Sans SemiBold 15–16 com contraste AA ou superior. Em telas mobile, largura total.

| Tipo | Padrão | Pressionado | Desabilitado |
|---|---|---|---|
| **Primário** | Fundo forest 700, texto branco | Fundo forest 900, texto branco | Fundo sand 200, texto bark 500 |
| **Secundário** (contorno) | Fundo branco, contorno forest 700 de 1,5, texto forest 700 | Fundo forest 100, contorno forest 700, texto forest 700 | Fundo sand 50, contorno sand 300, texto bark 500 |
| **Terciário** (texto) | Sem fundo, texto forest 700 | Fundo forest 100, texto forest 700 | Sem fundo, texto bark 500 |
| **Destrutivo** | Fundo red 600, texto branco | Fundo red 700 (≈ `#8E2B20`), texto branco | Fundo sand 200, texto bark 500 |

Variantes de uso no app web:
- **Padrão de página (48):** ações de cabeçalho e rodapé de formulário em desktop. Mantém raio 16.
- **Tonal (44):** fundo forest 100, texto forest 700, para ações secundárias dentro de cartões ("Registrar leitura", "Associar").
- **Destrutivo discreto:** terciário com texto e ícone red 600 ("Excluir" no cabeçalho do animal), para não competir com a ação principal.
- **Botão de ícone (40 × 40):** raio 12, ícone de 18 em forest 700 (ou red 600 quando destrutivo), sem fundo; hover em forest 100.
- Botão com ícone: ícone de 18 à esquerda, espaçamento de 8.

Hierarquia: no máximo **um botão primário por área**. A ação principal fica à direita no rodapé de formulários, com "Cancelar" terciário à esquerda dela.

### 6.2 Campo de texto

Rótulo **sempre visível acima** do campo (nunca só placeholder). Foco com traço de 2 na cor da marca. Erro com cor **e** mensagem, sem depender só da cor.

| Estado | Fundo | Borda | Texto | Ajuda |
|---|---|---|---|---|
| Padrão | Branco | 1 · sand 300 | bark 900; placeholder bark 500 | bark 500 |
| Foco | Branco | **2 · forest 700** | bark 900 | bark 500 |
| Preenchido | Branco | 1 · sand 300 | bark 900 | bark 500 |
| Erro | Branco | **2 · red 600** | bark 900 | **red 600**, com ícone warn e texto da mensagem |
| Desabilitado | sand 50 | 1 · sand 200 | bark 500 | bark 500 |

Medidas: altura de 52 nas telas de acesso e 48 nas telas internas; raio 12; padding horizontal de 16; rótulo Label/Large (14 SemiBold bark 900) a 6–8 acima; ajuda Body/Small (12) a 6 abaixo.

Obrigatoriedade: asterisco red 600 após o rótulo e legenda "Campos com * são obrigatórios" no topo do formulário.

Variações:
- **Busca:** ícone search de 20 em bark 500 a 14 da esquerda; padding esquerdo de 44.
- **Senha:** botão de ícone "Mostrar senha" (eye) de 44 × 44 dentro do campo, à direita.
- **Select:** mesmas medidas e bordas do campo de texto.
- **Área de texto:** padding de 14 × 16, altura de linha de 22, redimensionável na vertical, contador "78 / 5.000" alinhado à direita na linha de ajuda.
- **Lista de requisitos** (senha): itens de 12 px com ícone check em forest 500 quando atendidos e bark 500 quando pendentes.

### 6.3 Interruptor (switch)

Trilho de 44 × 26 com cantos totalmente arredondados e botão branco de 20. Ligado: trilho forest 700, botão à direita. Desligado: trilho sand 300, botão à esquerda. Sempre acompanhado de texto ("Ativo" / "Inativo"). Área de toque de 48 de altura.

### 6.4 Badge de status

Sempre combina **ponto colorido e texto**, para que o estado não dependa apenas da cor. Texto em cor principal (bark 900) com contraste AAA.

| Badge | Fundo | Ponto |
|---|---|---|
| Crítico | red 100 | red 600 |
| Atenção | ochre 100 | ochre 500 |
| Saudável | forest 100 | forest 500 |
| Informação | sky 100 | sky 600 |
| Neutro | Branco com borda sand 200 | bark 500 |

Medidas: pílula de 24–26 de altura, padding horizontal de 10, ponto de 8, espaçamento de 6, texto Label/Small (12 SemiBold).

### 6.5 Tag de fluxo (status do alerta) — extensão

Para separar o **status do tratamento** da **severidade** (que já usa o badge colorido), o status do alerta usa uma tag retangular de raio 8, 24–26 de altura, texto Label/Small e ícone opcional de 14:

| Status | Fundo | Texto | Ícone |
|---|---|---|---|
| Pendente | sand 100 | bark 700 | clock |
| Em análise | sky 100 | bark 900 | search |
| Resolvido | forest 100 | forest 700 | check |

### 6.6 Tag de categoria — extensão

Para o tipo do protocolo (Sanitário, Nutricional, Reprodutivo): raio 8, fundo sand 100, texto bark 700 Label/Small, ícone tag de 12. Neutra de propósito: categoria não é estado e não deve competir com as cores de status.

### 6.7 Chip de filtro

Filtra listas por lote, status ou período. Pílula de 40 de altura, padding horizontal de 16–18, texto 14 SemiBold.
- **Selecionado:** preenchimento forest 700, texto branco.
- **Não selecionado:** fundo branco, contorno sand 300, texto bark 900.

Pode mostrar a contagem no próprio texto ("Pendentes · 7"). Os chips de um grupo são mutuamente exclusivos e expõem o estado "pressionado" para tecnologias assistivas.

### 6.8 Cabeçalho de seção

Título em **Fraunces** (H2, 22/30) e ação textual alinhada à direita (Label/Large em forest 700, ex.: "Ver todos"). Usado antes de listas e grupos de cartões. A ação tem área de toque mínima de 44 de altura.

### 6.9 Cartão de alerta

Mostra o **animal, o comportamento identificado e a recomendação**, no formato objetivo validado na entrevista. Ícone, cor e badge reforçam a severidade.

Anatomia (da esquerda para a direita):
1. **Círculo de ícone** de 40–44: fundo na cor 100 da severidade; ícone de 20–22 indica o **tipo** do alerta (thermo = temperatura, activity = atividade, utensils = alimentação, warn = genérico/sem leitura). Cor do ícone: red 600 (crítico), clay 700 (atenção), sky 600 (informação).
2. **Conteúdo:** título H3 (18/26 SemiBold) no formato "Animal 154 com queda de atividade"; descrição Body/Medium em bark 700 com o dado e a recomendação ("Redução de 35% na movimentação… Recomenda-se avaliação."); linha de metadados com badge de severidade, tag de fluxo (quando houver) e carimbo "há 12 min · Lote B" em bark 500.
3. **Chevron** à direita em bark 500, indicando que o cartão inteiro abre o detalhe.

Superfície: branco, borda sand 200, raio 16, padding 20, Elevation/1. O cartão inteiro é clicável.

Variação **compacta** (listas e detalhe do animal): círculo de 40, título de 15–16 e sem descrição.

Variação **selecionada** (Central de alertas): borda de 2 em forest 700.

### 6.10 Cartão de indicador (KPI)

Número em destaque (Fraunces Bold 32/38) com variação. O sentido da variação usa **ícone de seta** além da cor.

| Variação | Ícone | Cor |
|---|---|---|
| Positiva | trend para cima | forest 500 |
| Negativa | trend para baixo | red 600 |
| Neutra | activity | bark 500 |

"Positivo" e "negativo" são semânticos, não matemáticos: mais alertas pendentes é negativo (seta para cima em red 600); menos alertas em análise é positivo (seta para baixo em forest 500).

Anatomia: rótulo Body/Medium em bark 700 → número → variação (13, Medium). Branco, borda sand 200, raio 16, padding 20 × 24.

### 6.11 Linha de animal

Item de lista com identificação grande, localização e status. **Toda a linha é tocável** (altura mínima de 72).

Anatomia: ladrilho de ID de 48 × 48 (raio 12) com o número do animal em DM Sans Medium 18, fundo na cor 100 da situação (red 100, ochre 100 ou forest 100) → nome (15 SemiBold) e "Lote B · Pasto 3" (12, bark 700) → badge de situação à direita. Branco, borda sand 200, raio 16, padding 12 × 16.

Na tabela de animais, a mesma ideia aparece na primeira coluna com ladrilho de 44 e a identificação completa ("BR00000154") abaixo do nome.

### 6.12 Tabela de dados — extensão

- Container: cartão branco, borda sand 200, raio 16, Elevation/1, com rolagem horizontal interna em telas estreitas.
- Cabeçalho: fundo sand 50, texto Label/Small em bark 700, divisor sand 200.
- Linhas: padding de 12–14 × 16–20, divisor sand 100, texto Body/Medium. Números alinhados à direita.
- Coluna de ações à direita com botões de ícone (ver, editar, excluir).
- Rodapé com resumo ("Mostrando 1–8 de 1.248") à esquerda e paginação à direita.

### 6.13 Paginação

Botões de 40 × 40, raio 12, texto 14 SemiBold. Página atual com fundo forest 700 e texto branco; demais sem fundo. Setas anterior/próxima com contorno sand 300; desabilitadas com fundo sand 50, borda sand 200 e ícone bark 500. Reticências para intervalos longos. Seletor "Itens por página" (15, 30, 50) quando fizer sentido; o backend aceita de 1 a 100 itens por página (padrão 15).

### 6.14 Barra de filtros

Container sand 100, raio 16, padding 16, com campo de busca (rótulo visível), selects e grupos de chips lado a lado, que quebram linha em telas menores.

### 6.15 Navegação lateral — extensão

- Fundo forest 900, largura de 256, padding de 24 × 16.
- Topo: logo reverso (símbolo de 36 + palavra-marca 22).
- Itens: 44 de altura mínima, raio 12, ícone de 20 + texto 15.
  - Inativo: texto sand 200, ícone forest 300.
  - Ativo: fundo forest 700, texto sand 50 SemiBold, ícone ochre 500.
- Contador de alertas pendentes no item "Alertas": pílula red 100 com número bark 900.
- Grupo "Administração" com overline forest 300; o item "Usuários" só aparece para o perfil `admin`.
- Rodapé: avatar (iniciais em clay 700 sobre clay 100), nome, perfil e ação "Sair" com ícone log-out.

### 6.16 Avisos

| Tipo | Visual | Uso |
|---|---|---|
| Banner de erro | Fundo red 100, texto red 600 Medium, ícone warn, raio 12 | Erro de envio (ex.: "Credenciais inválidas.") |
| Toast de sucesso | Fundo forest 100, círculo forest 500 com check branco, texto bark 900, botão fechar | Confirmação de criação, edição e exclusão |
| Aviso informativo | Fundo ochre 100, ícone info em clay 700 | Regras e dicas dentro de formulários |
| Nota de rodapé | Fundo sand 100 ou texto bark 500 de 12 | "Alertas não substituem o diagnóstico veterinário" |

### 6.17 Diálogo

Scrim forest 900 a 55%. Cartão branco, raio 24, padding 28, Elevation/2. Círculo de ícone de 48 no topo (cor da intenção), título H2 Fraunces, texto Body/Large em bark 700 e ações alinhadas à direita (terciário + primário ou destrutivo). Função de diálogo de alerta quando bloqueia ou confirma algo destrutivo.

Modais e pop-ups **não contam como telas distintas** (RNF11).

### 6.18 Painel lateral de edição — extensão

Cartão branco com Elevation/2, título H2 e botão fechar (x). Usado para criar e editar sem sair da listagem (Protocolos). Rodapé com "Cancelar" terciário e "Salvar" primário.

### 6.19 Trilha (breadcrumb)

Texto 13 com o nível anterior como link (forest 700, SemiBold) e chevron de 14 em bark 500. Usada em formulários e detalhes.

### 6.20 Indicador de etapas — extensão

Três segmentos de 6 de altura em pílula, um por etapa do fluxo do alerta, com rótulos "1 · Pendente", "2 · Em análise" e "3 · Resolvido". Concluída/atual: forest 700. Futura: sand 200, com rótulo em bark 500.

---

## 7. Estrutura do app

### 7.1 Áreas

| Área | Telas | Layout |
|---|---|---|
| **Pública** | Login, Cadastro | Duas metades: painel de marca (forest 900, motivo órbitas, assinatura em Display/Hero) e formulário centralizado de até 420 de largura sobre sand 50. Em telas estreitas o painel de marca fica acima do formulário. |
| **Autenticada** | Todas as demais | Barra lateral + área de conteúdo sobre sand 50. |

### 7.2 Cabeçalho de página (área autenticada)

Overline de categoria (clay 700) → H1 Fraunces → subtítulo ou contagem (bark 700) ou carimbo "Atualizado há 5 minutos" (bark 500). Ações à direita, alinhadas à base do título. Telas de formulário e detalhe trocam a overline pela trilha.

### 7.3 Navegação

| Item | Destino | Perfis |
|---|---|---|
| Painel | Dashboard | admin, user |
| Animais | Listagem de animais | admin, user |
| Lotes | Listagem de lotes | admin, user |
| Protocolos | Protocolos de manejo | admin, user |
| Alertas (com contador) | Central de alertas | admin, user |
| Usuários (grupo Administração) | Gestão de usuários | **somente admin** |
| Sair | Encerra a sessão e volta ao Login | admin, user |

Rotas protegidas sem sessão válida levam ao Login. Depois do login, o usuário vai ao Painel.

### 7.4 Padrão de containers

- **Container de seção:** fundo sand 100, raio 24, padding 24. Agrupa cartões brancos (alertas, linhas de animal).
- **Cartão de conteúdo:** branco, borda sand 200, raio 16, Elevation/1. Para tabelas, formulários e indicadores.
- Nunca colocar cartão sand 100 dentro de outro sand 100.

---

## 8. Mapeamentos semânticos

### 8.1 Severidade do alerta (`alerts.severity`)

| Valor no backend | Rótulo na interface | Badge | Cor do ícone |
|---|---|---|---|
| `alta` | Crítico | Crítico (red) | red 600 |
| `média` | Atenção | Atenção (ochre) | clay 700 |
| `baixa` | Informação | Informação (sky) | sky 600 |

### 8.2 Status do alerta (`alerts.status`, RN01)

| Valor | Tag de fluxo | Ação principal disponível |
|---|---|---|
| `Pendente` | Pendente (sand, clock) | "Iniciar análise" |
| `Em análise` | Em análise (sky, search) | "Marcar como resolvido" |
| `Resolvido` | Resolvido (forest, check) | "Reabrir alerta" (secundário, ação explícita) |

A interface só oferece a próxima transição válida. Não existe botão para ir de Pendente direto para Resolvido, nem de Resolvido para Pendente sem a ação explícita de reabertura.

### 8.3 Tipo do alerta (`alerts.type`) → ícone

| Tipo | Ícone |
|---|---|
| `temperatura` | thermo |
| `atividade` | activity |
| `alimentação` | utensils |
| Outros / sem leitura | warn |

### 8.4 Situação do animal (derivada dos alertas abertos)

| Situação | Quando | Badge / ladrilho |
|---|---|---|
| Crítico | Há alerta aberto de severidade alta | red 100 |
| Atenção | Há alerta aberto de severidade média | ochre 100 |
| Saudável | Sem alertas abertos de severidade alta ou média | forest 100 |

### 8.5 Status cadastral do animal (`animals.status`)

Badge **Neutro** com o texto do status ("Ativo", "Em tratamento", "Inativo"). Fica separado da situação de saúde para não misturar cadastro com monitoramento.

### 8.6 Protocolo

- `type`: tag de categoria (Sanitário, Nutricional, Reprodutivo).
- `active`: badge Saudável "Ativo" ou badge Neutro "Inativo"; no formulário, interruptor.
- Associação animal–protocolo (`status`): badge Informação "Em andamento" ou badge Saudável "Concluído".

### 8.7 Perfil do usuário (`users.role`)

| Valor | Rótulo | Visual |
|---|---|---|
| `admin` | Administrador | Pílula forest 100, texto forest 700, ícone shield |
| `user` | Usuário | Pílula branca com borda sand 200, ícone user |

---

## 9. Telas

São 11 telas desenhadas (mínimo exigido: 8), além do diálogo de bloqueio de exclusão. Todas estão no canvas "HerdVision — Telas do app web", ligadas entre si como protótipo navegável.

Legenda de origem dos dados:
- ✅ **Rota existente** no backend.
- 🕓 **Rota prevista**: a tabela existe nas migrations, mas o endpoint ainda não foi criado. A tela segue os campos da migration e do planejamento.

---

### 01 · Login

**Objetivo:** autenticar com e-mail e senha.
**API:** ✅ `POST /api/auth/login` (`email`, `password`) → `user`, `access_token`, `token_type`, `expires_in`.

**Conteúdo:**
- Painel de marca: logo, overline "PECUÁRIA DE PRECISÃO", assinatura "Dados do rebanho em decisões inteligentes.", texto de apoio e motivo órbitas.
- Formulário: título "Entrar", subtítulo, campo E-mail, campo Senha com "Mostrar senha", botão primário "Entrar", link "Criar conta".

**Estados:**
- Erro 401: banner de erro "Credenciais inválidas. Confira o e-mail e a senha." A mensagem é a mesma para e-mail inexistente e senha errada (o backend evita revelar quais e-mails existem).
- Erro 429 (mais de 10 tentativas por minuto): banner "Muitas tentativas. Aguarde um minuto e tente de novo."
- Envio em andamento: botão com indicador de carregamento e desabilitado.

---

### 02 · Cadastro

**Objetivo:** criar conta.
**API:** ✅ `POST /api/auth/register` (`name`, `email`, `password`) → 201 com usuário e token (já entra logado).

**Validações exibidas (espelham o backend):**
- Nome: obrigatório, de 2 a 255 caracteres.
- E-mail: obrigatório, válido e único. Erro: "Este e-mail já está cadastrado."
- Senha: mínimo de 8 caracteres, com letras e números. A lista de requisitos marca cada item em tempo real.

**Conteúdo:** mesmo layout do Login, assinatura "Rebanho sob controle.", link "Voltar para entrar", botão "Criar conta" e nota "Novas contas entram com o perfil Usuário. O perfil Administrador é atribuído pela equipe responsável."

---

### 03 · Dashboard (Painel do rebanho)

**Objetivo:** visão geral do rebanho e dos alertas (RF05).
**API:** agregação de 🕓 animais, ✅ `GET /api/lots` (contagem e `animals_count`) e 🕓 alertas.

**Conteúdo:**
1. Cabeçalho: overline com propriedade e data, H1 "Painel do rebanho", "Atualizado há X minutos"; ações "Ver alertas" (secundário) e "Novo animal" (primário).
2. Quatro cartões de indicador: Animais monitorados, Lotes, Alertas pendentes e Em análise, cada um com variação.
3. Seção "Alertas de hoje" (container sand 100) com até 3 cartões de alerta, ação "Ver todos" e nota de que alertas não substituem o diagnóstico veterinário.
4. Coluna lateral: "Animais em atenção" (linhas de animal) e "Animais por lote" (barras horizontais forest 500 sobre trilho sand 100, com o grupo "Outros" em forest 300).

**Estados:** sem alertas → container com texto "Nenhum alerta hoje. Tudo em ordem no rebanho." e ícone check em forest 500. Carregando → esqueletos sand 100 no formato dos cartões.

---

### 04 · Listagem de animais

**Objetivo:** pesquisar, filtrar, paginar e acessar animais (RF06, RF14).
**API:** 🕓 `GET /api/animals` com `search`, filtro por lote e por status, e paginação (mesmo padrão de `lots`).

**Conteúdo:**
- Cabeçalho "Animais" com contagem e botão "Novo animal".
- Barra de filtros: busca (identificação, nome ou raça), select de lote e chips de status.
- Tabela: Animal (ladrilho + nome + identificação), Espécie · Raça, Lote, Nascimento, Status (badge neutro), Situação (badge de saúde) e ações (ver, editar, excluir).
- Paginação.

**Permissões:** excluir apenas para `admin` (o ícone não aparece para `user`).
**Estado vazio:** "Nenhum animal encontrado" + sugestão de limpar filtros ou "Cadastrar primeiro animal".

---

### 05 · Cadastro/edição de animal

**Objetivo:** criar ou editar um animal (RF06, RF09).
**API:** 🕓 `POST /api/animals` e `PUT/PATCH /api/animals/{id}`.

**Campos (migration `animals`):**

| Grupo | Campo | Regra |
|---|---|---|
| Identificação | Identificação * | Texto obrigatório e **único** ("Código único, como o do brinco ou do SISBOV.") |
| | Nome | Opcional ("Apelido usado no dia a dia.") |
| Características | Espécie * | Select (padrão "Bovino") |
| | Raça | Opcional |
| | Data de nascimento | Opcional; não pode estar no futuro |
| Manejo | Lote * | Select com a contagem de animais de cada lote; **todo animal pertence a um lote**; link "Criar lote" |
| | Status * | Select (Ativo, Em tratamento, Inativo — a confirmar) |

**Layout:** formulário em cartão com três grupos (fieldsets) separados por divisores; rodapé sand 50 com "Cancelar" e "Salvar animal". Painel lateral com "Depois de salvar" (associar protocolos, leituras no histórico) e aviso sobre identificação única. Em modo edição, o título vira o nome do animal e o botão vira "Salvar alterações".

---

### 06 · Detalhes do animal

**Objetivo:** ver dados, lote, monitoramento, alertas e protocolos do animal (RF06, RF10, RF11).
**API:** 🕓 `GET /api/animals/{id}`, 🕓 leituras do Monitoring Service filtradas por `animal_id`, 🕓 alertas por `animal_id`, 🕓 associações animal–protocolo.

**Conteúdo:**
1. Trilha "Animais › Animal 154".
2. Cartão de cabeçalho (raio 24): ladrilho de ID de 72, H1, badge de situação, badge de status, "BR00000154 · Bovino · Nelore"; ações "Excluir" (destrutivo discreto, só admin) e "Editar" (secundário); lista de dados: Lote (link), Nascimento com idade, Cadastrado em e Última atualização.
3. Três KPIs da última leitura: Temperatura (°C), Atividade e Alimentação, com variação.
4. "Histórico de monitoramento": tabela de data e hora, temperatura (valores acima da referência em red 600 com seta), atividade e alimentação; botão tonal "Registrar leitura"; link "Ver histórico completo".
5. "Alertas" do animal em cartões compactos, com severidade e status.
6. "Protocolos" (relacionamento N:N): nome, tipo, data de início e status da aplicação; botão tonal "Associar". O mesmo protocolo pode aparecer mais de uma vez (histórico de aplicações).

---

### 07 · Listagem de lotes

**Objetivo:** consultar, pesquisar, paginar e gerenciar lotes (RF07, RF14). **CRUD completo da Release 2.**
**API:** ✅ `GET /api/lots` (`search` em nome/descrição, `per_page` de 1 a 100, ordenado por nome) → `id`, `name`, `description`, `animals_count`, `created_at`, `updated_at`.

**Conteúdo:**
- Cabeçalho "Lotes" e botão "Novo lote".
- Toast de sucesso após criar, editar ou excluir.
- Barra de filtros com busca e "Itens por página".
- Tabela: Lote (ícone layers em ladrilho forest 100 + nome), Descrição, Animais (`animals_count`, alinhado à direita), Criado em e ações (editar, excluir).
- Paginação.
- Nota com cadeado: "Somente administradores podem excluir lotes, e apenas lotes sem animais."

**Permissões:** listar e consultar → todos; criar e editar → `admin` e `user`; excluir → **somente `admin`**.

---

### 08 · Cadastro/edição de lote

**Objetivo:** criar ou editar lote.
**API:** ✅ `POST /api/lots` (201) · ✅ `PUT/PATCH /api/lots/{id}` (atualização parcial; enviar descrição vazia limpa o campo) · ✅ `GET /api/lots/{id}`.

**Campos:**
- Nome do lote * (até 255 caracteres).
- Descrição (opcional, até 5.000 caracteres, com contador).

**Painel lateral (modo edição):** cartão com "Animais neste lote" (número Fraunces), link "Ver animais do lote", datas de criação e atualização; cartão "Excluir lote" (borda red 100) que explica o bloqueio quando há animais e traz o botão desabilitado e a nota "Disponível apenas para administradores".

---

### Diálogo · Excluir lote bloqueado (409)

**API:** ✅ `DELETE /api/lots/{id}` → 204 (excluído) ou **409** com a mensagem do backend e `animals_count`.

**Conteúdo:** círculo warn em red 100, título "Não é possível excluir o Lote B", texto com a quantidade de animais e a orientação de mover ou remover os animais antes. Ações "Fechar" (terciário) e "Ver animais do lote" (primário).

Para um lote sem animais, o mesmo diálogo vira confirmação: título "Excluir Lote D?", texto "Esta ação não pode ser desfeita." e botões "Cancelar" e "Excluir lote" (destrutivo).

---

### 09 · Protocolos de manejo

**Objetivo:** listar, criar, editar, excluir e associar protocolos (RF08, RF10).
**API:** 🕓 CRUD de `management_protocols` e 🕓 associação `animal_management_protocol` (`animal_id`, `management_protocol_id`, `start_date`, `status`).

**Layout em duas colunas:**
- **Lista:** barra de filtros (busca + chips de tipo); linhas com nome, descrição, tag de categoria, quantidade de animais, badge Ativo/Inativo e ações; a linha selecionada usa fundo forest 100; paginação.
- **Painel lateral (Elevation/2):**
  1. "Editar protocolo" com Nome *, Tipo * (select), Situação (interruptor Ativo/Inativo) e Descrição; "Cancelar" e "Salvar".
  2. "Animais com este protocolo" (container sand 100) com busca de animal, data de início, botão "Associar" e a lista de animais vinculados, cada um com início, status e botão para remover a associação.

Excluir um protocolo que tem aplicações deve ser bloqueado (a chave estrangeira usa RESTRICT) com o mesmo padrão do diálogo 409. Sugestão de texto: "Este protocolo foi aplicado a N animais. Desative-o em vez de excluir."

---

### 10 · Central de alertas

**Objetivo:** listar, filtrar, ver detalhes e tratar alertas (RF12, RF13, RN01).
**API:** 🕓 `GET /api/alerts` (filtros por status e severidade, paginação) e 🕓 endpoint de transição de status.

**Layout em duas colunas:**
- **Filtros:** chips de status com contagem (Todos, Pendentes, Em análise, Resolvidos) e select de gravidade.
- **Lista:** cartões de alerta compactos; o selecionado tem borda forest 700 de 2.
- **Detalhe (Elevation/2, raio 24):**
  1. Círculo de ícone de 52, título H2, badge de severidade ("Crítico · gravidade alta") e tag de fluxo.
  2. Descrição completa em Body/Large.
  3. Lista de dados: Animal (link), Tipo e Leitura de origem (data, hora e valor).
  4. "Tratamento": indicador de etapas e **apenas a próxima ação válida** como botão primário de 52; ação secundária "Ver animal"; texto de orientação sobre a próxima etapa.
  5. "Histórico" das mudanças, com o que mudou, quem mudou e quando.
  6. Nota: "Alertas indicam condições que merecem avaliação e não substituem o diagnóstico veterinário."

**Interação no protótipo:** os botões avançam o alerta de Pendente para Em análise e depois para Resolvido; em Resolvido aparece "Reabrir alerta".

---

### 11 · Usuários (admin)

**Objetivo:** consultar usuários e perfis (RF17).
**API:** ✅ `GET /api/users` com `search` (nome ou e-mail), `role` (`admin` | `user`) e `per_page`; apenas `admin`.

**Conteúdo:**
- Overline com cadeado "SOMENTE ADMINISTRADORES", H1 "Usuários" e dois mini indicadores (Administradores, Usuários).
- Barra de filtros com busca e chips de perfil.
- Tabela: Nome (avatar com iniciais), E-mail, Perfil (pílula) e Cadastrado em; paginação.
- Nota sobre o perfil padrão e sobre a mensagem de acesso negado.

A tela é só de consulta porque o backend ainda não tem rotas para editar perfis. Quando houver, a coluna de ações recebe "Alterar perfil" via diálogo.

---

## 10. Estados, erros e respostas da API

| Situação | Resposta | Tratamento na interface |
|---|---|---|
| Carregando lista | — | Esqueletos no formato das linhas e cartões, em sand 100 com pulso suave; cabeçalho da página continua visível |
| Lista vazia | 200 com `data` vazio | Ilustração mínima (ícone de 48 em forest 300), título curto, explicação e ação principal |
| Busca sem resultado | 200 com `data` vazio | "Nenhum resultado para '…'" + botão terciário "Limpar filtros" |
| Validação | 422 com erros por campo | Erro em cada campo (borda red 600 + mensagem); foco no primeiro campo com erro |
| Sem sessão ou token expirado | 401 ("Token de autenticação não informado." / token inválido) | Voltar ao Login com o banner "Sua sessão expirou. Entre novamente." |
| Sem permissão | 403 ("Você não tem permissão para acessar este recurso.") | Estado de página com ícone lock e a mensagem; para ações, o botão nem aparece |
| Não encontrado | 404 ("Recurso não encontrado.") | Estado de página com link para a listagem |
| Conflito | 409 (lote com animais) | Diálogo de bloqueio |
| Muitas tentativas | 429 (login e cadastro: 10 por minuto) | Banner de erro com orientação de espera |
| Sucesso | 200, 201 ou 204 | Toast de sucesso por ~4 s, com botão de fechar |
| Logout | `POST /api/auth/logout` | Volta ao Login com toast "Você saiu da sua conta." |

**Regra de autorização na interface:** esconder o que o perfil não pode fazer (excluir, menu Usuários). Isso **não substitui** a validação do backend, que continua sendo a fonte da verdade.

---

## 11. Acessibilidade

- Contraste: todos os pares de texto seguem o §3.8 (mínimo AA; AAA no texto principal e nos badges).
- Estado nunca só pela cor: badges com ponto e texto; variações com seta; erros com ícone e mensagem; status do alerta com texto e ícone.
- Alvos: mínimo de 44 × 44; botões principais de 52; linhas de animal de 72.
- Foco visível: contorno de 2 px em forest 700 com afastamento de 2 px em todo elemento interativo.
- Formulários: `label` associado a cada campo, campos inválidos marcados como inválidos e ligados à mensagem de erro, grupos com legenda.
- Semântica: navegação principal e paginação como regiões de navegação; tabelas com cabeçalhos de coluna; item de menu atual marcado como página atual; chips com estado pressionado; interruptor com papel de switch; diálogo de bloqueio com papel de alertdialog.
- Ícones decorativos ocultos para leitores de tela; botões só de ícone com rótulo.
- Idioma da página: pt-BR.
- Movimento: animações curtas (150–200 ms, entrada suave) e respeito à preferência de movimento reduzido.

---

## 12. Voz e microtexto

- **Direto e respeitoso**, na segunda pessoa implícita: "Acesse o painel do seu rebanho."
- **Alertas:** "Animal + comportamento" no título; "dado + recomendação" na descrição. Usar "Recomenda-se avaliação" e "Vale observar", nunca termos de diagnóstico ("doente", "infectado").
- **Erros:** dizer o que aconteceu e o que fazer. "Este lote possui 356 animais. Mova ou remova os animais antes de excluir."
- **Botões:** verbo no infinitivo + objeto: "Salvar animal", "Iniciar análise", "Marcar como resolvido", "Associar".
- **Vocabulário de campo:** lote, pasto, manejo, curral, brinco, matrizes, recria, engorda.
- **Números:** "1.248", "40,3 °C", "há 12 min", "19/11 · 07:40".

---

## 13. Extensões feitas sobre o Figma e pontos a confirmar

### 13.1 O que foi estendido

O Figma define a identidade e os componentes com foco em mobile (390 × 844). Para o app web, estes itens foram derivados mantendo os mesmos tokens:

- Layout desktop com barra lateral (forest 900) e grade de 12 colunas.
- Tabela de dados, paginação, barra de filtros, painel lateral, diálogo, trilha, toast, interruptor e indicador de etapas.
- Tag de fluxo (status do alerta) separada do badge de severidade.
- Tag de categoria neutra para o tipo de protocolo.
- Variantes de botão: tonal, destrutivo discreto, botão de ícone e altura de 48 em desktop.
- Cor do botão destrutivo pressionado (≈ `#8E2B20`), estimada a partir do print.

### 13.2 Pontos a confirmar

1. **Cor de "Vision" no logotipo:** o texto do brand guidelines diz "tom de argila", mas o logo aparece em ocre/dourado. Este documento usa ochre 500. Confirmar com o arquivo oficial.
2. **Hex exato do vermelho pressionado** do botão destrutivo.
3. **Valores de `animals.status`:** o backend só usa "ativo" nos dados de exemplo. As telas propõem Ativo, Em tratamento e Inativo.
4. **Faixas de referência dos indicadores** (temperatura, atividade, alimentação) que geram os alertas e definem o destaque em vermelho no histórico.
5. **Login social:** ~~em aberto~~ **decidido na Release 3: fora do produto.** Login social é só um ponto de complexidade opcional no enunciado; os botões de Google foram removidos do login e do cadastro.
6. **Política de permissões do perfil `user`** para animais e protocolos ("conforme política definida" no planejamento). As telas seguem o padrão dos lotes: `user` cria e edita, só `admin` exclui.
7. **Histórico de status do alerta:** o detalhe do alerta prevê a lista de mudanças. Isso depende da decisão sobre uma entidade de histórico (§12 do planejamento).
8. **Escopo multi-propriedade:** a overline do Dashboard mostra o nome da propriedade. Se o sistema tiver uma única propriedade, a overline vira só a data.
