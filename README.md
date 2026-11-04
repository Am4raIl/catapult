# 🚀 Catapult

Catálogo de produtos e gestão de estoque com API REST, interface web e aplicativo mobile.

## Funcionalidades

- Catálogo público com busca, filtros, categorias e detalhes de produtos.
- Sacola e checkout com validação de estoque, cálculo no servidor e operação transacional.
- Administração de produtos, categorias, imagens, estoque e indicadores.
- Autenticação por sessão HTTP para operações administrativas.
- Aplicativo mobile com catálogo, sacola, checkout e painel administrativo.

## Stack

- **Backend:** Java 21, Spring Boot, Spring Security, JPA/Hibernate, Flyway e MySQL.
- **Web:** Next.js, React, TypeScript, Tailwind CSS e TanStack Query.
- **Mobile:** Expo, React Native, Expo Router e TypeScript.
- **Infraestrutura:** Podman Compose ou Docker Compose.

## Requisitos

Para execução com containers, instale Git, Podman e `podman-compose` — ou Docker Engine com Compose v2.

Para execução local, instale Java 21, Node.js 22, npm e MySQL/MariaDB.

## Execução com containers

Na raiz do projeto:

```bash
podman-compose up --build --force-recreate -d
```

Serviços disponíveis:

- Web: <http://localhost:3000>
- API: <http://localhost:8080/api>
- Login administrativo: <http://localhost:3000/login>

Credenciais de desenvolvimento: `admin` / `admin`.

Comandos úteis:

```bash
podman-compose up -d       # inicia os serviços
podman-compose logs -f     # acompanha os logs
podman-compose down        # para os serviços e preserva os volumes
```

Os volumes mantêm o banco e os arquivos enviados. Use `podman-compose down -v` somente se quiser removê-los.

## Execução local

Crie o banco `project` no MySQL/MariaDB e inicie a API:

```bash
cd backend
./mvnw spring-boot:run
```

Em outro terminal, inicie o frontend:

```bash
cd frontend
npm ci
npm run dev
```

O frontend usa `http://localhost:8080` como destino padrão da API. Para alterar o endereço:

```bash
API_ORIGIN=http://ENDERECO_DA_API:8080 npm run dev
```

## Aplicativo mobile

Configure o endereço da API em `mobile/.env.local`:

```bash
cd mobile
npm ci
cp .env.example .env.local
npx expo start --lan --clear
```

Defina `EXPO_PUBLIC_API_ORIGIN` com a origem da API, sem o sufixo `/api`. Em um telefone físico, use o IP do computador; no Android Emulator padrão, use `http://10.0.2.2:8080`.

## API

A API usa o prefixo `/api` e autenticação por cookie de sessão.

Principais recursos:

| Método | Rota | Finalidade |
| --- | --- | --- |
| `POST` | `/api/login` | Inicia uma sessão administrativa. |
| `GET` | `/api/products` | Lista produtos públicos. |
| `POST`, `PUT`, `DELETE` | `/api/products` | Gerencia produtos autenticados. |
| `POST` | `/api/products/bulk-delete` | Exclui vários produtos autenticados. |
| `GET`, `POST`, `PUT`, `DELETE` | `/api/categories` | Consulta e gerencia categorias. |
| `POST` | `/api/checkout` | Finaliza a sacola e atualiza o estoque. |

Os contratos completos estão em [`backend/docs/api.md`](backend/docs/api.md).

## Testes e verificações

```bash
# Frontend
cd frontend && npm run lint && npx tsc --noEmit

# Mobile
cd mobile && npm run lint && npx tsc --noEmit

# Backend
cd backend && ./mvnw test
```

## Estrutura

```text
backend/   API Spring Boot, migrações e testes
frontend/  Interface web Next.js
mobile/    Aplicativo Expo/React Native
compose.yaml
```
