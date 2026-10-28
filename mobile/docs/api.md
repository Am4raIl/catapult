# Catapult — guia para o Claude implementar o aplicativo mobile

> Fonte de verdade para a implementação React Native com Expo. Este documento foi produzido a partir do backend atual e do projeto `mobile`. Ao trabalhar neste app, leia também `../AGENTS.md` e `../../backend/docs/api.md`. Em caso de divergência no contrato HTTP, o código do backend e `../../backend/docs/api.md` prevalecem.

## 1. Missão do agente

Implemente um aplicativo mobile-first de catálogo e gestão de estoque para Android e iOS, mantendo compatibilidade com web quando isso não prejudicar a experiência nativa.

O projeto já usa:

- Expo SDK 58;
- React Native 0.88 e React 19;
- TypeScript 6;
- Expo Router com rotas em `src/app/`;
- `expo-image` para imagens;
- npm (`package-lock.json` presente).

Antes de alterar uma API do Expo, confirme a assinatura na documentação do SDK 58. Instale dependências compatíveis com `npx expo install <pacote>`, nunca escolhendo versões manualmente.

O agente deve:

1. substituir as telas de exemplo do template pelas telas descritas neste guia;
2. manter arquivos de rota em `src/app/` e mover componentes, hooks, serviços, tipos e utilitários para fora dessa pasta;
3. consumir a API real, sem dados mockados permanentes;
4. implementar todos os estados de carregamento, vazio, erro, atualização e sessão expirada;
5. usar componentes React Native, não HTML/DOM, nas telas compartilhadas;
6. não criar nem editar `ios/` ou `android/` manualmente;
7. executar `npx expo lint`, `npx tsc --noEmit` e `npx expo-doctor` antes de concluir.

Não invente recursos que o backend não oferece: não há cadastro, recuperação de senha, JWT, carrinho, pedidos, permissões por papel, operações em lote nem filtro server-side de produtos ativos.

## 2. Escopo de telas

| Tela | Rota sugerida | Acesso | Objetivo |
|---|---|---:|---|
| Catálogo | `/` | Público | Buscar, filtrar e paginar produtos ativos |
| Detalhe público | `/products/[id]` | Público | Ver foto/PDF, preço, categoria e estoque |
| Login | `/login` | Público | Criar sessão administrativa |
| Dashboard | `/admin` | Restrito | Mostrar indicadores e atalhos de atenção |
| Produtos | `/admin/products` | Restrito | Buscar, filtrar, paginar e alterar estoque |
| Novo produto | `/admin/products/new` | Restrito | Criar produto, com arquivo opcional |
| Produto admin | `/admin/products/[id]` | Restrito | Ver dados completos, editar ou excluir |
| Editar produto | `/admin/products/[id]/edit` | Restrito | Atualizar produto e tratar a foto atual |
| Categorias | `/admin/categories` | Restrito | Listar, criar, renomear e excluir categorias |

Use um `Stack` na raiz. Dentro da área administrativa, use tabs para `Dashboard`, `Produtos` e `Categorias`. Telas de formulário e detalhe devem ser empilhadas sobre essas tabs. No SDK 58, prefira `Stack.Protected`/`Tabs.Protected` com `redirectTo="/login"` e uma fonte única de estado de sessão. Não use route groups diferentes com dois arquivos `index.tsx` que resolvam ambos para `/`.

Uma estrutura possível:

```text
src/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── login.tsx
│   ├── products/[id].tsx
│   └── admin/
│       ├── _layout.tsx
│       ├── index.tsx
│       ├── products/
│       │   ├── _layout.tsx
│       │   ├── index.tsx
│       │   ├── new.tsx
│       │   ├── [id].tsx
│       │   └── [id]/edit.tsx
│       └── categories/index.tsx
├── components/
├── features/
├── hooks/
├── lib/api/
├── providers/
├── theme/
└── types/
```

Rotas protegidas melhoram a navegação, mas a segurança real continua no backend.

## 3. API e conectividade no mobile

### 3.1 Visão geral

- prefixo da API: `/api`;
- URL do backend local: `http://localhost:8080` **apenas para processos no mesmo host**;
- IDs: UUID em string;
- dinheiro: número JSON; formatar em `pt-BR` apenas na interface;
- datas: ISO-8601 sem fuso, por exemplo `2026-10-26T14:35:12.123456`;
- autenticação: sessão HTTP com cookie `JSESSIONID`, não JWT;
- fotos/PDFs: URLs relativas, por exemplo `/api/products/{id}/photo`.

Configure a origem em uma variável pública do Expo:

```dotenv
# mobile/.env.local — exemplo para dispositivo físico na mesma rede
EXPO_PUBLIC_API_ORIGIN=http://192.168.0.25:8080
```

Leia-a exatamente por acesso estático:

```ts
const API_ORIGIN = process.env.EXPO_PUBLIC_API_ORIGIN;
```

Não use `process.env['EXPO_PUBLIC_API_ORIGIN']` nem destructuring: o Expo não faz inline desses formatos. A origem não é segredo e ficará no bundle. Valide na inicialização e falhe com mensagem clara se estiver ausente.

### 3.2 Qual host usar

| Ambiente do app | Origem local usual |
|---|---|
| Android Emulator | `http://10.0.2.2:8080` |
| iOS Simulator | `http://127.0.0.1:8080` |
| Aparelho físico / Expo Go | `http://IP_LAN_DO_COMPUTADOR:8080` |
| Expo Web | `http://localhost:8080` |
| Produção | domínio HTTPS público da API |

Em aparelho físico, telefone e servidor devem estar na mesma rede, a porta 8080 precisa estar acessível e o Spring precisa aceitar conexões externas. `localhost` no telefone aponta para o próprio telefone.

Use sempre a mesma origem durante uma sessão. Um cookie criado para `192.168.0.25` não acompanha chamadas posteriores para `10.0.2.2` ou `localhost`.

Requisições nativas não dependem de CORS como um navegador. O build web, porém, exige CORS no backend ou um proxy de mesma origem; o backend atual não configura CORS. HTTP sem TLS também pode ser bloqueado por políticas nativas em builds próprios. Prefira HTTPS fora do desenvolvimento e não enfraqueça configurações de produção para acomodar uma URL local.

### 3.3 Resolver paths relativos

Nunca entregue `product.photo` diretamente a `expo-image`, pois o backend devolve um path relativo.

```ts
export const API_ORIGIN = process.env.EXPO_PUBLIC_API_ORIGIN?.replace(/\/$/, '');
export const API_BASE_URL = `${API_ORIGIN}/api`;

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function mediaUrl(path: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}
```

## 4. Sessão e autenticação

### 4.1 Regra obrigatória

O backend emite `Set-Cookie: JSESSIONID=...; HttpOnly` no login. Envie `credentials: 'include'` em **todas** as chamadas para que a camada de rede mantenha e reenvie a sessão.

- não procure um token no corpo;
- não envie header `Authorization`;
- não salve usuário/senha;
- não tente copiar o cookie HttpOnly para SecureStore ou AsyncStorage;
- não implemente JWT apenas no cliente;
- mantenha todas as requisições no mesmo `API_ORIGIN`.

Ao iniciar o app, faça `GET /auth/check`. Enquanto a verificação estiver pendente, mostre splash/loading neutro. Com `200`, libere a área admin; com `401`, marque a sessão como anônima. Só busque dashboard depois da confirmação.

Qualquer `401` de rota protegida deve:

1. marcar a sessão como expirada;
2. limpar/inutilizar caches privados;
3. mostrar “Sessão expirada. Entre novamente.”;
4. redirecionar para `/login` uma única vez.

Evite loop: o `401` esperado de `/auth/check` e o `401` de credenciais inválidas no login não devem acionar o aviso global.

### 4.2 Login

```http
POST /api/login
Content-Type: application/json
```

```json
{ "username": "admin", "password": "admin" }
```

Resposta `200`:

```json
{ "message": "Login realizado com sucesso!", "username": "admin" }
```

- `400`: campos ausentes, vazios ou em branco;
- `401`: credenciais incorretas.

Após o sucesso, execute `/auth/check` ou atualize a sessão com o `username` retornado e substitua a rota por `/(admin)`.

### 4.3 Verificar sessão

```http
GET /api/auth/check
```

Resposta `200`:

```json
{ "authenticated": true, "username": "admin" }
```

Sem sessão retorna `401`.

### 4.4 Logout

```http
POST /api/logout
```

Resposta `200`:

```json
{ "message": "Logout realizado com sucesso!" }
```

Logout é permitido mesmo sem sessão. Depois de um `200`, limpe o estado e cache privados e volte ao catálogo ou login. Se houver falha de rede, não declare logout concluído: o cookie é HttpOnly e a sessão no servidor pode continuar válida. Mostre retry e só abandone os dados privados da interface se isso fizer parte de uma política explícita do app.

## 5. Contratos TypeScript

Crie os tipos em `src/lib/api/types.ts` e preserve exatamente o `snake_case` recebido/enviado pela API.

```ts
export type UUID = string;
export type StockStatusApi = 'OUT_OF_STOCK' | 'LOW_STOCK' | 'IN_STOCK';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  username: string;
}

export interface AuthCheckResponse {
  authenticated: true;
  username: string;
}

export interface CategorySummary {
  id: UUID;
  name: string;
}

export interface ProductSummary {
  id: UUID;
  name: string;
  price: number;
  photo: string | null;
}

export interface Category {
  id: UUID;
  name: string;
  products: ProductSummary[];
}

export interface Product {
  id: UUID;
  name: string;
  price: number;
  category: CategorySummary;
  photo: string | null;
  stock_quantity: number;
  cost_price: number | null;
  created_at: string;
  updated_at: string;
  active: boolean;
}

export interface ProductInput {
  name: string;
  price: number;
  category_id: UUID;
  stock_quantity?: number | null;
  cost_price?: number | null;
  active?: boolean | null;
}

export interface SpringSort {
  sorted: boolean;
  unsorted: boolean;
  empty: boolean;
}

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  size: number;
  number: number;
  numberOfElements: number;
  empty: boolean;
  pageable: {
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
    sort: SpringSort;
  };
  sort: SpringSort;
}

export interface DashboardSummary {
  total_products: number;
  total_categories: number;
  total_inventory_value: number;
  average_product_price: number;
  products_without_photo: number;
  low_stock_count: number;
}

export interface ProductsByCategory {
  category_id: UUID;
  category_name: string;
  product_count: number;
  total_value: number;
}

export interface PriceRange {
  range: string;
  count: number;
}

export interface ProductListParams {
  page?: number;
  size?: number;
  nome?: string;
  category_id?: UUID;
  min_price?: number;
  max_price?: number;
  has_photo?: boolean;
  stock_status?: StockStatusApi;
  sort?: string;
}
```

Não modele dinheiro como string. Não acrescente `Z` às datas, pois elas não possuem offset. `products` de categoria deve ser tratado como array, inclusive vazio.

## 6. Cliente HTTP de referência

Centralize rede, parsing e `401`. Não espalhe `fetch` pelas telas.

```ts
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly payload: unknown,
  ) {
    super(`API request failed with status ${status}`);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends RequestInit {
  skipUnauthorized?: boolean;
}

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export async function request<T>(path: string, options: RequestOptions = {}) {
  const { skipUnauthorized, headers: initialHeaders, ...init } = options;
  const headers = new Headers(initialHeaders);
  const isFormData = init.body instanceof FormData;

  if (init.body != null && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      ...init,
      headers,
      credentials: 'include',
    });
  } catch (cause) {
    throw new Error('Não foi possível conectar à API.', { cause });
  }

  if (response.status === 401 && !skipUnauthorized) onUnauthorized?.();

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new ApiError(response.status, payload);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
```

Regras:

- `path` é relativo ao prefixo `/api`, por exemplo `/products`;
- `204` não tem corpo: nunca chame `.json()`;
- só defina `Content-Type: application/json` quando houver body JSON;
- **não** defina `Content-Type` para `FormData`; o runtime cria o boundary;
- diferencie falha de rede de resposta HTTP;
- aplique timeout com `AbortController` se necessário, cancelando também buscas antigas;
- logs de desenvolvimento não podem imprimir senha, cookie ou corpo sensível.

### 6.1 Serviços sugeridos

```ts
export const authApi = {
  login: (body: LoginRequest) =>
    request<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(body),
      skipUnauthorized: true,
    }),
  check: () =>
    request<AuthCheckResponse>('/auth/check', { skipUnauthorized: true }),
  logout: () =>
    request<{ message: string }>('/logout', {
      method: 'POST',
      skipUnauthorized: true,
    }),
};

export const categoriesApi = {
  list: () => request<Category[]>('/categories'),
  get: (id: UUID) => request<Category>(`/categories/${id}`),
  create: (name: string) => request<Category>('/categories', {
    method: 'POST', body: JSON.stringify({ name }),
  }),
  update: (id: UUID, name: string) => request<Category>(`/categories/${id}`, {
    method: 'PUT', body: JSON.stringify({ name }),
  }),
  remove: (id: UUID) => request<void>(`/categories/${id}`, {
    method: 'DELETE',
  }),
};
```

### 6.2 Produtos e dashboard

Monte a query com `URLSearchParams` para codificar busca e valores corretamente. Não envie chaves vazias.

```ts
function productQuery(params: ProductListParams = {}) {
  const query = new URLSearchParams();

  if (params.page != null) query.set('page', String(params.page));
  if (params.size != null) query.set('size', String(params.size));
  if (params.nome?.trim()) query.set('nome', params.nome.trim());
  if (params.category_id) query.set('category_id', params.category_id);
  if (params.min_price != null) query.set('min_price', String(params.min_price));
  if (params.max_price != null) query.set('max_price', String(params.max_price));
  if (params.has_photo != null) query.set('has_photo', String(params.has_photo));
  if (params.stock_status) query.set('stock_status', params.stock_status);
  if (params.sort) query.set('sort', params.sort);

  return query.toString();
}

export const productsApi = {
  list: (params: ProductListParams = {}) =>
    request<SpringPage<Product>>(`/products?${productQuery(params)}`),
  get: (id: UUID) => request<Product>(`/products/${id}`),
  createJson: (body: ProductInput) => request<Product>('/products', {
    method: 'POST', body: JSON.stringify(body),
  }),
  createMultipart: (body: FormData) => request<Product>('/products', {
    method: 'POST', body,
  }),
  updateJson: (id: UUID, body: ProductInput) =>
    request<Product>(`/products/${id}`, {
      method: 'PUT', body: JSON.stringify(body),
    }),
  updateMultipart: (id: UUID, body: FormData) =>
    request<Product>(`/products/${id}`, { method: 'PUT', body }),
  updateStock: (id: UUID, stock_quantity: number) =>
    request<Product>(`/products/${id}/stock`, {
      method: 'PATCH', body: JSON.stringify({ stock_quantity }),
    }),
  remove: (id: UUID) =>
    request<void>(`/products/${id}`, { method: 'DELETE' }),
};

export const dashboardApi = {
  summary: () => request<DashboardSummary>('/dashboard/summary'),
  productsByCategory: () =>
    request<ProductsByCategory[]>('/dashboard/products-by-category'),
  priceRanges: () => request<PriceRange[]>('/dashboard/price-ranges'),
};
```

Para cache server-state, TanStack Query é recomendado. Use chaves estáveis como `['products', filters]`, `['product', id]`, `['categories']` e `['dashboard', 'summary']`. Ao criar/editar/excluir produto, invalide produto, lista, categorias e dashboard; ao alterar categoria, invalide categorias e as consultas que exibem seu nome.

## 7. Mapa completo dos endpoints

| Método | Endpoint | Auth | Sucesso |
|---|---|---:|---|
| `POST` | `/api/login` | Não | `200` login |
| `POST` | `/api/logout` | Não | `200` mensagem |
| `GET` | `/api/auth/check` | Sim | `200` sessão |
| `GET` | `/api/categories` | Não | `200` lista |
| `POST` | `/api/categories` | Sim | `201` categoria |
| `GET` | `/api/categories/{id}` | Não | `200` categoria |
| `PUT` | `/api/categories/{id}` | Sim | `200` categoria |
| `DELETE` | `/api/categories/{id}` | Sim | `204` sem corpo |
| `GET` | `/api/products` | Não | `200` página |
| `POST` | `/api/products` | Sim | `201` produto |
| `GET` | `/api/products/{id}` | Não | `200` produto |
| `GET` | `/api/products/{id}/photo` | Não | `200` binário |
| `GET` | `/api/products/{id}/image` | Não | alias de `/photo` |
| `PUT` | `/api/products/{id}` | Sim | `200` produto |
| `PATCH` | `/api/products/{id}/stock` | Sim | `200` produto |
| `DELETE` | `/api/products/{id}` | Sim | `204` sem corpo |
| `GET` | `/api/dashboard/summary` | Sim | `200` resumo |
| `GET` | `/api/dashboard/products-by-category` | Sim | `200` lista |
| `GET` | `/api/dashboard/price-ranges` | Sim | `200` lista |

GETs de categorias, produtos e arquivos são públicos. Escritas e dashboard são protegidos.

## 8. Categorias

### 8.1 Listar e obter

```http
GET /api/categories
GET /api/categories/{id}
```

Resposta de lista:

```json
[
  {
    "id": "d9562726-42f7-4d6f-b9ea-528d2bd78284",
    "name": "Eletrônicos",
    "products": [
      {
        "id": "fcbeb855-36c5-4c65-af54-1627fd47d79a",
        "name": "Fone Bluetooth",
        "price": 199.90,
        "photo": "/api/products/fcbeb855-36c5-4c65-af54-1627fd47d79a/photo"
      }
    ]
  }
]
```

Não há paginação, busca nem variante resumida; cada categoria carrega seus produtos. A ordem não é garantida. Ordene por nome no app quando necessário.

### 8.2 Criar

```http
POST /api/categories
Content-Type: application/json
```

```json
{ "name": "Eletrônicos" }
```

`name` é obrigatório e não pode ser branco. Nomes duplicados são permitidos. Retorna `201`, header `Location` e:

```json
{
  "id": "d9562726-42f7-4d6f-b9ea-528d2bd78284",
  "name": "Eletrônicos",
  "products": []
}
```

### 8.3 Renomear

```http
PUT /api/categories/{id}
Content-Type: application/json
```

```json
{ "name": "Eletrônicos e acessórios" }
```

Retorna `200` com a categoria completa. Use `400` para validação e `404` para item removido por outro cliente.

### 8.4 Excluir

```http
DELETE /api/categories/{id}
```

- `204`: excluída;
- `404`: não existe;
- `409`: ainda possui produtos.

Não existe cascata. No `409`, mantenha o item e mostre “Mova ou exclua os produtos desta categoria antes de removê-la.”.

## 9. Produtos

### 9.1 Listar, filtrar e paginar

```http
GET /api/products?page=0&size=20&sort=name,asc
```

Filtros opcionais, combinados com `AND`:

| Query | Tipo | Significado |
|---|---|---|
| `nome` | string | nome contém, sem diferenciar maiúsculas |
| `category_id` | UUID | categoria exata |
| `min_price` | decimal | preço maior ou igual |
| `max_price` | decimal | preço menor ou igual |
| `has_photo` | boolean | coluna de foto preenchida/nula |
| `stock_status` | enum | `OUT_OF_STOCK`, `LOW_STOCK`, `IN_STOCK` |
| `page` | inteiro | página zero-based; padrão `0` |
| `size` | inteiro | itens por página; padrão `10` |
| `sort` | string | propriedade Java e direção |

Status de estoque:

| Valor | Regra |
|---|---|
| `OUT_OF_STOCK` | estoque `== 0` |
| `LOW_STOCK` | estoque entre `1` e `5` |
| `IN_STOCK` | estoque `> 5` |

Sorts permitidos no app: `name`, `price`, `stockQuantity`, `costPrice`, `createdAt`, `updatedAt`, `active`, `id`. O valor do sort usa `camelCase`, embora o JSON use `snake_case`. Não aceite propriedade arbitrária de input do usuário.

Exemplos:

```text
/products?nome=fone&page=0&size=20&sort=name,asc
/products?category_id={uuid}&min_price=10&max_price=200
/products?has_photo=true&stock_status=LOW_STOCK&sort=price,desc
```

Resposta `200`:

```json
{
  "content": [
    {
      "id": "fcbeb855-36c5-4c65-af54-1627fd47d79a",
      "name": "Fone Bluetooth",
      "price": 199.90,
      "category": {
        "id": "d9562726-42f7-4d6f-b9ea-528d2bd78284",
        "name": "Eletrônicos"
      },
      "photo": "/api/products/fcbeb855-36c5-4c65-af54-1627fd47d79a/photo",
      "stock_quantity": 8,
      "cost_price": 120.00,
      "created_at": "2026-10-26T14:35:12.123456",
      "updated_at": "2026-10-26T14:35:12.123456",
      "active": true
    }
  ],
  "totalElements": 1,
  "totalPages": 1,
  "first": true,
  "last": true,
  "size": 20,
  "number": 0,
  "numberOfElements": 1,
  "empty": false,
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "offset": 0,
    "paged": true,
    "unpaged": false,
    "sort": { "sorted": true, "unsorted": false, "empty": false }
  },
  "sort": { "sorted": true, "unsorted": false, "empty": false }
}
```

Ao mudar qualquer filtro, volte para `page=0`. Aplique debounce de 300–400 ms à busca. Use paginação incremental no catálogo e paginação anterior/próxima na área admin. Nunca tente carregar todos os produtos para simular filtros server-side.

Valide `min_price <= max_price` no app; o backend não valida essa relação. Um `stock_status` desconhecido é ignorado hoje, portanto use apenas o enum permitido. `has_photo` verifica a coluna do banco, não confirma se o arquivo físico ainda existe.

O backend não filtra `active`. A vitrine pública deve remover `active: false` de cada página recebida. Isso pode fazer uma página visível ter menos itens e `totalElements` continuar incluindo inativos; documente essa limitação na implementação e continue buscando enquanto houver próxima página.

### 9.2 Obter produto

```http
GET /api/products/{id}
```

Retorna `200` com `Product`, `404` se não existir e `400` para UUID malformado. Não dependa apenas do item resumido da lista: a tela de detalhe deve buscar novamente por ID.

### 9.3 Criar com JSON

```http
POST /api/products
Content-Type: application/json
```

```json
{
  "name": "Fone Bluetooth",
  "price": 199.90,
  "category_id": "d9562726-42f7-4d6f-b9ea-528d2bd78284",
  "stock_quantity": 8,
  "cost_price": 120.00,
  "active": true
}
```

| Campo | Obrigatório | Regra de criação |
|---|---:|---|
| `name` | Sim | não branco |
| `price` | Sim | `>= 0.01` |
| `category_id` | Sim | UUID de categoria existente |
| `stock_quantity` | Não | omitido/`null` vira `0` |
| `cost_price` | Não | omitido fica `null` |
| `active` | Não | omitido/`null` vira `true` |

Valide estoque e custo `>= 0` no app; o DTO completo do backend não os bloqueia. Retorna `201`, header `Location` e produto completo.

### 9.4 Criar com arquivo

Envie `multipart/form-data` para o mesmo `POST /api/products`.

| Parte | Tipo | Obrigatória |
|---|---|---:|
| `name` | texto | Sim |
| `price` | texto decimal com ponto | Sim |
| `category_id` | texto UUID | Sim |
| `stock_quantity` | texto inteiro | Não |
| `cost_price` | texto decimal com ponto | Não |
| `active` | `true`/`false` | Não |
| `photo` | arquivo | Não |

`image` é um alias aceito, mas o app deve padronizar em `photo`.

Use `expo-document-picker` para aceitar imagens e PDF em um único fluxo:

```bash
npx expo install expo-document-picker
```

```ts
import * as DocumentPicker from 'expo-document-picker';

const result = await DocumentPicker.getDocumentAsync({
  type: ['image/*', 'application/pdf'],
  multiple: false,
  copyToCacheDirectory: true,
});

if (!result.canceled) {
  const asset = result.assets[0];
  // validar asset.size, asset.mimeType, asset.name e asset.uri
}
```

No React Native nativo, acrescente o arquivo ao `FormData` com URI, nome e MIME. No web, use `asset.file` quando disponível.

```ts
type PickedAsset = {
  uri: string;
  name: string;
  mimeType?: string;
  file?: File;
};

function appendPhoto(form: FormData, asset: PickedAsset) {
  if (asset.file) {
    form.append('photo', asset.file);
    return;
  }

  form.append('photo', {
    uri: asset.uri,
    name: asset.name,
    type: asset.mimeType ?? 'application/octet-stream',
  } as unknown as Blob);
}
```

Exemplo de montagem:

```ts
const form = new FormData();
form.append('name', values.name.trim());
form.append('price', String(values.price));
form.append('category_id', values.categoryId);
form.append('stock_quantity', String(values.stockQuantity));
form.append('active', String(values.active));
if (values.costPrice != null) form.append('cost_price', String(values.costPrice));
if (asset) appendPhoto(form, asset);

await request<Product>('/products', { method: 'POST', body: form });
```

Não defina o header `Content-Type` manualmente.

Restrições do backend:

- até 5 MB por arquivo e 6 MB por request;
- extensões: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.pdf`;
- MIME começando com `image/` ou exatamente `application/pdf`;
- MIME e extensão precisam ser permitidos;
- o conteúdo real não é profundamente inspecionado.

Valide antes do envio e mostre o erro junto ao seletor. A permissão da galeria não é necessária para o seletor de documentos do sistema.

### 9.5 Atualizar produto — armadilha crítica

```http
PUT /api/products/{id}
```

Aceita JSON ou multipart. Continua sendo substituição completa: `name`, `price` e `category_id` são obrigatórios.

| Campo | Enviado | Omitido/`null` |
|---|---|---|
| `stock_quantity` | substitui | preserva |
| `cost_price` | substitui | preserva; não pode limpar para `null` |
| `active` | substitui | preserva |
| `photo` | troca o arquivo | **a foto atual é removida** |

Um PUT JSON ou multipart sem arquivo remove a foto existente. O formulário de edição deve oferecer uma decisão explícita:

- “Manter arquivo atual”: baixe o arquivo de `product.photo`, converta-o em parte multipart e reenvie;
- “Trocar arquivo”: envie o novo asset;
- “Remover arquivo”: faça PUT sem arquivo, após confirmação.

Nunca remova silenciosamente a foto. Se não for possível baixar o arquivo atual para preservá-lo, bloqueie o save e ofereça tentar novamente ou confirmar remoção. Após sucesso, invalide lista, detalhe, categorias e dashboard.

### 9.6 Atualizar somente estoque

```http
PATCH /api/products/{id}/stock
Content-Type: application/json
```

```json
{ "stock_quantity": 7 }
```

Obrigatório, inteiro e `>= 0`. Retorna `200` com o produto completo. Na tela de produtos, use botões `−`/`+`, desabilite `−` em zero, faça atualização otimista com rollback e agrupe toques rápidos com debounce curto. Evite enviar requests fora de ordem para o mesmo produto.

### 9.7 Excluir produto

```http
DELETE /api/products/{id}
```

Retorna `204`. Confirme com nome do produto e avise que registro e arquivo serão removidos sem possibilidade de desfazer. `404` pode ser tratado como “já removido” e seguido de refresh. `500` deve manter a tela aberta e oferecer retry.

### 9.8 Foto ou PDF

```http
GET /api/products/{id}/photo
GET /api/products/{id}/image
```

São públicos e equivalentes. `photo` sempre aponta para `/photo`. Pode retornar imagem, PDF ou `application/octet-stream`; `404` significa sem arquivo, arquivo ausente ou produto inexistente.

- para imagem, use `expo-image` com `source={{ uri: mediaUrl(product.photo) }}` e placeholder;
- para PDF, abra a URL absoluta com `expo-web-browser` ou o navegador do sistema;
- não presuma que toda `photo` pode ser renderizada como imagem;
- se precisar descobrir o tipo, faça `HEAD`/`GET`, leia `Content-Type` e mantenha fallback “Abrir arquivo”.

## 10. Dashboard

Todos os endpoints exigem sessão e incluem também produtos inativos.

### 10.1 Resumo

```http
GET /api/dashboard/summary
```

```json
{
  "total_products": 20,
  "total_categories": 5,
  "total_inventory_value": 84520.50,
  "average_product_price": 704.3375,
  "products_without_photo": 2,
  "low_stock_count": 3
}
```

- valor do estoque = soma de `price * stock_quantity`;
- estoque baixo = quantidade `<= 5`, incluindo zero;
- sem dados, agregados são zero.

### 10.2 Produtos por categoria

```http
GET /api/dashboard/products-by-category
```

```json
[
  {
    "category_id": "d9562726-42f7-4d6f-b9ea-528d2bd78284",
    "category_name": "Eletrônicos",
    "product_count": 4,
    "total_value": 5840.00
  }
]
```

Categorias vazias não aparecem. Ordene por `total_value` decrescente no app antes de desenhar barras.

### 10.3 Faixas de preço

```http
GET /api/dashboard/price-ranges
```

```json
[
  { "range": "R$ 0 - R$ 50", "count": 6 },
  { "range": "R$ 51 - R$ 200", "count": 8 },
  { "range": "R$ 201+", "count": 6 }
]
```

Sempre retorna três itens. Os limites reais são `<= 50`, `> 50 && <= 200` e `> 200`.

## 11. Especificação das telas

### 11.1 Catálogo público

- header com marca “Catapult” e ação “Admin”;
- busca por nome com debounce;
- chips horizontais de categoria, incluindo “Todas”;
- filtros em modal/bottom sheet: preço mínimo, máximo, com foto e status;
- ordenação por nome, menor preço e maior preço;
- lista de duas colunas em telas suficientemente largas e uma coluna quando necessário;
- cards com foto/placeholder, categoria, nome, preço e status do estoque;
- pull-to-refresh;
- carregamento incremental ao chegar ao fim;
- vazio específico para “nenhum produto” e para “nenhum resultado com esses filtros”.

Use `FlatList`, `numColumns` estável e `keyExtractor={item => item.id}`. Evite `ScrollView` envolvendo listas virtualizadas. Calcule status visual pelo estoque: zero = esgotado, 1–5 = baixo, acima de 5 = em estoque. Exiba apenas ativos, respeitando a limitação descrita na seção 9.1.

### 11.2 Detalhe público

- imagem grande ou cartão “Abrir PDF/arquivo”;
- nome, categoria, preço e status/quantidade disponível;
- não mostrar custo;
- não mostrar ações administrativas;
- `404` oferece voltar e atualizar a lista.

### 11.3 Login

- usuário e senha com labels visíveis;
- senha com `secureTextEntry` e botão acessível de mostrar/ocultar;
- submit pelo teclado e pelo botão;
- loading sem duplo envio;
- `401`: “Usuário ou senha incorretos.” sem apagar usuário;
- `400`: erro de campos;
- falha de rede: mostrar URL/ambiente de forma segura para facilitar diagnóstico;
- link para voltar ao catálogo.

Não ofereça “lembrar senha”, cadastro ou recuperação, pois a API não suporta.

### 11.4 Dashboard administrativo

- saudação com `username` e logout;
- seis cards: produtos, categorias, valor em estoque, preço médio, sem foto e estoque baixo;
- seção de faixas de preço;
- barras de valor por categoria;
- atalhos “Ver estoque baixo” e “Ver sem foto” abrindo a lista com filtro;
- pull-to-refresh que atualiza os três endpoints juntos;
- erro parcial por card/seção, sem derrubar toda a tela se só uma chamada falhar.

Não instale uma biblioteca pesada de gráficos apenas para esse painel. Cards, barras com largura proporcional e legenda atendem ao escopo.

### 11.5 Gestão de produtos

- busca, categoria e status de estoque;
- lista paginada com nome, categoria, preço, estoque, ativo/inativo e miniatura;
- ações de incrementar/decrementar estoque;
- FAB ou botão de header para novo produto;
- toque abre detalhe admin;
- long press não deve esconder ações essenciais;
- pull-to-refresh e retry;
- produtos inativos permanecem visíveis com tag explícita.

### 11.6 Criar/editar produto

Campos:

- nome obrigatório;
- categoria obrigatória;
- estoque inteiro `>= 0`;
- preço obrigatório `>= 0,01`;
- custo opcional `>= 0`;
- switch ativo;
- arquivo opcional (imagem ou PDF, até 5 MB).

Aceite vírgula na entrada monetária pt-BR, normalize para número e envie decimal com ponto. Nunca envie texto formatado como `R$ 199,90`. Mantenha erros junto aos campos e preserve valores após erro HTTP.

No edit, carregue o produto por ID e trate explicitamente manter/trocar/remover arquivo. Ao sair com alterações, peça confirmação. Durante upload, mostre estado de envio e bloqueie múltiplos submits.

### 11.7 Detalhe administrativo

Mostre todos os campos, incluindo custo, ativo, criado e atualizado. Formate data sem inventar fuso. Ações: editar e excluir. Exclusão exige diálogo destrutivo com foco/ação inicial na opção segura.

### 11.8 Categorias

- lista ordenada por nome;
- contador local usando `category.products.length`;
- criar e renomear em formulário curto;
- excluir com confirmação;
- `409` explica por que a categoria não pode ser removida;
- não tente paginar ou buscar no servidor.

## 12. Direção visual, estados e acessibilidade

### 12.1 Identidade visual

Preserve a identidade já definida para o frontend Catapult:

| Token | Cor | Uso |
|---|---|---|
| `ink` | `#17153B` | texto principal, headers e fundos escuros |
| `violet` | `#5B3DF5` | ação primária, link e tab ativa |
| `lime` | `#D4F55A` | destaque sobre fundo escuro |
| `ground` | `#F4F3FF` | fundo geral |
| `surface` | `#FFFFFF` | cards, sheets e campos |
| `line` | `#E4E1F5` | bordas e divisórias |
| `muted` | `#5A587A` | texto secundário |
| `danger` | `#B3122F` | ação destrutiva |

Status: sucesso `#E3F8B0`/`#2B3A00`, aviso `#FFE7B8`/`#6B3F00` e erro `#FFD9DE`/`#7A1426`. Use cards com raio próximo de 20, campos/botões com raio 12 e espaçamento em múltiplos de 4. Centralize tokens em um único módulo; não espalhe hexadecimais pelas telas. Use ícones vetoriais/símbolos consistentes, não emojis como controles.

A interface deve parecer nativa: ações destrutivas em diálogo/alerta, filtros em sheet/modal, feedback tátil apenas quando útil, headers compactos e conteúdo respeitando safe area. Não replique tabelas desktop; transforme registros em cards/list rows legíveis no telefone.

### 12.2 Estados e acessibilidade

Toda tela que consulta rede deve ter quatro estados reais: loading inicial, sucesso, vazio e erro com retry. Pull-to-refresh não substitui loading inicial.

Regras obrigatórias:

- respeitar safe areas e teclado;
- formulários em `KeyboardAvoidingView` + conteúdo rolável;
- área mínima de toque de 44×44;
- `accessibilityLabel`, `accessibilityRole` e `accessibilityState` em ações sem texto, tabs, switches e chips;
- mensagens não dependem apenas de cor;
- contraste adequado em tema claro e escuro, caso o tema automático seja mantido;
- preço com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`;
- listas grandes virtualizadas;
- imagens com dimensões definidas, placeholder e fallback;
- feedback de sucesso/erro visível e anunciado;
- desabilitar submit e ações destrutivas durante a própria mutation;
- preservar filtros ao voltar do detalhe;
- não renderizar área protegida brevemente antes do fim do auth check.

Status de estoque sugerido:

| Estado | Texto | Cor semântica |
|---|---|---|
| `0` | Esgotado | erro |
| `1–5` | Estoque baixo | aviso |
| `> 5` | Em estoque | sucesso |

## 13. Erros HTTP

O backend não possui um contrato uniforme de erro, salvo o `401` customizado. Um erro Spring pode ser:

```json
{
  "timestamp": "2026-10-26T18:47:41.554Z",
  "status": 404,
  "error": "Not Found",
  "path": "/api/products/00000000-0000-0000-0000-000000000000"
}
```

Não dependa de `message`, `errors` ou `trace`. Tente mapear detalhes quando existirem, mas sempre tenha mensagem por status:

| Status | Tratamento no app |
|---:|---|
| `400` | manter formulário e destacar dados inválidos |
| `401` | credenciais inválidas no login ou expirar sessão em rotas protegidas |
| `404` | recurso removido; voltar/atualizar quando apropriado |
| `409` | categoria possui produtos |
| `413` | arquivo/request grande demais |
| `415` | tipo de conteúdo incorreto |
| `500+` | mensagem genérica, retry e nenhum update otimista permanente |

Falha de conexão não tem status HTTP. Oriente o usuário a verificar backend, IP, Wi-Fi e `EXPO_PUBLIC_API_ORIGIN`; não mostre stack trace.

## 14. Dependências e escolhas de implementação

Adicione somente o que for realmente usado. Sugestão:

```bash
npx expo install @tanstack/react-query react-hook-form zod @hookform/resolvers expo-document-picker
```

- TanStack Query: cache, retry, mutations e invalidação;
- React Hook Form + Zod: estado/validação de formulários;
- Expo DocumentPicker: imagem/PDF;
- Expo Router, `expo-image` e `expo-web-browser` já estão instalados.

Não instale Axios apenas para replicar `fetch`, nem SecureStore para armazenar um cookie HttpOnly. Se uma dependência nativa for adicionada, confirme se funciona no Expo Go; caso contrário, documente a necessidade de development build.

## 15. Ordem recomendada de implementação

1. limpar o conteúdo de demonstração sem remover assets do usuário sem necessidade;
2. criar tema, formatadores, tipos e resolução de URL;
3. criar cliente HTTP e serviços por domínio;
4. criar provider de query e provider de sessão;
5. configurar Stack/route groups protegidos;
6. implementar catálogo e detalhe público;
7. implementar login e expiração global;
8. implementar dashboard;
9. implementar lista, estoque e detalhe admin;
10. implementar create/edit/upload/delete;
11. implementar CRUD de categorias;
12. revisar acessibilidade, loading, vazios e erros;
13. validar em Android, iOS quando disponível, e web se estiver no escopo do build;
14. rodar lint, typecheck e Expo Doctor.

Não deixe chamadas mockadas como fallback silencioso. Se a API estiver indisponível, a interface deve assumir estado de erro observável.

## 16. Cenários mínimos de validação

### Rede e sessão

- origem ausente gera diagnóstico claro;
- login válido mantém sessão em `/auth/check`;
- login inválido não dispara loop de redirecionamento;
- reinício do app restaura sessão quando o cookie ainda é válido;
- sessão expirada durante mutation limpa dados privados e abre login;
- logout remove acesso às rotas admin.

### Catálogo

- busca com acentos/espaços é codificada corretamente;
- troca de filtro volta à página zero;
- scroll não duplica página nem item;
- inativos não aparecem;
- path de foto vira URL absoluta;
- PDF não é passado ao componente de imagem;
- vazio e erro têm ações úteis.

### Produtos

- preço com vírgula vira decimal correto;
- estoque/custo negativos são impedidos;
- categoria removida durante edição resulta em `404` tratável;
- foto/PDF de até 5 MB é enviado sem header multipart manual;
- arquivo inválido ou grande mostra erro antes/depois da API;
- editar mantendo a foto realmente a preserva;
- editar removendo foto exige confirmação;
- `PATCH` nunca envia estoque negativo nem aplica respostas antigas fora de ordem;
- exclusão `204` não tenta parsear JSON.

### Categorias e dashboard

- categoria com produtos não some no `409`;
- dashboard funciona com todos os agregados em zero;
- categorias do dashboard são ordenadas no cliente;
- erro em uma seção do dashboard não apaga as demais.

## 17. Critérios de aceite do agente

Considere a entrega concluída apenas quando:

- nenhuma tela do template de exemplo continuar como rota principal;
- todas as telas da seção 2 estiverem navegáveis;
- API estiver centralizada e tipada;
- sessão por cookie funcionar sem JWT/localStorage;
- toda URL de mídia relativa estiver resolvida contra a origem;
- filtros, paginação e sort usarem os nomes exatos do backend;
- upload funcionar para imagem e PDF;
- PUT não remover foto sem escolha explícita;
- `204`, `401`, `404`, `409`, `413` e falhas de rede tiverem tratamento;
- loading, vazio, erro, retry e pull-to-refresh estiverem presentes onde cabem;
- alvos de toque, leitor de tela, teclado e safe area forem tratados;
- nenhum segredo, senha ou cookie aparecer em código/log;
- `npx expo lint`, `npx tsc --noEmit` e `npx expo-doctor` passarem.

## 18. Referências oficiais para o agente

- Expo SDK 58: `https://docs.expo.dev/versions/v58.0.0/`
- índice para agentes: `https://docs.expo.dev/llms.txt`
- Expo Router: `https://docs.expo.dev/router/introduction/`
- rotas protegidas: `https://docs.expo.dev/router/advanced/protected/`
- variáveis de ambiente: `https://docs.expo.dev/guides/environment-variables/`
- DocumentPicker SDK 58: `https://docs.expo.dev/versions/v58.0.0/sdk/document-picker/`
- Claude Code + Expo: `https://docs.expo.dev/agents/claude/`

Ao usar Claude Code, o plugin oficial do Expo pode ser instalado com `claude plugin install expo@claude-plugins-official`. Isso é opcional para executar o app; serve para dar ao agente acesso atualizado às convenções e documentação do Expo.

Para testes no perfil `dev` versionado, o seeder configura `admin`/`admin`. Não transporte essa credencial para produção nem a grave no app. Fora do perfil `dev`, não presuma que ela exista.
