# 🚀 Catapult — Catálogo e Gestão de Estoque

<p align="center">
  <img src="https://img.shields.io/badge/Java_21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white" alt="Java 21" />
  <img src="https://img.shields.io/badge/Spring_Boot_4-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" alt="Spring Boot 4" />
  <img src="https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React_Native-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo_58-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo 58" />
  <img src="https://img.shields.io/badge/MySQL_8.4-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL 8.4" />
  <img src="https://img.shields.io/badge/Podman-892CA0?style=for-the-badge&logo=podman&logoColor=white" alt="Podman" />
</p>

---

O **Catapult** reúne uma vitrine de produtos, uma sacola de compras e a administração de catálogo e estoque. A API em **Spring Boot** atende a interface web em **Next.js** e o aplicativo **Expo/React Native**. O checkout valida preços e disponibilidade no servidor, registra a baixa de estoque e evita baixas duplicadas em tentativas repetidas. Não há integração com meios de pagamento.

## ✨ Funcionalidades

- **Vitrine:** busca, filtros, categorias, paginação e detalhes dos produtos.
- **Sacola e checkout:** ajuste de quantidades, persistência local e confirmação transacional com validação de estoque.
- **Administração:** login por sessão, cadastro e edição de produtos e categorias, upload de imagem/PDF, ajustes de estoque e exclusão em lote.
- **Dashboard:** indicadores do catálogo, estoque e distribuição de produtos.
- **Mobile:** catálogo, sacola, checkout e telas administrativas para Android e iOS.

## 🛠️ Stack tecnológica

| Camada | Tecnologias |
| --- | --- |
| API | Java 21, Spring Boot 4, Spring Security, JPA/Hibernate e Flyway |
| Web | Next.js 16, React 19, TypeScript e Tailwind CSS 4 |
| Mobile | Expo 58, React Native, Expo Router e TypeScript |
| Dados e infraestrutura | MySQL 8.4, Podman Compose e volumes para banco e uploads |

## 📁 Estrutura do projeto

```text
Catapult/
├── compose.yaml     # MySQL, API e frontend web
├── backend/         # API Spring Boot, migrações e testes
├── frontend/        # Aplicação Next.js
└── mobile/          # Aplicativo Expo/React Native
```

## ✅ Pré-requisitos

- **Containers:** Podman e `podman-compose`.
- **Execução local:** Java 21, Node.js 22, npm e MySQL/MariaDB.
- **Mobile:** Expo Go compatível com o SDK 58 ou ambiente nativo configurado.

## 🚀 Rodando pela primeira vez

### Com Podman Compose

Na raiz do repositório:

```bash
podman-compose up --build -d
```

| Serviço | Endereço |
| --- | --- |
| Web | <http://localhost:3000> |
| API | <http://localhost:8080/api> |
| Login administrativo | <http://localhost:3000/login> |

No perfil `dev`, a API aplica as migrações e cria dados de demonstração quando o catálogo está vazio. Os volumes preservam banco e arquivos enviados; `podman-compose down` para os serviços sem apagá-los.

### Desenvolvimento local

Crie o banco `project` no MySQL/MariaDB. A configuração local padrão da API usa `root` / `1234` em `localhost:3306`; ajuste `SPRING_DATASOURCE_USERNAME` e `SPRING_DATASOURCE_PASSWORD` se necessário.

Para iniciar a API, a partir da raiz:

```bash
cd backend
./mvnw spring-boot:run
```

Em outro terminal, também a partir da raiz:

```bash
cd frontend
npm ci
npm run dev
```

### Aplicativo mobile

Com a API em execução:

```bash
cd mobile
npm ci
cp .env.example .env.local
```

Em `mobile/.env.local`, configure `EXPO_PUBLIC_API_ORIGIN` com a origem da API **sem `/api`**: use o IP do computador para um telefone físico ou `http://10.0.2.2:8080` no Android Emulator. Depois, execute `npx expo start --lan --clear` em `mobile/`. Para acessar a API do Compose pelo telefone, execute `CATAPULT_API_BIND=SEU_IP_LOCAL podman-compose up -d` na raiz do projeto.

## 🔑 Credenciais de demonstração

| Usuário | Senha | Ambiente |
| --- | --- | --- |
| `admin` | `admin` | Perfil `dev` |

Altere as credenciais antes de usar o projeto fora do ambiente de desenvolvimento.

## 📡 Principais endpoints

| Método | Rota | Acesso |
| --- | --- | --- |
| `POST` | `/api/login` | Público |
| `GET` | `/api/products`, `/api/products/{id}` | Público |
| `POST / PUT / DELETE` | `/api/products`, `/api/products/{id}` | Admin |
| `PATCH` | `/api/products/{id}/stock` | Admin |
| `POST` | `/api/products/bulk-delete` | Admin |
| `GET / POST / PUT / DELETE` | `/api/categories`, `/api/categories/{id}` | Consulta pública; alterações admin |
| `GET` | `/api/dashboard/summary` | Admin |
| `POST` | `/api/checkout` | Público |

A autenticação administrativa usa cookie de sessão. O contrato completo está em [backend/docs/api.md](backend/docs/api.md).

## 🧪 Verificações

```bash
(cd frontend && npm run lint && npx tsc --noEmit)
(cd mobile && npm run lint && npx tsc --noEmit)
(cd backend && ./mvnw test)
```

Os testes de integração do backend exigem bancos MySQL de teste separados, configurados nas classes de teste.
