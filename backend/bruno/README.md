# Testes manuais no Bruno

1. Inicie a API com o perfil `dev` e abra a pasta `bruno` como coleção no Bruno.
2. Envie `User/Login` primeiro. A coleção utiliza a sessão (`JSESSIONID`) retornada pela API para as próximas requisições protegidas.
3. Para `Products/GET Products - Filters` e `Products/PATCH Stock`, defina as variáveis `category_id` e `product_id` no ambiente ativo do Bruno. Você pode obter os IDs em `Categories/GET Categories` e `Products/GET Products`.
4. Os filtros estão desativados inicialmente. Habilite somente aqueles que deseja combinar. Valores aceitos em `stock_status`: `OUT_OF_STOCK`, `LOW_STOCK` e `IN_STOCK`.

O endereço padrão é `http://localhost:8080/api`. Para substituí-lo, configure a variável de ambiente `base_url` no Bruno.
