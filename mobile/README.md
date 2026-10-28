# Catapult Mobile

Aplicativo Expo/React Native do catálogo público e da gestão de estoque do Catapult.

## Pré-requisitos

- Node.js e npm;
- Java 21;
- MySQL/MariaDB disponível em `localhost:3306`;
- Expo Go no telefone ou um emulador Android/iOS.

## 1. Banco e backend

Crie o banco vazio (o Flyway cria as tabelas):

```bash
mysql -u root -p
```

No prompt do MySQL:

```sql
CREATE DATABASE IF NOT EXISTS project;
exit
```

Confira usuário e senha do banco em `../backend/src/main/resources/application-dev.properties`. Depois inicie a API:

```bash
cd ../backend
./mvnw spring-boot:run
```

A API ficará em `http://localhost:8080/api`. No perfil de desenvolvimento versionado, o acesso administrativo é `admin` / `admin`.

## 2. Aplicativo

Em outro terminal:

```bash
cd ../mobile
npm install
cp .env.example .env.local
npx expo start
```

Edite `EXPO_PUBLIC_API_ORIGIN` em `.env.local` conforme onde o app roda:

- Android Emulator: `http://10.0.2.2:8080`
- iOS Simulator: `http://127.0.0.1:8080`
- Expo Web: `http://localhost:8080`
- Telefone físico: `http://IP_DO_SEU_COMPUTADOR:8080`

No telefone físico, computador e celular precisam estar na mesma rede. Reinicie o Expo depois de mudar `.env.local`.

> O backend atual não habilita CORS. Use Android/iOS para desenvolvimento normal; a versão web precisa de proxy de mesma origem ou CORS configurado no servidor.

## Verificações

```bash
npx eslint .
npx tsc --noEmit
npx expo-doctor
```
