-- ============================================================
-- USUÁRIO PADRÃO DE LOGIN
--
-- Para alterar o usuário/senha padrão:
--   1. Troque o valor de 'username' abaixo pelo nome desejado.
--   2. Para trocar a senha, substitua o valor de 'password'
--      pelo hash BCrypt da nova senha.
--      IMPORTANTE: no banco fica sempre o HASH, nunca a senha
--      em texto puro. Para gerar o hash de uma nova senha:
--        - Pergunte ao assistente, ou
--        - Em Java: new BCryptPasswordEncoder(10).encode("minha-senha")
--
-- Senha atual deste seed: 1234
-- ============================================================
CREATE TABLE user(
    id BINARY(16) NOT NULL,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_user_username UNIQUE (username)
);

INSERT INTO user (id, username, password)
VALUES (UNHEX(REPLACE(UUID(), '-', '')), 'admin',
        '$2a$10$m2YnMvcAsogtng2AxYT2kOXGi.rXe95kzmkFRMi4OV5Ab6OSo6ESu');
