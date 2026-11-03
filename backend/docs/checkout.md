# Finalização da compra

`POST /api/checkout` é público e recebe somente a identificação da tentativa e os itens:

```json
{
  "request_id": "e34bbc68-b9df-42cd-87ba-e70bf4f92ca9",
  "items": [
    { "product_id": "4128c7e9-3c64-4c77-875b-566ce415c595", "quantity": 2 }
  ]
}
```

A sacola precisa ter entre 1 e 100 entradas, com UUIDs válidos e quantidades inteiras positivas. IDs de produto repetidos têm suas quantidades somadas antes da validação. O servidor calcula os valores usando os preços atuais, sem confiar em totais do navegador.

Todos os produtos são bloqueados e validados na mesma transação. Um item inexistente, inativo ou sem quantidade suficiente resulta em `409`, sem descontar nenhum item. Sucesso retorna `200` com `{ "id": "UUID", "total": 50.00, "item_count": 2 }` e desconta todas as quantidades.

O `request_id` deve ser um UUID novo para cada compra. Reenvie o mesmo ID e os mesmos itens após falha de rede ou resposta incerta: o comprovante persistido retorna o resultado original sem uma segunda baixa. Reutilizar o ID com outros itens retorna `422`. Payload inválido retorna `400`. Após um conflito de estoque confirmado, revise a sacola e inicie uma nova tentativa.

A migração `V4` cria a tabela de comprovantes de checkout. Não há integração de pagamento nem cobrança online.

## Testes

`mvn -B -Dtest=CheckoutIntegrationTests test` usa exclusivamente o banco `catapult_checkout_test` na porta `13316`, com usuário `root` e senha de teste `catapult-checkout-test`. A variável `CHECKOUT_TEST_DB_URL` permite apontar para outra instância de testes. Use sempre um banco descartável: os fixtures são removidos antes e depois de cada teste.

Os testes cobrem baixa da sacola inteira, rollback, validação, itens repetidos, concorrência, repetição da mesma requisição e o filtro `active` usado na paginação da vitrine.
