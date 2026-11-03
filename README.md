# Catapult com Podman

Na primeira vez, na raiz do projeto, execute:

```bash
podman-compose up --build --force-recreate -d
```

Abra [http://localhost:3000](http://localhost:3000). A interface web, a API e o MySQL sobem juntos. O banco é criado automaticamente, as migrações Flyway são aplicadas e os dados iniciais são gerados. No perfil de desenvolvimento, o login administrativo é `admin` / `admin`.

O primeiro início pode levar alguns minutos enquanto as imagens e dependências são baixadas.

## Uso no dia a dia

Para iniciar os containers já criados, sem reconstruir as imagens:

```bash
podman-compose up -d
```

Abra [http://localhost:3000](http://localhost:3000). Para acompanhar os logs, use `podman-compose logs -f`. Para parar, use `podman-compose down`.

Depois de alterar código ou dependências do backend ou frontend, use novamente `podman-compose up --build --force-recreate -d` para aplicar as mudanças. Os dados do banco e as imagens de produtos ficam em volumes e sobrevivem ao `down` e à recriação dos containers; `podman-compose down -v` apaga esses dados.

A API também está disponível em [http://localhost:8080/api](http://localhost:8080/api). As portas 3000 e 8080 são publicadas somente no computador local.

## Aplicativo móvel

O app Expo roda em um dispositivo ou emulador, separado da interface web. Para iniciá-lo, use as instruções em [mobile/README.md](mobile/README.md), com a API deste Compose em `localhost:8080` (ou no IP do computador para um telefone físico).
