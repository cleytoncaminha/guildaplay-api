# GuildaPlay API — Data Model

> Modelo de dados da Fase 1 do MVP comercial da GuildaPlay.
>
> Este documento deve ser lido junto com `docs/ARCHITECTURE.md` antes de criar ou alterar migrations.
>
> **Escopo:** gestão de mestres, mesas, jogadores, convites, cobrança mensal, Pix, cartão recorrente, split da plataforma, webhooks e auditoria.

---

## 1. Objetivos do modelo

O banco precisa representar corretamente o seguinte fluxo:

```text
Mestre
  |
  v
cria mesa
  |
  v
cria plano mensal
  |
  v
gera convite
  |
  v
jogador aceita
  |
  v
vira membro da mesa
  |
  v
cria assinatura
  |
  +------------------+
  |                  |
  v                  v
Cartão recorrente   Pix mensal
  |                  |
  +--------+---------+
           |
           v
        pagamento
           |
           v
          split
      8% plataforma
      restante mestre
```

O modelo deve priorizar:

- histórico financeiro confiável;
- idempotência;
- rastreabilidade;
- separação entre domínio GuildaPlay e provedor Asaas;
- valores monetários sem `float`;
- possibilidade de evolução sem reescrever o núcleo financeiro.

---

## 2. Convenções obrigatórias

### 2.1 IDs internos

Usar UUID para IDs internos.

Preferência:

```text
uuid
```

Pode ser UUID v7 caso a implementação escolhida esteja estável e bem suportada; caso contrário, UUID v4 é aceitável.

IDs externos do Asaas **nunca substituem IDs internos**.

Exemplo correto:

```text
payment.id = UUID interno
payment.provider_payment_id = ID do Asaas
```

---

### 2.2 Dinheiro

Todos os valores monetários internos devem ser armazenados em **centavos inteiros**.

```text
R$ 150,00 = 15000
R$ 1,99   = 199
```

Usar:

```text
integer / bigint
```

Não usar:

```text
float
real
double precision
```

Nomes de colunas monetárias devem terminar preferencialmente em:

```text
_cents
```

Exemplo:

```text
amount_cents
provider_fee_cents
platform_fee_cents
gm_net_amount_cents
```

---

### 2.3 Percentuais

Percentuais financeiros devem ser armazenados em **basis points (bps)**.

```text
1%   = 100 bps
8%   = 800 bps
10%  = 1000 bps
```

Taxa padrão inicial da GuildaPlay:

```text
platform_fee_bps = 800
```

Isso evita dependência de números decimais para taxas.

---

### 2.4 Datas

Usar `timestamptz` para timestamps absolutos.

Campos comuns:

```text
created_at
updated_at
paid_at
processed_at
expires_at
```

Persistir timestamps em UTC.

Para horário recorrente da mesa, armazenar explicitamente o timezone IANA.

Exemplos:

```text
America/Sao_Paulo
America/Argentina/Buenos_Aires
```

---

### 2.5 Nomenclatura

Banco:

```text
snake_case
```

TypeScript:

```text
camelCase
```

Tabelas devem usar nomes no plural.

Para evitar ambiguidade com o conceito SQL de `TABLE`, a tabela de mesas de RPG deve se chamar:

```text
game_tables
```

O módulo NestJS continua podendo se chamar:

```text
tables
```

---

### 2.6 Exclusão

Registros financeiros não devem ser apagados fisicamente em fluxos normais.

Nunca fazer hard delete de:

- `subscriptions`;
- `payments`;
- `payment_splits`;
- `refunds`;
- `webhook_events`;
- `audit_logs`.

Mesas devem ser arquivadas usando status.

Usuários poderão futuramente usar `deleted_at` e processo de anonimização quando necessário.

---

## 3. Visão geral das entidades

```text
users
  |
  +---- user_roles
  |
  +---- gm_profiles
  |       |
  |       +---- gm_payment_accounts
  |       |
  |       +---- game_tables
  |                  |
  |                  +---- billing_plans
  |                  |
  |                  +---- invitations
  |                  |
  |                  +---- table_members
  |                              |
  |                              +---- subscriptions
  |                                        |
  |                                        +---- payments
  |                                                 |
  |                                                 +---- payment_splits
  |                                                 |
  |                                                 +---- refunds
  |
  +---- payment_customers
  |
  +---- media_assets

webhook_events

audit_logs
```

---

# 4. `users`

Representa a identidade principal de uma pessoa na GuildaPlay.

Um usuário pode ser jogador, mestre ou ambos.

### Campos

| Campo               | Tipo                 | Regra                |
| ------------------- | -------------------- | -------------------- |
| `id`                | uuid                 | PK                   |
| `name`              | varchar(120)         | obrigatório          |
| `email`             | varchar(255)         | obrigatório          |
| `email_normalized`  | varchar(255)         | único                |
| `email_verified_at` | timestamptz nullable |                      |
| `avatar_asset_id`   | uuid nullable        | FK `media_assets.id` |
| `timezone`          | varchar(100)         | IANA timezone        |
| `country_code`      | char(2) nullable     | ISO 3166-1 alpha-2   |
| `status`            | enum                 | default `ACTIVE`     |
| `created_at`        | timestamptz          |                      |
| `updated_at`        | timestamptz          |                      |
| `deleted_at`        | timestamptz nullable | futuro/soft delete   |

### `user_status`

```text
ACTIVE
SUSPENDED
DELETED
```

### Regras

- `email_normalized` deve ser lowercase e trimado antes de persistir.
- autenticação e tabelas de sessão/conta serão definidas em `AUTH_SECURITY.md`;
- não colocar senha em `users` caso a solução de autenticação use tabela própria.

---

# 5. `user_roles`

Permite múltiplos papéis para o mesmo usuário.

### Campos

| Campo        | Tipo        | Regra         |
| ------------ | ----------- | ------------- |
| `user_id`    | uuid        | FK `users.id` |
| `role`       | enum        |               |
| `created_at` | timestamptz |               |

### Chave

```text
PRIMARY KEY (user_id, role)
```

### `user_role`

```text
USER
GM
ADMIN
```

Todo usuário autenticado pode possuir `USER`.

`GM` deve ser usado para autorização de funcionalidades de mestre.

---

# 6. `gm_profiles`

Contém dados específicos de quem atua como mestre.

Não representa uma identidade separada do usuário.

### Campos

| Campo          | Tipo          | Regra                 |
| -------------- | ------------- | --------------------- |
| `id`           | uuid          | PK                    |
| `user_id`      | uuid          | FK `users.id`, UNIQUE |
| `display_name` | varchar(120)  | obrigatório           |
| `bio`          | text nullable |                       |
| `status`       | enum          | default `PENDING`     |
| `created_at`   | timestamptz   |                       |
| `updated_at`   | timestamptz   |                       |

### `gm_profile_status`

```text
PENDING
ACTIVE
SUSPENDED
```

### Regras

- dados financeiros do Asaas não devem ficar misturados diretamente neste perfil;
- usar `gm_payment_accounts` para integração financeira.

---

# 7. `gm_payment_accounts`

Relaciona um mestre a uma conta/carteira de um provedor financeiro.

Essa tabela evita acoplar o domínio diretamente ao Asaas.

### Campos

| Campo                 | Tipo                  | Regra                                   |
| --------------------- | --------------------- | --------------------------------------- |
| `id`                  | uuid                  | PK                                      |
| `gm_profile_id`       | uuid                  | FK `gm_profiles.id`                     |
| `provider`            | enum                  | inicialmente `ASAAS`                    |
| `provider_account_id` | varchar(255) nullable | ID externo quando aplicável             |
| `provider_wallet_id`  | varchar(255) nullable | wallet usada no split                   |
| `status`              | enum                  |                                         |
| `metadata`            | jsonb nullable        | somente dados não sensíveis necessários |
| `created_at`          | timestamptz           |                                         |
| `updated_at`          | timestamptz           |                                         |

### Unique

```text
UNIQUE (gm_profile_id, provider)
```

### `payment_account_status`

```text
PENDING
ACTIVE
BLOCKED
DISCONNECTED
```

### Regras

- nunca armazenar API key do mestre nessa tabela;
- nunca retornar `provider_wallet_id` desnecessariamente ao frontend;
- confirmar os requisitos operacionais do modelo de contas/subcontas do Asaas antes da produção.

---

# 8. `game_tables`

Representa uma mesa/campanha de RPG.

### Campos

| Campo                | Tipo              | Regra                 |
| -------------------- | ----------------- | --------------------- |
| `id`                 | uuid              | PK                    |
| `gm_profile_id`      | uuid              | FK `gm_profiles.id`   |
| `name`               | varchar(160)      | obrigatório           |
| `description`        | text nullable     |                       |
| `system_name`        | varchar(120)      | obrigatório no MVP    |
| `cover_asset_id`     | uuid nullable     | FK `media_assets.id`  |
| `max_players`        | smallint          | > 0                   |
| `schedule_frequency` | enum              |                       |
| `weekday`            | smallint nullable | 0–6                   |
| `start_time`         | time nullable     | horário local da mesa |
| `timezone`           | varchar(100)      | IANA timezone         |
| `status`             | enum              | default `DRAFT`       |
| `created_at`         | timestamptz       |                       |
| `updated_at`         | timestamptz       |                       |

### `game_table_status`

```text
DRAFT
ACTIVE
PAUSED
ARCHIVED
```

### `schedule_frequency`

```text
WEEKLY
BIWEEKLY
MONTHLY
CUSTOM
```

`CUSTOM` não precisa ter automação avançada no MVP; existe apenas para não obrigar o domínio a representar toda mesa como semanal.

### Regras

- preço não deve ficar diretamente em `game_tables`;
- cobrança pertence a `billing_plans`;
- uma mesa arquivada não recebe novos membros;
- somente o mestre proprietário ou admin pode alterar a mesa.

---

# 9. `billing_plans`

Representa os termos financeiros de uma mesa.

Um plano deve ser tratado como **versionável**.

Se preço ou taxa mudarem, preferir criar um novo plano em vez de alterar silenciosamente o histórico.

### Campos

| Campo              | Tipo                 | Regra               |
| ------------------ | -------------------- | ------------------- |
| `id`               | uuid                 | PK                  |
| `game_table_id`    | uuid                 | FK `game_tables.id` |
| `amount_cents`     | integer              | > 0                 |
| `currency`         | char(3)              | default `BRL`       |
| `interval`         | enum                 | MVP: `MONTHLY`      |
| `platform_fee_bps` | integer              | default `800`       |
| `status`           | enum                 |                     |
| `effective_from`   | timestamptz          |                     |
| `created_at`       | timestamptz          |                     |
| `archived_at`      | timestamptz nullable |                     |

### `billing_interval`

```text
MONTHLY
```

### `billing_plan_status`

```text
ACTIVE
ARCHIVED
```

### Constraints

```text
amount_cents > 0
platform_fee_bps >= 0
platform_fee_bps <= 10000
```

### Regras

Para uma mensalidade de R$150:

```text
amount_cents = 15000
platform_fee_bps = 800
```

Uma mesa deve possuir no máximo um plano `ACTIVE` por vez no MVP.

---

# 10. `invitations`

Representa links de convite para uma mesa.

Não criar `table_member` antes de o convite ser aceito.

### Campos

| Campo                | Tipo                 | Regra                        |
| -------------------- | -------------------- | ---------------------------- |
| `id`                 | uuid                 | PK                           |
| `game_table_id`      | uuid                 | FK `game_tables.id`          |
| `created_by_user_id` | uuid                 | FK `users.id`                |
| `token_hash`         | varchar(255)         | UNIQUE                       |
| `status`             | enum                 |                              |
| `max_uses`           | integer nullable     | null = sem limite específico |
| `uses_count`         | integer              | default 0                    |
| `expires_at`         | timestamptz nullable |                              |
| `created_at`         | timestamptz          |                              |
| `revoked_at`         | timestamptz nullable |                              |

### `invitation_status`

```text
ACTIVE
REVOKED
EXPIRED
```

### Segurança

O token público deve ser aleatório e de alta entropia.

Preferência:

```text
URL contém token bruto
DB guarda apenas hash do token
```

Exemplo:

```text
https://app.guildaplay.com/invite/<raw-token>
```

### Regras de aceite

Antes de aceitar:

1. validar token;
2. validar status;
3. validar expiração;
4. validar `max_uses`;
5. verificar se a mesa ainda aceita membros;
6. impedir duplicidade de membro;
7. criar `table_member`;
8. incrementar `uses_count` de forma transacional.

---

# 11. `table_members`

Representa a relação real entre um jogador e uma mesa.

O convite ainda não aceito **não é membro**.

### Campos

| Campo                      | Tipo                 | Regra               |
| -------------------------- | -------------------- | ------------------- |
| `id`                       | uuid                 | PK                  |
| `game_table_id`            | uuid                 | FK `game_tables.id` |
| `user_id`                  | uuid                 | FK `users.id`       |
| `joined_via_invitation_id` | uuid nullable        | FK `invitations.id` |
| `status`                   | enum                 |                     |
| `joined_at`                | timestamptz          |                     |
| `left_at`                  | timestamptz nullable |                     |
| `created_at`               | timestamptz          |                     |
| `updated_at`               | timestamptz          |                     |

### Unique

```text
UNIQUE (game_table_id, user_id)
```

### `table_member_status`

```text
ACTIVE
PAST_DUE
SUSPENDED
LEFT
REMOVED
```

### Significado

`ACTIVE`
: jogador ativo na mesa.

`PAST_DUE`
: existe cobrança vencida; não significa remoção automática.

`SUSPENDED`
: acesso suspenso por regra do mestre/plataforma.

`LEFT`
: jogador saiu voluntariamente.

`REMOVED`
: jogador removido pelo mestre/admin.

### Regra importante

Status financeiro e status de assinatura não devem ser inferidos somente por `table_members.status`.

A fonte financeira continua sendo:

```text
subscriptions
payments
```

`table_members.status` é um estado operacional derivado/gerenciado pelo domínio.

---

# 12. `payment_customers`

Relaciona um usuário GuildaPlay ao cadastro de cliente no provedor de pagamento.

### Campos

| Campo                  | Tipo         | Regra                |
| ---------------------- | ------------ | -------------------- |
| `id`                   | uuid         | PK                   |
| `user_id`              | uuid         | FK `users.id`        |
| `provider`             | enum         | inicialmente `ASAAS` |
| `provider_customer_id` | varchar(255) |                      |
| `created_at`           | timestamptz  |                      |
| `updated_at`           | timestamptz  |                      |

### Unique

```text
UNIQUE (user_id, provider)
UNIQUE (provider, provider_customer_id)
```

### Regras

- criar de forma lazy quando o usuário precisar pagar;
- não armazenar dados completos de cartão;
- não armazenar CVV;
- dados pessoais enviados ao provedor devem seguir o mínimo necessário para a operação.

---

# 13. `subscriptions`

Representa o compromisso recorrente de cobrança de um membro da mesa.

Existe independentemente de o método ser cartão recorrente ou Pix mensal.

### Campos

| Campo                      | Tipo                  | Regra                                   |
| -------------------------- | --------------------- | --------------------------------------- |
| `id`                       | uuid                  | PK                                      |
| `table_member_id`          | uuid                  | FK `table_members.id`                   |
| `billing_plan_id`          | uuid                  | FK `billing_plans.id`                   |
| `payment_customer_id`      | uuid                  | FK `payment_customers.id`               |
| `provider`                 | enum                  | inicialmente `ASAAS`                    |
| `provider_subscription_id` | varchar(255) nullable | usado quando existir assinatura externa |
| `payment_method`           | enum                  |                                         |
| `status`                   | enum                  |                                         |
| `current_period_start`     | date nullable         |                                         |
| `current_period_end`       | date nullable         |                                         |
| `next_due_date`            | date nullable         |                                         |
| `cancel_at_period_end`     | boolean               | default false                           |
| `canceled_at`              | timestamptz nullable  |                                         |
| `created_at`               | timestamptz           |                                         |
| `updated_at`               | timestamptz           |                                         |

### `subscription_payment_method`

```text
CARD_RECURRING
PIX_MANUAL
```

Pix Automático fica fora da Fase 1.

### `subscription_status`

```text
PENDING
ACTIVE
PAST_DUE
PAUSED
CANCELED
ENDED
```

### Regras

- `provider_subscription_id` pode ser `NULL` para Pix manual;
- não criar duas assinaturas ativas simultâneas para o mesmo `table_member`;
- preferir partial unique index para estados ativos, se a implementação ficar simples e clara;
- `billing_plan_id` preserva os termos contratados naquele momento;
- alteração de preço não deve alterar retroativamente pagamentos antigos.

---

# 14. `payments`

Representa cada cobrança individual.

Essa é uma das tabelas mais importantes do sistema.

### Campos

| Campo                 | Tipo                  | Regra                             |
| --------------------- | --------------------- | --------------------------------- |
| `id`                  | uuid                  | PK                                |
| `subscription_id`     | uuid                  | FK `subscriptions.id`             |
| `provider`            | enum                  | inicialmente `ASAAS`              |
| `provider_payment_id` | varchar(255) nullable | ID externo                        |
| `payment_method`      | enum                  |                                   |
| `status`              | enum                  |                                   |
| `currency`            | char(3)               | default `BRL`                     |
| `gross_amount_cents`  | integer               | valor cobrado                     |
| `provider_fee_cents`  | integer nullable      | preencher quando conhecido        |
| `platform_fee_bps`    | integer               | snapshot da taxa                  |
| `platform_fee_cents`  | integer nullable      | valor efetivo da GuildaPlay       |
| `gm_net_amount_cents` | integer nullable      | valor efetivo destinado ao mestre |
| `due_date`            | date                  |                                   |
| `period_start`        | date                  | início do ciclo                   |
| `period_end`          | date                  | fim do ciclo                      |
| `paid_at`             | timestamptz nullable  |                                   |
| `created_at`          | timestamptz           |                                   |
| `updated_at`          | timestamptz           |                                   |

### `payment_method`

```text
CARD
PIX
```

### `payment_status`

```text
PENDING
PAID
OVERDUE
FAILED
CANCELED
REFUNDED
PARTIALLY_REFUNDED
```

### Unique

Quando houver ID externo:

```text
UNIQUE (provider, provider_payment_id)
```

Para evitar duplicação do mesmo ciclo:

```text
UNIQUE (subscription_id, period_start)
```

Se houver necessidade futura de múltiplas tentativas/cobranças para o mesmo ciclo, esse desenho deverá ser revisado explicitamente antes da mudança.

### Regras financeiras

`gross_amount_cents`
: valor originalmente cobrado do jogador.

`provider_fee_cents`
: taxa efetivamente cobrada pelo provedor.

`platform_fee_bps`
: taxa contratada da GuildaPlay naquele pagamento; inicialmente `800`.

`platform_fee_cents`
: valor efetivamente atribuído à GuildaPlay.

`gm_net_amount_cents`
: valor efetivamente atribuído ao mestre.

Não recalcular valores históricos ao mudar a taxa padrão no futuro.

---

# 15. `payment_splits`

Mantém o histórico do split associado a um pagamento.

Mesmo que o Asaas execute o split, a GuildaPlay deve conseguir auditar o que esperava distribuir.

### Campos

| Campo                | Tipo                  | Regra                    |
| -------------------- | --------------------- | ------------------------ |
| `id`                 | uuid                  | PK                       |
| `payment_id`         | uuid                  | FK `payments.id`         |
| `recipient_type`     | enum                  |                          |
| `gm_profile_id`      | uuid nullable         | FK `gm_profiles.id`      |
| `provider_wallet_id` | varchar(255) nullable | snapshot externo         |
| `percentage_bps`     | integer nullable      |                          |
| `amount_cents`       | integer nullable      | efetivo quando conhecido |
| `status`             | enum                  |                          |
| `created_at`         | timestamptz           |                          |
| `updated_at`         | timestamptz           |                          |

### `split_recipient_type`

```text
PLATFORM
GM
```

### `split_status`

```text
PENDING
CONFIRMED
FAILED
CANCELED
```

### Regras

No MVP haverá normalmente:

```text
1 pagamento
  +---- participação da plataforma
  +---- participação do mestre
```

Não assumir que `8%` equivale a exatamente 8% do valor bruto recebido pelo jogador.

O valor efetivo deve refletir a regra real aplicada pelo provedor e os valores retornados pela integração.

---

# 16. `refunds`

Registra reembolsos sem destruir o histórico do pagamento original.

### Campos

| Campo                  | Tipo                  | Regra            |
| ---------------------- | --------------------- | ---------------- |
| `id`                   | uuid                  | PK               |
| `payment_id`           | uuid                  | FK `payments.id` |
| `provider_refund_id`   | varchar(255) nullable |                  |
| `amount_cents`         | integer               | > 0              |
| `status`               | enum                  |                  |
| `reason`               | varchar(500) nullable |                  |
| `requested_by_user_id` | uuid nullable         | FK `users.id`    |
| `created_at`           | timestamptz           |                  |
| `confirmed_at`         | timestamptz nullable  |                  |

### `refund_status`

```text
PENDING
CONFIRMED
FAILED
CANCELED
```

### Regras

- um pagamento pode possuir mais de um reembolso parcial no futuro;
- soma dos reembolsos confirmados nunca pode exceder `gross_amount_cents`;
- atualização de `payments.status` deve ocorrer de forma transacional quando possível.

---

# 17. `webhook_events`

Armazena todo evento financeiro externo relevante recebido.

Essa tabela é essencial para idempotência e suporte.

### Campos

| Campo               | Tipo                 | Regra                                      |
| ------------------- | -------------------- | ------------------------------------------ |
| `id`                | uuid                 | PK                                         |
| `provider`          | enum                 |                                            |
| `provider_event_id` | varchar(255)         |                                            |
| `event_type`        | varchar(160)         |                                            |
| `status`            | enum                 |                                            |
| `payload`           | jsonb                | payload bruto sanitizado quando necessário |
| `attempts`          | integer              | default 0                                  |
| `last_error`        | text nullable        | sem secrets                                |
| `received_at`       | timestamptz          |                                            |
| `processed_at`      | timestamptz nullable |                                            |
| `created_at`        | timestamptz          |                                            |

### Unique

```text
UNIQUE (provider, provider_event_id)
```

### `webhook_event_status`

```text
RECEIVED
PROCESSING
PROCESSED
FAILED
IGNORED
```

### Fluxo esperado

```text
evento chega
   |
   v
já existe provider + provider_event_id?
   |
   +-- sim --> retornar sucesso sem reprocessar
   |
   +-- não --> persistir
                  |
                  v
               processar
                  |
                  v
             atualizar status
```

### Regras

- não confiar em ordem perfeita de entrega;
- processamento deve tolerar retries;
- payload nunca deve ser enviado inteiro ao frontend comum;
- `last_error` não deve conter segredo ou dado de cartão.

---

# 18. `media_assets`

Registra metadados dos arquivos armazenados no Cloudflare R2.

O arquivo em si não fica no PostgreSQL.

### Campos

| Campo           | Tipo                 | Regra         |
| --------------- | -------------------- | ------------- |
| `id`            | uuid                 | PK            |
| `owner_user_id` | uuid                 | FK `users.id` |
| `purpose`       | enum                 |               |
| `object_key`    | varchar(500)         | UNIQUE        |
| `mime_type`     | varchar(120)         |               |
| `size_bytes`    | bigint               |               |
| `status`        | enum                 |               |
| `created_at`    | timestamptz          |               |
| `deleted_at`    | timestamptz nullable |               |

### `media_purpose`

```text
USER_AVATAR
TABLE_COVER
```

### `media_status`

```text
PENDING_UPLOAD
ACTIVE
DELETED
```

### Regras

- frontend faz upload direto via presigned URL;
- API controla autorização e metadados;
- não confiar em MIME informado somente pelo browser;
- limites iniciais sugeridos:

```text
avatar: 2 MB
capa:   5 MB
```

---

# 19. `audit_logs`

Registra ações relevantes para suporte, segurança e histórico financeiro.

### Campos

| Campo           | Tipo                  | Regra              |
| --------------- | --------------------- | ------------------ |
| `id`            | uuid                  | PK                 |
| `actor_user_id` | uuid nullable         | FK `users.id`      |
| `action`        | varchar(120)          |                    |
| `entity_type`   | varchar(120)          |                    |
| `entity_id`     | uuid nullable         |                    |
| `request_id`    | varchar(120) nullable | correlação de logs |
| `metadata`      | jsonb nullable        | sem secrets        |
| `created_at`    | timestamptz           |                    |

### Ações iniciais sugeridas

```text
GM_PROFILE_CREATED
GAME_TABLE_CREATED
GAME_TABLE_UPDATED
GAME_TABLE_PAUSED
INVITATION_CREATED
INVITATION_ACCEPTED
PLAYER_JOINED_TABLE
PLAYER_LEFT_TABLE
PLAYER_REMOVED
SUBSCRIPTION_CREATED
SUBSCRIPTION_ACTIVATED
SUBSCRIPTION_CANCELED
PAYMENT_CREATED
PAYMENT_CONFIRMED
PAYMENT_OVERDUE
PAYMENT_FAILED
REFUND_REQUESTED
REFUND_CONFIRMED
WEBHOOK_PROCESSING_FAILED
```

### Regras

- logs de auditoria não são analytics;
- não armazenar senha, token, API key, CVV ou dados completos de cartão;
- eventos críticos financeiros devem ser auditáveis.

---

# 20. Enum comum: `payment_provider`

Inicialmente:

```text
ASAAS
```

Mesmo com um único provedor, manter o conceito de provider nas entidades de integração financeira.

Objetivo:

```text
Billing domain != Asaas
```

---

# 21. Relações principais

## Usuário e mestre

```text
users 1 ---- 0..1 gm_profiles
```

Um usuário não precisa ser mestre.

Um mestre sempre corresponde a um usuário.

---

## Mestre e mesas

```text
gm_profiles 1 ---- N game_tables
```

---

## Mesa e jogadores

```text
game_tables 1 ---- N table_members
users       1 ---- N table_members
```

Um usuário não pode aparecer duas vezes na mesma mesa.

---

## Mesa e plano financeiro

```text
game_tables 1 ---- N billing_plans
```

Histórico de planos pode existir, mas apenas um deve estar ativo no MVP.

---

## Membro e assinatura

```text
table_members 1 ---- N subscriptions
```

Pode haver histórico de assinaturas, mas apenas uma assinatura operacionalmente ativa por membro no MVP.

---

## Assinatura e pagamentos

```text
subscriptions 1 ---- N payments
```

Uma assinatura gera cobranças mensais individuais.

---

## Pagamento e split

```text
payments 1 ---- N payment_splits
```

---

## Pagamento e reembolso

```text
payments 1 ---- N refunds
```

---

# 22. Índices mínimos

Além das PKs e uniques, criar índices para consultas frequentes.

Sugestão inicial:

```text
users(email_normalized)

gm_profiles(user_id)

game_tables(gm_profile_id, status)

table_members(game_table_id, status)
table_members(user_id, status)

billing_plans(game_table_id, status)

invitations(game_table_id, status)
invitations(token_hash)

subscriptions(table_member_id, status)
subscriptions(provider, provider_subscription_id)
subscriptions(next_due_date, status)

payments(subscription_id, status)
payments(provider, provider_payment_id)
payments(due_date, status)
payments(status, paid_at)

webhook_events(provider, provider_event_id)
webhook_events(status, received_at)

audit_logs(entity_type, entity_id, created_at)
audit_logs(actor_user_id, created_at)
```

Não criar índices especulativos em excesso.

Medir e adicionar conforme consultas reais surgirem.

---

# 23. Constraints importantes

O banco deve proteger invariantes simples sempre que possível.

Exemplos:

```text
max_players > 0
amount_cents > 0
platform_fee_bps BETWEEN 0 AND 10000
uses_count >= 0
max_uses IS NULL OR max_uses > 0
refund.amount_cents > 0
```

Também garantir:

```text
UNIQUE (game_table_id, user_id)
UNIQUE (provider, provider_event_id)
UNIQUE (provider, provider_payment_id) quando não-null
UNIQUE (user_id, provider) em payment_customers
```

---

# 24. Operações que exigem transação

Usar transação de banco em operações compostas críticas.

### Aceitar convite

```text
validar convite
+ validar vaga
+ criar table_member
+ incrementar uses_count
+ audit log
```

### Confirmar pagamento

```text
atualizar payment
+ atualizar subscription se necessário
+ atualizar table_member se necessário
+ registrar split conhecido
+ audit log
```

### Reembolso

```text
registrar/confirmar refund
+ atualizar payment
+ atualizar valores/status relacionados
+ audit log
```

Evitar estados intermediários inconsistentes.

---

# 25. Capacidade da mesa

No MVP, capacidade significa quantidade máxima de membros operacionais da mesa.

Para contagem de ocupação considerar inicialmente:

```text
ACTIVE
PAST_DUE
SUSPENDED
```

Não contar:

```text
LEFT
REMOVED
```

A regra deve estar centralizada no domínio, não duplicada em controllers.

---

# 26. Billing e mudança de preço

Não alterar silenciosamente o plano usado por assinaturas existentes.

Exemplo:

```text
Plano A
R$150
8%

Mestre altera preço para R$180
```

Preferência:

```text
Plano A -> ARCHIVED
Plano B -> ACTIVE (R$180)
```

Assinaturas existentes continuam referenciando o plano anterior até que uma migração de preço seja executada explicitamente.

A política de comunicação/aceite de novo preço será definida futuramente.

---

# 27. Snapshot financeiro

Pagamentos devem manter snapshot de seus termos.

Mesmo que o `billing_plan` mude depois:

```text
payment.gross_amount_cents
payment.platform_fee_bps
payment.platform_fee_cents
payment.provider_fee_cents
payment.gm_net_amount_cents
```

continuam representando o pagamento histórico.

Nunca reconstruir histórico financeiro apenas olhando o plano atual.

---

# 28. Estados derivados

Evitar depender de um único campo para representar todo o estado financeiro.

Exemplo:

```text
table_member.status = ACTIVE
subscription.status = ACTIVE
payment.status = PENDING
```

Esse estado é válido: jogador está na mesa e a próxima cobrança ainda está pendente.

Outro exemplo:

```text
table_member.status = PAST_DUE
subscription.status = PAST_DUE
payment.status = OVERDUE
```

Mudanças entre esses estados devem acontecer por casos de uso explícitos.

---

# 29. Dados que NÃO devem existir no banco GuildaPlay

Não armazenar:

```text
número completo do cartão
CVV
senha em texto puro
API key do Asaas em tabelas de domínio
tokens de sessão em texto puro quando houver alternativa segura
raw secret de webhook
dados bancários desnecessários
```

Secrets pertencem ao ambiente seguro da aplicação.

---

# 30. Dados sensíveis em JSONB

Campos `metadata` e `payload` não são desculpa para armazenar qualquer coisa.

Antes de persistir payloads externos, avaliar/redigir:

- tokens;
- headers de autenticação;
- segredos;
- dados completos de cartão;
- documentos pessoais que não sejam necessários para auditoria.

---

# 31. Tabelas fora do MVP

Não criar agora:

```text
game_catalog
reviews
ratings
forum_topics
forum_posts
chat_messages
marketplace_listings
orders
shipments
disputes
digital_products
groups
matchmaking_requests
master_proposals
```

Essas entidades pertencem a fases futuras.

---

# 32. Ordem sugerida das migrations

```text
001_users
002_user_roles
003_media_assets
004_gm_profiles
005_gm_payment_accounts
006_game_tables
007_billing_plans
008_invitations
009_table_members
010_payment_customers
011_subscriptions
012_payments
013_payment_splits
014_refunds
015_webhook_events
016_audit_logs
```

A numeração real pode ser gerada automaticamente pelo TypeORM.

A ordem conceitual das dependências deve ser respeitada.

---

# 33. Dados iniciais / seeds

Não depender de seed para configuração financeira de produção.

Seeds podem existir apenas para desenvolvimento local.

Exemplo de seed local:

```text
1 admin
1 mestre
1 mesa
4 jogadores
1 billing plan de R$150
```

Nunca colocar IDs/credenciais reais do Asaas em seed versionado.

---

# 34. Exemplo de estado do MVP

```text
GM Rafael
  |
  +-- Mesa: Curse of Strahd
       |
       +-- Billing Plan
       |     R$150/mês
       |     8% plataforma
       |
       +-- João
       |    subscription: CARD_RECURRING / ACTIVE
       |    payment setembro: PAID
       |
       +-- Maria
       |    subscription: PIX_MANUAL / ACTIVE
       |    payment setembro: PAID
       |
       +-- Pedro
       |    subscription: CARD_RECURRING / PAST_DUE
       |    payment setembro: OVERDUE
       |
       +-- Lucas
            subscription: PIX_MANUAL / ACTIVE
            payment setembro: PENDING
```

Dashboard do mestre deve ser derivável desses registros, sem depender de dados calculados manualmente no frontend.

---

# 35. Regras para o Codex

Ao implementar ou alterar o banco, o Codex deve:

1. ler `ARCHITECTURE.md` e este documento;
2. usar migrations para toda mudança de schema;
3. nunca editar produção manualmente como substituto de migration;
4. usar centavos inteiros para dinheiro;
5. usar basis points para percentuais;
6. manter IDs internos independentes dos IDs do Asaas;
7. não criar `table_member` para convite ainda não aceito;
8. preservar histórico financeiro;
9. não fazer hard delete de pagamentos, assinaturas, splits, reembolsos, webhooks ou auditoria;
10. tratar alteração de preço como nova versão de plano sempre que aplicável;
11. preservar snapshot financeiro em cada pagamento;
12. criar uniques/constraints que protejam idempotência;
13. não adicionar entidades fora do MVP sem solicitação;
14. atualizar este documento quando uma decisão estrutural do modelo mudar;
15. não armazenar dados completos de cartão ou segredos no banco.

---

# 36. Princípio principal

> **O banco da GuildaPlay deve conseguir explicar, meses depois, quem deveria pagar, quanto foi cobrado, quanto o provedor reteve, quanto a plataforma recebeu e quanto foi destinado ao mestre.**

Se um modelo de dados não permite responder isso de forma confiável, ele não é suficiente para o núcleo financeiro do MVP.

---

# 37. Catálogo: Dados da Guilda

O catálogo é independente de `game_tables`. Este domínio persiste sistemas de
RPG, itens conceituais, edições concretas, editoras, criadores e suas
associações. Neste momento há somente endpoints editoriais protegidos por
`ADMIN`; a consulta pública ainda não existe.

## Enums

```text
catalog_item_type: CORE_BOOK | SETTING | ADVENTURE | SUPPLEMENT | TOOL
catalog_status: DRAFT | PUBLISHED | ARCHIVED
creator_role: AUTHOR | DESIGNER | ILLUSTRATOR | EDITOR | TRANSLATOR | OTHER
catalog_experience_level: BEGINNER | INTERMEDIATE | ADVANCED
```

## Relacionamentos

```text
publishers 1 ---- N rpg_systems
publishers 1 ---- N catalog_editions
catalog_items 1 ---- N catalog_editions
catalog_items N ---- N rpg_systems  (catalog_item_systems)
catalog_items N ---- N creators     (catalog_item_creators, with role)
catalog_items N ---- N categories   (catalog_item_categories)
catalog_items N ---- N tags         (catalog_item_tags)
catalog_items 1 ---- N aliases      (catalog_item_aliases)
catalog_items 1 ---- N sources      (catalog_item_sources)
catalog_items 1 ---- N media        (catalog_item_media -> media_assets)
catalog_items 1 ---- N relações     (catalog_item_relations, origem/destino)
```

### `publishers`

Editora de um sistema ou edição: `name`, `slug` único, `website_url` opcional,
`country_code` opcional e timestamps.

### `creators`

Pessoa ou organização creditada em um item: `name`, `slug` único,
`website_url` opcional e timestamps. A função pertence a
`catalog_item_creators`.

### `rpg_systems`

Sistema de RPG reutilizável: `name`, `slug` único, `description` opcional,
`publisher_id` opcional, `release_year` opcional, `status` e timestamps.

### `catalog_items`

Obra conceitual: `type`, `title`, `slug` único, `summary` opcional,
`description` opcional, `original_release_year` opcional, `experience_level`
opcional, `status` e
timestamps. A editora pertence à edição, nunca diretamente ao item.

### `catalog_editions`

Publicação concreta de um item: `catalog_item_id`, `name`, `slug` único,
`language_code`, `publisher_id` opcional, `release_year` opcional, `isbn_10`
opcional, `isbn_13` opcional e timestamps.

### Tabelas associativas

- `catalog_item_systems`: chave primária composta por `catalog_item_id` e
  `rpg_system_id`.
- `catalog_item_creators`: chave primária composta por `catalog_item_id`,
  `creator_id` e `role`.
- `catalog_item_categories` e `catalog_item_tags`: chaves primárias compostas
  pelos IDs do item e do metadado correspondente.

### Metadados e mídia

- `catalog_categories` e `catalog_tags` possuem `name`, `slug` único e
  timestamps; categorias também podem ter descrição.
- `catalog_item_aliases` armazena um alias e sua versão normalizada, única em
  todo o catálogo, para suportar busca posterior sem ambiguidade.
- `catalog_item_sources` armazena `label` e URL da fonte editorial.
- `catalog_item_media` vincula assets ativos do R2 a um item, com `kind`
  (`COVER` ou `IMAGE`) e posição. Há no máximo uma capa por item.

`media_purpose` agora inclui `CATALOG_COVER` e `CATALOG_IMAGE`. Apenas ADMIN
pode solicitar e completar esses uploads; a nova capa substitui o vínculo da
capa anterior sem apagar o arquivo no R2.

### Relações semânticas

`catalog_item_relations` registra uma relação direcionada de um item de origem
para um item de destino. Os tipos são `REQUIRES`, `SUPPLEMENT_OF`,
`ADVENTURE_FOR`, `SETTING_FOR`, `EDITION_OF`, `EXPANSION_OF` e
`COMPATIBLE_WITH`. A combinação origem, destino e tipo é única; o banco também
impede uma relação de um item consigo mesmo.

Todas as chaves estrangeiras do catálogo usam `ON DELETE RESTRICT`. Anos de
lançamento aceitam valores entre 1900 e 2200 quando preenchidos;
`country_code`, quando preenchido, deve conter exatamente dois caracteres.

Fora deste checkpoint: endpoints públicos de descoberta, busca e filtros,
avaliações, favoritos/listas pessoais, contribuições da comunidade e relações
semânticas entre itens, como expansão, requisito ou compatibilidade.
