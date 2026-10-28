# Catapult — Especificação de design do frontend

Documento para o agente que vai implementar o frontend. Descreve identidade visual, telas, componentes, comportamento e integração com a API. O contrato completo do backend está em `api.md`, que é a fonte de verdade para rotas, campos e status HTTP. Em caso de conflito entre este documento e o `api.md` sobre a API, vale o `api.md`.

Referência visual: canvas "Catapult — Design do Frontend" (https://claude.ai/artifact/PC3H3k6N9NBxtLV2Z3Ly3t). As telas lá são maquetes estáticas com dados de exemplo. Este documento é a versão implementável.

---

## 1. Objetivo e escopo

Aplicação web de catálogo e estoque com duas áreas:

1. **Área pública (vitrine):** qualquer pessoa navega pelos produtos e categorias. Usa apenas rotas públicas da API.
2. **Área administrativa (restrita):** só quem tem sessão válida acessa. Reúne indicadores do dashboard e gestão de produtos em uma única tela, com modais para visualizar, editar e excluir.

Telas e componentes a entregar:

| Tela / componente | Rota sugerida | Acesso |
|---|---|---|
| Vitrine pública | `/` | Público |
| Login | `/login` | Público |
| Painel admin (dashboard + produtos) | `/admin` | Restrito |
| Modal visualizar produto | sobre `/admin` | Restrito |
| Modal editar / criar produto | sobre `/admin` | Restrito |
| Modal excluir produto | sobre `/admin` | Restrito |
| Toasts | global | Ambos |
| Página 404 | `*` | Público |

Fora de escopo nesta versão: tela de categorias, detalhe público de produto em página própria, estado vazio ilustrado, layout de celular dos modais como folha inferior, desfazer exclusão (a API não oferece).

---

## 2. Stack recomendada

- React 18 + TypeScript + Vite.
- React Router (rotas e guarda de rota).
- TanStack Query para cache e invalidação das chamadas.
- React Hook Form + Zod para formulários e validação.
- CSS Modules ou Tailwind, o que o projeto já usar. Os tokens da seção 3 devem virar variáveis CSS ou tema, sem valores soltos nos componentes.
- Sem biblioteca de componentes pesada. Modais, toasts e chips são simples e devem seguir esta especificação. Se usar uma base acessível (por exemplo Radix Dialog), estilizar conforme abaixo.

---

## 3. Design tokens

### 3.1 Cores

| Token | Hex | Uso |
|---|---|---|
| `--ink` | `#17153B` | Texto principal, sidebar, fundos escuros, chip ativo |
| `--violet` | `#5B3DF5` | Cor de ação: botão primário, link, item ativo da sidebar |
| `--lime` | `#D4F55A` | Destaque sobre fundo escuro (links, botão na 404, anel do "0") |
| `--ground` | `#F4F3FF` | Fundo das páginas e campos somente leitura |
| `--surface` | `#FFFFFF` | Cards, modais, campos |
| `--line` | `#E4E1F5` | Borda de card e do header |
| `--line-soft` | `#EEECFA` | Divisórias de tabela, trilhas de barra, borda de campo readonly |
| `--line-input` | `#CFCBE8` | Borda de campos, botões secundários, chips |
| `--muted` | `#5A587A` | Texto secundário, rótulos |
| `--danger` | `#B3122F` | Botão de exclusão e ícone de lixeira |
| `--scrim` | `#17153B` | Fundo escuro dos modais, com gradiente radial `#4A3FB0` no canto superior esquerdo |

Status de estoque e estados (fundo / texto):

| Estado | Fundo | Texto |
|---|---|---|
| Em estoque / sucesso | `#E3F8B0` | `#2B3A00` |
| Estoque baixo / aviso | `#FFE7B8` | `#6B3F00` |
| Esgotado / erro | `#FFD9DE` | `#7A1426` |
| Informação | `#EDEBFA` | `#17153B` |

Gradientes de miniatura de produto (placeholder quando não há foto, ou fundo do card): pares como `#D9D2FF → #B8A8FF`, `#F1FFC4 → #D4F55A`, `#FFE1D6 → #FFB9A0`, `#CFF3FF → #9AD9F5`, `#FFF3C9 → #FFDD7A`, `#FFD9DE → #FFB3BD`. Escolher o par de forma estável a partir do `id` do produto.

Contraste: todos os pares texto/fundo acima já foram escolhidos para 4,5:1 ou mais. Manter ao criar novas variações.

### 3.2 Tipografia

- Títulos e números de destaque: **Bricolage Grotesque**, pesos 600 e 800 (Google Fonts).
- Corpo, rótulos, botões, campos: **Manrope**, pesos 500 e 700.
- Fallback: `system-ui, sans-serif`.

| Papel | Tamanho / peso |
|---|---|
| Título hero da vitrine | 44px / 800, entrelinha 1.05 |
| Título de página admin | 32px / 800 |
| Título de modal | 24–26px / 800 |
| Número de KPI | 24px / 800 (Bricolage) |
| Preço no card da vitrine | 20px / 800 (Bricolage) |
| Corpo | 14px / 500 |
| Rótulo de campo | 12px / 700, cor `--muted` |
| Texto auxiliar | 13px / 500, cor `--muted` |
| Tag | 12px / 700 |
| "404" | 200px / 800 |

### 3.3 Forma, espaço e sombra

- Raios: card 20px, hero 28px, modal 28px, campo e botão 12px, miniatura 16px, chip e tag 99px.
- Alvos de toque e altura mínima de campo, botão e chip: **44px**.
- Espaçamento base de 4px. Gaps usuais: 8, 12, 16, 20, 24.
- Sombra de modal: `0 30px 80px rgba(0,0,0,.45)`. Sombra de toast: `0 10px 30px rgba(23,21,59,.18)`.
- Focus visível em todo elemento interativo: anel de 2px em `--violet` com offset de 2px (em fundo escuro, `--lime`).

### 3.4 Ícones

SVG inline com traço (stroke 1.6–2.5, cantos arredondados), sem emojis. Necessários: fechar (X), lixeira, caixa/pacote (404), check, alerta, informação. Botões só com ícone levam `aria-label`; SVG decorativo leva `aria-hidden="true"`.

---

## 4. Componentes base

### Botões
- **Primário:** fundo `--violet`, texto branco, 700, raio 12, altura 44, padding horizontal 20.
- **Secundário:** fundo branco, borda `--line-input`, texto `--ink`.
- **Destrutivo:** fundo `--danger`, texto branco.
- **No fundo escuro (404):** primário vira fundo `--lime` com texto `--ink`; secundário fica transparente, texto branco, borda `#8F86E0`.
- Estados: hover levemente mais escuro, disabled com opacidade reduzida e `cursor: not-allowed`, loading com spinner e texto mantido.

### Campos
- Altura 44, borda `--line-input`, raio 12, padding horizontal 14.
- Rótulo acima, 12px/700, ligado por `for`/`id`.
- Somente leitura: fundo `--ground`, borda `--line-soft`, sem foco de edição.
- Erro de validação: borda `--danger` e mensagem abaixo, 13px, ligada por `aria-describedby`.

### Chip
Pílula de 44px de altura, borda `--line-input`, fundo branco. Ativo: fundo e borda `--ink`, texto branco. É um `button` com `aria-pressed`.

### Tag
Pílula pequena com as cores de status da seção 3.1. Nunca depender só da cor: sempre com texto ("Em estoque", "Baixo", "Esgotado", "Ativo", "PDF").

### Card
Fundo branco, borda `--line`, raio 20, padding 18 (KPIs 14×16).

### Miniatura
Quadrado com raio 12–16 e gradiente do pool da seção 3.1 quando não há imagem. Com `photo` de imagem, mostrar `<img>` com `object-fit: cover`. Quando o arquivo for PDF, mostrar o gradiente com tag "PDF" e abrir o arquivo em nova aba ao clicar (a API pode devolver PDF em `/photo`, então não usar `<img>` para ele).

### Barra de progresso
Trilha `--line-soft`, 8px de altura, raio 99, preenchimento `--violet`, largura proporcional ao maior valor.

---

## 5. Telas

### 5.1 Vitrine pública (`/`)

Fundo `--ground`. Conteúdo centralizado, largura máxima 1200px, padding horizontal 40px (24px no celular).

Estrutura, de cima para baixo:

1. **Header** branco com borda inferior: logotipo "Catapult" (Bricolage 24px, `--violet`), campo de busca (flexível, máximo 520px) e botão secundário "Área do administrador" que leva a `/admin`.
2. **Hero** escuro (`--ink`) com raio 28, padding 40, gradiente radial `--violet` no canto superior direito. Título "Tudo o que você procura, em estoque." e uma linha de apoio.
3. **Chips de categoria** em linha com quebra: "Todas" mais uma por categoria vinda de `GET /api/categories`.
4. **Barra de filtros:** preço mínimo, preço máximo, chip "Em estoque", chip "Com foto" e seletor de ordenação alinhado à direita (Nome A–Z, Menor preço, Maior preço).
5. **Grade de produtos:** `grid-template-columns: repeat(auto-fill, minmax(250px, 1fr))`, gap 20.
6. **Paginação:** botão secundário centralizado "Carregar mais · página X de Y".

**Card de produto:** card com padding 10. Área de imagem 4:3 com raio 14 e a tag de disponibilidade no canto inferior esquerdo. Abaixo: nome da categoria (muted), nome do produto (700) e preço (Bricolage 20px) formatado em `pt-BR`. Card inteiro clicável abre o modal de visualização pública (mesmo modal de visualizar, sem o botão "Editar").

Mapeamento de disponibilidade (calculado no cliente a partir de `stock_quantity`): `0` = "Esgotado" (erro), `1–5` = "Últimas unidades" (aviso), `>5` = "Em estoque" (sucesso).

**Chamadas (todas públicas):**

| Ação | Chamada |
|---|---|
| Categorias para os chips | `GET /api/categories` |
| Lista | `GET /api/products?page=&size=12&sort=...` |
| Busca | `nome=` com debounce de 300ms |
| Categoria | `category_id=` |
| Preço | `min_price=`, `max_price=` |
| Em estoque | `stock_status=IN_STOCK` |
| Com foto | `has_photo=true` |
| Foto | `product.photo` resolvido contra a origem da API |

Regras:
- Qualquer mudança de filtro volta `page` para `0`.
- A vitrine deve mostrar só produtos `active: true`. A API não filtra por `active`, então filtrar no cliente e avisar no código que a contagem da página pode ficar menor que `size`.
- "Carregar mais" usa `useInfiniteQuery` acumulando páginas; desabilitar quando `last === true`.
- Ordenação usa propriedades Java em camelCase: `name,asc`, `price,asc`, `price,desc`. Usar lista fixa (allowlist).
- Validar `min_price <= max_price` no cliente, porque a API não valida.

### 5.2 Login (`/login`)

Tela dividida em duas colunas que empilham abaixo de ~880px.

- **Esquerda:** fundo `--ink` com gradiente radial violeta no canto inferior esquerdo. Logotipo no topo e, embaixo, título "Painel do administrador" (52px/800) e uma frase de apoio.
- **Direita:** fundo `--ground`, card branco de até 380px centralizado: título "Entrar", campos Usuário e Senha, alerta de erro, botão "Entrar" e link "Voltar à vitrine pública".

Comportamento:
- `POST /api/login` com `{ username, password }`, ambos obrigatórios e não vazios.
- Sucesso: invalidar o cache de sessão e redirecionar para a rota que o usuário tentou acessar (padrão `/admin`).
- `401`: mostrar no alerta (`role="alert"`) "Usuário ou senha incorretos." Não limpar o campo de usuário.
- `400`: mostrar erros de campo.
- Desabilitar o botão e mostrar loading durante o envio.
- Não salvar senha, não procurar token. A sessão é o cookie `JSESSIONID`.

### 5.3 Painel admin (`/admin`)

Layout: sidebar fixa à esquerda (210px) e área principal rolável. Fundo `--ground`.

**Sidebar:** fundo `--ink`, padding 22×14. Logotipo no topo (branco). Itens: "Painel" (ativo: fundo `--violet`, texto branco), "Categorias" (reservado), "Vitrine pública" (leva a `/`). "Sair" no rodapé. Itens com 44px de altura, texto `#D9D6F5`. Em telas estreitas, a sidebar vira barra superior ou menu recolhível.

**Cabeçalho da página:** título "Painel" (32px), subtítulo "Indicadores e produtos em um só lugar", tag "Sessão: *username*" (sucesso) e botão primário "+ Novo produto".

**Linha 1, KPIs em cards pequenos** (flex com quebra, `flex: 1 1 150px`): Produtos, Categorias, Valor em estoque (formatado de forma compacta, por exemplo "R$ 84,5 mil"), Preço médio, Sem foto, Estoque baixo. Dados de `GET /api/dashboard/summary`.

**Linha 2, três cards:**
- **Faixas de preço:** anel (donut) em `conic-gradient` com `--violet`, `--lime` e `--ink`, mais legenda com contagens. Dados de `GET /api/dashboard/price-ranges` (sempre 3 itens). O anel precisa de `role="img"` e `aria-label` descrevendo os valores.
- **Valor por categoria:** barras horizontais com nome, valor e barra proporcional. Dados de `GET /api/dashboard/products-by-category`. A API não garante ordem: ordenar por `total_value` decrescente no cliente.
- **Atenção:** card escuro com os alertas "N produtos com estoque baixo", "N produtos sem foto" e link lima "Ver estoque baixo", que aplica o filtro de estoque baixo na tabela abaixo.

**Linha 3, gestão de produtos** (um card):
- Chips de status com contagem: Todos, Esgotado, Baixo, Em estoque. Equivalem a `stock_status` (`OUT_OF_STOCK`, `LOW_STOCK`, `IN_STOCK`). As contagens podem vir de requisições de `size=1` lendo `totalElements`.
- Busca por nome (debounce 300ms) e seletor de categoria.
- Tabela com colunas: miniatura, Produto (nome + categoria), Preço, Estoque, Status, ação "Editar".
- **Estoque editável na linha:** botões "−" e "+" de 44×44 com o valor no meio. Cada clique dispara `PATCH /api/products/{id}/stock` com `{ stock_quantity }`, com atualização otimista e rollback em erro. Não deixar passar de 0 para baixo. Fazer debounce de 400ms para cliques em sequência.
- Clique no nome ou na miniatura abre o modal de visualizar. "Editar" abre o modal de editar.
- Rodapé: "Página X de Y · N itens" e controles de página anterior/próxima. Tabela com `overflow-x: auto` e largura mínima de 700px.
- Status da linha: tag com as regras da seção 5.1, mas com rótulos "Em estoque", "Baixo" e "Esgotado".

**Observações do dashboard:** todos os endpoints do dashboard consideram produtos inativos. Mostrar uma nota discreta ou tag "Inativo" na linha quando `active === false`. "Estoque baixo" do resumo inclui estoque zero.

### 5.4 Guarda de rota e sessão

- Ao montar o app, chamar `GET /api/auth/check` (com `credentials: 'include'`). Guardar `{ authenticated, username }` no estado de sessão.
- `/admin` e seus filhos só renderizam com `200`. Com `401`, redirecionar para `/login` guardando a rota de origem.
- Enquanto a verificação não terminar, mostrar um esqueleto neutro, nunca o painel.
- **Tratamento global de `401`:** qualquer resposta `401` em chamada protegida limpa a sessão e o cache privado (TanStack Query `clear()`), mostra o toast "Sessão expirada" e redireciona para o login.
- Logout: `POST /api/logout`, limpar sessão e cache, ir para `/`.
- Só carregar dados do dashboard depois de a sessão estar confirmada.
- Esta guarda é conveniência de interface. A segurança real é do backend.

---

## 6. Modais

Comportamento comum:
- Base: `<dialog>` ou componente equivalente com `role="dialog"`, `aria-modal="true"` e `aria-labelledby` apontando para o título.
- Fundo (scrim): `--ink` com gradiente radial `#4A3FB0` no canto superior esquerdo; cobre a tela, centraliza o modal e tem padding de 32px.
- Painel branco, largura 100% com máximo 620px (440px no de exclusão), raio 28, padding 28, gap 18, sombra da seção 3.3.
- Foco: ao abrir, foco no primeiro campo (ou no botão seguro, no de exclusão). Prender o foco dentro. `Esc` e clique no scrim fecham, exceto durante envio. Ao fechar, devolver o foco ao elemento que abriu.
- Bloquear a rolagem da página enquanto aberto.
- Animação de entrada sutil (opacidade e leve subida, 150–200ms). Respeitar `prefers-reduced-motion`.
- Cabeçalho: miniatura 56×56 (raio 16), título, subtítulo (muted) e botão de fechar 44×44 com ícone X (fundo `--ground`, raio 12, `aria-label="Fechar"`).

### 6.1 Modal visualizar

- Subtítulo: "Somente visualização".
- Faixa de imagem 16:7 com raio 20 e as tags de estoque e "Ativo"/"Inativo" no canto inferior esquerdo. Se a foto for PDF, mostrar bloco com o gradiente e botão "Abrir PDF".
- Campos em grade de 2 colunas, todos somente leitura e **já preenchidos** (no React, via `defaultValue` ou valor controlado do produto): Nome (largura total), Categoria, Estoque ("8 un."), Preço ("R$ 199,90"), Custo, Criado em e Atualizado em (`dd/MM/yyyy HH:mm`, sem fuso).
- `cost_price` nulo mostra "—".
- Rodapé alinhado à direita: "Fechar" (secundário) e "Editar" (primário), que troca para o modal de editar sem recarregar.
- Na vitrine pública, o modal não mostra Custo, Criado em, Atualizado em nem "Editar".

### 6.2 Modal editar / criar

- Título "Editar produto" (subtítulo "Atualize os dados e salve") ou "Novo produto".
- Campos: Nome (largura total, obrigatório), Categoria (select, obrigatória, com as categorias da API), Estoque (inteiro, mínimo 0), Preço (obrigatório, mínimo 0,01), Custo (mínimo 0, opcional). Preços aceitam vírgula e são convertidos para número antes do envio.
- Interruptor "Produto ativo" (checkbox de 20px com rótulo clicável).
- Área de arquivo com borda tracejada `--line-input`, fundo `--ground`, raio 18: miniatura, nome do arquivo atual, texto "PNG, JPG, GIF, WEBP ou PDF · até 5 MB" e botão "Trocar arquivo". Também aceita arrastar e soltar.
- **Aviso fixo (importante):** faixa âmbar (`#FFE7B8` / `#6B3F00`) com o texto "Sem reenviar o arquivo, a foto atual é removida ao salvar." Ver a regra abaixo.
- Rodapé: "Cancelar" (secundário) e "Salvar alterações" (primário). No criar: "Criar produto".

**Regras de envio:**
- Sem arquivo novo e criando: `POST /api/products` em JSON.
- Com arquivo: `FormData` com `name`, `price`, `category_id`, `stock_quantity`, `cost_price`, `active` e `photo`. Não definir `Content-Type` manualmente.
- Edição: `PUT /api/products/{id}`. `name`, `price` e `category_id` são sempre obrigatórios. **A API apaga a foto atual quando o PUT não leva arquivo.** Para preservá-la, o cliente deve baixar o arquivo atual de `/api/products/{id}/photo` e reenviá-lo como `photo` no multipart, ou então mostrar a confirmação do aviso acima antes de salvar. Implementar a primeira opção quando possível e manter o aviso quando o usuário optar por remover.
- `cost_price` e `stock_quantity` omitidos preservam o valor atual. Não é possível limpar o custo para `null`.
- Validação no cliente: arquivo até 5 MB e extensão/MIME permitidos, estoque e custo não negativos (a API não valida), preço maior ou igual a 0,01.
- Sucesso: fechar o modal, invalidar `products` e `dashboard`, toast "Produto salvo".
- Erros: `400` mostra erros nos campos, `404` de categoria avisa e recarrega categorias, `413` e erros de arquivo mostram mensagem no bloco de arquivo, `500` mostra toast de erro.

### 6.3 Modal excluir

- Compacto (440px), conteúdo centralizado.
- Círculo de 72px com fundo `#FFD9DE` e ícone de lixeira em `--danger`.
- Título "Excluir produto?" e texto "Esta ação remove o produto e o arquivo associado. Não é possível desfazer."
- Resumo do produto em bloco `--ground` com raio 16: miniatura de 44px, nome e "categoria · preço".
- Botões lado a lado: "Cancelar" (secundário) e "Sim, excluir" (destrutivo). Foco inicial em "Cancelar".
- `DELETE /api/products/{id}`: `204` não tem corpo, então não chamar `.json()`. Sucesso: fechar, invalidar cache e mostrar toast "Produto excluído". `404`: tratar como já excluído e atualizar a lista. `500`: toast de erro (o arquivo pode não ter sido removido).

---

## 7. Toasts

- Posição: canto superior direito, empilhados com gap 12, largura de 360–400px (no celular, largura total com margem de 16px, no topo).
- Card branco, raio 16, padding 14×16, sombra da seção 3.3. Conteúdo: ícone circular de 36px, título (700), descrição (muted) e barra de tempo de 4px na base.
- `role="status"` (e `role="alert"` para erros). Ficam em uma região `aria-live="polite"`.
- Duração: 5 segundos para sucesso e informação, com pausa ao passar o mouse ou focar. Erros e avisos permanecem até serem fechados. Incluir botão de fechar de 44px.
- Limite de 4 visíveis ao mesmo tempo.

Variantes e quando usar:

| Variante | Ícone / cores | Título e texto | Quando |
|---|---|---|---|
| Sucesso | `✓`, fundo `#E3F8B0`, texto `#2B3A00` | "Produto salvo" / "*Nome* foi atualizado." | `200`/`201` em criar e editar |
| Sucesso | idem | "Estoque atualizado" / "*Nome* agora tem N unidades." | PATCH de estoque |
| Aviso | `!`, `#FFE7B8` / `#6B3F00` | "Sessão expirada" / "Entre novamente para continuar." | Qualquer `401` |
| Erro | `×`, `#FFD9DE` / `#7A1426` | "Categoria não excluída" / "Ela ainda possui produtos vinculados." | `409` |
| Erro | idem | "Não foi possível salvar" / mensagem genérica | `400` sem campo mapeável, `5xx` |
| Informação | `i`, `#EDEBFA` / `#17153B` | "Produto excluído" / "O arquivo associado também foi removido." | `204` em excluir |

Expor uma API simples, por exemplo `toast.success(title, text)`, `toast.error(...)`, `toast.warning(...)`, `toast.info(...)`.

---

## 8. Página 404

- Rota coringa `*`.
- Tela cheia, fundo `--ink` com gradiente radial `--violet` no canto superior direito, conteúdo centralizado, texto branco.
- No topo, "Catapult" em `--lime`.
- Linha principal: `4`, um círculo de 180px preenchido com `--lime` contendo um ícone de caixa em `--ink` (o "0"), e `4`. Os numerais usam Bricolage 200px/800. Em telas estreitas, diminuir para ~120px e permitir quebra.
- Título "Esse produto saiu do estoque." (40px) e frase "A página ou o produto que você procura não existe mais, ou o link está incorreto."
- Campo de busca (até 320px) com botão lima "Buscar", que leva à vitrine com `?nome=`.
- Dois botões secundários transparentes: "Voltar à vitrine" e "Ver categorias" (leva à vitrine com os chips de categoria visíveis).
- O círculo tem `role="img"` e `aria-label="Caixa vazia"`.
- Também usar este layout quando `GET /api/products/{id}` devolver `404` em um link direto.

---

## 9. Integração com a API

Seguir o `api.md`. Pontos que o agente deve respeitar:

- **Mesma origem via proxy.** Em desenvolvimento, configurar proxy de `/api` para `http://localhost:8080`. Não há CORS configurado no backend.
- Todas as chamadas com `credentials: 'include'`.
- Cliente único `request<T>()` que: define `Content-Type: application/json` só quando há corpo e não é `FormData`, devolve `undefined` em `204`, lança `ApiError(status, payload)` em resposta não `ok` e aciona o tratamento global de `401`.
- Não depender de `message`, `errors` ou `trace` em erros do Spring. Decidir por status.
- Paginação com `page` zero-based. Resposta no formato `SpringPage<Product>`.
- Nomes de campo: `snake_case` nos corpos JSON e respostas (`stock_quantity`, `category_id`), `camelCase` apenas no valor do parâmetro `sort` (`stockQuantity`, `createdAt`).
- Datas `LocalDateTime` sem fuso, formatar como horário local sem converter.
- Valores monetários: formatar com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
- Foto: `photo` é caminho relativo (`/api/products/{id}/photo`). Com proxy, usar direto. Tratar `photo === null` com o gradiente de placeholder.
- Cache: invalidar `products` e `dashboard` após criar, editar, excluir ou alterar estoque. Limpar tudo no logout e em `401`.

Tipos TypeScript: usar os do `api.md` seção 4 (`Product`, `Category`, `ProductInput`, `SpringPage<T>`, `LoginRequest`, e demais).

---

## 10. Responsividade

- Vitrine: grade auto-fill, header e filtros quebram linha, hero reduz padding e título (~32px) no celular.
- Login: colunas empilham abaixo de ~880px, a coluna escura fica mais baixa.
- Painel: KPIs e cards da linha 2 usam flex com quebra. A sidebar vira menu recolhível em telas estreitas. A tabela rola horizontalmente dentro do card.
- Modais: no celular ocupam toda a largura com margem de 16px e rolam por dentro se necessário. Grade de 2 colunas dos campos vira 1 coluna abaixo de ~480px.
- Nada deve gerar rolagem horizontal da página.

---

## 11. Acessibilidade

- Elementos interativos reais: `button`, `a href`, `input` com `label`. Nunca `div` com `onClick`.
- Contraste mínimo 4,5:1 em texto, inclusive os de 11–13px.
- Informação nunca só por cor: status sempre com texto.
- Foco visível, ordem de tabulação lógica, foco preso e devolvido nos modais.
- Toasts anunciados por região `aria-live`.
- Gráficos (anel, barras) com texto equivalente.
- Respeitar `prefers-reduced-motion` e `prefers-color-scheme` não é exigido nesta versão (tema claro apenas).

---

## 12. Estrutura de pastas sugerida

```
src/
  app/            rotas, providers, guarda de rota
  api/            request.ts, auth.ts, products.ts, categories.ts, dashboard.ts, tipos
  components/     Button, Input, Chip, Tag, Card, Thumb, Modal, Toast, ProgressBar, Donut
  features/
    storefront/   StorefrontPage, ProductCard, Filters
    auth/         LoginPage, useSession
    admin/        AdminPage, KpiRow, Insights, ProductsTable, StockStepper
    products/     ProductViewModal, ProductFormModal, ProductDeleteModal, schema.ts
  pages/          NotFoundPage
  styles/         tokens.css, globals.css
```

---

## 13. Dados de exemplo para desenvolvimento

Usar o seeder do backend (perfil `dev`): 5 categorias, 20 produtos e usuário `admin` / `admin`. Para os textos de interface, não inventar números: sempre vir da API.

---

## 14. Critérios de aceite

- [ ] Os tokens da seção 3 existem como variáveis e são os únicos valores de cor, raio e fonte usados.
- [ ] A vitrine funciona sem login e usa apenas rotas públicas. Mostra só produtos ativos.
- [ ] `/admin` redireciona ao login sem sessão e restaura a sessão ao recarregar.
- [ ] Qualquer `401` limpa a sessão, mostra o toast "Sessão expirada" e leva ao login.
- [ ] O painel mostra os seis KPIs, o anel de faixas, as barras por categoria e o card de atenção, com dados reais.
- [ ] O estoque da linha muda com − e +, com atualização otimista e rollback.
- [ ] Os três modais (visualizar, editar/criar, excluir) seguem a seção 6, com foco preso, `Esc` e devolução de foco.
- [ ] O modal de visualizar abre com todos os campos preenchidos e somente leitura.
- [ ] Editar com PUT não remove a foto sem aviso: reenvia o arquivo ou confirma a remoção.
- [ ] `204` nunca chama `.json()`. `FormData` nunca recebe `Content-Type` manual.
- [ ] Os cinco toasts da seção 7 existem e disparam nos status indicados.
- [ ] A 404 existe para rotas desconhecidas e para produto não encontrado.
- [ ] Sem rolagem horizontal da página em 360px, 768px e 1280px.
- [ ] Todo texto passa em contraste 4,5:1 e todo elemento interativo tem foco visível e alvo de 44px.
