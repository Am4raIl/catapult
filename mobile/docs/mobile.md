# Catapult Mobile — especificação de design e experiência

> **Instruções para o agente de IA:** implemente a experiência descrita neste arquivo no aplicativo React Native + Expo existente. Este documento define **design, interação e critérios visuais**; o contrato HTTP é definido pelo backend e pela documentação `../../backend/docs/api.md`, que prevalecem em caso de conflito. Leia também `../AGENTS.md` antes de editar o projeto.
>
> **Resultado esperado:** um aplicativo de catálogo e administração de estoque com aparência refinada, contemporânea, minimalista e nativa; funcional em Android e iOS, com web como alvo secundário. Nenhuma tela deve parecer um template de demonstração ou uma versão web comprimida.

## 1. Conceito do produto

**Catapult** é um catálogo público e ferramenta administrativa de estoque. A interface deve transmitir clareza, organização e agilidade: **menos ruído, mais informação útil por interação**.

Quatro princípios:

1. **Calmo e premium:** superfícies discretas, espaços bem definidos, tipografia forte e poucos elementos decorativos.
2. **Smart e contextual:** mostre a ação relevante no momento adequado; mantenha buscas/filtros ao voltar; faça feedback imediato sem sacrificar consistência com o servidor.
3. **Fluido e nativo:** transições curtas, gestos esperados da plataforma, teclado bem tratado, feedback tátil onde houver suporte, áreas de toque confortáveis.
4. **Confiável:** nunca esconda falhas, expiração de sessão, arquivo ausente, erros de salvamento nem limitações do backend. Dados reais, sem mocks permanentes.

**Linguagem visual:** minimalismo editorial + produto SaaS moderno. Não usar excesso de gradientes, sombras fortes, glassmorphism em todas as superfícies, ícones coloridos aleatórios, emojis como ícones principais ou gráficos 3D.

## 2. Design system obrigatório

### 2.1 Temas claro, escuro e automático

- Suportar **Claro**, **Escuro** e **Sistema**. O padrão é **Sistema**, acompanhando a mudança de aparência do aparelho em tempo real.
- Disponibilizar escolha de tema em um pequeno menu/configuração acessível na área administrativa e, se fizer sentido, pelo header público. A preferência do usuário para o tema pode ser persistida localmente; **não** persistir senha nem cookies.
- Usar `useColorScheme` ou integração equivalente do React Native com um único `ThemeProvider` e tokens semânticos. Nunca codificar cores de superfície/texto diretamente dentro de telas.
- `StatusBar`, header, modais, inputs, bottom sheets, skeletons, ícones, placeholders e feedbacks devem responder ao tema.
- No modo escuro, trabalhar com camadas grafite profundas (não inverter imagens e não usar preto absoluto em toda a interface). Garantir contraste de texto e controles; testar estados desabilitados.

**Paleta proposta (ajustável com consistência):**

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `background` | `#F7F8FA` | `#0C1016` | Fundo geral |
| `surface` | `#FFFFFF` | `#161C25` | Cards, sheets, campos |
| `surfaceElevated` | `#FFFFFF` | `#202836` | Popovers, diálogos |
| `textPrimary` | `#111827` | `#F3F6FA` | Títulos, valores |
| `textSecondary` | `#657084` | `#A7B1C1` | Descrições e metadados |
| `border` | `#E5E9EF` | `#303A48` | Separadores sutis |
| `accent` | `#3858E9` | `#91A5FF` | CTA, seleção, foco |
| `accentOnSolid` | `#FFFFFF` | `#101626` | Texto sobre CTA sólido |
| `success` | `#1E8054` | `#62D4A0` | Estoque OK |
| `warning` | `#A7650D` | `#F5C46B` | Estoque baixo |
| `danger` | `#C13F47` | `#FF8990` | Esgotado, erro, excluir |

- Preferir **fundos neutros**; usar azul de destaque somente em ações, foco e seleção.
- Para badges de estoque, usar fundo tonal suave + ícone/texto. Nunca depender só da cor.
- Gradiente, quando necessário, apenas como detalhe sutil de marca, não como plano de fundo de todas as páginas.

### 2.2 Tipografia, grid e dimensões

- Fonte do sistema ou família sans moderna compatível com Expo; boa legibilidade e numerais alinhados para preços/estatísticas.
- Escala sugerida: **display 30–34**, **heading 24–28**, **section 18–20**, **body 15–16**, **support 13–14**, **caption 11–12** (respeitar acessibilidade e dimensionamento de fontes do sistema).
- Títulos com peso semibold/bold, corpo regular, metadados medium. Evitar texto todo em maiúsculas.
- Espaçamento baseado em **4 px**; padrões 8, 12, 16, 20, 24, 32.
- Padding horizontal de telas **20 px** (16 em telas compactas), largura máxima confortável no web/tablet.
- Cards: raio **16–20 px**; campos: **12–14 px**; chips: pill; botões: **12–14 px**.
- Elevation quase imperceptível; preferir separação por fundo, borda e espaçamento.
- Alvos de toque de no mínimo **44 × 44** e margem entre ações adjacentes.
- Usar `SafeAreaView`/safe area insets; respeitar notch, barras do sistema e teclado.

### 2.3 Componentes compartilhados

Construir componentes reutilizáveis (fora de `src/app/`) para:

- `ScreenScaffold` (safe area, background, padding, header e conteúdo).
- `AppHeader` (título, voltar, ações contextuais; opacidade/elevação sutil quando rolar).
- `PrimaryButton`, `SecondaryButton`, `IconButton`, `DestructiveButton` (loading, disabled e acessibilidade).
- `AppInput`, `PasswordInput`, `MoneyInput`, `NumberInput`, `SelectField`, `AppSwitch` (label persistente, hint e erro por campo).
- `SearchField` (ícone, clear, debounce), `FilterChip`, `StockBadge`, `StatusBadge`.
- `ProductCard`, `ProductRow`, `ProductMedia`, `MetricCard`, `CategoryRow`.
- `EmptyState`, `ErrorState`, `LoadingSkeleton`, `InlineError`, `Toast/Banner`, `ConfirmDialog`.
- `FilterSheet`/modal nativo, `SortSheet`, `PaginationControls`, `SectionHeading`.

Variantes de componentes devem compartilhar os mesmos tokens e comportamentos nos dois temas. Ícones de uma biblioteca consistente; usar ícones com labels acessíveis. Estados de foco e seleção precisam ser evidentes em web e em tecnologias assistivas.

### 2.4 Movimento e microinterações

- Duração indicativa: **120–180 ms** para press/foco, **180–260 ms** para sheets/cards, **220–320 ms** para transições de conteúdo; usar curvas suaves, sem bounces exagerados.
- Press feedback discreto por opacidade/escala (ex.: 0,98). Adicionar haptics leves apenas em ações importantes se a dependência for compatível.
- Entrada de lista sem cascatas longas; mudanças de filtros devem manter sensação de continuidade.
- Skeletons com brilho **muito sutil** ou fade, respeitando redução de movimento.
- Respeitar `reduceMotion`/preferência do sistema. Nunca atrasar a navegação para exibir animações.
- Evitar deslocamento de layout quando imagens carregarem: reservar dimensões desde o início.

## 3. Arquitetura de informação e navegação

### Público

`/` → catálogo. `/products/[id]` → detalhe público. `/login` → autenticação.

### Admin

`/admin` → dashboard. `/admin/products` → produtos. `/admin/categories` → categorias. Formulário de novo produto em `/admin/products/new`, detalhe em `/admin/products/[id]`, edição em `/admin/products/[id]/edit`.

- `Stack` raiz e navegação por **tabs** dentro de admin: **Dashboard**, **Produtos**, **Categorias**. Apenas três tabs para não poluir a navegação.
- Tabs com ícone + texto, destaque suave para ativo, safe area e teclado respeitados. Telas de detalhe e formulário entram por cima das tabs, sem duplicá-las.
- Botão voltar sempre retorna ao contexto correto; filtros e scroll da listagem devem permanecer ao retornar do detalhe.
- Rotas administrativas protegidas por uma **única fonte de verdade de sessão**, usando mecanismos compatíveis com Expo Router SDK 58. Não renderizar conteúdo privado antes do auth check.
- Nunca criar duas rotas de `index.tsx` que resolvam ambas para `/`.

## 4. Especificação detalhada de cada tela

### 4.1 Catálogo — `/` (público)

**Objetivo:** permitir encontrar rapidamente produtos disponíveis, com primeira impressão visual elegante.

**Composição (de cima para baixo):**

1. Header compacto: símbolo/marca **Catapult** à esquerda; ação discreta **Admin** à direita, com ícone de cadeado ou usuário.
2. Hero editorial pequeno: título **“Explore o catálogo”**; subtítulo curto **“Encontre o que você procura.”**. Sem banner promocional fictício.
3. Busca em campo largo com ícone e placeholder **“Buscar produtos”**, botão limpar quando houver texto.
4. Chips horizontais: **Todas**, seguido das categorias reais ordenadas alfabeticamente. Chip ativo destacado em azul tonal.
5. Linha de ferramentas com texto **“Produtos”** e botões **Filtrar** e **Ordenar**; quando houver filtros ativos, exibir contador e ação limpar.
6. Grade de produtos: 2 colunas em largura adequada, 1 em telas estreitas. Cards com imagem de proporção consistente, categoria, nome (até 2 linhas), preço em destaque e badge **Em estoque / Estoque baixo / Esgotado**.
7. Paginação incremental via `FlatList`, footer de carregamento, retry no footer em caso de falha e refresh por gesto.

**Interações:**

- Busca com debounce 300–400 ms; filtros persistem enquanto o usuário abre e fecha detalhes.
- `FilterSheet`: preço mínimo/máximo, apenas com foto, status de estoque; botão **Aplicar filtros** e **Limpar**. Validar intervalo de preço.
- `SortSheet`: Nome A–Z, Menor preço, Maior preço.
- Ao alterar busca, categoria, filtro ou sort: reiniciar página em zero e evitar requests antigos sobrescreverem o resultado atual.
- Ao tocar card: abrir detalhe sem perder contexto da lista.
- Mostrar somente produtos com `active: true` **da página recebida**. O backend não filtra ativos server-side: continuar paginação enquanto houver próxima página e não apresentar `totalElements` como total exato de ativos.

**Estados:** skeleton de cards no carregamento inicial; vazio sem produtos **“Ainda não há produtos no catálogo”**; sem correspondência **“Nenhum produto encontrado”** com limpar filtros; falha de rede com **Tentar novamente**; fim de lista discreto sem efeito infinito.

### 4.2 Detalhe público — `/products/[id]`

**Objetivo:** apresentar um produto com foco visual e dados que ajudem na decisão, sem simular e-commerce.

- Header mínimo com botão voltar e título discreto **Produto**.
- Área de mídia grande, com fundo neutro e proporção previsível; foto sem cortes agressivos. Se PDF: cartão com ícone de documento e ação **Abrir PDF**; mídia desconhecida: **Abrir arquivo**.
- Abaixo: categoria em texto secundário, nome forte (até 2–3 linhas), preço proeminente, badge de estoque e linha **“X unidades disponíveis”**.
- Se não houver imagem: placeholder elegante com ícone de pacote e legenda **“Sem imagem”**.
- **Não mostrar custo, botão de compra, carrinho, pedidos nem ações de admin.**
- Buscar produto por ID novamente; `404`: **“Produto não encontrado”**, ações voltar e tentar atualizar.

### 4.3 Login — `/login`

**Objetivo:** entrada simples e segura para a gestão, sem distrair.

- Fundo limpo e cartão/coluna de formulário verticalmente equilibrado; no mobile, ocupar a largura disponível com padding generoso.
- Marca Catapult, título **“Acessar gestão”**, descrição **“Entre para gerenciar catálogo e estoque.”**.
- Campo **Usuário**; campo **Senha** com botão mostrar/ocultar com `accessibilityLabel` adequado; botão primário **Entrar** em largura total.
- Link secundário **Voltar ao catálogo**.
- Labels sempre visíveis, teclado com `returnKeyType` apropriado, submissão no teclado, `KeyboardAvoidingView` + conteúdo rolável.
- Em loading, botão vira indicador + **“Entrando...”**, bloqueando múltiplos submits.
- `401` de login: **“Usuário ou senha incorretos.”**; não apagar usuário. `400`: validar campos vazios e brancos. Falha de rede: erro amigável com dica sobre endereço da API, sem revelar credenciais.
- Sem cadastro, recuperação de senha, JWT, “lembrar senha” ou login social.

### 4.4 Dashboard — `/admin`

**Objetivo:** visão imediata de saúde do estoque e caminhos para ação.

- Header com **“Visão geral”**, linha de saudação **“Olá, {username}”**, ações discretas para tema e sair.
- Primeiro bloco: **Valor em estoque** com card mais proeminente (superfície levemente diferenciada), valor em BRL e texto **“Valor potencial do inventário”**. Não insinuar lucro ou receita.
- Grade de seis métricas no total: **Produtos**, **Categorias**, **Valor em estoque**, **Preço médio**, **Sem arquivo**, **Estoque baixo**. No celular, 2 colunas; em tablet, até 3, sem cards espremidos.
- Seção **Atenção necessária**: dois atalhos nítidos **“Ver estoque baixo”** e **“Ver produtos sem foto”** que abrem `/admin/products` com os filtros correspondentes.
- Seção **Valor por categoria**: barras horizontais proporcionais, nomes legíveis e valores; ordenadas por `total_value` decrescente, com categorias vazias ausentes conforme API.
- Seção **Faixas de preço**: três barras/linhas com contagem, sem biblioteca de gráfico pesada.
- Pull-to-refresh refaz as três consultas do dashboard. **Cada seção falha isoladamente**, com retry específico; não apagar métricas válidas porque uma seção falhou.
- Em dados zerados, apresentar zero com dignidade; não inventar variação percentual nem tendências históricas.

### 4.5 Gestão de produtos — `/admin/products`

**Objetivo:** consultar e ajustar estoque rapidamente, com baixo risco de erro.

- Header **“Produtos”**, contagem disponibilizada pela API e ação **+ Novo** (ou FAB sem cobrir conteúdo).
- Busca persistente; filtros por categoria, status de estoque e, quando necessário, filtro **Com/Sem foto**. Mostrar ativos **e inativos**; tag **Inativo** visível.
- Lista vertical de `ProductRow`: miniatura quadrada, nome, categoria, preço, tag ativo/inativo, quantidade e estoque visual.
- À direita ou abaixo, controle explícito de estoque **[−] [quantidade] [+]**; alvos de toque ≥44 px. Botão decremento desabilitado em zero.
- Toque no corpo da linha abre detalhe admin; botões de estoque não disparam abertura de detalhe.
- Atualização de estoque otimista com feedback discreto **“Salvando...”**; rollback claro se falhar. Agrupar toques rápidos por produto e serializar requisições para não permitir respostas antigas substituírem quantidade recente.
- Paginação anterior/próxima, com página atual e indicador de carregamento; pull-to-refresh e retry. Preservar filtros ao voltar.
- Estados vazios distintos: sem produtos cadastrados (CTA **Cadastrar produto**) e sem resultados (CTA **Limpar filtros**).

### 4.6 Novo produto — `/admin/products/new`

**Objetivo:** cadastrar sem fricção e com validação compreensível.

- Header **“Novo produto”** e voltar.
- Formulário em seções visuais leves: **Informações básicas**, **Preço e estoque**, **Visibilidade e arquivo**.
- Campos: Nome, Categoria (seletor nativo/modal de lista pesquisável localmente), Preço (BRL), Custo (opcional), Quantidade em estoque (inteiro), switch **Produto ativo**.
- Área de upload tipo card tracejado **“Adicionar imagem ou PDF”**, com ícone, formatos aceitos e **“Máx. 5 MB”**. Ao escolher, mostrar nome, formato, tamanho e botão trocar/remover.
- Botão primário **“Criar produto”** persistente ou posicionado ao fim do formulário respeitando teclado/safe area.
- Validação inline: nome não branco, categoria obrigatória, preço ≥ R$ 0,01, custo ≥ 0, estoque inteiro ≥ 0, arquivo permitido e até 5 MB. Aceitar vírgula em campos monetários e normalizar antes do request.
- Impedir duplo envio; manter valores em caso de erro e mostrar estado de upload.
- Após sucesso, feedback visível e navegação para detalhe admin do novo produto ou lista atualizada.
- Confirmar saída se há alterações não salvas.

### 4.7 Detalhe administrativo — `/admin/products/[id]`

**Objetivo:** inspecionar dados completos e executar ações conscientes.

- Header com voltar e menu/ações **Editar** e **Excluir**.
- Mídia com lógica de imagem/PDF igual ao detalhe público.
- Nome, categoria, preço e etiquetas **Ativo/Inativo** e status de estoque.
- Seção **Estoque**: quantidade atual e apresentação clara.
- Seção **Dados do produto**: custo, data de criação e última atualização. Datas do backend não têm fuso: exibir sem assumir UTC ou adicionar `Z`.
- CTA primário **Editar produto**. Ação excluir visível, mas de menor hierarquia visual e sem ficar colada à ação principal.
- Excluir abre confirmação com nome e texto **“O produto e seu arquivo serão excluídos permanentemente.”**; ação inicial/segura **Cancelar**, destrutiva **Excluir produto**.
- `204`: voltar e atualizar listas; `404`: informar que já não existe; `500+`: permanecer na tela, erro + retry.

### 4.8 Editar produto — `/admin/products/[id]/edit`

**Objetivo:** atualizar sem perda silenciosa de arquivo nem dados.

- Mesmo sistema de campos do formulário de criação, preenchido após `GET /products/{id}`; skeleton durante carregamento.
- Área de mídia atual com nome/preview quando possível e **decisão obrigatória explícita**:
  - **Manter arquivo atual** (padrão se houver mídia): baixar e reenviar a mídia atual no PUT multipart.
  - **Trocar arquivo**: selecionar novo arquivo e anexar.
  - **Remover arquivo**: exigir confirmação, e então PUT sem arquivo.
- Nunca enviar um PUT JSON/multipart sem `photo` por acidente: neste backend, isso **remove a mídia existente**.
- Se o download da mídia atual falhar, bloquear salvar no modo “manter”, mostrar **Tentar novamente** ou permitir escolha explícita de remoção.
- Botão **Salvar alterações**, estado **“Salvando...”**, erros preservando formulário, confirmação ao sair com mudanças pendentes.
- Atualizações incluem campos completos obrigatórios; não confundir `null`/omissão de custo com comando de limpar valor (o backend não suporta limpar `cost_price` desse modo).

### 4.9 Categorias — `/admin/categories`

**Objetivo:** CRUD leve, rápido e seguro.

- Header **“Categorias”** + CTA **Nova categoria**.
- Lista ordenada por nome, cada linha com nome, contador **“X produtos”** (obtido de `category.products.length`), ações de renomear e excluir.
- Criar/renomear em modal curto ou sheet: campo **Nome da categoria**, CTA contextual **Criar / Salvar**; validação de nome não branco.
- Excluir: confirmação clara; no HTTP `409`, manter linha e exibir **“Mova ou exclua os produtos desta categoria antes de removê-la.”**.
- Categorias duplicadas são permitidas pelo backend: não inventar bloqueio de nome duplicado no cliente.
- Estado vazio com CTA **Criar primeira categoria**. Refresh/retry adequados; sem paginação server-side.

## 5. Contrato de dados e integração: requisitos que o design não pode contrariar

### 5.1 Cliente HTTP e sessão

- API sob `/api`, origem por acesso estático `process.env.EXPO_PUBLIC_API_ORIGIN`; se ausente, apresentar diagnóstico claro.
- Mesmo host/origem para todas as operações; `credentials: 'include'` em **todas** as requisições. Sessão por cookie **HttpOnly `JSESSIONID`**, não JWT; não armazenar senha/cookie manualmente.
- No bootstrap, executar `GET /auth/check`; `200` libera admin, `401` significa anônimo. Exibir splash neutro durante a verificação.
- `401` em chamadas privadas: invalidar cache privado, marcar sessão expirada, apresentar **“Sessão expirada. Entre novamente.”** e redirecionar uma vez. Não tratar `401` esperado do bootstrap/login como expiração global.
- Logout somente é considerado concluído após `POST /logout` retornar `200`. Em falha de rede, mostrar retry, sem afirmar logout.
- Tratar `204` como resposta sem body, multipart sem definir `Content-Type`, erros HTTP separados de falha de conexão.
- Não colocar `fetch` nas telas; centralizar serviços, tipos e cache. Preservar `snake_case` dos payloads.

### 5.2 Endpoints por experiência

| Experiência | API |
|---|---|
| Login / sessão / sair | `POST /login`, `GET /auth/check`, `POST /logout` |
| Catálogo / listagem admin | `GET /products` com `nome`, `category_id`, `min_price`, `max_price`, `has_photo`, `stock_status`, `page`, `size`, `sort` |
| Detalhes | `GET /products/{id}` |
| Mídia | `GET /products/{id}/photo` (path relativo resolvido contra origem) |
| Criar / editar / excluir | `POST /products`, `PUT /products/{id}`, `DELETE /products/{id}` |
| Ajustar estoque | `PATCH /products/{id}/stock` |
| Categorias | `GET /categories`, `POST /categories`, `PUT /categories/{id}`, `DELETE /categories/{id}` |
| Dashboard | `GET /dashboard/summary`, `GET /dashboard/products-by-category`, `GET /dashboard/price-ranges` |

- Sorts permitidos: `name`, `price`, `stockQuantity`, `costPrice`, `createdAt`, `updatedAt`, `active`, `id`. **Sort usa camelCase**, payloads JSON usam snake_case.
- Status: `OUT_OF_STOCK` (=0), `LOW_STOCK` (1–5), `IN_STOCK` (>5).
- `mediaUrl()` deve resolver `/api/products/.../photo` em URL absoluta. Não supor que `photo` seja sempre imagem; pode ser PDF ou arquivo de tipo genérico.
- Upload com `expo-document-picker` para imagens e PDF. No nativo usar URI/nome/MIME; no web, `asset.file` quando disponível. Verificar extensão, MIME e 5 MB.
- Dashboard inclui produtos inativos. Catálogo filtra `active` **somente client-side na página atual**. Não simular filtro server-side inexistente.
- Não implementar cadastro público, carrinho, pedidos, autorização por papéis, bulk actions, JWT ou estatísticas históricas inexistentes.

## 6. Padrão de estados e mensagens

Todo componente com rede deve ter estado real de **loading inicial, sucesso, vazio e erro/retry**. Diferenciar loading inicial de refresh e de carregamento de próxima página.

| Situação | Padrão visual e comportamento |
|---|---|
| Loading inicial | Skeleton no mesmo layout final; sem tela vazia piscando |
| Atualização | Spinner discreto de refresh, mantendo dados existentes |
| Carregar mais | Indicador no rodapé, sem bloquear a lista |
| Sem dados | Ilustração simples em linha ou ícone + título + descrição + ação útil |
| Erro de rede | Texto claro + **Tentar novamente**, sem stack trace |
| Erro de campo | Descrição abaixo do input; borda semântica; foco no primeiro campo inválido |
| Sucesso de mutation | Feedback breve e acessível; refletir novos dados após invalidação |
| Falha de mutation | Preservar dados de formulário; reverter otimista quando aplicável |
| Sessão expirada | Banner/aviso claro + navegação única para login |
| Operação destrutiva | Diálogo de confirmação com opção segura destacada inicialmente |

Mensagens por status: `400` validação; `401` login inválido/expiração conforme contexto; `404` removido ou inexistente; `409` conflito de categoria; `413` arquivo grande; `415` formato inválido; `500+` erro genérico com retry. Não pressupor formato uniforme de resposta de erro Spring.

## 7. Responsividade, acessibilidade e performance

- Pensar primeiro em aparelhos de 360–430 dp de largura; adaptar tablets/web com contenção de largura e mais colunas onde houver espaço.
- Nunca envolver `FlatList` virtualizada em `ScrollView` vertical que quebre virtualização. `numColumns` deve permanecer estável dentro da mesma instância; remount controlado ao mudar breakpoint.
- Suportar acessibilidade de fonte, contraste, leitor de tela, labels de ações só com ícone, seleção de chips/switches e redução de movimento.
- Inputs fora de visão devem ser alcançáveis com teclado aberto; manter botões importantes acessíveis acima do teclado e da safe area.
- Feedback não depende só de cor: incluir texto/ícone de estado.
- `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` para valores; aceitar vírgula na digitação e enviar número JSON ou campo multipart decimal com ponto.
- Cancelar buscas obsoletas; debounce; evitar chamadas duplicadas de paginação e mutações concorrentes de estoque no mesmo produto.
- Ao voltar do detalhe, preservar lista, posição, filtros e ordenação quando viável.
- Preferir componentes nativos e `expo-image`; não usar HTML/DOM nas telas compartilhadas.

## 8. Estrutura de implementação sugerida

```text
src/
  app/                  # somente arquivos de rota e layouts
    _layout.tsx
    index.tsx
    login.tsx
    products/[id].tsx
    admin/
      _layout.tsx
      index.tsx
      products/
        _layout.tsx
        index.tsx
        new.tsx
        [id].tsx
        [id]/edit.tsx
      categories/index.tsx
  components/
    ui/                 # primitives e componentes de estado
    catalog/            # cards e filtros
    admin/              # métricas, linhas e formulários
  features/             # lógica por domínio
  hooks/                # filtros, debounce, tema, estado
  lib/api/              # cliente, tipos, serviços e URLs
  providers/            # tema, autenticação, query
  theme/                # tokens light/dark, escalas
  utils/                # moeda, data, validação
```

- Utilizar Expo SDK 58, React Native, TypeScript e Expo Router existentes. Consultar documentação oficial do SDK 58 antes de modificar APIs do Expo.
- Instalar somente dependências necessárias, via `npx expo install <pacote>`; não editar manualmente projetos nativos `ios/`/`android/`.
- TanStack Query é adequado para estado servidor, com invalidação de produtos/categorias/dashboard após mutations. Não persistir cache privado inadvertidamente após logout/expiração.
- Não gravar senhas, cookies ou informações sensíveis em logs. Não inserir credencial padrão de dev no app.

## 9. Regras de qualidade visual (evitar)

**Não fazer:**

- Transformar toda seção em um card com borda e sombra.
- Usar azul muito saturado em grandes fundos, especialmente à noite.
- Colocar cinco ou mais ações igualmente chamativas no mesmo header.
- Mostrar placeholders falsos como se fossem dados de produção.
- Animar cada linha de lista com delays cumulativos.
- Esconder ações essenciais atrás de long press.
- Enviar foto em `expo-image` sem distinguir PDF.
- Descartar formulário quando a API retornar erro.
- Remover arquivo existente por omissão acidental em `PUT`.
- Oferecer funcionalidades que o backend não suporta.

**Fazer:** usar hierarquia, whitespace, informações progressivas, microinterações discretas, confirmação de ações irreversíveis, consistência entre claro/escuro e estados reais observáveis.

## 10. Plano de execução para o agente

1. Inspecionar o projeto real, `../AGENTS.md` e `../../backend/docs/api.md`; verificar o que já existe antes de sobrescrever.
2. Criar tokens de tema, provider e componentes básicos com dark mode funcional.
3. Criar serviços HTTP tipados, resolução de mídia e provider de sessão.
4. Implementar navegação, catálogo, detalhe e login.
5. Implementar dashboard e área administrativa com tabs.
6. Implementar CRUD de produtos, estoque, upload seguro e edição com preservação de arquivo.
7. Implementar CRUD de categorias e tratamento de `409`.
8. Refinar responsividade, acessibilidade, microinterações, vazios e erros.
9. Rodar `npx expo lint`, `npx tsc --noEmit` e `npx expo-doctor`; corrigir falhas e reportar resultados reais.
10. Testar manualmente fluxos prioritários em Android e iOS quando disponíveis; web opcional, sem comprometer UX nativa.

## 11. Critérios de aceite

- [ ] As 9 telas estão implementadas, navegáveis e consistentes com o design system.
- [ ] Claro, escuro e sistema funcionam, com atualização imediata de componentes e StatusBar.
- [ ] Nenhuma rota principal continua sendo demo/template.
- [ ] UI elegante com cartões/typografia/spacing consistentes e sem excesso visual.
- [ ] Sessão HTTP por cookie funciona; rotas protegidas não piscam conteúdo privado.
- [ ] Filtros, sort, paginação e visibilidade pública respeitam backend real.
- [ ] Status, imagens, PDF e moeda são exibidos corretamente.
- [ ] Gestão de produtos, categorias, estoque e dashboard consome a API real.
- [ ] Edição de produto nunca remove a mídia atual sem decisão explícita.
- [ ] Loading, empty, error, retry, refresh e mutation feedback cobertos.
- [ ] Teclado, safe area, leitores de tela, toque mínimo e redução de movimento verificados.
- [ ] `expo lint`, TypeScript e `expo-doctor` executados e resultados documentados.

---

### Prompt recomendado para iniciar um agente

> Leia integralmente `mobile.md`, `../AGENTS.md` e `../../backend/docs/api.md`. Implemente no projeto Expo existente todas as telas e comportamentos descritos em `mobile.md`. Priorize uma UI nativa moderna, minimalista e fluida, com temas claro/escuro/sistema baseados em tokens semânticos. Consuma exclusivamente a API real; preserve contratos e limitações do backend. Crie componentes reutilizáveis, valide todos os estados e execute lint, typecheck e Expo Doctor ao final. Não considere concluído nenhum fluxo com mocks permanentes, preservação de mídia insegura ou bugs de autenticação.
