# GuildaPlay API — API Contracts

> Contratos HTTP da Fase 1 da API NestJS da GuildaPlay.
>
> Ler junto com:
>
> - `docs/ARCHITECTURE.md`
> - `docs/DATA_MODEL.md`
> - `docs/AUTH_SECURITY.md`
> - `docs/PAYMENTS_ASAAS.md`
>
> **Status:** Fase 1 — MVP comercial  
> **Abordagem:** API-first  
> **Frontend:** fora do escopo atual de implementação
>
> A API deve estar utilizável por:
>
> - Swagger;
> - cURL;
> - Postman/Insomnia;
> - testes automatizados futuros;
>
> antes de qualquer integração com Next.js.

---

# 1. Objetivo

Definir:

- prefixo e versionamento;
- convenções REST;
- autenticação;
- DTOs;
- respostas;
- erros;
- paginação;
- endpoints públicos e privados;
- autorização;
- contratos financeiros;
- endpoints administrativos;
- contratos de webhook;
- contratos de upload;
- status HTTP;
- idempotência.

Este documento descreve os contratos da Fase 1.

Não inclui marketplace público de descoberta.

---

# 2. Base URL

Ambiente local:

```text
http://localhost:3001/api/v1
```

Produção futura:

```text
https://api.guildaplay.com/api/v1
```

Prefixo NestJS:

```text
/api
```

Versionamento:

```text
/v1
```

Resultado:

```text
/api/v1
```

---

# 3. Swagger

Swagger:

```text
/api/docs
```

Swagger deve incluir:

- Bearer Auth;
- DTOs;
- exemplos;
- status codes;
- enums;
- descriptions;
- endpoints públicos e privados.

Swagger não deve expor:

- segredos;
- API keys;
- hashes;
- credenciais reais.

---

# 4. Content-Type

Padrão:

```http
Content-Type: application/json
```

Uploads para R2 usam presigned URL e não passam binário pela API.

---

# 5. Autenticação

Endpoints protegidos:

```http
Authorization: Bearer <access-token>
```

Refresh token:

```text
cookie HttpOnly
```

conforme `AUTH_SECURITY.md`.

Durante desenvolvimento API-first, mecanismos auxiliares podem ser usados localmente sem mudar o contrato de produção.

---

# 6. Formato de sucesso

Para recurso simples:

```json
{
  "data": {
    "id": "..."
  }
}
```

Para coleções:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 120,
    "totalPages": 6
  }
}
```

Para ação sem corpo relevante:

```json
{
  "data": null
}
```

---

# 7. Formato de erro

Padrão:

```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Dados inválidos.",
  "details": [],
  "requestId": "req_..."
}
```

`details` pode ser omitido quando não houver informação segura e útil.

---

# 8. Códigos de erro comuns

```text
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
CONFLICT
RATE_LIMITED
INTERNAL_ERROR
```

Domínio:

```text
EMAIL_ALREADY_EXISTS
INVALID_CREDENTIALS
EMAIL_NOT_VERIFIED

GM_PROFILE_REQUIRED
GM_PAYMENT_ACCOUNT_NOT_READY

TABLE_NOT_FOUND
TABLE_NOT_ACTIVE
TABLE_FULL

INVITATION_NOT_FOUND
INVITATION_EXPIRED
INVITATION_ALREADY_USED

MEMBERSHIP_NOT_FOUND
MEMBERSHIP_NOT_ACTIVE

BILLING_PLAN_NOT_FOUND
SUBSCRIPTION_ALREADY_ACTIVE
SUBSCRIPTION_NOT_FOUND
SUBSCRIPTION_NOT_ACTIVE

PAYMENT_NOT_FOUND
PAYMENT_ALREADY_EXISTS
PAYMENT_METHOD_REJECTED
PAYMENT_PROVIDER_UNAVAILABLE

REFUND_NOT_ALLOWED
REFUND_AMOUNT_INVALID

UPLOAD_TYPE_NOT_ALLOWED
UPLOAD_TOO_LARGE
```

---

# 9. Paginação

Query padrão:

```text
?page=1&limit=20
```

Defaults:

```text
page = 1
limit = 20
```

Máximo:

```text
limit = 100
```

---

# 10. Ordenação

Quando suportada:

```text
?sort=createdAt&order=desc
```

`sort` deve aceitar apenas campos allowlisted.

Nunca interpolar nome arbitrário de coluna.

---

# 11. Filtros

Filtros devem ser explícitos por endpoint.

Não implementar filtros genéricos do tipo:

```text
?where={"anything":"anything"}
```

---

# 12. Datas

Formato:

```text
ISO 8601
```

Exemplo:

```text
2026-09-22T18:30:00.000Z
```

Datas sem horário:

```text
YYYY-MM-DD
```

Exemplo:

```text
2026-10-05
```

---

# 13. Valores monetários

Contratos públicos usam centavos.

Exemplo:

```json
{
  "amountCents": 15000,
  "currency": "BRL"
}
```

Não retornar:

```json
{
  "amount": 150.0000000003
}
```

---

# 14. Percentuais

Usar basis points.

Exemplo:

```text
800 = 8.00%
```

Campo:

```text
platformFeeBps
```

---

# 15. IDs

IDs internos:

```text
UUID
```

Clients só recebem IDs necessários.

IDs do Asaas não devem ser expostos salvo necessidade administrativa.

---

# 16. Enums HTTP

Representados como strings.

Exemplo:

```json
{
  "status": "ACTIVE"
}
```

---

# 17. Health

## GET `/health`

Público.

Response:

```json
{
  "data": {
    "status": "ok"
  }
}
```

Status:

```text
200
```

---

# 18. Auth — Register

## POST `/auth/register`

Público.

Request:

```json
{
  "name": "Cleyton",
  "email": "user@example.com",
  "password": "uma senha longa"
}
```

Regras:

```text
name: 2..120
email: válido
password: 10..128
```

Response:

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "name": "Cleyton",
      "email": "user@example.com",
      "emailVerified": false,
      "roles": ["USER"],
      "createdAt": "2026-09-22T18:00:00.000Z"
    }
  }
}
```

Status:

```text
201
```

Erros:

```text
400 VALIDATION_ERROR
409 EMAIL_ALREADY_EXISTS
429 RATE_LIMITED
```

---

# 19. Auth — Login

## POST `/auth/login`

Público.

Request:

```json
{
  "email": "user@example.com",
  "password": "uma senha longa"
}
```

Response:

```json
{
  "data": {
    "accessToken": "jwt",
    "expiresIn": 900,
    "user": {
      "id": "uuid",
      "name": "Cleyton",
      "email": "user@example.com",
      "emailVerified": true,
      "roles": ["USER", "GM"]
    }
  }
}
```

Refresh token deve ser definido via cookie HTTP-only.

Status:

```text
200
```

Erro:

```text
401 INVALID_CREDENTIALS
```

Mensagem externa neutra.

---

# 20. Auth — Refresh

## POST `/auth/refresh`

Público no sentido de não exigir access token.

Exige refresh token válido.

Request:

```json
{}
```

Response:

```json
{
  "data": {
    "accessToken": "new-jwt",
    "expiresIn": 900
  }
}
```

Refresh token deve ser rotacionado.

Status:

```text
200
```

Erros:

```text
401 UNAUTHORIZED
```

---

# 21. Auth — Logout

## POST `/auth/logout`

Autenticado ou sessão de refresh válida.

Response:

```json
{
  "data": null
}
```

Status:

```text
200
```

Revoga sessão atual.

---

# 22. Auth — Logout All

## POST `/auth/logout-all`

Autenticado.

Response:

```json
{
  "data": null
}
```

Revoga todas as sessões.

---

# 23. Auth — Me

## GET `/auth/me`

Autenticado.

Response:

```json
{
  "data": {
    "id": "uuid",
    "name": "Cleyton",
    "email": "user@example.com",
    "emailVerified": true,
    "avatarUrl": null,
    "timezone": "America/Sao_Paulo",
    "country": "BR",
    "roles": ["USER", "GM"],
    "gmProfile": {
      "id": "uuid",
      "displayName": "Mestre Cleyton",
      "status": "ACTIVE"
    }
  }
}
```

---

# 24. Auth — Verify Email

## POST `/auth/verify-email`

Público.

Request:

```json
{
  "token": "raw-token"
}
```

Response:

```json
{
  "data": {
    "verified": true
  }
}
```

---

# 25. Auth — Resend Verification

## POST `/auth/resend-verification`

Autenticado.

Response:

```json
{
  "data": null
}
```

Resposta deve ser neutra.

---

# 26. Auth — Forgot Password

## POST `/auth/forgot-password`

Público.

Request:

```json
{
  "email": "user@example.com"
}
```

Response:

```json
{
  "data": null
}
```

Sempre mesma resposta pública.

---

# 27. Auth — Reset Password

## POST `/auth/reset-password`

Público.

Request:

```json
{
  "token": "raw-token",
  "newPassword": "nova senha segura"
}
```

Response:

```json
{
  "data": null
}
```

Revoga sessões antigas.

---

# 28. Users — Get Me

## GET `/users/me`

Autenticado.

Response:

```json
{
  "data": {
    "id": "uuid",
    "name": "Cleyton",
    "email": "user@example.com",
    "avatarUrl": null,
    "timezone": "America/Sao_Paulo",
    "country": "BR",
    "createdAt": "..."
  }
}
```

---

# 29. Users — Update Me

## PATCH `/users/me`

Autenticado.

Request parcial:

```json
{
  "name": "Cleyton Caminha",
  "timezone": "America/Argentina/Buenos_Aires",
  "country": "AR"
}
```

Permitido:

```text
name
timezone
country
avatarUrl via fluxo de upload
```

Não permitido:

```text
roles
emailVerified
walletId
provider IDs
```

Response:

```json
{
  "data": {
    "id": "uuid",
    "name": "Cleyton Caminha",
    "timezone": "America/Argentina/Buenos_Aires",
    "country": "AR"
  }
}
```

---

# 30. GM Profiles — Create

## POST `/gm-profiles`

Autenticado.

Exige e-mail verificado.

Request:

```json
{
  "displayName": "Mestre Rafael",
  "bio": "Mestro campanhas narrativas e terror investigativo."
}
```

Response:

```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "displayName": "Mestre Rafael",
    "bio": "...",
    "status": "PENDING",
    "paymentAccountStatus": "PENDING"
  }
}
```

Status:

```text
201
```

Role `GM` é concedida pelo caso de uso interno.

---

# 31. GM Profiles — Get Mine

## GET `/gm-profiles/me`

Autenticado.

Response:

```json
{
  "data": {
    "id": "uuid",
    "displayName": "Mestre Rafael",
    "bio": "...",
    "status": "ACTIVE",
    "paymentAccount": {
      "status": "ACTIVE",
      "provider": "ASAAS"
    }
  }
}
```

Não expor:

```text
walletId
API keys
providerAccountId
```

em endpoint comum.

---

# 32. GM Profiles — Update Mine

## PATCH `/gm-profiles/me`

Autenticado GM.

Request:

```json
{
  "displayName": "Rafael RPG",
  "bio": "Nova bio"
}
```

Response:

```json
{
  "data": {
    "id": "uuid",
    "displayName": "Rafael RPG",
    "bio": "Nova bio"
  }
}
```

---

# 33. GM Payment Account — Start Setup

## POST `/gm-payment-account/setup`

Autenticado GM.

Exige e-mail verificado.

Request inicial:

```json
{}
```

Response depende do fluxo aprovado pelo Asaas.

Formato abstrato:

```json
{
  "data": {
    "status": "PENDING",
    "actionRequired": true,
    "actionUrl": "https://..."
  }
}
```

Se onboarding ocorrer totalmente via backend:

```json
{
  "data": {
    "status": "PENDING",
    "actionRequired": false
  }
}
```

Não consolidar contrato final antes da definição exata do onboarding Asaas de produção.

---

# 34. GM Payment Account — Status

## GET `/gm-payment-account`

Autenticado GM.

Response:

```json
{
  "data": {
    "provider": "ASAAS",
    "status": "ACTIVE"
  }
}
```

Não retornar IDs sensíveis do provider.

---

# 35. Tables — Create

## POST `/tables`

Autenticado GM.

Exige:

```text
email verificado
gm profile ativo
```

Para criar mesa paga `ACTIVE`, conta financeira deve estar `ACTIVE`.

Request:

```json
{
  "name": "Curse of Strahd",
  "description": "Campanha semanal.",
  "system": "D&D 5e",
  "monthlyPriceCents": 15000,
  "maxPlayers": 4,
  "weekday": 1,
  "startTime": "20:00",
  "timezone": "America/Sao_Paulo"
}
```

Regras:

```text
name 3..160
monthlyPriceCents >= 0
maxPlayers 1..20
weekday 0..6
startTime HH:mm
currency BRL no MVP
```

Response:

```json
{
  "data": {
    "id": "uuid",
    "name": "Curse of Strahd",
    "system": "D&D 5e",
    "status": "DRAFT",
    "monthlyPriceCents": 15000,
    "currency": "BRL",
    "platformFeeBps": 800,
    "maxPlayers": 4,
    "activePlayers": 0,
    "weekday": 1,
    "startTime": "20:00",
    "timezone": "America/Sao_Paulo",
    "createdAt": "..."
  }
}
```

Status:

```text
201
```

---

# 36. Tables — List Mine

## GET `/tables/mine`

Autenticado GM.

Query:

```text
?page=1&limit=20&status=ACTIVE
```

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Curse of Strahd",
      "status": "ACTIVE",
      "monthlyPriceCents": 15000,
      "maxPlayers": 4,
      "activePlayers": 4
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "totalPages": 1
  }
}
```

---

# 37. Tables — Get Mine By ID

## GET `/tables/:tableId`

Autenticado.

Na Fase 1:

- GM dono pode ver;
- nesta entrega, somente o GM proprietário pode ver;
- convite preview usa endpoint separado.

Response:

```json
{
  "data": {
    "id": "uuid",
    "name": "Curse of Strahd",
    "description": "...",
    "system": "D&D 5e",
    "status": "ACTIVE",
    "monthlyPriceCents": 15000,
    "currency": "BRL",
    "platformFeeBps": 800,
    "maxPlayers": 4,
    "activePlayers": 4,
    "weekday": 1,
    "startTime": "20:00",
    "timezone": "America/Sao_Paulo",
    "cover": null
  }
}
```

---

# 38. Tables — Update

## PATCH `/tables/:tableId`

Autenticado GM dono.

Request parcial:

```json
{
  "name": "Curse of Strahd — Temporada 2",
  "description": "Nova descrição",
  "weekday": 5,
  "startTime": "21:00"
}
```

Não alterar diretamente:

```text
gmId
platformFeeBps
provider IDs
activePlayers
```

Mudança de preço deve seguir fluxo de billing plan.

---

# 39. Tables — Activate

## POST `/tables/:tableId/activate`

Autenticado GM dono.

Exige:

```text
gm payment account ACTIVE
billing plan válido
mesa válida
```

Response:

```json
{
  "data": {
    "id": "uuid",
    "status": "ACTIVE"
  }
}
```

---

# 40. Tables — Pause

## POST `/tables/:tableId/pause`

Autenticado GM dono.

Response:

```json
{
  "data": {
    "id": "uuid",
    "status": "PAUSED"
  }
}
```

Ação financeira segue `PAYMENTS_ASAAS.md`.

---

# 41. Tables — Archive

## POST `/tables/:tableId/archive`

Autenticado GM dono.

Não usar DELETE.

Response:

```json
{
  "data": {
    "id": "uuid",
    "status": "ARCHIVED"
  }
}
```

---

# 42. Table Members — List

## GET `/tables/:tableId/members`

Autenticado GM dono.

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "name": "João",
        "avatarUrl": null
      },
      "status": "ACTIVE",
      "joinedAt": "...",
      "billing": {
        "subscriptionStatus": "ACTIVE",
        "paymentMethod": "CARD_RECURRING",
        "currentPaymentStatus": "PAID",
        "currentAmountCents": 15000
      }
    }
  ]
}
```

Não expor e-mail por padrão se não necessário.

---

# 43. Table Members — Remove

## POST `/tables/:tableId/members/:memberId/remove`

Autenticado GM dono.

Request:

```json
{
  "reason": "LEFT_GROUP"
}
```

`reason` pode ser enum simples no MVP.

Response:

```json
{
  "data": {
    "id": "uuid",
    "status": "REMOVED"
  }
}
```

Não apagar histórico.

---

# 44. Invitations — Create

## POST `/tables/:tableId/invitations`

Autenticado GM dono.

Request:

```json
{
  "expiresInDays": 7
}
```

Response:

```json
{
  "data": {
    "id": "uuid",
    "inviteUrl": "https://app.guildaplay.com/invite/raw-token",
    "expiresAt": "2026-09-29T18:00:00.000Z"
  }
}
```

API retorna token bruto uma vez.

Banco guarda hash.

---

# 45. Invitations — Preview

## GET `/invitations/:token/preview`

Público.

Response:

```json
{
  "data": {
    "table": {
      "name": "Curse of Strahd",
      "system": "D&D 5e",
      "monthlyPriceCents": 15000,
      "currency": "BRL",
      "weekday": 1,
      "startTime": "20:00",
      "timezone": "America/Sao_Paulo",
      "maxPlayers": 4,
      "availableSlots": 1
    },
    "gm": {
      "displayName": "Mestre Rafael"
    },
    "expiresAt": "..."
  }
}
```

Não retornar IDs internos desnecessários.

---

# 46. Invitations — Accept

## POST `/invitations/:token/accept`

Autenticado.

Exige e-mail verificado.

Response:

```json
{
  "data": {
    "membership": {
      "id": "uuid",
      "tableId": "uuid",
      "status": "ACTIVE"
    }
  }
}
```

Status:

```text
201
```

Erros:

```text
404 INVITATION_NOT_FOUND
409 INVITATION_ALREADY_USED
409 TABLE_FULL
410 INVITATION_EXPIRED
```

---

# 47. Memberships — Mine

## GET `/memberships/mine`

Autenticado.

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "status": "ACTIVE",
      "table": {
        "id": "uuid",
        "name": "Curse of Strahd",
        "system": "D&D 5e",
        "weekday": 1,
        "startTime": "20:00",
        "timezone": "America/Sao_Paulo"
      },
      "billing": {
        "subscriptionStatus": "ACTIVE",
        "paymentMethod": "CARD_RECURRING"
      }
    }
  ]
}
```

---

# 48. Billing Plan — Get Table Current

## GET `/tables/:tableId/billing-plan`

Autenticado.

Permissão:

- GM dono;
- membro ativo.

Response:

```json
{
  "data": {
    "id": "uuid",
    "amountCents": 15000,
    "currency": "BRL",
    "interval": "MONTHLY",
    "platformFeeBps": 800,
    "active": true
  }
}
```

---

# 49. Billing Plan — Change Price

## POST `/tables/:tableId/billing-plans`

Autenticado GM dono.

Request:

```json
{
  "amountCents": 18000
}
```

Response:

```json
{
  "data": {
    "id": "uuid",
    "amountCents": 18000,
    "currency": "BRL",
    "interval": "MONTHLY",
    "platformFeeBps": 800,
    "active": true
  }
}
```

Não migrar subscriptions existentes automaticamente no MVP.

---

# 50. Subscriptions — Create Card Recurring

## POST `/subscriptions`

Autenticado membro ativo.

Request:

```json
{
  "tableId": "uuid",
  "paymentMethod": "CARD_RECURRING"
}
```

Não receber:

```text
amount
fee
walletId
gmId
customerId
```

Response:

```json
{
  "data": {
    "subscription": {
      "id": "uuid",
      "status": "PENDING",
      "paymentMethod": "CARD_RECURRING",
      "amountCents": 15000,
      "currency": "BRL",
      "nextDueDate": null
    },
    "checkout": {
      "url": "https://...",
      "expiresAt": "..."
    }
  }
}
```

Status:

```text
201
```

Headers:

```http
Idempotency-Key: optional-client-generated-key
```

API também deve aplicar idempotência interna.

---

# 51. Subscriptions — Create Pix Manual

## POST `/subscriptions`

Mesmo endpoint.

Request:

```json
{
  "tableId": "uuid",
  "paymentMethod": "PIX_MANUAL"
}
```

Response:

```json
{
  "data": {
    "subscription": {
      "id": "uuid",
      "status": "PENDING",
      "paymentMethod": "PIX_MANUAL",
      "amountCents": 15000,
      "currency": "BRL",
      "nextDueDate": "2026-10-05"
    },
    "currentPayment": {
      "id": "uuid",
      "status": "PENDING",
      "amountCents": 15000,
      "dueDate": "2026-10-05"
    }
  }
}
```

QR pode ser buscado separadamente.

---

# 52. Subscriptions — Mine

## GET `/subscriptions/mine`

Autenticado.

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "status": "ACTIVE",
      "paymentMethod": "CARD_RECURRING",
      "amountCents": 15000,
      "currency": "BRL",
      "nextDueDate": "2026-10-05",
      "cancelAtPeriodEnd": false,
      "table": {
        "id": "uuid",
        "name": "Curse of Strahd"
      }
    }
  ]
}
```

---

# 53. Subscriptions — Get Mine

## GET `/subscriptions/:subscriptionId`

Autenticado owner ou GM dono da mesa com resposta limitada.

Para player owner:

```json
{
  "data": {
    "id": "uuid",
    "status": "ACTIVE",
    "paymentMethod": "PIX_MANUAL",
    "amountCents": 15000,
    "currency": "BRL",
    "nextDueDate": "2026-10-05",
    "cancelAtPeriodEnd": false
  }
}
```

GM pode receber visão operacional sem dados sensíveis do pagador.

---

# 54. Subscriptions — Cancel

## POST `/subscriptions/:subscriptionId/cancel`

Autenticado owner.

Request:

```json
{
  "cancelAtPeriodEnd": true
}
```

Response:

```json
{
  "data": {
    "id": "uuid",
    "status": "ACTIVE",
    "cancelAtPeriodEnd": true
  }
}
```

Cancelamento imediato pode ser acrescentado depois.

---

# 55. Subscriptions — GM End

## POST `/tables/:tableId/members/:memberId/end-subscription`

Autenticado GM dono.

Request:

```json
{
  "atPeriodEnd": true
}
```

Response:

```json
{
  "data": {
    "subscriptionId": "uuid",
    "cancelAtPeriodEnd": true
  }
}
```

Toda ação auditada.

---

# 56. Payments — Mine

## GET `/payments/mine`

Autenticado.

Query:

```text
?page=1&limit=20&status=PAID
```

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "status": "PAID",
      "amountCents": 15000,
      "currency": "BRL",
      "paymentMethod": "PIX_MANUAL",
      "dueDate": "2026-09-05",
      "paidAt": "2026-09-03T13:22:00.000Z",
      "periodStart": "2026-09-01",
      "periodEnd": "2026-09-30",
      "table": {
        "id": "uuid",
        "name": "Curse of Strahd"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "totalPages": 1
  }
}
```

---

# 57. Payments — Get Mine

## GET `/payments/:paymentId`

Autenticado owner.

Response:

```json
{
  "data": {
    "id": "uuid",
    "status": "PENDING",
    "amountCents": 15000,
    "currency": "BRL",
    "paymentMethod": "PIX_MANUAL",
    "dueDate": "2026-10-05",
    "paidAt": null,
    "periodStart": "2026-10-01",
    "periodEnd": "2026-10-31"
  }
}
```

---

# 58. Payments — Pix QR Code

## GET `/payments/:paymentId/pix`

Autenticado owner.

Somente para payment Pix elegível.

Response:

```json
{
  "data": {
    "paymentId": "uuid",
    "status": "PENDING",
    "amountCents": 15000,
    "dueDate": "2026-10-05",
    "pixCopyPaste": "00020126...",
    "pixQrCodeBase64": "data:image/png;base64,...",
    "expiresAt": "2026-10-05T23:59:59.000Z"
  }
}
```

Pode-se futuramente trocar Base64 por endpoint de imagem/cache.

---

# 59. Payments — GM Table Summary

## GET `/tables/:tableId/payments/summary`

Autenticado GM dono.

Response:

```json
{
  "data": {
    "tableId": "uuid",
    "currency": "BRL",
    "currentPeriod": {
      "periodStart": "2026-09-01",
      "periodEnd": "2026-09-30",
      "expectedGrossCents": 60000,
      "paidGrossCents": 45000,
      "pendingGrossCents": 15000,
      "overdueGrossCents": 0,
      "playerCount": 4,
      "paidPlayers": 3,
      "pendingPlayers": 1,
      "overduePlayers": 0
    }
  }
}
```

Valores líquidos podem ser adicionados quando consolidados.

---

# 60. Payments — GM Table List

## GET `/tables/:tableId/payments`

Autenticado GM dono.

Query:

```text
?page=1&limit=50&period=2026-09
```

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "player": {
        "id": "uuid",
        "name": "João"
      },
      "status": "PAID",
      "amountCents": 15000,
      "dueDate": "2026-09-05",
      "paidAt": "..."
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 4,
    "totalPages": 1
  }
}
```

---

# 61. Payments — Retry Card Payment

Não criar endpoint manual no MVP até confirmar o comportamento desejado com Asaas.

Pode ser necessário apenas:

- atualizar método;
- gerar checkout novo;
- deixar retries do provider ocorrerem.

Contrato ficará pendente.

---

# 62. Refunds — Create

## POST `/payments/:paymentId/refunds`

Inicialmente:

```text
ADMIN ou regra GM controlada
```

Recomendação para primeiro MVP real:

```text
ADMIN only
```

Request:

```json
{
  "amountCents": 15000,
  "reason": "SESSION_CANCELED"
}
```

Response:

```json
{
  "data": {
    "id": "uuid",
    "paymentId": "uuid",
    "amountCents": 15000,
    "status": "PENDING"
  }
}
```

Status:

```text
202
```

---

# 63. Refunds — Get

## GET `/refunds/:refundId`

Autenticado owner ou admin conforme policy.

Response:

```json
{
  "data": {
    "id": "uuid",
    "paymentId": "uuid",
    "amountCents": 15000,
    "status": "CONFIRMED",
    "createdAt": "...",
    "confirmedAt": "..."
  }
}
```

---

# 64. GM Dashboard — Summary

## GET `/gm/dashboard`

Autenticado GM.

Response:

```json
{
  "data": {
    "tables": {
      "active": 10,
      "paused": 0
    },
    "players": {
      "active": 40
    },
    "currentPeriod": {
      "expectedGrossCents": 600000,
      "paidGrossCents": 510000,
      "pendingGrossCents": 60000,
      "overdueGrossCents": 30000
    }
  }
}
```

No futuro podem entrar valores líquidos.

---

# 65. Player Dashboard — Summary

## GET `/player/dashboard`

Autenticado.

Response:

```json
{
  "data": {
    "activeTables": 2,
    "activeSubscriptions": 2,
    "nextPayments": [
      {
        "paymentId": "uuid",
        "tableName": "Curse of Strahd",
        "amountCents": 15000,
        "dueDate": "2026-10-05",
        "status": "PENDING"
      }
    ]
  }
}
```

---

# 66. Uploads — Presign Avatar

## POST `/uploads/avatar/presign`

Autenticado.

Request:

```json
{
  "contentType": "image/webp",
  "sizeBytes": 345221
}
```

Response:

```json
{
  "data": {
    "uploadUrl": "https://...",
    "objectKey": "avatars/user-id/uuid.webp",
    "expiresAt": "..."
  }
}
```

A API escolhe a key.

---

# 67. Uploads — Presign Table Cover

## POST `/tables/:tableId/cover/presign`

Autenticado GM dono.

Request:

```json
{
  "contentType": "image/jpeg",
  "sizeBytes": 1200345
}
```

Response:

```json
{
  "data": {
    "uploadUrl": "https://...",
    "objectKey": "table-covers/table-id/uuid.jpg",
    "expiresAt": "..."
  }
}
```

---

# 68. Uploads — Confirm

## POST `/uploads/confirm`

Autenticado.

Request:

```json
{
  "objectKey": "avatars/user-id/uuid.webp",
  "purpose": "AVATAR"
}
```

Service deve validar owner/prefix.

Response:

```json
{
  "data": {
    "url": "https://cdn..."
  }
}
```

---

# 69. Webhooks — Asaas

## POST `/webhooks/asaas`

Não usa auth de usuário.

Usa autenticação própria do provider.

Request:

```text
payload do Asaas
```

Response em sucesso:

```json
{
  "received": true
}
```

Status:

```text
200
```

Duplicata:

```text
200
```

Erro transitório interno:

pode retornar não-2xx quando retry do provider for desejado, conforme política documentada.

Nunca retornar stack trace.

---

# 70. Admin — Users

## GET `/admin/users`

ADMIN.

Query:

```text
?page=1&limit=50&email=
```

Response paginada.

Dados financeiros sensíveis não entram por padrão.

---

# 71. Admin — GM Payment Accounts

## GET `/admin/gm-payment-accounts`

ADMIN.

Filtros:

```text
status=PENDING
```

Response:

```json
{
  "data": [
    {
      "gmProfileId": "uuid",
      "displayName": "Mestre Rafael",
      "provider": "ASAAS",
      "status": "PENDING",
      "createdAt": "..."
    }
  ]
}
```

---

# 72. Admin — Webhooks

## GET `/admin/webhooks`

ADMIN.

Query:

```text
?page=1&limit=50&status=FAILED&eventType=PAYMENT_CONFIRMED
```

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "provider": "ASAAS",
      "providerEventId": "...",
      "eventType": "PAYMENT_CONFIRMED",
      "status": "FAILED",
      "attempts": 2,
      "lastError": "sanitized error",
      "createdAt": "..."
    }
  ]
}
```

Não retornar payload bruto por padrão.

---

# 73. Admin — Webhook Detail

## GET `/admin/webhooks/:id`

ADMIN.

Pode retornar payload sanitizado.

Response:

```json
{
  "data": {
    "id": "uuid",
    "eventType": "PAYMENT_CONFIRMED",
    "status": "FAILED",
    "attempts": 2,
    "lastError": "...",
    "payload": {}
  }
}
```

---

# 74. Admin — Reprocess Webhook

## POST `/admin/webhooks/:id/reprocess`

ADMIN.

Response:

```json
{
  "data": {
    "id": "uuid",
    "status": "PROCESSING"
  }
}
```

Status:

```text
202
```

---

# 75. Admin — Reconcile Payment

## POST `/admin/payments/:paymentId/reconcile`

ADMIN.

Response:

```json
{
  "data": {
    "paymentId": "uuid",
    "previousStatus": "PENDING",
    "currentStatus": "PAID",
    "reconciled": true
  }
}
```

Toda ação auditada.

---

# 76. Admin — Reconcile Subscription

## POST `/admin/subscriptions/:subscriptionId/reconcile`

ADMIN.

Response:

```json
{
  "data": {
    "subscriptionId": "uuid",
    "reconciled": true,
    "status": "ACTIVE"
  }
}
```

---

# 77. Admin — Audit Logs

## GET `/admin/audit-logs`

ADMIN.

Query:

```text
?page=1&limit=50&userId=&action=&entityType=&entityId=
```

Response paginada.

---

# 78. Status HTTP padrão

```text
200 OK
201 Created
202 Accepted
204 No Content (usar pouco; preferimos envelope quando útil)

400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
410 Gone
422 Unprocessable Entity
429 Too Many Requests

500 Internal Server Error
502 Bad Gateway
503 Service Unavailable
```

---

# 79. 400 vs 422

Usar:

```text
400
```

para DTO inválido e request malformado.

Usar:

```text
422
```

para regra de negócio semanticamente impossível quando apropriado.

Exemplo:

```text
mesa PAUSED tentando iniciar assinatura
```

Pode ser:

```text
422 TABLE_NOT_ACTIVE
```

---

# 80. 409 Conflict

Usar para:

```text
EMAIL_ALREADY_EXISTS
SUBSCRIPTION_ALREADY_ACTIVE
PAYMENT_ALREADY_EXISTS
INVITATION_ALREADY_USED
```

---

# 81. 410 Gone

Usar para recurso que existiu e expirou:

```text
INVITATION_EXPIRED
```

---

# 82. Not Found e privacy

Quando revelar existência de recurso for sensível, pode retornar:

```text
404
```

mesmo que recurso exista mas não pertença ao usuário.

Exemplo:

```text
GET /payments/:id
```

de outro usuário.

---

# 83. Idempotency Header

Operações financeiras mutativas podem aceitar:

```http
Idempotency-Key: <opaque-key>
```

Regras:

- 1..128 chars;
- escopo por usuário + endpoint;
- mesma key + mesmo payload => mesma resposta lógica;
- mesma key + payload diferente => 409.

Mesmo sem header, constraints internas continuam obrigatórias.

---

# 84. Correlation

Response pode incluir:

```http
X-Request-Id: req_...
```

Erros também retornam `requestId`.

---

# 85. Cache

Endpoints autenticados financeiros:

```text
Cache-Control: no-store
```

Tokens/auth:

```text
Cache-Control: no-store
```

Recursos públicos futuros podem usar cache depois.

---

# 86. ETags

Fora do MVP.

---

# 87. DTO naming

NestJS:

```text
RegisterDto
LoginDto
UpdateMeDto

CreateGmProfileDto
UpdateGmProfileDto

CreateTableDto
UpdateTableDto

CreateInvitationDto

CreateSubscriptionDto
CancelSubscriptionDto

CreateRefundDto

PresignUploadDto
```

Responses podem usar DTOs específicos quando útil.

---

# 88. Controller naming

```text
AuthController
UsersController
GmProfilesController
GmPaymentAccountController

TablesController
TableMembersController
InvitationsController
MembershipsController

SubscriptionsController
PaymentsController
RefundsController

UploadsController
DashboardsController

AsaasWebhookController

AdminUsersController
AdminWebhooksController
AdminPaymentsController
AdminAuditLogsController
```

---

# 89. Service naming

```text
AuthService
UsersService
GmProfilesService
GmPaymentAccountService

TablesService
TableMembersService
InvitationsService
MembershipsService

BillingService
SubscriptionsService
PaymentsService
RefundsService

UploadsService
GmDashboardService
PlayerDashboardService

AsaasWebhookService
PaymentsReconciliationService
```

---

# 90. Repository naming

```text
UsersRepository
GmProfilesRepository
TablesRepository
TableMembersRepository
InvitationsRepository

BillingPlansRepository
SubscriptionsRepository
PaymentsRepository
RefundsRepository
WebhookEventsRepository
AuditLogsRepository
```

---

# 91. Não expor internals

Endpoints normais não retornam:

```text
passwordHash
refreshTokenHash
providerWalletId
providerCustomerId
providerSubscriptionId
providerPaymentId
providerAccountId
API keys
webhook secret
raw provider payload
```

Admin só recebe provider IDs quando necessário para suporte e com endpoint específico.

---

# 92. Public resource exposure

Na Fase 1 não existe:

```text
GET /public/tables
GET /marketplace
GET /masters
```

Esses endpoints pertencem à Fase 2.

---

# 93. Search

Busca pública fica fora do MVP.

Não criar endpoint genérico agora.

---

# 94. Chat

Fora do escopo.

---

# 95. Reviews

Fora da Fase 1.

---

# 96. Groups / matchmaking

Fora da Fase 1.

---

# 97. Used marketplace

Fora da Fase 1.

---

# 98. API version compatibility

Dentro de `/v1`, mudanças compatíveis podem incluir:

- novos campos opcionais;
- novos endpoints;
- novos enums apenas quando consumidores tolerarem.

Mudanças breaking exigem:

```text
/v2
```

ou migração coordenada.

---

# 99. Nullability

Contratos devem distinguir:

```text
campo ausente
```

de:

```text
campo null
```

PATCH:

campo ausente:

```text
não alterar
```

campo `null`:

```text
limpar
```

somente onde permitido.

---

# 100. PATCH semantics

PATCH é parcial.

Não usar DTO de create inteiro como DTO de update sem revisão de segurança.

Campos imutáveis devem ser excluídos.

---

# 101. Delete semantics

Evitar DELETE para entidades com histórico.

Usar:

```text
archive
cancel
remove membership
```

Nunca apagar:

```text
payments
subscriptions financeiras históricas
refunds
webhook events
audit logs
```

---

# 102. Table response ownership

`GET /tables/:id` na Fase 1 exige relacionamento.

Não é endpoint público de marketplace.

---

# 103. Timezone

Sempre retornar timezone da mesa:

```text
America/Sao_Paulo
```

Não converter horário da mesa no backend para timezone do usuário como representação primária.

Consumidor pode converter depois.

---

# 104. Weekday

MVP:

```text
0 = Sunday
1 = Monday
...
6 = Saturday
```

Documentar no Swagger.

---

# 105. Start time

Formato:

```text
HH:mm
```

Timezone separado.

Exemplo:

```json
{
  "weekday": 5,
  "startTime": "20:00",
  "timezone": "America/Sao_Paulo"
}
```

---

# 106. Currency

MVP suporta:

```text
BRL
```

DTOs não devem aceitar outras moedas ainda.

---

# 107. Max players

Valor inicial permitido:

```text
1..20
```

Pode mudar depois.

---

# 108. Table status

```text
DRAFT
ACTIVE
PAUSED
ARCHIVED
```

---

# 109. Membership status

```text
ACTIVE
LEFT
REMOVED
```

Convite ainda não aceito não é `table_member`.

---

# 110. Invitation status

Pode ser derivado de:

```text
usedAt
revokedAt
expiresAt
```

Não é obrigatório persistir enum redundante.

---

# 111. Subscription payment method

```text
CARD_RECURRING
PIX_MANUAL
```

---

# 112. Subscription status

```text
PENDING
ACTIVE
PAST_DUE
PAUSED
CANCELED
ENDED
```

---

# 113. Payment status

```text
PENDING
PAID
OVERDUE
FAILED
CANCELED
REFUNDED
PARTIALLY_REFUNDED
```

---

# 114. Refund status

```text
PENDING
CONFIRMED
FAILED
CANCELED
```

---

# 115. Webhook status

```text
RECEIVED
PROCESSING
PROCESSED
FAILED
IGNORED
```

---

# 116. GM payment account status

```text
PENDING
ACTIVE
BLOCKED
DISCONNECTED
```

---

# 117. Audit actions

Documentadas em `AUTH_SECURITY.md` e `PAYMENTS_ASAAS.md`.

Endpoints administrativos devem usar filtros textuais/enum conhecidos.

---

# 118. Pagination response

Sempre:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

---

# 119. Validation details

Exemplo:

```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Dados inválidos.",
  "details": [
    {
      "field": "email",
      "message": "E-mail inválido."
    }
  ],
  "requestId": "req_123"
}
```

Não retornar mensagens internas do class-validator sem normalização quando forem ruins para API pública.

---

# 120. Provider unavailable

Quando Asaas estiver indisponível:

```text
503 PAYMENT_PROVIDER_UNAVAILABLE
```

Exemplo:

```json
{
  "statusCode": 503,
  "code": "PAYMENT_PROVIDER_UNAVAILABLE",
  "message": "Não foi possível concluir a operação de pagamento agora.",
  "requestId": "..."
}
```

Não afirmar que cobrança falhou se estado externo for incerto.

---

# 121. Async financial operations

Quando resultado financeiro ainda depende de provider/webhook:

```text
202 Accepted
```

pode ser utilizado.

Exemplo:

```text
refund criado PENDING
```

---

# 122. Return URLs

URLs de checkout não são confirmação.

Response pode retornar:

```text
checkout.url
```

mas nenhuma rota de retorno deve alterar estado financeiro diretamente.

---

# 123. Sandbox metadata

Não retornar:

```text
sandbox=true
```

em todo recurso.

Ambiente é configuração de deployment.

Pode aparecer somente em endpoint interno/admin se útil.

---

# 124. Request body limits

JSON:

```text
1 MB
```

ou menor, salvo necessidade.

Uploads não passam por JSON.

---

# 125. String normalization

E-mails:

```text
trim + lowercase
```

Nomes:

```text
trim
```

Não lowercase em nomes humanos.

---

# 126. Table system

No MVP:

```text
system: string
```

Exemplo:

```text
D&D 5e
```

Catálogo estruturado de sistemas vem depois.

---

# 127. Table cover

`cover` somente pode ser atualizado a partir de objeto R2 validado/confirmado.

Não aceitar URL arbitrária externa no `PATCH /tables/:id`.

---

# 128. Avatar

Mesma regra.

`avatarUrl` não deve aceitar qualquer URL externa sem policy explícita.

---

# 129. Email change

Mudança de e-mail fica fora do primeiro contrato.

Adicionar depois com:

- confirmação;
- reautenticação;
- invalidação adequada.

---

# 130. User deletion

Fora do MVP inicial.

Se necessário, deverá considerar retenção legal/financeira e anonimização.

Nunca simplesmente cascade delete em pagamentos.

---

# 131. Admin impersonation

Proibido no MVP.

---

# 132. Admin manual paid

Proibido.

Não criar:

```text
POST /admin/payments/:id/mark-paid
```

---

# 133. Admin provider IDs

Quando necessário para suporte, criar endpoint explícito protegido.

Não adicionar provider IDs em todas as respostas administrativas por conveniência.

---

# 134. Webhook raw endpoint logging

Não logar payload completo automaticamente antes de sanitização.

Persistência pode guardar payload conforme policy de segurança.

---

# 135. Error from ownership

Para recursos sensíveis:

```text
404 NOT_FOUND
```

é preferível a revelar:

```text
403 existe mas não é seu
```

em certos casos.

---

# 136. Optimistic UI

Fora do contrato da API.

API sempre retorna estado persistido real.

---

# 137. Table full concurrency

Aceitar convite deve ser transacional.

Se dois jogadores tentarem última vaga:

```text
um recebe 201
outro recebe 409 TABLE_FULL
```

---

# 138. Active subscription uniqueness

Por membro e mesa:

```text
máximo uma subscription ativa/relevante
```

Request duplicado:

```text
409 SUBSCRIPTION_ALREADY_ACTIVE
```

---

# 139. Pix duplicate cycle

Mesmo ciclo:

```text
não criar dois payments
```

Endpoint/cron duplicado deve reutilizar recurso existente ou retornar estado atual.

---

# 140. Retry-safe responses

Operação repetida com mesma idempotency key pode retornar:

```text
200
```

ou replay da resposta original.

Contrato final será definido na implementação de idempotency storage.

---

# 141. API client future

O frontend futuro pode gerar TypeScript client a partir do OpenAPI.

Por isso:

- DTOs precisam ser estáveis;
- enums documentados;
- responses consistentes;
- evitar `any`.

---

# 142. Swagger examples

Cada endpoint crítico deve ter exemplo.

Prioridade:

```text
auth
tables
invitations
subscriptions
payments
webhooks
admin reconciliation
```

---

# 143. Módulos sem endpoint

Alguns services não precisam controller próprio.

Exemplo:

```text
BillingService
SplitPolicyService
AsaasPaymentProvider
```

Não criar endpoint só porque existe módulo.

---

# 144. Endpoint count discipline

Evitar CRUD automático gerado para tudo.

Não criar:

```text
DELETE /payments/:id
PATCH /payments/:id
DELETE /subscriptions/:id
PATCH /webhooks/:id
```

se o domínio não permite.

Endpoints refletem casos de uso.

---

# 145. First implementation subset

A primeira entrega da API não precisa implementar todos os endpoints deste arquivo de uma vez.

Ordem mínima:

```text
1. health
2. auth register/login/me
3. gm profile
4. table create/list/get/update
5. invitations
6. memberships
7. billing plan
8. payment account
9. subscriptions
10. payments
11. webhooks
12. dashboards
13. admin webhook/reconcile
14. uploads
```

A ordem completa estará em:

```text
docs/MVP_ROADMAP.md
```

---

# 146. Critério de pronto — API Contract

Este documento estará implementado para o MVP quando for possível, via Swagger:

```text
REGISTER
   |
LOGIN
   |
CREATE GM PROFILE
   |
SETUP PAYMENT ACCOUNT
   |
CREATE TABLE
   |
ACTIVATE TABLE
   |
CREATE INVITE
   |
SECOND USER REGISTER/LOGIN
   |
ACCEPT INVITE
   |
CREATE SUBSCRIPTION
   |
PAY
   |
WEBHOOK
   |
GET PAYMENT STATUS
   |
GM DASHBOARD
```

Sem frontend.

---

# 147. Regras obrigatórias para o Codex

Antes de implementar controller ou DTO, ler:

```text
docs/ARCHITECTURE.md
docs/DATA_MODEL.md
docs/AUTH_SECURITY.md
docs/PAYMENTS_ASAAS.md
docs/API_CONTRACTS.md
```

O Codex não deve:

1. inventar endpoints não documentados sem necessidade;
2. criar CRUD genérico para entidades financeiras;
3. expor provider IDs no contrato comum;
4. aceitar `userId` arbitrário quando o usuário vem da sessão;
5. aceitar `gmId` arbitrário do cliente;
6. aceitar `platformFeeBps` em criação de assinatura;
7. aceitar `walletId` do cliente;
8. aceitar `paymentStatus` do cliente;
9. usar redirect como confirmação financeira;
10. retornar entidade de banco diretamente;
11. retornar password hash;
12. retornar token hash;
13. retornar payload bruto do Asaas ao usuário;
14. usar float em valores monetários;
15. criar DELETE para pagamentos;
16. criar DELETE para audit logs;
17. criar endpoint de "mark payment paid";
18. tornar mesa pública na Fase 1;
19. implementar marketplace nesta fase;
20. acoplar response ao modelo interno do Asaas.

---

# 148. Resumo dos endpoints Fase 1

```text
HEALTH
GET    /health

AUTH
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
POST   /auth/logout-all
GET    /auth/me
POST   /auth/verify-email
POST   /auth/resend-verification
POST   /auth/forgot-password
POST   /auth/reset-password

USERS
GET    /users/me
PATCH  /users/me

GM
POST   /gm-profiles
GET    /gm-profiles/me
PATCH  /gm-profiles/me

GM PAYMENT ACCOUNT
POST   /gm-payment-account/setup
GET    /gm-payment-account

TABLES
POST   /tables
GET    /tables/mine
GET    /tables/:tableId
PATCH  /tables/:tableId
POST   /tables/:tableId/activate
POST   /tables/:tableId/pause
POST   /tables/:tableId/archive

MEMBERS
GET    /tables/:tableId/members
POST   /tables/:tableId/members/:memberId/remove
GET    /memberships/mine

INVITATIONS
POST   /tables/:tableId/invitations
GET    /invitations/:token/preview
POST   /invitations/:token/accept

BILLING
GET    /tables/:tableId/billing-plan
POST   /tables/:tableId/billing-plans

SUBSCRIPTIONS
POST   /subscriptions
GET    /subscriptions/mine
GET    /subscriptions/:subscriptionId
POST   /subscriptions/:subscriptionId/cancel
POST   /tables/:tableId/members/:memberId/end-subscription

PAYMENTS
GET    /payments/mine
GET    /payments/:paymentId
GET    /payments/:paymentId/pix
GET    /tables/:tableId/payments
GET    /tables/:tableId/payments/summary

REFUNDS
POST   /payments/:paymentId/refunds
GET    /refunds/:refundId

DASHBOARDS
GET    /gm/dashboard
GET    /player/dashboard

UPLOADS
POST   /uploads/avatar/presign
POST   /tables/:tableId/cover/presign
POST   /uploads/confirm

WEBHOOKS
POST   /webhooks/asaas

ADMIN
GET    /admin/users
GET    /admin/gm-payment-accounts
GET    /admin/webhooks
GET    /admin/webhooks/:id
POST   /admin/webhooks/:id/reprocess
POST   /admin/payments/:paymentId/reconcile
POST   /admin/subscriptions/:subscriptionId/reconcile
GET    /admin/audit-logs
```

---

# 149. Decisão final

A API da GuildaPlay será orientada a casos de uso e não a CRUD genérico.

O frontend futuro deverá conseguir consumir toda a Fase 1 sem possuir regra de negócio crítica.

Fluxo esperado:

```text
Client
  |
  v
REST /api/v1
  |
  v
NestJS Controllers
  |
  v
DTO validation
  |
  v
Services
  |
  +---- Authorization
  +---- Business rules
  +---- Repositories
  +---- PaymentProvider
  |
  v
Neon / Asaas / R2
```

Toda regra crítica permanece na API.

---

# 150. Admin Catalog: Dados da Guilda

O catálogo ainda não possui endpoints públicos. A gestão editorial exige
autenticação com a role `ADMIN` e usa o prefixo `/api/v1/admin/catalog`.

```text
POST  /publishers
GET   /publishers
GET   /publishers/:publisherId
PATCH /publishers/:publisherId

POST  /creators
GET   /creators
GET   /creators/:creatorId
PATCH /creators/:creatorId

POST  /systems
GET   /systems
GET   /systems/:systemId
PATCH /systems/:systemId
POST  /systems/:systemId/publish
POST  /systems/:systemId/archive

POST  /items
GET   /items
GET   /items/:itemId
PATCH /items/:itemId
POST  /items/:itemId/publish
POST  /items/:itemId/archive

POST  /editions
GET   /editions
GET   /editions/:editionId
PATCH /editions/:editionId

POST  /categories
GET   /categories
PATCH /categories/:categoryId

POST  /tags
GET   /tags
PATCH /tags/:tagId

POST  /items/:itemId/aliases
PATCH /items/:itemId/aliases/:aliasId
POST  /items/:itemId/sources
PATCH /items/:itemId/sources/:sourceId
```

As listas usam `?page=1&limit=20`. Criação e edição de itens aceitam
opcionalmente `systemIds`, `categoryIds`, `tagIds` e `creators`; quando um desses campos é enviado em
uma edição, ele substitui integralmente o conjunto correspondente. Um array
vazio remove todas as associações daquele tipo.

Sistemas e itens são criados como `DRAFT`. A transição permitida é
`DRAFT -> PUBLISHED` ou `DRAFT/PUBLISHED -> ARCHIVED`; `ARCHIVED` é terminal.
Editoras, criadores e edições não possuem status no modelo e, por isso, não
possuem endpoints de publicar ou arquivar.

Para mídia, `POST /api/v1/media/upload-url` aceita adicionalmente
`CATALOG_COVER` ou `CATALOG_IMAGE` e exige `catalogItemId`. A conclusão em
`POST /api/v1/media/:assetId/complete` vincula o asset ao item; somente ADMIN
pode realizar esse fluxo.

---

# 151. Catálogo público

As rotas públicas não exigem autenticação e retornam somente itens com status
`PUBLISHED`:

```text
GET /api/v1/catalog/items
GET /api/v1/catalog/items/:slug
```

`GET /catalog/items` aceita os filtros explícitos abaixo, além de `page` e
`limit`:

```text
q                título ou alias normalizado
systemId         UUID do sistema
type             CORE_BOOK | SETTING | ADVENTURE | SUPPLEMENT | TOOL
genre            slug de categoria
languageCode     idioma de uma edição, por exemplo pt-BR
publisherId      UUID da editora de uma edição
year             ano original de lançamento
experienceLevel  BEGINNER | INTERMEDIATE | ADVANCED
sort             TITLE | RELEASE_YEAR | NEWEST
order            ASC | DESC
```

Para filtros de idioma e editora, ambos os critérios — quando enviados — devem
ser atendidos pela mesma edição. A ordenação é allowlisted e não aceita nomes
arbitrários de coluna.

---

# 152. Relações de catálogo

Relações são geridas por ADMIN:

```text
POST   /api/v1/admin/catalog/items/:itemId/relations
DELETE /api/v1/admin/catalog/items/:itemId/relations/:relationId
```

O corpo da criação contém `targetItemId` e um tipo de relação. Relações
duplicadas ou autorreferências são rejeitadas. A ficha pública exibe somente
relações cujo item de destino esteja publicado.
