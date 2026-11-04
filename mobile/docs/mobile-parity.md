# Paridade com o frontend web

A implementação mobile acompanha `../frontend` e os contratos atuais do backend. Em conflitos com o guia original `api.md`, esta atualização e `../../backend/docs/api.md` prevalecem.

## Interface

- Tokens claros e escuros acompanham `frontend/app/globals.css`: violeta, superfícies neutras e hero lavanda.
- Catálogo com hero, busca com debounce, categorias horizontais, filtros em sheet e ordenação. A lista virtualizada usa uma coluna em telas pequenas e duas em telas maiores; o carregamento incremental substitui a paginação desktop.
- Filtros só são aplicados ao confirmar; fechar o sheet descarta as alterações. O servidor recebe `active=true`, além da proteção visual contra produtos inativos.
- Detalhes e formulários usam navegação em pilha, com tabs inferiores para painel, produtos e categorias.
- Categorias têm busca local, ordenação por valor/quantidade/nome, indicadores, participação no estoque, preços médio/mínimo/máximo, detalhes, produtos vinculados e CRUD.
- Produtos têm contagens por status, filtros por categoria/arquivo, paginação e controle de estoque com debounce. Os últimos toques são enviados mesmo ao sair da tela.

## Sacola e checkout

`POST /api/checkout` é público e recebe:

```json
{
  "request_id": "UUID",
  "items": [{ "product_id": "UUID", "quantity": 1 }]
}
```

Retorno `200`: `{ "id": "UUID", "total": 25.00, "item_count": 1 }`.

- Até 100 produtos diferentes; quantidades inteiras e positivas.
- A API confirma todos os itens em uma transação e desconta o estoque. Não há pagamento online.
- `409`: produto removido, inativo ou estoque insuficiente. Reconsultar e permitir ajustar/remover itens.
- `400`/`422`: seleção inválida; liberar a seleção para correção.
- Queda de rede, timeout ou erro de servidor: manter pedido pendente e repetir **o mesmo** `request_id` e os mesmos itens. Nunca criar outro ID automaticamente quando o resultado é incerto.
- A sacola e a requisição pendente são persistidas juntas no AsyncStorage. O request é gravado antes do envio; uma falha de armazenamento impede o envio. Ao reiniciar, uma compra pendente bloqueia alterações até consultar o resultado.
- `expo-crypto` gera o UUID, com versão resolvida pelo instalador oficial do SDK 58.
- Estoque e preços são reconsultados ao abrir a sacola e a cada 15 segundos. O total final é sempre o devolvido pelo servidor.
- Checkout confirmado invalida catálogo, produtos, detalhes, categorias e indicadores.

## Verificação

```bash
npx tsc --noEmit
npx expo lint
npx expo-doctor
npx expo export --platform android --platform ios --output-dir /tmp/catapult-mobile-export
```

Teste funcional da prévia Expo Web, sem tocar no banco de dados do usuário (requer Electron instalado):

```bash
EXPO_NO_DOTENV=1 EXPO_PUBLIC_API_ORIGIN=http://127.0.0.1:8090 npx expo start --web --localhost --port 8088 --clear
# Em outro terminal:
env -u ELECTRON_RUN_AS_NODE electron --no-sandbox scripts/ui-qa.cjs
```

O script usa uma API isolada de teste, redireciona as chamadas locais de `127.0.0.1:8080` para essa API e salva capturas em `/tmp/catapult-expo-*.png`. Valida responsividade em 320/390/768 px, filtros, temas, sacola, reinício com compra pendente, repetição idempotente, conflito de estoque, autenticação, categorias e navegação administrativa. O uso de fixtures fica restrito ao script; o aplicativo consome a API configurada, sem fallback de dados fictícios.

Android/iOS exigem verificação adicional em aparelho ou emulador para teclado, gestos, seletor de arquivos e cookies nativos. O Expo Go do SDK 58 inclui `expo-crypto`.

### Resultado da validação

- 24 verificações funcionais/visuais aprovadas na prévia Expo Web, sem erros inesperados no console.
- TypeScript e Expo lint aprovados.
- Expo Doctor: 20/20 verificações aprovadas após atualizar os patches compatíveis do SDK 58.
- Bundles Hermes de Android e iOS gerados em `/tmp/catapult-mobile-export-final`.
- Nenhum aparelho ou emulador disponível nesta sessão; interação nativa e conectividade real ainda precisam ser verificadas em dispositivo.
