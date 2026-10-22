# Especificação do Backend — API de Categorias e Produtos

## 1. Visão geral

Backend REST em **Spring Boot 4.1.1 / Java 21**, banco **MySQL/MariaDB** com migrações **Flyway**.
Gerencia **Categorias** (1:N) **Produtos**, com upload de imagem/PDF por produto e **autenticação por sessão**.
Não há API versionada, Swagger/OpenAPI, CORS configurado nem endpoints de usuário.

- **Base URL local:** `http://localhost:8080`
- **Prefixo das rotas:** `/api`
- **Formato:** JSON (exceto multipart e download de arquivo)
- **Porta:** 8080 (padrão do Spring Boot, não customizada)
- **Datas:** não existem campos de data nas respostas.

## 2. Autenticação e sessão (MUITO IMPORTANTE)

- Login por **cookie de sessão** (`JSESSIONID`, HttpOnly). **Não existe token JWT nem header Authorization.**
- **CSRF está desabilitado.** Não é necessário enviar token CSRF.
- **Todas as requisições GET são públicas.**
- **POST, PUT e DELETE exigem sessão autenticada** (exceto `/api/login` e `/api/logout`).
- Sessão em memória: reiniciar o backend invalida todos os logins. Timeout padrão de inatividade: ~30 min.
- **CORS NÃO está configurado.** O frontend deve rodar na mesma origem (ex.: proxy do Vite/Next de `/api` para `http://localhost:8080`) **ou** será necessário adicionar CORS no backend. Com proxy/same-origin, envie as requisições com `credentials: "include"` (fetch) / `withCredentials: true` (axios).

### 2.1 POST /api/login
Autentica e cria a sessão (responde com `Set-Cookie: JSESSIONID=...`).

Request:
```json
{ "username": "admin", "password": "sua-senha" }
```

Respostas:
- `200 OK`
```json
{ "message": "Login realizado com sucesso!", "username": "admin" }
```
- `401 Unauthorized` — credenciais inválidas (corpo padrão de erro do Spring, ver seção 5)
- `400 Bad Request` — `username` ou `password` em branco

> O usuário padrão é `admin`, criado pela migração V3. A **senha** é definida no hash BCrypt da migration (pode ter sido alterada pelo dono do projeto — peça as credenciais a ele).

### 2.2 POST /api/logout
Encerra a sessão. Pode ser chamado sem sessão (idempotente).

- `200 OK`
```json
{ "message": "Logout realizado com sucesso!" }
```
- Após o logout, qualquer POST/PUT/DELETE com o cookie antigo retorna `401`.

### 2.3 Resposta para acesso não autenticado (401)
Formato **customizado e fixo** (UTF-8):
```json
{
  "status": 401,
  "error": "Unauthorized",
  "message": "Autenticação necessária. Faça login para continuar."
}
```
Aplicado a qualquer rota protegida sem sessão válida.

## 3. Modelo de dados (respostas)

### 3.1 CategoryResponseDTO
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "Eletrônicos",
  "products": [
    {
      "id": "uuid",
      "name": "Fone Bluetooth",
      "price": 199.90,
      "photo": "/api/products/{id}/photo"
    }
  ]
}
```

### 3.2 CategorySummaryResponseDTO
```json
{ "id": "uuid", "name": "Eletrônicos" }
```

### 3.3 ProductResponseDTO
```json
{
  "id": "uuid",
  "name": "Fone Bluetooth",
  "price": 199.90,
  "category": { "id": "uuid", "name": "Eletrônicos" },
  "photo": "/api/products/{id}/photo"
}
```
- `photo` é **uma URL relativa** (não é nome de arquivo). Prefixe com a base URL para exibir (`http://localhost:8080` + `photo`).
- `photo` pode ser `null` (produto sem imagem/PDF).
- Preço é número decimal (`BigDecimal`), sempre com 2 casas vindas do banco quando criado pelo seed; envie como número no JSON (não string).

### 3.4 Página de produtos (Spring Data `Page`)
`GET /api/products` retorna um objeto de paginação:
```json
{
  "content": [ /* ProductResponseDTO[] */ ],
  "pageable": { "pageNumber": 0, "pageSize": 10, "offset": 0, "paged": true, "unpaged": false },
  "totalElements": 20,
  "totalPages": 2,
  "last": false,
  "first": true,
  "size": 10,
  "number": 0,
  "numberOfElements": 10,
  "sort": { "sorted": true, "unsorted": false, "empty": false },
  "empty": false
}
```
Campos estáveis para o frontend: `content`, `totalElements`, `totalPages`, `number` (página atual, **0-based**), `size`, `first`, `last`, `numberOfElements`, `empty`.

## 4. Endpoints

### 4.1 Categorias — `/api/categories`

| Método | Rota | Auth | Sucesso | Erros |
|---|---|---|---|---|
| GET | `/api/categories` | pública | 200 `CategoryResponseDTO[]` | — |
| POST | `/api/categories` | **sim** | 201 `CategoryResponseDTO` + header `Location` | 400 |
| GET | `/api/categories/{id}` | pública | 200 `CategoryResponseDTO` | 404 |
| PUT | `/api/categories/{id}` | **sim** | 200 `CategoryResponseDTO` | 400, 404 |
| DELETE | `/api/categories/{id}` | **sim** | 204 (sem corpo) | 404, 409 |

**POST/PUT body** (ambos):
```json
{ "name": "Eletrônicos" }
```
Validação: `name` obrigatório e não branco (`@NotBlank`, máx. 255 chars no banco).

**DELETE — regra de negócio:** retorna `409 Conflict` se a categoria possuir produtos vinculados.

Exemplo POST:
```
POST /api/categories
Content-Type: application/json

{ "name": "Eletrônicos" }
→ 201 Created
Location: /api/categories/{id}
{ "id": "...", "name": "Eletrônicos", "products": [] }
```

### 4.2 Produtos — `/api/products`

| Método | Rota | Auth | Sucesso | Erros |
|---|---|---|---|---|
| GET | `/api/products` | pública | 200 `Page<ProductResponseDTO>` | 400 (query inválida) |
| POST | `/api/products` (JSON) | **sim** | 201 `ProductResponseDTO` + `Location` | 400, 404 (categoria) |
| POST | `/api/products` (multipart) | **sim** | 201 `ProductResponseDTO` + `Location` | 400, 404, 413/500 (arquivo) |
| GET | `/api/products/{id}` | pública | 200 `ProductResponseDTO` | 404 |
| GET | `/api/products/{id}/photo` (ou `/image`) | pública | 200 binário | 404 |
| PUT | `/api/products/{id}` (JSON) | **sim** | 200 `ProductResponseDTO` | 400, 404 |
| PUT | `/api/products/{id}` (multipart) | **sim** | 200 `ProductResponseDTO` | 400, 404 |
| DELETE | `/api/products/{id}` | **sim** | 204 (sem corpo) | 404 |

#### GET /api/products — filtros e paginação
Query params:
- `nome` (opcional): filtro **contém, ignorando maiúsculas/minúsculas**. Vazio/ausente = todos.
- `page` (opcional, padrão `0`, **0-based**)
- `size` (opcional, padrão `10`)
- `sort` (opcional, padrão `name,asc`): ex. `sort=price,desc`, `sort=name,asc`. Aceita múltiplos `sort`.

Exemplos:
```
GET /api/products?nome=fone&page=0&size=10&sort=name,asc
GET /api/products?sort=price,desc
```

#### POST JSON
```json
{
  "name": "Fone Bluetooth",
  "price": 199.90,
  "category_id": "uuid-da-categoria"
}
```
- `name`: obrigatório (`@NotBlank`)
- `price`: obrigatório e `>= 0.01` (`@NotNull`, `@DecimalMin("0.01")`)
- `category_id`: obrigatório (`@NotNull`) e a categoria deve existir (senão 404)

#### POST multipart (com arquivo)
`Content-Type: multipart/form-data`. Partes:
- `name` (texto)
- `price` (texto decimal, ex. `199.90`)
- `category_id` (texto UUID)
- `photo` **ou** `image` (arquivo). Se ambos vierem, `photo` tem prioridade.

Restrições do arquivo:
- Extensões aceitas: `png`, `jpg`, `jpeg`, `gif`, `webp`, `pdf`
- Content-Type aceito: `image/*` **ou** `application/pdf`
- Tamanho máximo: **5 MB por arquivo** / **6 MB por requisição**
- Nome do arquivo no servidor é gerado (UUID); o original não é preservado.
- Erros: extensão inválida → 400; tipo inválido → 400.

Exemplo cURL:
```bash
curl -b cookies.txt -X POST http://localhost:8080/api/products \
  -F "name=Fone Bluetooth" -F "price=199.90" \
  -F "category_id=$CATEGORY_ID" \
  -F "photo=@arquivo.png;type=image/png"
```

#### GET /api/products/{id}/photo (alias: `/image`)
- Retorna o binário salvo (imagem **ou PDF**).
- `Content-Type` derivado da extensão: `image/png`, `image/jpeg`, `image/gif`, `image/webp`, `application/pdf`; desconhecido → `application/octet-stream`.
- `404` se o produto não existe, não possui arquivo ou o arquivo sumiu do disco.

#### PUT JSON — ATENÇÃO
```json
{ "name": "Novo nome", "price": 99.90, "category_id": "uuid" }
```
**Sem envio de arquivo, a imagem/PDF atual é REMOVIDA** (`photo` vira `null`). Use o PUT multipart para trocar a imagem; para preservá-la, reenvie o arquivo.

#### PUT multipart
Mesmos campos do POST multipart. Se um novo arquivo for enviado, o antigo é apagado do disco. Se nenhum arquivo for enviado, a imagem é removida (mesmo comportamento do PUT JSON).

#### DELETE
Remove o produto, faz `flush` e apaga o arquivo do disco. `404` se não existir.

## 5. Formato padrão de erros

Não há `@ControllerAdvice`. Erros de status (404, 409, etc.) usam o formato padrão do Spring:
```json
{
  "timestamp": "2026-10-20T18:47:41.554Z",
  "status": 404,
  "error": "Not Found",
  "path": "/api/products/00000000-0000-0000-0000-000000000000"
}
```
- `400` de validação (`@Valid`) usa o mesmo formato (`"error": "Bad Request"`). **As mensagens de validação NÃO vêm no corpo por padrão** — valide no frontend e use apenas o status.
- Em execução via IDE/devtools pode aparecer também `message`/`trace` no corpo; não dependa desses campos.
- `401` de rota protegida é a exceção customizada da seção 2.3.
- `409` apenas para DELETE de categoria com produtos.

## 6. Fluxos esperados no frontend

1. **Login:** `POST /api/login` com JSON → guardar estado "logado" (a sessão é o cookie; não há token para armazenar). Incluir credenciais em todas as chamadas.
2. **Bootstrapping:** ao abrir o app, tentar uma rota de escrita ou usar o estado de erro 401 para decidir se mostra a tela de login. Não existe endpoint `GET /api/me`.
3. **Categorias:** listar/ler livremente. Criar/editar/excluir apenas quando logado. Em 409 ao excluir, informar que há produtos vinculados.
4. **Produtos:** listagem pública paginada com busca `nome` e ordenação. Criar/editar com envio JSON (sem arquivo) ou multipart (com arquivo). Exibir `photo` prefixando a base URL.
5. **Logout:** `POST /api/logout` → limpar estado e voltar ao login.
6. **Tratamento global:** 401 → redirecionar/abrir login; 404 → mensagem "não encontrado"; 400 → validação; 409 → regra de negócio; 5xx → erro genérico.

## 7. Observações técnicas para o frontend

- Use `fetch` com `credentials: "same-origin"` (ou `"include"` se cross-origin com CORS) — sem isso o cookie de sessão não é enviado.
- Em multipart, **não** defina `Content-Type` manualmente (o browser gera o boundary).
- Respostas `204` não têm corpo.
- `photo` pode ser `null`; trate com placeholder.
- Imagens/PDFs são servidos apenas via API (não há pasta estática pública).
- Não há refresh token, papéis/permissões nem multiusuário pela API: login é tudo-ou-nada (usuários existem só na tabela `user`).
- Não há CORS: para desenvolvimento, configure proxy de `/api` no dev server (Vite: `server.proxy`), evitando cookies cross-origin.
- A URL da imagem é servida apenas quando o produto existe; o `photo` é montado dinamicamente a partir do id.

## 8. Dados iniciais (perfil dev)

Com o banco vazio, o seeder cria automaticamente:
- **5 categorias** e **20 produtos** (4 por categoria), com nomes gerados pelo Datafaker em inglês.
- Cada produto recebe um **PNG placeholder** embutido (300×300).
- Usuário `admin` criado pela migration V3 (senha em hash BCrypt definida na migration).

## 9. Resumo dos status codes

| Código | Quando |
|---|---|
| 200 | GET/PUT/login/logout bem-sucedidos |
| 201 | POST de categoria/produto criado |
| 204 | DELETE de categoria/produto |
| 400 | validação, arquivo inválido, query inválida |
| 401 | login inválido ou rota protegida sem sessão |
| 404 | recurso/categoria/imagem inexistente |
| 409 | excluir categoria com produtos |
| 413/500 | arquivo acima do limite / falha ao salvar arquivo |
