# Catapult — guia completo do backend para implementação do frontend

> Especificação produzida a partir da implementação atual. Este documento descreve o contrato que o frontend pode efetivamente consumir, inclusive comportamentos que não ficam evidentes apenas pelas rotas.

## 1. Visão geral

O Catapult é uma API REST de catálogo e estoque construída com Java 21, Spring Boot 4.1.1, Spring MVC, Spring Security, Spring Data JPA/Hibernate, MySQL/MariaDB e Flyway. Fotos e PDFs de produtos são armazenados no sistema de arquivos local.

O domínio possui:

- `Category`: categoria com vários produtos;
- `Product`: produto pertencente obrigatoriamente a uma categoria;
- `User`: usuário usado apenas para autenticação; não há CRUD público de usuários.

Características gerais:

- URL local: `http://localhost:8080`;
- prefixo: `/api`;
- sem versionamento da API;
- IDs em UUID;
- valores monetários em `BigDecimal`, expostos como números JSON;
- datas `LocalDateTime` em ISO-8601, sem fuso horário;
- sem Swagger/OpenAPI e sem CORS configurado;
- autenticação por sessão HTTP/cookie `JSESSIONID`, não JWT.

## 2. Mapa dos endpoints

| Método | Endpoint | Auth | Sucesso |
|---|---|---:|---|
| `POST` | `/api/login` | Não | `200` dados do login |
| `POST` | `/api/logout` | Não | `200` mensagem |
| `POST` | `/api/checkout` | Não | `200` confirmação e total da compra |
| `GET` | `/api/auth/check` | Sim | `200` usuário da sessão |
| `GET` | `/api/categories` | Não | `200` categorias |
| `POST` | `/api/categories` | Sim | `201` categoria criada |
| `GET` | `/api/categories/{id}` | Não | `200` categoria |
| `PUT` | `/api/categories/{id}` | Sim | `200` categoria atualizada |
| `DELETE` | `/api/categories/{id}` | Sim | `204` sem corpo |
| `GET` | `/api/products` | Não | `200` página de produtos |
| `POST` | `/api/products` | Sim | `201` produto criado |
| `GET` | `/api/products/{id}` | Não | `200` produto |
| `GET` | `/api/products/{id}/photo` | Não | `200` arquivo binário |
| `GET` | `/api/products/{id}/image` | Não | Alias de `/photo` |
| `PUT` | `/api/products/{id}` | Sim | `200` produto atualizado |
| `PATCH` | `/api/products/{id}/stock` | Sim | `200` produto atualizado |
| `DELETE` | `/api/products/{id}` | Sim | `204` sem corpo |
| `POST` | `/api/products/bulk-delete` | Sim | `204` sem corpo |
| `GET` | `/api/dashboard/summary` | Sim | `200` indicadores |
| `GET` | `/api/dashboard/products-by-category` | Sim | `200` agrupamento |
| `GET` | `/api/dashboard/price-ranges` | Sim | `200` faixas de preço |

Todos os endpoints de escrita exigem sessão, exceto login/logout e checkout. GETs de categorias, produtos e arquivos são públicos. GETs de autenticação e dashboard são protegidos.

## 3. Autenticação por sessão

### 3.1 Funcionamento

O cliente envia usuário e senha a `POST /api/login`. Em sucesso, o Spring cria uma sessão e responde com algo semelhante a:

```http
Set-Cookie: JSESSIONID=ABC123...; Path=/; HttpOnly
```

O browser conserva e reenvia o cookie. Não existe token para armazenar em `localStorage`.

- política de sessão: `IF_REQUIRED`;
- contexto de segurança salvo na sessão HTTP;
- senha no banco com BCrypt;
- autoridade interna fixa `ROLE_USER`;
- sem papéis/permissões diferentes;
- CSRF desabilitado, sem token CSRF;
- reiniciar o servidor normalmente invalida sessões em memória;
- timeout não configurado pelo projeto, usando o padrão do servidor/ambiente.

### 3.2 Login

```http
POST /api/login
Content-Type: application/json
```

```json
{ "username": "admin", "password": "admin" }
```

Ambos são strings obrigatórias e não podem estar vazios/em branco.

Resposta `200`:

```json
{ "message": "Login realizado com sucesso!", "username": "admin" }
```

Falhas: `400` para body/campos inválidos e `401` para credenciais incorretas.

### 3.3 Verificar sessão

```http
GET /api/auth/check
Cookie: JSESSIONID=...
```

```json
{ "authenticated": true, "username": "admin" }
```

Sem sessão retorna `401`. Use este endpoint para restaurar o estado de autenticação após recarregar o frontend.

### 3.4 Logout

```http
POST /api/logout
Cookie: JSESSIONID=...
```

```json
{ "message": "Logout realizado com sucesso!" }
```

Retorna `200`, invalida a sessão e limpa a autenticação. Também é permitido sem sessão, podendo ser tratado como idempotente.

### 3.5 Rota protegida sem sessão

```json
{
  "status": 401,
  "error": "Unauthorized",
  "message": "Autenticação necessária. Faça login para continuar."
}
```

### 3.6 Cookies e CORS

Não há configuração de CORS. Prefira mesma origem ou proxy de desenvolvimento:

```text
browser -> http://localhost:3000/api/... -> proxy -> http://localhost:8080/api/...
```

```ts
fetch('/api/auth/check', { credentials: 'include' });

const api = axios.create({ baseURL: '/api', withCredentials: true });
```

Para origens diferentes, CORS e política do cookie precisarão ser configurados no backend. `credentials: 'include'` sozinho não resolve a ausência de CORS.

## 4. Contratos TypeScript sugeridos

```ts
type UUID = string;

interface LoginRequest { username: string; password: string }
interface LoginResponse { message: string; username: string }
interface AuthCheckResponse { authenticated: true; username: string }
interface CategorySummary { id: UUID; name: string }

interface ProductSummary {
  id: UUID;
  name: string;
  price: number;
  photo: string | null;
}

interface Category {
  id: UUID;
  name: string;
  products: ProductSummary[];
}

interface Product {
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

interface ProductInput {
  name: string;
  price: number;
  category_id: UUID;
  stock_quantity?: number | null;
  cost_price?: number | null;
  active?: boolean | null;
}

interface SpringSort { sorted: boolean; unsorted: boolean; empty: boolean }

interface SpringPage<T> {
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
```

Notas:

- `photo` é URL relativa da API, não nome físico;
- datas não têm offset, por exemplo `2026-10-26T14:35:12.123456`;
- formate valores monetários no frontend; JSON não garante zeros finais;
- `products` sempre é array;
- não há ordem garantida para categorias, seus produtos ou agrupamentos do dashboard.

## 5. Categorias

### 5.1 Listar

```http
GET /api/categories
```

Público, sem filtros/paginação. Cada categoria inclui todos os produtos resumidos:

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

Não há variante “sem produtos”; a resposta pode crescer com o catálogo.

### 5.2 Obter

```http
GET /api/categories/{id}
```

Público. Retorna `200` com o mesmo contrato, `404` se não existir e `400` para UUID malformado.

### 5.3 Criar

```http
POST /api/categories
Content-Type: application/json
Cookie: JSESSIONID=...
```

```json
{ "name": "Eletrônicos" }
```

- `name` obrigatório e não branco;
- banco aceita até 255 caracteres, mas não há `@Size` no DTO;
- nomes repetidos são permitidos.

Resposta `201`, `Location: /api/categories/{id}`:

```json
{ "id": "d9562726-42f7-4d6f-b9ea-528d2bd78284", "name": "Eletrônicos", "products": [] }
```

### 5.4 Atualizar

```http
PUT /api/categories/{id}
Content-Type: application/json
Cookie: JSESSIONID=...
```

```json
{ "name": "Eletrônicos e acessórios" }
```

Retorna `200` com categoria completa, `400` para entrada inválida e `404` se não existir.

### 5.5 Excluir

```http
DELETE /api/categories/{id}
Cookie: JSESSIONID=...
```

- `204`: sucesso, sem body;
- `404`: inexistente;
- `409`: possui produtos vinculados.

Não há cascata. Produtos devem ser removidos ou realocados antes.

## 6. Produtos

### 6.1 Listar, filtrar, ordenar e paginar

```http
GET /api/products
```

Público; retorna `Page<Product>`.

#### Filtros

| Query param | Tipo | Comportamento |
|---|---|---|
| `nome` | string | contém, sem diferenciar caixa |
| `category_id` | UUID | categoria exata |
| `min_price` | decimal | preço `>=` valor |
| `max_price` | decimal | preço `<=` valor |
| `has_photo` | boolean | `true`: foto preenchida; `false`: nula |
| `stock_status` | string | `OUT_OF_STOCK`, `LOW_STOCK`, `IN_STOCK` |
| `active` | boolean | `true`: somente ativos; `false`: somente inativos; omitido: todos |

São opcionais e combinados com `AND`.

| Status | Condição |
|---|---|
| `OUT_OF_STOCK` | estoque `== 0` |
| `LOW_STOCK` | estoque `> 0 && <= 5` |
| `IN_STOCK` | estoque `> 5` |

O status ignora caixa/espaços nas pontas. Valor desconhecido é atualmente ignorado, sem erro; valide os três valores no frontend.

- `nome` vazio/branco é ignorado;
- `has_photo` verifica a coluna, não o arquivo físico;
- não há validação de `min_price <= max_price`;
- UUID/número/boolean malformado gera `400`.

#### Paginação e sort

| Param | Padrão | Nota |
|---|---|---|
| `page` | `0` | zero-based |
| `size` | `10` | itens por página |
| `sort` | `name,asc` | propriedade Java/direção |

```text
GET /api/products?page=0&size=20
GET /api/products?nome=fone&sort=price,desc
GET /api/products?category_id={uuid}&min_price=10&max_price=200
GET /api/products?has_photo=false&stock_status=LOW_STOCK
GET /api/products?sort=active,desc&sort=name,asc
```

Sorts úteis: `name`, `price`, `stockQuantity`, `costPrice`, `createdAt`, `updatedAt`, `active`, `id`. Em sort use propriedade Java `camelCase` (`stockQuantity`), não JSON `snake_case`. Propriedade inexistente pode causar erro; use allowlist.

Resposta abreviada:

```json
{
  "content": [{
    "id": "fcbeb855-36c5-4c65-af54-1627fd47d79a",
    "name": "Fone Bluetooth",
    "price": 199.90,
    "category": { "id": "d9562726-42f7-4d6f-b9ea-528d2bd78284", "name": "Eletrônicos" },
    "photo": "/api/products/fcbeb855-36c5-4c65-af54-1627fd47d79a/photo",
    "stock_quantity": 8,
    "cost_price": 120.00,
    "created_at": "2026-10-26T14:35:12.123456",
    "updated_at": "2026-10-26T14:35:12.123456",
    "active": true
  }],
  "pageable": {
    "pageNumber": 0, "pageSize": 10, "offset": 0,
    "paged": true, "unpaged": false,
    "sort": { "sorted": true, "unsorted": false, "empty": false }
  },
  "totalElements": 1,
  "totalPages": 1,
  "last": true,
  "first": true,
  "size": 10,
  "number": 0,
  "numberOfElements": 1,
  "sort": { "sorted": true, "unsorted": false, "empty": false },
  "empty": false
}
```

### 6.2 Obter

```http
GET /api/products/{id}
```

Público. Retorna `200`, `404` se inexistente e `400` para UUID malformado.

### 6.3 Criar com JSON

```http
POST /api/products
Content-Type: application/json
Cookie: JSESSIONID=...
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

| Campo | Obrigatório | Criação |
|---|---:|---|
| `name` | Sim | não branco |
| `price` | Sim | `>= 0.01` |
| `category_id` | Sim | categoria existente |
| `stock_quantity` | Não | omitido/`null` vira `0` |
| `cost_price` | Não | omitido fica `null` |
| `active` | Não | omitido/`null` vira `true` |

O DTO completo não valida estoque nem custo negativos; bloqueie-os no frontend. Retorna `201`, `Location` e produto. Falhas: `400`, `401`, `404` para categoria.

### 6.4 Criar com multipart

| Parte | Tipo | Obrigatória |
|---|---|---:|
| `name` | texto | Sim |
| `price` | texto decimal | Sim |
| `category_id` | texto UUID | Sim |
| `stock_quantity` | texto inteiro | Não |
| `cost_price` | texto decimal | Não |
| `active` | texto booleano | Não |
| `photo` | arquivo | Não |
| `image` | arquivo | Não; alias de `photo` |

Se os dois aliases forem enviados, `photo` não vazio tem prioridade.

```ts
const form = new FormData();
form.append('name', values.name);
form.append('price', String(values.price));
form.append('category_id', values.categoryId);
form.append('stock_quantity', String(values.stockQuantity));
form.append('cost_price', String(values.costPrice));
form.append('active', String(values.active));
if (values.file) form.append('photo', values.file);

await fetch('/api/products', {
  method: 'POST', credentials: 'include', body: form,
});
```

Não defina `Content-Type` manualmente para `FormData`; o browser cria o boundary.

Arquivo:

- máximo 5 MB por arquivo e 6 MB por request;
- extensões `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.pdf`;
- MIME deve começar com `image/` ou ser `application/pdf`;
- MIME e extensão precisam ser aceitos;
- conteúdo real não é inspecionado profundamente;
- nome final é UUID;
- armazenamento em `uploads/products`, relativo ao diretório de execução.

Erros: `400` para MIME/extensão, erro de multipart para limite, `500` para falha de escrita.

### 6.5 Atualizar com PUT

Aceita `application/json` ou `multipart/form-data`. `name`, `price` e `category_id` continuam obrigatórios; não é PATCH geral.

| Campo | Preenchido | Omitido/`null` |
|---|---|---|
| `stock_quantity` | substitui | preserva |
| `cost_price` | substitui | preserva; não pode limpar para `null` |
| `active` | substitui | preserva |
| `photo`/`image` | troca e apaga antigo | **remove foto atual** |

Tanto PUT JSON quanto multipart sem arquivo apagam a foto atual. Para preservá-la, a API exige reenviar o arquivo. Retorna `200`; erros `400`, `401`, `404` de produto/categoria.

### 6.6 Atualizar apenas estoque

```http
PATCH /api/products/{id}/stock
Content-Type: application/json
Cookie: JSESSIONID=...
```

```json
{ "stock_quantity": 7 }
```

Obrigatório, inteiro e `>= 0`. Retorna o produto completo (`200`), ou `400`, `401`, `404`.

### 6.7 Excluir

```http
DELETE /api/products/{id}
Cookie: JSESSIONID=...
```

Exclui registro e depois arquivo associado. Retorna `204`, `401`, `404`, ou possível `500` se o arquivo não puder ser removido.

### 6.7.1 Excluir vários produtos

```http
POST /api/products/bulk-delete
Content-Type: application/json
Cookie: JSESSIONID=...

{ "ids": ["d9562726-42f7-4d6f-b9ea-528d2bd78284", "d9562726-42f7-4d6f-b9ea-528d2bd78285"] }
```

Aceita de 1 a 100 UUIDs não nulos. IDs repetidos são processados uma única vez. Exige sessão (`401`); lista ausente/vazia, UUID inválido, item nulo ou mais de 100 IDs retorna `400`.

A exclusão dos registros é transacional: todos os produtos são bloqueados e verificados antes de excluir. Se qualquer ID não existir, retorna `404` e nenhum produto é excluído. Sucesso retorna `204`, sem JSON. Os arquivos são removidos após o commit; falhas de limpeza são registradas no log, sem reverter uma exclusão já confirmada.

No admin web e mobile, o checkbox geral seleciona somente os produtos da página visível, incluindo inativos. Mudar página, busca ou filtros limpa a seleção. A confirmação informa a quantidade e os nomes; após sucesso, listas, categorias e indicadores são atualizados e a paginação é ajustada se a última página desaparecer.

### 6.8 Foto/PDF

```http
GET /api/products/{id}/photo
GET /api/products/{id}/image
```

Públicas e equivalentes; `photo` aponta sempre para `/photo`.

```ts
const src = product.photo
  ? new URL(product.photo, 'http://localhost:8080').toString()
  : '/placeholder-product.png';
```

Pode ser PDF, portanto nem toda URL cabe em `<img>`. MIME possível: imagens, `application/pdf` ou `application/octet-stream`. Retorna `404` quando produto/arquivo não existe ou o produto não tem arquivo.

## 7. Dashboard

Todos exigem sessão e consideram também produtos `active: false`. Não há filtros.

### 7.1 Resumo

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

- valor do estoque: soma `price * stock_quantity`;
- preço médio: média de `price`;
- sem foto: coluna `photo` nula;
- estoque baixo: `stock_quantity <= 5`, incluindo zero;
- sem dados, agregados são zero.

### 7.2 Produtos por categoria

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
}]
```

`total_value` soma `price * stock_quantity`. Categorias vazias não aparecem e a ordem não é garantida.

### 7.3 Faixas de preço

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

Sempre vêm três itens. Limites reais: `<= 50`, `> 50 && <= 200`, `> 200`; apesar do rótulo “R$ 51”, `50.01` pertence à segunda faixa.

## 8. Erros e status

Não há `@ControllerAdvice`. Exceto o `401` customizado, vale o erro padrão do Spring:

```json
{
  "timestamp": "2026-10-26T18:47:41.554Z",
  "status": 404,
  "error": "Not Found",
  "path": "/api/products/00000000-0000-0000-0000-000000000000"
}
```

O formato pode variar. Não dependa de `message`, `errors` ou `trace`; trate pelo status.

| Status | Uso |
|---:|---|
| `200` | consulta/login/logout/atualização |
| `201` | criação; há `Location` |
| `204` | exclusão; não parsear JSON |
| `400` | JSON/query/UUID/validação/arquivo inválido |
| `401` | login inválido ou sessão ausente/expirada |
| `404` | recurso/arquivo inexistente |
| `409` | categoria ainda possui produtos |
| `413` | possível para multipart grande |
| `415` | `Content-Type` não suportado |
| `500` | persistência, sort inválido ou I/O |

```ts
async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    // limpar autenticação e abrir login
  }
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new ApiError(response.status, error);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
```

## 9. Fluxos recomendados

### Inicialização/login

1. Chamar `/api/auth/check`.
2. Em `200`, popular usuário; em `401`, mostrar login.
3. Enviar login com cookies habilitados.
4. Não salvar senha nem procurar JWT.
5. Só carregar dashboard depois de confirmar sessão.

### Catálogo/formulários

1. Carregar categorias para selects e produtos com paginação server-side.
2. Ao mudar filtro, voltar `page` a `0`; aplicar debounce em `nome`.
3. Restringir `sort` a propriedades conhecidas.
4. Usar JSON sem arquivo e `FormData` com arquivo.
5. Validar arquivo, preço e estoque no cliente.
6. Considerar que PUT sem reenvio remove a foto.

### Logout/sessão expirada

1. Chamar `/api/logout`.
2. Limpar estado/cache privado.
3. Tratar globalmente `401` como sessão ausente/expirada.

## 10. Cliente `fetch` de referência

```ts
const API_BASE = '/api';

class ApiError extends Error {
  constructor(public status: number, public payload: unknown) {
    super(`API request failed with status ${status}`);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(!(init.body instanceof FormData) && init.body
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new ApiError(response.status, payload);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const authApi = {
  login: (body: LoginRequest) => request<LoginResponse>('/login', {
    method: 'POST', body: JSON.stringify(body),
  }),
  check: () => request<AuthCheckResponse>('/auth/check'),
  logout: () => request<{ message: string }>('/logout', { method: 'POST' }),
};

export const productApi = {
  list: (p: URLSearchParams) => request<SpringPage<Product>>(`/products?${p}`),
  get: (id: UUID) => request<Product>(`/products/${id}`),
  createJson: (body: ProductInput) => request<Product>('/products', {
    method: 'POST', body: JSON.stringify(body),
  }),
  createMultipart: (body: FormData) => request<Product>('/products', {
    method: 'POST', body,
  }),
  updateJson: (id: UUID, body: ProductInput) => request<Product>(`/products/${id}`, {
    method: 'PUT', body: JSON.stringify(body),
  }),
  updateStock: (id: UUID, stock_quantity: number) =>
    request<Product>(`/products/${id}/stock`, {
      method: 'PATCH', body: JSON.stringify({ stock_quantity }),
    }),
  remove: (id: UUID) => request<void>(`/products/${id}`, { method: 'DELETE' }),
};
```

## 11. Banco, arquivos e dados iniciais

Configuração dev atual:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/project
spring.datasource.username=root
spring.datasource.password=1234
spring.jpa.hibernate.ddl-auto=validate
spring.flyway.enabled=true
app.storage.products-dir=uploads/products
app.default-admin.username=admin
app.default-admin.password=admin
```

A migration cria originalmente `admin`/`1234`, mas no perfil `dev` o `DataSeeder` atualiza esse usuário pelas propriedades. Com a configuração versionada, as credenciais efetivas são `admin`/`admin`. Fora do perfil `dev`, permanece a senha da migration, salvo alteração posterior.

O seeder:

- configura o admin mesmo se já houver categorias;
- se não houver categoria, cria 5 categorias e 20 produtos;
- gera preços, estoques e custos fictícios;
- copia uma imagem padrão por produto;
- se houver qualquer categoria, não cria catálogo fictício.

O banco guarda só o nome do arquivo; o conteúdo fica em `uploads/products`. Backup apenas do banco não preserva imagens.

## 12. Arquitetura e limitações

```text
HTTP -> Spring Security -> Controller/@Valid -> Service/DTO -> Repository/JPA -> banco
```

- `SecurityConfig`: sessão/autorização/logout/401;
- controllers e services de auth, categorias, produtos e dashboard;
- `ImageStorageService`: arquivos;
- `DataSeeder`: dados dev;
- `db/migration`: esquema Flyway.

Limitações relevantes:

- sem cadastro, perfil, recuperação ou troca de senha;
- sem permissões diferentes;
- sem filtro por `active`; inativos continuam em listas/métricas;
- categorias sem paginação e já incluindo produtos;
- sem busca de categorias;
- sem PATCH geral, apenas estoque;
- PUT sem arquivo remove foto;
- sem endpoint para remover apenas foto;
- nomes não são únicos;
- sem operações em lote;
- sem CORS;
- arquivos locais, não S3/CDN;
- erros sem contrato detalhado uniforme.

## 13. Executar e testar

Requer Java 21 e MySQL/MariaDB conforme `application-dev.properties`.

```bash
./mvnw spring-boot:run
```

```bash
# Login e cookie
curl -i -c cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin"}' \
  http://localhost:8080/api/login

curl -i -b cookies.txt http://localhost:8080/api/auth/check
curl 'http://localhost:8080/api/products?page=0&size=10&stock_status=LOW_STOCK'
curl -i -b cookies.txt http://localhost:8080/api/dashboard/summary
curl -i -b cookies.txt -X POST http://localhost:8080/api/logout
```

Há uma coleção Bruno em `bruno/`; a `base_url` esperada é `http://localhost:8080/api`. IDs estáticos dos exemplos precisam ser trocados pelos UUIDs da base atual.

## 14. Checklist para o agente de frontend

- usar `/api` via proxy, preferencialmente;
- habilitar cookies em toda chamada;
- restaurar sessão por `/api/auth/check`;
- não implementar JWT;
- paginação zero-based;
- enviar filtros com nomes exatos;
- usar `camelCase` somente no valor de `sort` e `snake_case` nos DTOs;
- converter valores de formulário antes do JSON;
- não definir `Content-Type` para `FormData`;
- tratar `photo: null` e distinguir imagem/PDF;
- não chamar `.json()` em `204`;
- tratar globalmente `401`, `400`, `404`, `409`, 5xx;
- validar estoque não negativo no formulário completo;
- contornar/avisar remoção da foto em PUT sem arquivo;
- ordenar dashboard no cliente quando necessário;
- não presumir que produtos inativos sejam omitidos.
