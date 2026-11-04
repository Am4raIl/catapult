# Catapult Mobile

Aplicativo Expo/React Native do catálogo público e da gestão de estoque do Catapult.

## Expo Go por QR code, sem USB

Coloque o computador e o celular na mesma rede Wi-Fi. Descubra o IP do computador com `ip -4 route get 1.1.1.1` (campo `src`) e substitua `SEU_IP_LOCAL` nos comandos abaixo. A rede precisa permitir que o celular acesse o computador.

Em um terminal, na raiz do projeto, publique a API nesse IP e suba os containers:

```bash
cd /home/japones/Projetos/Catapult
CATAPULT_API_BIND=SEU_IP_LOCAL podman-compose up -d --no-deps --force-recreate backend
```

Se banco e backend ainda não estiverem iniciados, execute `CATAPULT_API_BIND=SEU_IP_LOCAL podman-compose up -d db backend`. O Compose mantém a API restrita a `127.0.0.1` quando `CATAPULT_API_BIND` não é definido.

Em `mobile/.env.local`, configure a mesma origem:

```dotenv
EXPO_PUBLIC_API_ORIGIN=http://SEU_IP_LOCAL:8080
```

Em outro terminal, inicie o Expo:

```bash
cd /home/japones/Projetos/Catapult/mobile
npm install
npx expo start --lan --clear
```

Escaneie o QR code com o Expo Go no Android, ou com a câmera no iPhone. Mantenha o terminal do Expo aberto. Se o IP do computador mudar, atualize `CATAPULT_API_BIND` e `.env.local`, recrie o backend e reinicie o Expo. O computador pode estar no cabo de rede, desde que o celular consiga alcançá-lo pela rede local.

Se o celular não alcançar o computador pela rede local, consulte [docs.md](docs.md) para usar túneis para o Expo e para a API.

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

## Paridade com a versão web

Consulte [mobile-parity.md](docs/mobile-parity.md) para o design atualizado, a sacola com checkout idempotente, os indicadores de categorias e o roteiro de validação.
