# GuildaPlay API — MVP Roadmap

> Roadmap de implementação da Fase 1 da API NestJS da GuildaPlay.
>
> Ler antes de implementar:
>
> - `docs/ARCHITECTURE.md`
> - `docs/DATA_MODEL.md`
> - `docs/AUTH_SECURITY.md`
> - `docs/PAYMENTS_ASAAS.md`
> - `docs/API_CONTRACTS.md`
>
> **Status:** Fase 1 — API-first  
> **Frontend:** fora do escopo atual  
> **Objetivo final:** primeira mesa real processando pagamentos via Asaas com split da GuildaPlay.
>
> O Codex deve seguir este roadmap na ordem, salvo instrução explícita em contrário.

---

## Status da implementação atual

O roadmap abaixo também descreve etapas futuras de pagamentos. A entrega atual
deliberadamente encerra a primeira fase **sem pagamentos**. O estado efetivo é:

```text
M0 Bootstrap                 concluído
M1 PostgreSQL + TypeORM       concluído
M2 Auth                       concluído
M3 Users + GM Profiles        concluído
M4 Tables + Billing estrutural concluído
M5 Invitations + Memberships  concluído
M6 R2 + Media Assets + Admin  concluído
M7 Hardening final            concluído
```

As etapas de Asaas, subscriptions, pagamentos, Pix, webhooks, splits, refunds
e dashboards permanecem futuras e não possuem implementação nesta fase.

---

# 1. Objetivo do MVP

O MVP da API estará concluído quando este fluxo funcionar de ponta a ponta:

```text
GM registra conta
    |
    v
verifica e-mail
    |
    v
cria perfil de mestre
    |
    v
configura recebimento Asaas
    |
    v
cria mesa
    |
    v
define R$150/mês
    |
    v
ativa mesa
    |
    v
gera convite
    |
    v
jogador cria conta
    |
    v
aceita convite
    |
    v
escolhe:
CARD_RECURRING
ou
PIX_MANUAL
    |
    v
Asaas processa
    |
    v
webhook atualiza GuildaPlay
    |
    v
split 8% / 92%
    |
    v
GM consulta dashboard
    |
    v
jogador consulta pagamentos
```

Tudo deve funcionar sem frontend.

---

# 2. Escopo da Fase 1

Incluído:

```text
NestJS API
PostgreSQL / Neon
TypeORM ORM
Auth
Roles
GM profiles
Tables
Invitations
Memberships
Billing plans
Asaas
Card recurring
PIX manual
Split
Webhooks
Payments
Refunds básicos
Dashboards
R2 presigned upload
Admin mínimo
Swagger
Logs
Audit logs
Reconciliation
```

Fora do escopo:

```text
Frontend Next.js
Marketplace público
Busca de mesas
Matchmaking
Grupos procurando mestre
Chat
Reviews
Comunidade
Catálogo estilo Ludopedia
Produtos digitais
Marketplace de usados
Pix Automático
App mobile
Discord integration
Foundry integration
IA
```

---

# 3. Regras de execução para o Codex

Antes de qualquer etapa:

1. ler os documentos relevantes;
2. verificar o estado atual do repositório;
3. não reimplementar algo que já existe;
4. não alterar arquitetura sem necessidade;
5. não avançar para a próxima etapa se a atual estiver quebrada;
6. manter controllers finos;
7. manter regras em services;
8. manter persistência em repositories;
9. manter integrações externas em providers;
10. atualizar documentação quando decisão estrutural mudar.

O Codex não deve tentar implementar a Fase 1 inteira em um único prompt.

---

# 4. Estratégia de desenvolvimento

Usar ciclos pequenos:

```text
ler docs
   |
   v
implementar 1 unidade
   |
   v
rodar build
   |
   v
rodar lint
   |
   v
executar verificação manual
   |
   v
corrigir
   |
   v
commit checkpoint
```

Nunca:

```text
implementar 15 módulos
-> só depois tentar compilar
```

---

# 5. Checkpoints

Roadmap dividido em:

```text
M0 — Bootstrap
M1 — Database
M2 — Auth
M3 — GM
M4 — Tables
M5 — Invitations
M6 — Billing Core
M7 — Asaas Foundation
M8 — Card Recurring
M9 — Webhooks
M10 — PIX Manual
M11 — Dashboards
M12 — Refunds/Reconciliation
M13 — R2
M14 — Admin
M15 — Hardening
M16 — Sandbox Complete
M17 — Production Pilot
```

---

# M0 — Bootstrap do projeto

## Objetivo

Ter uma aplicação NestJS limpa, configurada e executável.

---

## M0.1 Criar projeto

Stack:

```text
NestJS
TypeScript
pnpm
```

Estrutura base:

```text
src/
├── app.module.ts
├── main.ts
├── config/
├── common/
└── health/
```

---

## M0.2 Configuração global

Adicionar:

```text
ValidationPipe
Helmet
CORS configurável
API prefix /api
version v1
request ID
exception filter
```

Swagger:

```text
/api/docs
```

---

## M0.3 Environment validation

Criar configuração tipada.

Variáveis iniciais:

```text
NODE_ENV
PORT
DATABASE_URL

JWT_ACCESS_SECRET
ACCESS_TOKEN_TTL
REFRESH_TOKEN_TTL

CORS_ALLOWED_ORIGINS
```

Aplicação deve falhar se variável obrigatória estiver ausente.

---

## M0.4 Health

Implementar:

```text
GET /api/v1/health
```

Response:

```json
{
  "data": {
    "status": "ok"
  }
}
```

---

## Critério de pronto M0

```text
pnpm dev
-> sobe sem erro

GET /api/v1/health
-> 200

/api/docs
-> Swagger abre

pnpm build
-> OK
```

---

## Commit sugerido

```text
feat: bootstrap NestJS API foundation
```

---

# M1 — Database e TypeORM

## Objetivo

Conectar a API ao Neon e criar fundação de persistência.

---

## M1.1 Instalar/configurar TypeORM

Criar:

```text
src/database/
├── database.module.ts
├── database.service.ts
├── schema/
└── migrations/
```

Ou estrutura equivalente consistente com `ARCHITECTURE.md`.

---

## M1.2 Tipos utilitários

Definir padrão de:

```text
UUID
timestamps
money cents
basis points
```

Não criar abstração excessiva.

---

## M1.3 Schema inicial

Primeira migration deve incluir apenas o necessário para auth:

```text
users
user_roles
auth_credentials
auth_sessions
email_verification_tokens
password_reset_tokens
```

Não criar todas as tabelas financeiras imediatamente.

---

## M1.4 Migration workflow

Comandos claros:

```text
generate
migrate
studio
```

Documentar no README futuramente.

---

## M1.5 Seed admin local

Pode existir script de desenvolvimento para criar admin.

Nunca rodar automaticamente em produção.

---

## Critério de pronto M1

```text
migration em banco vazio
-> OK

migration repetida
-> não quebra

API conecta Neon
-> OK

health opcionalmente verifica DB
-> OK
```

---

## Commit sugerido

```text
feat: add Neon PostgreSQL and TypeORM foundation
```

---

# M2 — Authentication

## Objetivo

Ter autenticação completa e segura sem frontend.

---

## M2.1 Users repository

Implementar:

```text
findById
findByEmail
create
update
```

Sem regras financeiras.

---

## M2.2 Password service

Usar:

```text
Argon2id
```

Métodos:

```text
hashPassword
verifyPassword
```

---

## M2.3 Token service

Responsável por:

```text
access JWT
random refresh token
hash opaque token
email verification token
password reset token
```

---

## M2.4 Session service

Implementar:

```text
createSession
rotateRefreshToken
revokeSession
revokeAllSessions
validateRefreshToken
```

---

## M2.5 Register

Endpoint:

```text
POST /auth/register
```

Fluxo conforme `AUTH_SECURITY.md`.

---

## M2.6 Login

Endpoint:

```text
POST /auth/login
```

Retorna access token.

Refresh token via mecanismo definido.

---

## M2.7 Auth guard

Implementar:

```text
JwtStrategy
JwtAuthGuard
@Public
@CurrentUser
```

Preferência:

```text
guard global
```

---

## M2.8 Me

Implementar:

```text
GET /auth/me
```

---

## M2.9 Refresh

Implementar:

```text
POST /auth/refresh
```

Com rotação.

---

## M2.10 Logout

Implementar:

```text
POST /auth/logout
POST /auth/logout-all
```

---

## M2.11 Email verification

Implementar geração e consumo de token.

Para primeira fase, se provider de e-mail ainda não estiver configurado:

- gerar token no backend;
- permitir inspeção somente em desenvolvimento via log seguro específico;
- não criar bypass em produção.

Preferir adicionar provider de e-mail antes do pilot real.

---

## M2.12 Password reset

Implementar:

```text
forgot-password
reset-password
```

Reset revoga sessões.

---

## M2.13 Rate limiting

Aplicar pelo menos em:

```text
login
register
forgot password
verification resend
refresh
```

---

## M2.14 Audit logs foundation

Adicionar tabela:

```text
audit_logs
```

Registrar:

```text
USER_REGISTERED
LOGIN_SUCCEEDED
LOGIN_FAILED
EMAIL_VERIFIED
LOGOUT
PASSWORD_RESET
```

---

## Critério de pronto M2

Via Swagger/cURL:

```text
register
login
me
refresh
logout
logout-all
verify email
forgot password
reset password
```

Todos funcionando.

---

## Commit sugerido

```text
feat: implement secure authentication and sessions
```

---

# M3 — GM Profiles

## Objetivo

Permitir que usuário se torne mestre.

---

## M3.1 Schema

Adicionar:

```text
gm_profiles
gm_payment_accounts
```

Ainda sem integração real Asaas.

---

## M3.2 GM repository

Implementar:

```text
create
findByUserId
findById
update
```

---

## M3.3 GM service

Casos:

```text
createProfile
getMyProfile
updateMyProfile
```

Ao criar:

```text
role GM
```

deve ser concedida internamente.

---

## M3.4 Endpoints

```text
POST  /gm-profiles
GET   /gm-profiles/me
PATCH /gm-profiles/me
```

---

## Critério de pronto M3

Usuário verificado:

```text
POST /gm-profiles
-> GM criado
-> role GM atribuída
```

Outro usuário não consegue alterar o perfil.

---

## Commit sugerido

```text
feat: add game master profiles
```

---

# M4 — Tables

## Objetivo

Mestre consegue criar e administrar mesas.

---

## M4.1 Schema

Adicionar:

```text
game_tables
billing_plans
```

---

## M4.2 Table repository

Métodos:

```text
create
findById
findOwnedByGm
listOwnedByGm
updateOwned
```

---

## M4.3 Tables service

Implementar:

```text
create
listMine
getAccessible
update
activate
pause
archive
```

---

## M4.4 Billing plan automático

Ao criar mesa paga:

```text
criar billing_plan
```

Default:

```text
currency = BRL
interval = MONTHLY
platform_fee_bps = 800
```

---

## M4.5 Endpoints

```text
POST  /tables
GET   /tables/mine
GET   /tables/:tableId
PATCH /tables/:tableId

POST /tables/:tableId/activate
POST /tables/:tableId/pause
POST /tables/:tableId/archive
```

---

## M4.6 Activation guard

No início, mesa pode permanecer:

```text
DRAFT
```

Até `gm_payment_account` estar ativo.

Antes de Asaas estar implementado, activation pode retornar:

```text
GM_PAYMENT_ACCOUNT_NOT_READY
```

Isto é esperado.

---

## Critério de pronto M4

GM consegue:

```text
criar 10 mesas
listar
editar
arquivar
```

Outro GM não consegue acessá-las.

---

## Commit sugerido

```text
feat: add game tables and billing plans
```

---

# M5 — Invitations e Memberships

## Objetivo

Trazer jogadores existentes para as mesas sem marketplace.

---

## M5.1 Schema

Adicionar:

```text
table_invitations
table_members
```

Constraints conforme `DATA_MODEL.md`.

---

## M5.2 Invitation service

Implementar:

```text
create
preview
accept
revoke opcional
```

Token:

```text
raw -> cliente
hash -> banco
```

---

## M5.3 Table Members service

Implementar:

```text
listMembers
removeMember
listMyMemberships
```

---

## M5.4 Transaction de accept

Aceitar convite:

```text
validar token
validar expiry
validar capacity
criar member
marcar invitation used
```

Tudo transacional.

---

## M5.5 Concorrência última vaga

Garantir:

```text
última vaga
2 requests simultâneos

1 -> success
1 -> TABLE_FULL
```

---

## M5.6 Endpoints

```text
POST /tables/:tableId/invitations
GET  /invitations/:token/preview
POST /invitations/:token/accept

GET  /tables/:tableId/members
POST /tables/:tableId/members/:memberId/remove

GET /memberships/mine
```

---

## Critério de pronto M5

Fluxo completo:

```text
GM cria invite
novo usuário aceita
member ACTIVE
GM vê jogador na mesa
```

---

## Commit sugerido

```text
feat: add table invitations and memberships
```

---

# M6 — Billing Core

## Objetivo

Criar domínio financeiro interno antes do Asaas.

---

## M6.1 Schema

Adicionar:

```text
payment_customers
subscriptions
payments
payment_splits
refunds
webhook_events
```

---

## M6.2 Enums

Adicionar enums documentados:

```text
payment method
subscription status
payment status
split status
refund status
webhook status
```

---

## M6.3 Constraints

Obrigatórias:

```text
no duplicate active subscription
unique provider IDs
unique webhook provider event
unique payment per subscription + period
```

---

## M6.4 Billing service

Responsável por:

```text
resolve billing plan
resolve fee
validate GM payment readiness
```

---

## M6.5 Split policy

Implementar função pura:

```text
platform = 800 bps
gm = 9200 bps
```

Sem Asaas ainda.

---

## M6.6 Subscription service skeleton

Casos:

```text
createInternal
cancel
markActive
markPastDue
end
```

---

## M6.7 Payment service skeleton

Casos:

```text
createInternalPayment
markPaid
markOverdue
markFailed
markRefunded
```

Métodos sensíveis devem ser internos.

Não expor:

```text
markPaid endpoint
```

---

## Critério de pronto M6

É possível criar em banco:

```text
mesa
member
subscription PENDING
payment PENDING
split expected
```

sem provider externo.

---

## Commit sugerido

```text
feat: add internal billing domain
```

---

# M7 — Asaas Foundation

## Objetivo

Conectar sandbox Asaas sem ainda implementar todo o fluxo.

---

## M7.1 Config

Adicionar:

```text
ASAAS_API_KEY
ASAAS_BASE_URL
ASAAS_WEBHOOK_SECRET
ASAAS_ENV
PAYMENTS_ENABLED
```

---

## M7.2 Asaas Client

Criar:

```text
AsaasClient
```

Responsável por:

```text
headers
auth
timeout
serialization
error mapping
```

---

## M7.3 Payment Provider interface

Criar contrato definido em `PAYMENTS_ASAAS.md`.

---

## M7.4 Customer

Implementar:

```text
create Asaas customer
get/create GuildaPlay payment_customer
```

Lazy.

---

## M7.5 GM Payment Account

Implementar fluxo de sandbox compatível com o modelo aprovado.

Objetivo técnico:

```text
gm_payment_accounts.provider_wallet_id
gm_payment_accounts.status = ACTIVE
```

---

## M7.6 Endpoints

```text
POST /gm-payment-account/setup
GET  /gm-payment-account
```

---

## M7.7 Activation real

Agora:

```text
POST /tables/:id/activate
```

pode exigir conta Asaas ativa.

---

## Critério de pronto M7

Sandbox:

```text
customer criado
GM payment account conectado
wallet disponível internamente
mesa ativada
```

Nenhum provider ID sensível exposto.

---

## Commit sugerido

```text
feat: integrate Asaas sandbox foundation
```

---

# M8 — Card Recurring

## Objetivo

Criar primeira assinatura recorrente em cartão.

---

## M8.1 Subscription endpoint

Implementar:

```text
POST /subscriptions
```

com:

```text
CARD_RECURRING
```

---

## M8.2 Pre-checks

Validar:

```text
user authenticated
email verified
membership ACTIVE
table ACTIVE
billing plan ACTIVE
GM payment account ACTIVE
no existing subscription
```

---

## M8.3 Internal first

Antes de chamar Asaas:

```text
create subscription PENDING
```

---

## M8.4 Customer

Resolver/criar:

```text
payment_customer
```

---

## M8.5 Checkout

Criar recurring checkout Asaas.

Configurar:

```text
amount
customer
recurrence
externalReference
GM split
callbacks
```

conforme API atual do Asaas.

---

## M8.6 Persist checkout reference

Guardar referência necessária.

Não ativar subscription ainda.

---

## M8.7 Idempotency

Dois requests iguais não podem gerar duas subscriptions.

---

## Critério de pronto M8

Sandbox:

```text
member
-> POST /subscriptions CARD_RECURRING
-> checkout URL
-> checkout abre no Asaas
```

Ainda não considerar completo até M9.

---

## Commit sugerido

```text
feat: add recurring card checkout flow
```

---

# M9 — Asaas Webhooks

## Objetivo

Tornar fluxo financeiro confiável.

---

## M9.1 Endpoint

Implementar:

```text
POST /webhooks/asaas
```

---

## M9.2 Validate provider auth

Validar segredo/token configurado.

---

## M9.3 Persist first

Fluxo:

```text
validate
insert webhook_event
duplicate?
  -> 200
process
update status
```

---

## M9.4 Handler architecture

Separar:

```text
checkout handler
subscription handler
payment handler
```

---

## M9.5 Checkout events

Tratar eventos necessários.

---

## M9.6 Subscription events

Tratar:

```text
created
updated
inactivated
deleted
split issues
```

---

## M9.7 Payment events

Tratar:

```text
created
confirmed
received
overdue
failed
refunded
split done
```

---

## M9.8 Event ordering

Handlers devem tolerar:

```text
out-of-order
duplicate
missing local resource temporarily
```

---

## M9.9 First card payment

Ao confirmar primeira cobrança:

```text
payment PAID
subscription ACTIVE
```

---

## M9.10 Split

Ao confirmar split:

```text
payment_splits CONFIRMED
```

---

## Critério de pronto M9

Sandbox:

```text
checkout
-> payment
-> webhook
-> subscription ACTIVE
-> payment PAID
-> split CONFIRMED
```

E evento duplicado não gera efeito duplicado.

---

## Commit sugerido

```text
feat: process Asaas webhooks idempotently
```

---

# M10 — Pix Manual

## Objetivo

Permitir mensalidade via Pix gerado pela plataforma.

---

## M10.1 Create PIX subscription

`POST /subscriptions` com:

```text
PIX_MANUAL
```

Cria subscription interna.

---

## M10.2 First payment

Para primeira versão:

```text
criar primeira cobrança imediatamente
```

---

## M10.3 Create Asaas PIX payment

Payload:

```text
customer
PIX
amount
dueDate
externalReference
split
```

---

## M10.4 QR code

Implementar:

```text
GET /payments/:id/pix
```

---

## M10.5 Scheduler

Adicionar job para ciclos seguintes.

Não depender de process lifecycle instável em produção.

Deployment final será decidido em `DEPLOYMENT_OPERATIONS.md`.

---

## M10.6 Duplicate protection

Constraint:

```text
subscription_id + period_start
```

---

## M10.7 Overdue

Webhook:

```text
payment OVERDUE
subscription PAST_DUE
```

---

## M10.8 Paid

Webhook:

```text
payment PAID
subscription ACTIVE
next_due_date atualizado
```

---

## Critério de pronto M10

Sandbox:

```text
create PIX subscription
-> payment created
-> QR returned
-> pay sandbox
-> webhook
-> PAID
-> split
```

---

## Commit sugerido

```text
feat: add monthly PIX billing flow
```

---

# M11 — Dashboards API

## Objetivo

Entregar valor real ao mestre e jogador pela API.

---

## M11.1 GM dashboard

Implementar:

```text
GET /gm/dashboard
```

Dados:

```text
active tables
active players
expected gross
paid gross
pending gross
overdue gross
```

---

## M11.2 Table payment summary

Implementar:

```text
GET /tables/:id/payments/summary
GET /tables/:id/payments
```

---

## M11.3 Player dashboard

Implementar:

```text
GET /player/dashboard
```

---

## M11.4 Payment history

Implementar:

```text
GET /payments/mine
GET /payments/:id
```

---

## M11.5 Subscriptions list

Implementar:

```text
GET /subscriptions/mine
GET /subscriptions/:id
```

---

## Critério de pronto M11

GM consegue enxergar via Swagger:

```text
Mesa A
João  PAID
Maria PAID
Pedro PENDING
Lucas OVERDUE
```

Sem consultar painel Asaas.

---

## Commit sugerido

```text
feat: add financial dashboards
```

---

# M12 — Cancellation, Refunds e Reconciliation

## Objetivo

Completar ciclo operacional básico.

---

## M12.1 Cancel subscription

Implementar:

```text
POST /subscriptions/:id/cancel
```

Default:

```text
cancelAtPeriodEnd = true
```

---

## M12.2 GM end subscription

Implementar:

```text
POST /tables/:tableId/members/:memberId/end-subscription
```

---

## M12.3 Refund service

Criar:

```text
refund PENDING
-> call provider
-> webhook/reconciliation
-> CONFIRMED
```

---

## M12.4 Refund endpoint

MVP:

```text
ADMIN only
```

---

## M12.5 Reconciliation service

Implementar:

```text
reconcilePayment
reconcileSubscription
```

---

## M12.6 Reconciliation candidates

Identificar:

```text
PENDING velho
split PENDING velho
webhook FAILED
subscription PENDING velha
```

---

## M12.7 Manual admin reconcile

Endpoints:

```text
POST /admin/payments/:id/reconcile
POST /admin/subscriptions/:id/reconcile
```

---

## Critério de pronto M12

É possível:

```text
cancelar
reembolsar
recuperar estado após webhook perdido
```

sem alterar registros manualmente no banco.

---

## Commit sugerido

```text
feat: add cancellation refunds and reconciliation
```

---

# M13 — Cloudflare R2

## Objetivo

Adicionar upload seguro para assets.

---

## M13.1 Config

Variáveis:

```text
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
```

---

## M13.2 Presigned upload

Implementar:

```text
POST /uploads/avatar/presign
POST /tables/:id/cover/presign
```

---

## M13.3 Validation

Validar:

```text
mime
size
ownership
purpose
```

---

## M13.4 Confirm

Implementar:

```text
POST /uploads/confirm
```

---

## M13.5 Security

API escolhe:

```text
object key
```

Cliente não pode controlar path arbitrariamente.

---

## Critério de pronto M13

Via cliente HTTP:

```text
get presigned URL
upload direto R2
confirm
avatar/table cover updated
```

---

## Commit sugerido

```text
feat: add secure R2 uploads
```

---

# M14 — Admin mínimo

## Objetivo

Ter ferramentas de operação antes do beta.

---

## M14.1 Admin users

```text
GET /admin/users
```

---

## M14.2 GM payment accounts

```text
GET /admin/gm-payment-accounts
```

---

## M14.3 Webhooks

```text
GET /admin/webhooks
GET /admin/webhooks/:id
POST /admin/webhooks/:id/reprocess
```

---

## M14.4 Audit logs

```text
GET /admin/audit-logs
```

---

## M14.5 Security

Todos:

```text
ADMIN only
audit mutative actions
```

---

## Critério de pronto M14

Admin consegue investigar:

```text
"pagamento do jogador não apareceu"
```

sem abrir banco manualmente.

---

## Commit sugerido

```text
feat: add minimal admin operations
```

---

# M15 — Hardening

## Objetivo

Preparar API para sandbox completo e produção.

---

## M15.1 Review ownership

Revisar todos endpoints privados.

Perguntar:

```text
usuário A consegue acessar recurso B?
```

---

## M15.2 Review DTOs

Garantir:

```text
whitelist
forbidNonWhitelisted
```

---

## M15.3 Review secrets

Buscar no repo:

```text
API keys
wallet IDs hardcoded
JWT secrets
database URLs
```

---

## M15.4 Review money

Buscar por:

```text
float
Number(amount)
amount * 0.08
```

Garantir uso correto.

---

## M15.5 Review payment endpoints

Não pode existir:

```text
mark paid
set fee
set wallet
set status
```

em endpoints comuns.

---

## M15.6 Review webhook idempotency

Simular duplicata.

---

## M15.7 Review logging

Garantir que não vazem:

```text
tokens
passwords
API keys
card data
```

---

## M15.8 Review rate limits

Auth e operações sensíveis.

---

## M15.9 Review Swagger

Todos endpoints documentados.

---

## Critério de pronto M15

Checklist sem falha crítica.

---

## Commit sugerido

```text
chore: harden MVP API security and payments
```

---

# M16 — Sandbox Complete

## Objetivo

Validar todo fluxo antes de produção.

---

## M16.1 Criar cenário sandbox

### GM

```text
gm@example.com
```

### Player 1

```text
card@example.com
```

### Player 2

```text
pix@example.com
```

Mesa:

```text
Curse of Strahd
R$150/mês
4 vagas
```

---

## M16.2 Card scenario

Executar:

```text
register GM
verify
create gm profile
setup Asaas
create table
activate
invite
register player
accept
create CARD_RECURRING
pay checkout
receive webhook
verify PAID
verify split
verify dashboard
```

---

## M16.3 Pix scenario

Executar:

```text
invite second player
accept
create PIX_MANUAL
get QR
pay sandbox
receive webhook
verify PAID
verify split
verify dashboard
```

---

## M16.4 Failure scenario

Executar:

```text
payment failed
-> PAST_DUE
```

---

## M16.5 Overdue scenario

Executar:

```text
PIX overdue
-> OVERDUE
```

---

## M16.6 Cancel scenario

Executar:

```text
cancelAtPeriodEnd
-> next cycle stopped
```

---

## M16.7 Refund scenario

Executar:

```text
refund
-> provider
-> webhook
-> status
```

---

## M16.8 Duplicate webhook

Enviar mesmo evento novamente.

Resultado:

```text
no duplicate effects
```

---

## M16.9 Reconciliation

Simular estado inconsistente.

Executar:

```text
admin reconcile
```

Estado corrigido.

---

## Critério de pronto M16

Todos os fluxos críticos confirmados no sandbox.

Só então iniciar produção.

---

## Commit sugerido

```text
chore: validate complete Asaas sandbox flow
```

---

# M17 — Production Pilot

## Objetivo

Primeira transação real com risco controlado.

---

## M17.1 Pré-requisitos

Antes de produção:

```text
Asaas production approved
KYC/marketplace flow validado
production secrets
production DB
production webhook
HTTPS
logs
admin tools
refund process
support contact
terms/privacy minimum
```

---

## M17.2 Feature flag

Começar:

```text
PAYMENTS_ENABLED=false
```

Deploy produção.

Validar health.

Depois:

```text
PAYMENTS_ENABLED=true
```

---

## M17.3 Ordem do pilot

Não migrar 10 mesas de uma vez.

Sequência:

```text
1 mestre
1 mesa
1 jogador
```

Depois:

```text
1 mesa
4 jogadores
```

Depois:

```text
3 mesas
~12 jogadores
```

Depois:

```text
10 mesas
~40 jogadores
```

---

## M17.4 Primeira transação

Registrar manualmente:

```text
user
table
subscription
payment
provider fee
platform fee
GM split
webhook IDs
timestamps
```

Confirmar no Asaas e na GuildaPlay.

---

## M17.5 Primeiro mês

Acompanhar:

```text
payment success rate
failed payments
overdue payments
webhook failures
refunds
split failures
support issues
```

---

## Critério de pronto M17

```text
10 mesas reais
~40 jogadores
pagamentos processados
dashboard coerente
split funcionando
sem operação manual diária
```

Neste ponto:

```text
FASE 1 MVP = CONCLUÍDA
```

---

# 6. Ordem resumida

```text
M0  Bootstrap
 |
M1  Database
 |
M2  Auth
 |
M3  GM Profiles
 |
M4  Tables
 |
M5  Invitations/Members
 |
M6  Billing Domain
 |
M7  Asaas Foundation
 |
M8  Card Recurring
 |
M9  Webhooks
 |
M10 PIX Manual
 |
M11 Dashboards
 |
M12 Cancel/Refund/Reconcile
 |
M13 R2
 |
M14 Admin
 |
M15 Hardening
 |
M16 Sandbox
 |
M17 Production Pilot
```

---

# 7. O que não deve bloquear o MVP

Não esperar para:

```text
design perfeito
frontend
marketplace
mobile
IA
reviews
chat
social
```

Se o fluxo financeiro funciona via Swagger, a API está cumprindo seu papel.

---

# 8. Prioridade absoluta

Ordem de importância:

```text
1. correção financeira
2. segurança
3. idempotência
4. consistência dos dados
5. observabilidade
6. DX/Swagger
7. performance
```

Performance não deve ser otimizada prematuramente.

---

# 9. Definição de Done por módulo

Um módulo só está pronto quando:

```text
build passa
lint passa
migration funciona
Swagger documenta
happy path funciona
error path principal funciona
ownership foi verificado
audit/log existe quando necessário
docs continuam coerentes
```

---

# 10. Checkpoints recomendados para prompts do Codex

Cada prompt do Codex deve cobrir no máximo um checkpoint coerente.

Exemplos bons:

```text
Implemente M0.1 até M0.4.
Leia os docs antes.
Não avance para M1.
```

```text
Implemente M2.1 até M2.5.
Não implemente refresh ainda.
```

```text
Implemente M9.1 até M9.4.
Não adicione handlers de Pix ainda.
```

Exemplo ruim:

```text
Implemente toda a API GuildaPlay.
```

---

# 11. Regra de correção

Quando encontrar bug:

```text
corrigir etapa atual
```

antes de adicionar nova feature.

Não criar workaround em camada errada.

Exemplo:

```text
problema no webhook
```

Não corrigir no frontend.

---

# 12. Mudanças de arquitetura

Se durante implementação surgir necessidade de mudar:

```text
schema
auth strategy
payment flow
provider abstraction
```

primeiro:

1. explicar a necessidade;
2. atualizar MD relevante;
3. implementar migration compatível;
4. só depois alterar código.

---

# 13. Schema migrations

Nunca editar migration já aplicada em ambiente compartilhado.

Criar nova migration.

Durante início local, antes de qualquer ambiente compartilhado, resets podem ser aceitos.

Após sandbox compartilhado:

```text
append-only migrations
```

---

# 14. Dados financeiros

Nunca corrigir erro financeiro com:

```text
DELETE FROM payments
```

Usar:

```text
reconciliation
refund
status transition
audit
```

---

# 15. Post-MVP

Somente depois de M17 concluído:

```text
Fase 2
Marketplace público de mesas

Fase 3
Groups / procurando mestre

Fase 4
Catálogo/comunidade

Fase 5
Produtos digitais

Fase 6
Usados
```

---

# 16. Primeiro marco comercial

Meta inicial:

```text
10 mesas pagantes
```

Esperado, com média atual:

```text
10 mesas
x 4 jogadores
x R$150/mês

= R$6.000 GMV/mês
```

Com taxa padrão GuildaPlay:

```text
8%
```

A receita real depende das taxas e base líquida utilizada pelo Asaas.

Não usar projeção como dado contábil real.

---

# 17. Segundo marco

Após estabilidade:

```text
20 mesas pagantes
```

Somente então começar a avaliar:

```text
aquisição paga
marketing
marketplace público
```

---

# 18. Métricas desde o pilot

Persistir/medir futuramente:

```text
active paid tables
active paying players
GMV
platform revenue
payment success rate
overdue rate
refund rate
churn
webhook failure rate
```

A métrica principal do produto inicial:

```text
ACTIVE PAID TABLES
```

---

# 19. Final Definition of Done — Fase 1

Fase 1 termina quando:

```text
[ ] API NestJS em produção
[ ] banco Neon produção
[ ] auth segura
[ ] GM profiles
[ ] GM Asaas ready
[ ] mesas
[ ] billing plans
[ ] convites
[ ] memberships
[ ] card recurring
[ ] Pix manual
[ ] split 8%
[ ] webhooks idempotentes
[ ] payments
[ ] cancellation
[ ] refunds operacionais
[ ] reconciliation
[ ] GM dashboard API
[ ] player dashboard API
[ ] admin mínimo
[ ] R2
[ ] Swagger
[ ] audit logs
[ ] 1 transação real validada
[ ] 1 mesa completa validada
[ ] 3 mesas validadas
[ ] 10 mesas operando
```

Depois disso:

```text
MVP financeiro GuildaPlay = validado operacionalmente
```

e a próxima fase pode transformar o produto em marketplace.

---

# 20. Regra final para o Codex

O Codex deve sempre perguntar ao roadmap:

```text
"Qual é o próximo milestone incompleto?"
```

e trabalhar apenas nele.

Não antecipar features.

Não implementar Fase 2 durante Fase 1.

Não sacrificar segurança financeira por velocidade.

O objetivo desta fase não é construir a plataforma final.

É provar que:

```text
Mestres conseguem administrar mesas
+
Jogadores conseguem pagar
+
GuildaPlay consegue cobrar 8%
+
Mestre recebe automaticamente
+
Tudo fica rastreável na API
```

Quando isso funcionar com as primeiras mesas reais, a Fase 1 estará concluída.
