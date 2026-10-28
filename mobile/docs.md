# Rodando o Catapult Mobile

## Backend

Em um terminal, inicie a API:

```bash
cd /home/japones/Projetos/Catapult/backend
./mvnw spring-boot:run
```

Confirme que ela responde localmente:

```bash
curl http://localhost:8080/api/products
```

## Acesso do celular ao backend

Como o computador e o celular podem estar em redes diferentes, exponha a porta do backend com um túnel:

```bash
cd /home/japones/Projetos/Catapult
npx localtunnel --port 8080
```

Copie a URL exibida, por exemplo `https://exemplo.loca.lt`, para `mobile/.env.local`:

```env
EXPO_PUBLIC_API_ORIGIN=https://exemplo.loca.lt
```

O túnel precisa permanecer aberto enquanto o app estiver em uso. Se uma nova URL for gerada, atualize o `.env.local`.

## Expo no celular

O servidor Metro também precisa ser acessível fora da rede local. Em outro terminal:

```bash
cd /home/japones/Projetos/Catapult/mobile
npx expo start --tunnel
```

Escaneie o QR code exibido pelo Expo Go. Não use o QR code de uma execução comum (`npx expo start`), pois ele tenta acessar o computador pela rede local.

Após alterar `.env.local`, reinicie o Expo com cache limpo:

```bash
npx expo start --tunnel -c
```

## Fluxo validado: Android por USB, sem conta Expo

Este é o fluxo usado para testar o projeto. Ele funciona mesmo quando o computador está no cabo da empresa e o celular está em outra rede. Conecte um celular Android por USB, ative a **Depuração USB** e confirme que ele aparece no ADB:

```bash
adb devices
```

Redirecione o backend e o Metro para o celular:

```bash
adb reverse tcp:8080 tcp:8080
adb reverse tcp:8081 tcp:8081
```

Use uma origem local no `mobile/.env.local`:

```env
EXPO_PUBLIC_API_ORIGIN=http://127.0.0.1:8080
```

O app usa o transporte HTTP nativo do React Native para enviar arquivos selecionados pelo Android. Reinicie o Expo com cache limpo após atualizar o código ou o endereço da API.

Inicie o backend normalmente e, em outro terminal, inicie o Expo:

```bash
cd /home/japones/Projetos/Catapult/mobile
npm run start:usb
```

Abra o projeto no Expo Go. O celular deve permanecer conectado por USB. Repita os comandos `adb reverse` se o aparelho for desconectado ou reiniciado.

Ao criar produtos com imagem ou PDF, o app envia a URI escolhida pelo Android usando `whatwg-fetch`, que mantém o suporte ao `FormData` nativo. O formulário aplica máscara `R$ 0,00` nos campos de preço e custo e envia números para a API.

## Ordem resumida

1. Backend: `./mvnw spring-boot:run`.
2. Confirmar a API: `curl http://localhost:8080/api/products`.
3. Conectar o Android e executar os dois comandos `adb reverse`.
4. Mobile: `npm run start:usb`.
5. Abrir o projeto no Expo Go.

Se usar túnel em vez de USB, mantenha o `localtunnel` e o `EXPO_PUBLIC_API_ORIGIN` atualizados e execute `npx expo start --tunnel -c` com login Expo.
