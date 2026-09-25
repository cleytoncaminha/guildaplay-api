# GuildaPlay API — Deployment & Operations

> Operação, ambientes e deploy da Fase 1 da API NestJS da GuildaPlay.
>
> Ler junto com:
>
> - `docs/ARCHITECTURE.md`
> - `docs/DATA_MODEL.md`
> - `docs/AUTH_SECURITY.md`
> - `docs/PAYMENTS_ASAAS.md`
> - `docs/API_CONTRACTS.md`
> - `docs/MVP_ROADMAP.md`
>
> **Status:** Fase 1 — API-first  
> **Objetivo:** colocar a API em produção com segurança, observabilidade e capacidade de recuperação.
>
> Este documento não define frontend.

---

# 1. Objetivo

Definir:

- ambientes;
- estratégia de deploy;
- configuração da API NestJS;
- Neon;
- Cloudflare R2;
- Asaas sandbox e produção;
- variáveis de ambiente;
- secrets;
- migrations;
- health checks;
- logs;
- observabilidade;
- jobs;
- cron;
- retries;
- backups;
- rollback;
- incidentes;
- go-live;
- operação do beta.

---

# 2. Ambientes

Existirão no mínimo:

```text
development
staging
production
```

## development

Uso:

- máquina local;
- Codex;
- desenvolvimento diário.

Integrações:

```text
Neon dev
Asaas sandbox
R2 dev
```

---

## staging

Uso:

- validação integrada;
- sandbox compartilhado;
- testes manuais;
- reprodução de problemas.

Integrações:

```text
Neon staging
Asaas sandbox
R2 staging
```

Staging nunca deve processar dinheiro real.

---

## production

Uso:

- usuários reais;
- dinheiro real;
- webhooks reais.

Integrações:

```text
Neon production
Asaas production
R2 production
```

---

# 3. Separação de credenciais

Nunca compartilhar entre ambientes:

```text
DATABASE_URL
JWT secrets
Asaas keys
R2 credentials
webhook secrets
```

Cada ambiente possui seus próprios valores.

---

# 4. Deploy target da API

A API NestJS deve rodar em ambiente compatível com:

- processo Node persistente;
- HTTP server;
- webhooks;
- jobs;
- logs;
- migrations externas;
- HTTPS via proxy/plataforma.

A decisão de provider pode mudar.

A arquitetura não deve depender de recurso proprietário do host.

Exemplos aceitáveis:

```text
Render
Railway
Fly.io
Cloud Run
ECS/Fargate
VM
container host equivalente
```

O deploy não deve depender do Vercel para a API NestJS.

Vercel fica reservado ao frontend futuro.

---

# 5. Containerização

Preferência:

```text
Docker
```

Imagem deve:

1. instalar dependências;
2. compilar NestJS;
3. executar build de produção;
4. rodar como usuário não-root;
5. expor apenas porta necessária.

Estrutura conceitual:

```text
build stage
    |
    v
production stage
```

Não incluir:

- `.env`;
- arquivos temporários;
- cache;
- docs sensíveis;
- credenciais.

---

# 6. Processo de build

Pipeline mínimo:

```text
install
lint
build
migration check
image build
deploy
health check
```

Quando testes automatizados existirem:

```text
tests
```

entram antes do deploy.

---

# 7. Package manager

Usar:

```text
pnpm
```

Commitar:

```text
pnpm-lock.yaml
```

Deploy deve respeitar lockfile.

Não executar upgrade implícito de dependências no deploy.

---

# 8. Node.js

Definir versão explícita.

Exemplo:

```text
Node.js 22 LTS
```

Usar:

- `.nvmrc`;
- `engines`;
- Docker base compatível.

Não deixar host escolher versão livremente.

---

# 9. Start command

Produção:

```text
node dist/main.js
```

ou equivalente.

Não executar:

```text
nest start --watch
```

em produção.

---

# 10. Runtime configuration

Toda configuração vem de env.

Nunca usar:

```text
if production then hardcode x
```

em diversos módulos.

Centralizar em:

```text
ConfigModule
```

com validação.

---

# 11. Variáveis gerais

Exemplo:

```text
NODE_ENV
PORT
APP_BASE_URL

LOG_LEVEL

CORS_ALLOWED_ORIGINS

DATABASE_URL

JWT_ACCESS_SECRET
ACCESS_TOKEN_TTL
REFRESH_TOKEN_TTL

ASAAS_ENV
ASAAS_BASE_URL
ASAAS_API_KEY
ASAAS_WEBHOOK_SECRET

R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_PUBLIC_BASE_URL

PAYMENTS_ENABLED
PIX_PAYMENTS_ENABLED
REFUNDS_ENABLED

DEFAULT_PLATFORM_FEE_BPS
```

---

# 12. `.env.example`

Pode existir:

```text
.env.example
```

com nomes das variáveis.

Nunca colocar valores reais.

---

# 13. Secret management

Produção deve usar secret manager do host.

Não armazenar secrets em:

- repositório;
- README;
- MD;
- issue;
- log;
- screenshot;
- frontend.

---

# 14. Rotação de secrets

Plano mínimo:

## JWT

Troca planejada exige estratégia de invalidação.

MVP pode invalidar sessões após rotação.

## Asaas

Se key for comprometida:

```text
revogar
gerar nova
atualizar production secret
redeploy
auditar ações
```

## R2

Rotacionar access keys sem downtime quando possível.

---

# 15. Neon

A API é a única camada autorizada a acessar o banco.

Produção:

```text
NestJS -> Neon
```

Não:

```text
frontend -> Neon
```

---

# 16. Neon por ambiente

Preferência:

```text
guildaplay-dev
guildaplay-staging
guildaplay-production
```

Pode usar projetos ou branches conforme custo/operação.

Production deve ficar isolado.

---

# 17. Connection pooling

Usar connection string adequada a workloads server-side.

Respeitar limits do Neon.

Não abrir nova conexão manual a cada request.

TypeORM deve trabalhar sobre pool/client reutilizável.

---

# 18. SSL

Produção:

```text
SSL obrigatório
```

Não desabilitar validação TLS para "corrigir conexão".

---

# 19. Migrations

Migrations são parte do deploy.

Regra:

```text
código que depende de schema
não entra antes da migration necessária
```

---

# 20. Migration workflow

Desenvolvimento:

```text
generate
review
apply
```

Staging:

```text
apply migration
deploy
validate
```

Production:

```text
backup/check
apply migration
deploy compatible code
health check
```

---

# 21. Backward-compatible migrations

Preferir deploys compatíveis.

Exemplo:

Para renomear coluna:

```text
1. adicionar coluna nova
2. código escreve nas duas ou migra
3. backfill
4. código passa a usar nova
5. remover antiga em migration futura
```

Evitar:

```text
DROP COLUMN
+
deploy novo simultâneo sem compatibilidade
```

---

# 22. Migrations destrutivas

Requerem revisão manual.

Exemplos:

```text
DROP
TRUNCATE
ALTER TYPE arriscado
NOT NULL sem backfill
```

Nunca aplicar automaticamente sem verificar impacto.

---

# 23. Dados financeiros

Nunca apagar tabelas financeiras em produção.

Especialmente:

```text
payments
subscriptions
refunds
payment_splits
webhook_events
audit_logs
```

---

# 24. Backup

Neon possui mecanismos próprios de restore/branching conforme plano.

Além disso:

- documentar restore;
- saber RPO/RTO real;
- testar recuperação antes de depender disso.

MVP deve ter ao menos procedimento documentado de restauração.

---

# 25. R2

Usos do MVP:

```text
avatars
table covers
```

Não armazenar:

- dados de cartão;
- secrets;
- documentos financeiros sensíveis;
- dumps de banco.

---

# 26. Buckets

Preferência:

```text
guildaplay-dev
guildaplay-staging
guildaplay-prod
```

ou buckets separados logicamente equivalentes.

---

# 27. R2 object naming

Formato:

```text
avatars/<userId>/<uuid>.webp
table-covers/<tableId>/<uuid>.webp
```

Nunca permitir path arbitrário do usuário.

---

# 28. R2 access

Upload:

```text
presigned URL
```

Leitura:

pode ser:

```text
public CDN
```

para assets públicos ou:

```text
signed URL
```

se privado.

Avatar/capa podem ser públicos.

---

# 29. Cache de assets

Para assets versionados por UUID:

```text
Cache-Control: public, max-age=31536000, immutable
```

Quando trocar imagem:

```text
nova key
```

não sobrescrever necessariamente a antiga.

---

# 30. Cleanup de assets

Não bloquear MVP por cleanup complexo.

Futuramente job pode remover objetos órfãos.

Nunca apagar imediatamente asset antigo antes de confirmar novo upload.

---

# 31. Asaas — ambientes

Development:

```text
sandbox
```

Staging:

```text
sandbox
```

Production:

```text
production
```

Código deve usar:

```text
ASAAS_ENV
```

para impedir mistura acidental.

---

# 32. Proteção contra chave errada

No startup:

Se:

```text
NODE_ENV=production
```

e:

```text
ASAAS_ENV=sandbox
```

com pagamentos habilitados:

```text
falhar startup
```

ou alertar/bloquear conforme policy.

Também impedir produção com URL sandbox.

---

# 33. Feature flags financeiras

Produção inicial:

```text
PAYMENTS_ENABLED=false
PIX_PAYMENTS_ENABLED=false
REFUNDS_ENABLED=false
```

Depois habilitar progressivamente.

---

# 34. Go-live financeiro

Sequência:

```text
deploy production
health OK
DB OK
webhook endpoint OK
Asaas production config OK
PAYMENTS_ENABLED=false
```

Depois:

```text
habilitar PAYMENTS_ENABLED
```

para grupo controlado.

---

# 35. Webhook URL

Produção:

```text
https://api.guildaplay.com/api/v1/webhooks/asaas
```

Deve ser:

- HTTPS;
- estável;
- sem auth de usuário;
- protegido por segredo/provider auth;
- rápido;
- idempotente.

---

# 36. Webhook response time

Webhook não deve executar trabalho pesado síncrono desnecessário.

Fluxo ideal MVP:

```text
validate
persist
process quick
respond
```

Se processamento crescer:

```text
persist
enqueue
respond
worker
```

pode ser adotado depois.

---

# 37. Webhook availability

Endpoint deve estar disponível 24/7.

Deploy deve minimizar downtime.

Evitar:

```text
migration longa
+
API offline
```

---

# 38. Webhook retries

Assumir retries do provider.

API deve suportar duplicata.

Nunca tratar duplicata como 500.

---

# 39. Jobs

Fase 1 necessita jobs para:

```text
PIX monthly generation
reconciliation
cleanup tokens
optional stale data cleanup
```

---

# 40. Job execution model

Não assumir cron confiável dentro de processo web sem validar host.

Três opções:

```text
A. process persistente NestJS + @nestjs/schedule
B. worker separado
C. cron externo chamando endpoint interno protegido
```

Preferência inicial depende do host.

---

# 41. Se usar `@nestjs/schedule`

Somente quando:

- uma única instância executa job;
- ou existe lock distribuído;
- ou duplicate-safe.

Jobs financeiros devem ser duplicate-safe de qualquer forma.

---

# 42. Multi-instance

Se API escalar horizontalmente:

```text
2 instâncias
```

e ambas rodam cron:

```text
job pode rodar duas vezes
```

Então:

- unique constraints;
- advisory lock;
- DB lock;
- scheduler externo;
- worker único.

devem impedir duplicidade.

---

# 43. PIX job idempotency

Mesmo se job rodar duas vezes:

```text
UNIQUE(subscription_id, period_start)
```

impede dupla cobrança interna.

Antes de provider call:

```text
verificar provider_payment_id
```

e reconciliar se necessário.

---

# 44. Reconciliation job

Executar periodicamente.

Exemplo inicial:

```text
a cada 15 ou 30 minutos
```

somente para candidatos.

Não fazer full scan pesado.

---

# 45. Token cleanup

Pode rodar diariamente:

```text
email verification expirados
password reset expirados
auth sessions expiradas
```

Pode marcar/limpar conforme policy.

Não apagar audit logs.

---

# 46. Timezone dos jobs

Jobs financeiros devem operar em:

```text
UTC
```

Regras de due date usam `date`.

Não depender do timezone do servidor.

---

# 47. Logging

Produção deve usar logs estruturados.

Formato recomendado:

```json
{
  "level": "info",
  "message": "payment webhook processed",
  "requestId": "...",
  "paymentId": "...",
  "eventType": "PAYMENT_CONFIRMED"
}
```

---

# 48. Log levels

```text
error
warn
info
debug
```

Production default:

```text
info
```

Debug somente temporariamente.

---

# 49. Nunca logar

```text
password
passwordHash
accessToken
refreshToken
JWT secret
Asaas API key
webhook secret
R2 secret
card number
CVV
raw sensitive payload
```

---

# 50. Request logs

Registrar:

```text
method
route
status
duration
requestId
userId quando seguro
```

Não registrar body completo de endpoints sensíveis.

---

# 51. Error tracking

MVP deve usar ao menos uma solução de error tracking quando produção iniciar.

Exemplos:

```text
Sentry
Better Stack
Axiom
equivalente
```

Pode iniciar em free tier.

---

# 52. Métricas

Inicialmente, logs + banco podem bastar.

Mas acompanhar:

```text
HTTP 5xx
webhook failures
payment failures
provider latency
DB errors
reconciliation count
```

---

# 53. Alertas

Alertas mínimos:

```text
API down
5xx spike
webhook failures
split divergence
provider unavailable
DB unavailable
```

Não alertar por cada pagamento recusado individualmente como incidente técnico.

---

# 54. Health endpoint

```text
GET /api/v1/health
```

Rápido.

Response:

```json
{
  "data": {
    "status": "ok"
  }
}
```

---

# 55. Readiness

Recomendado:

```text
GET /api/v1/health/readiness
```

Pode verificar:

- DB;
- configuração mínima.

Não precisa consultar Asaas em toda chamada.

---

# 56. Liveness

Pode ser:

```text
GET /api/v1/health/liveness
```

Verifica processo.

Não depender de serviço externo.

---

# 57. Provider health

Não incluir Asaas no liveness.

Pode existir endpoint interno ou metric específica.

---

# 58. Graceful shutdown

NestJS deve habilitar:

```text
enableShutdownHooks()
```

Ao receber SIGTERM:

```text
parar aceitar trabalho novo
finalizar request em andamento
fechar conexão DB
encerrar
```

---

# 59. Deployment strategy

Preferir:

```text
rolling deploy
```

ou estratégia equivalente sem downtime.

---

# 60. Deploy order

Para mudança schema-compatible:

```text
migration
deploy
health
```

Para mudança complexa:

```text
expand schema
deploy compatible code
backfill
switch code
contract schema later
```

---

# 61. Rollback

Rollback de código deve ser possível sem rollback destrutivo de banco.

Por isso migrations precisam ser backward-compatible.

---

# 62. Migration rollback

Não depender de:

```text
down migration automática
```

em produção financeira.

Se migration causar problema:

```text
forward fix
```

muitas vezes é mais seguro.

---

# 63. Release tagging

Usar tags:

```text
v0.1.0
v0.2.0
```

ou build SHA.

Logs devem permitir identificar versão em execução.

---

# 64. Version endpoint

Opcional:

```text
GET /api/v1/version
```

Pode retornar:

```json
{
  "data": {
    "version": "0.1.0",
    "commit": "abc123"
  }
}
```

Não expor detalhes de infraestrutura.

---

# 65. CI

Pipeline mínimo:

```text
install
lint
build
```

Quando disponível:

```text
tests
```

Não fazer deploy se build falhar.

---

# 66. CD

Staging:

```text
auto deploy main/develop branch conforme fluxo
```

Production:

preferir:

```text
manual promotion
```

durante MVP financeiro.

---

# 67. Branch strategy

Simples:

```text
main
feature/*
```

Pode existir:

```text
staging
```

se útil.

Evitar GitFlow pesado para projeto solo.

---

# 68. Pull/commit discipline

Antes de deploy financeiro:

- revisar diff;
- checar migrations;
- checar env changes;
- checar Asaas impact.

---

# 69. Config changes

Mudança de env deve ser registrada em:

```text
.env.example
DEPLOYMENT_OPERATIONS.md
```

sem valor real.

---

# 70. Database indexes

Antes do pilot:

confirmar índices em:

```text
users.email
provider IDs
webhook provider event ID
subscriptions
payments
table membership
invitations
```

---

# 71. Query performance

Não otimizar tudo antes.

Mas dashboard de GM não deve fazer:

```text
N+1 por jogador
```

Verificar queries principais.

---

# 72. Pagination

Admin lists e history devem sempre paginar.

Não carregar:

```text
todos payments
```

sem limite.

---

# 73. Rate limiting em produção

Ativar limites definidos em `AUTH_SECURITY.md`.

Provider webhook deve ficar fora do limiter comum ou com policy própria.

---

# 74. Reverse proxy trust

Se host usa proxy:

configurar corretamente `trust proxy`.

Importante para:

- IP;
- secure cookies;
- rate limit.

Não confiar em `X-Forwarded-For` de qualquer origem sem configuração do host.

---

# 75. CORS production

Exemplo futuro:

```text
https://app.guildaplay.com
```

Staging:

```text
https://staging.guildaplay.com
```

Local:

```text
http://localhost:3000
```

Nunca wildcard com credentials.

---

# 76. Domain strategy

Futuro:

```text
app.guildaplay.com
api.guildaplay.com
```

Pode começar com domínio temporário do host.

Antes do pilot real, preferir domínio estável para webhook.

---

# 77. DNS

API domain:

```text
api.guildaplay.com
```

HTTPS gerenciado pelo host/proxy.

Monitorar renovação automática.

---

# 78. Email provider

Antes do pilot real será necessário provider para:

```text
verification
password reset
payment notifications futuramente
```

Pode usar:

```text
Resend
Postmark
SES
equivalente
```

No development pode existir adapter fake.

---

# 79. Email adapter

Criar interface:

```text
EmailProvider
```

Não espalhar calls de vendor.

---

# 80. Email sandbox

Staging não deve enviar e-mail real para usuários externos por acidente.

Pode usar:

- provider test mode;
- allowlist;
- mailbox sandbox.

---

# 81. Notifications

Push/chat fora do MVP.

Email suficiente para operação inicial.

---

# 82. Admin access

Admin em produção deve ser criado por processo controlado.

Não existe:

```text
signup as admin
```

---

# 83. Admin bootstrap

Pode existir script manual:

```text
pnpm admin:create
```

Executado com acesso controlado.

Auditável.

---

# 84. Production DB access

Acesso manual ao banco deve ser raro.

Nunca corrigir incidentes comuns com SQL ad hoc se existe caso de uso/admin.

---

# 85. SQL manual

Se inevitável:

1. backup;
2. documentar;
3. executar transação;
4. auditar;
5. criar correção permanente no sistema.

---

# 86. Incident severity

Exemplo:

## SEV1

```text
cobrança duplicada
split incorreto
vazamento de segredo
API inteira indisponível
```

## SEV2

```text
webhooks falhando
Pix indisponível
dashboard financeiro incorreto
```

## SEV3

```text
upload de avatar quebrado
erro visual em Swagger
```

---

# 87. Incidente financeiro

Se houver suspeita de cobrança duplicada:

```text
1. desabilitar PAYMENTS_ENABLED se necessário
2. identificar provider IDs
3. parar criação nova
4. reconciliar
5. refund quando aplicável
6. documentar causa
7. corrigir
8. reativar
```

---

# 88. Kill switch

`PAYMENTS_ENABLED=false`

deve bloquear novas operações financeiras iniciadas pela GuildaPlay.

Não deve impedir:

```text
receber webhooks
reconciliar pagamentos existentes
consultar histórico
```

Isso é crítico.

---

# 89. Pix kill switch

```text
PIX_PAYMENTS_ENABLED=false
```

Bloqueia novas cobranças Pix.

Webhooks existentes continuam.

---

# 90. Refund kill switch

```text
REFUNDS_ENABLED=false
```

Bloqueia criação automatizada de novos refunds.

---

# 91. Asaas outage

Se Asaas estiver indisponível:

```text
não marcar payment FAILED automaticamente
```

Retornar:

```text
PAYMENT_PROVIDER_UNAVAILABLE
```

e reconciliar depois.

---

# 92. Neon outage

API pode retornar:

```text
503
```

Não tentar operar financeiramente sem persistência interna.

Não criar cobrança Asaas se não conseguir primeiro persistir estado interno necessário.

---

# 93. R2 outage

Não deve derrubar pagamentos.

Uploads retornam erro específico.

Core financeiro continua funcionando.

---

# 94. Dependency isolation

Falha em:

```text
R2
```

não pode derrubar:

```text
auth
payments
webhooks
```

quando não relacionado.

---

# 95. API startup

Startup deve validar:

- env;
- DB connectivity opcionalmente;
- configuração crítica.

Não chamar Asaas para "testar key" em todo startup se isso puder causar indisponibilidade.

---

# 96. Production data policy

Não usar dados reais em staging.

Se precisar reproduzir bug:

- anonimizar;
- criar fixture;
- não copiar banco de produção indiscriminadamente.

---

# 97. PII

Tratar como sensível:

```text
email
nome
IP
provider IDs
dados financeiros
```

Acesso mínimo necessário.

---

# 98. Data retention

Definição legal completa fica para política futura.

Por enquanto:

- não apagar financeiro;
- não apagar audit;
- não apagar webhook prematuramente;
- token expirado pode ser limpo.

---

# 99. Webhook retention

MVP:

manter payload/event history suficiente para investigação.

Revisar política depois com volume real.

---

# 100. Log retention

Usar retenção compatível com orçamento.

Pelo menos algumas semanas no beta.

Incidentes financeiros devem ter rastreabilidade.

---

# 101. Production launch checklist

Antes de ativar pagamentos:

```text
[ ] API build production OK
[ ] HTTPS
[ ] domain stable
[ ] Neon production
[ ] migrations applied
[ ] admin created
[ ] Asaas production approved
[ ] GM onboarding validated
[ ] webhook configured
[ ] webhook secret configured
[ ] R2 production
[ ] CORS production
[ ] JWT production secret
[ ] email production
[ ] error tracking
[ ] logs
[ ] health checks
[ ] rate limits
[ ] feature flags
[ ] terms/privacy minimum
[ ] support contact
[ ] refund procedure
[ ] sandbox checklist complete
```

---

# 102. First production pilot checklist

```text
[ ] one GM only
[ ] one table only
[ ] one player only
[ ] known payment amount
[ ] admin watching logs
[ ] Asaas panel open
[ ] DB payment record checked
[ ] webhook checked
[ ] split checked
[ ] dashboard checked
[ ] refund path known
```

---

# 103. Expansion checklist

Depois do primeiro jogador:

```text
1 table / 4 players
```

Depois:

```text
3 tables
```

Depois:

```text
10 tables
```

Não pular etapas.

---

# 104. Daily beta operations

Durante primeiras semanas verificar diariamente:

```text
failed webhooks
pending old payments
split pending
overdue payments
provider errors
refund requests
GM support
```

---

# 105. Weekly beta operations

Semanalmente:

```text
active paid tables
active paying players
GMV
platform revenue
payment success rate
overdue rate
refund rate
webhook failure rate
support volume
```

---

# 106. Financial reconciliation

No início, comparar:

```text
GuildaPlay DB
vs
Asaas dashboard/API
```

semanalmente.

Objetivo:

confirmar:

```text
gross
fees
splits
refunds
```

---

# 107. Manual reconciliation report

Pode ser script/admin futuro.

Primeira versão pode gerar CSV interno.

Não precisa UI.

---

# 108. Revenue accounting

Não considerar:

```text
platform_fee_bps * gross
```

como receita contábil final.

Usar valores efetivos confirmados pelo provider.

---

# 109. Monitoring critical tables

Acompanhar crescimento de:

```text
webhook_events
audit_logs
payments
auth_sessions
```

para evitar custos inesperados.

---

# 110. Database maintenance

MVP não precisa administração pesada.

Mas acompanhar:

- storage;
- slow queries;
- connection count;
- index usage.

---

# 111. Neon free tier awareness

Free tier é suficiente para desenvolvimento inicial.

Antes de produção com uso comercial real:

- revisar limites;
- monitorar consumo;
- ter plano de upgrade.

Não deixar produção parar por limite previsível.

---

# 112. R2 free tier awareness

10 GB gratuitos podem ser suficientes no início.

Controlar:

```text
avatar <= 2 MB
cover <= 5 MB
```

Preferir WebP/compressão.

---

# 113. Provider cost monitoring

Asaas é custo variável.

Registrar por pagamento:

```text
provider_fee_cents
```

quando disponível.

Isso permitirá calcular margem real.

---

# 114. Platform fee monitoring

Registrar:

```text
platform_fee_cents
```

real.

Não inferir somente por 8%.

---

# 115. Release checklist

Cada release production:

```text
[ ] diff reviewed
[ ] docs considered
[ ] migrations reviewed
[ ] env changes documented
[ ] build OK
[ ] deploy staging
[ ] staging health OK
[ ] critical flow manually checked if financial
[ ] production deploy
[ ] production health OK
[ ] logs checked
```

---

# 116. Hotfix

Fluxo:

```text
branch hotfix
fix smallest scope
build
staging if possible
production
monitor
document
```

Não adicionar feature durante hotfix.

---

# 117. Dependency updates

Atualizar em lotes pequenos.

Dependências críticas:

```text
NestJS
TypeORM
JWT/auth
Asaas integration
AWS SDK/R2
```

merecem revisão extra.

---

# 118. Security patch

Patch crítico:

prioridade alta.

Após atualização:

```text
build
sandbox flow
deploy
monitor
```

---

# 119. Disaster recovery

MVP precisa saber responder:

```text
E se banco ficar corrompido?
E se API key vazar?
E se webhook ficar offline?
E se deploy quebrar produção?
```

Procedimentos mínimos estão neste documento.

---

# 120. Database recovery

Passos gerais:

```text
1. stop writes if needed
2. identify restore point
3. restore/branch
4. validate financial consistency
5. point API
6. reconcile Asaas events after restore point
```

Importante:

restaurar banco para trás pode perder eventos locais que ainda ocorreram no Asaas.

Por isso:

```text
reconciliation after restore is mandatory
```

---

# 121. Webhook outage recovery

Se webhook ficou offline:

```text
1. restore endpoint
2. provider retries may replay
3. process duplicates safely
4. identify missing periods
5. run reconciliation
```

---

# 122. Secret leak recovery

Se Asaas key vazar:

```text
1. revoke key
2. disable payments if needed
3. create new key
4. update secret
5. redeploy
6. audit provider actions
7. rotate related secrets if uncertain
```

---

# 123. JWT secret leak

```text
1. rotate secret
2. revoke all sessions
3. require login
4. investigate logs
```

---

# 124. R2 key leak

```text
1. revoke
2. create new
3. update env
4. redeploy
5. review object access
```

---

# 125. Documentation ownership

Sempre que deployment mudar:

atualizar:

```text
DEPLOYMENT_OPERATIONS.md
.env.example
README se necessário
```

---

# 126. README mínimo

Raiz pode conter:

```text
setup local
commands
docs index
```

Não duplicar documentação extensa.

---

# 127. Local development bootstrap

Fluxo esperado:

```text
pnpm install
copy .env.example -> .env
configure Neon dev
configure Asaas sandbox
configure R2 dev
pnpm db:migrate
pnpm dev
```

---

# 128. Local webhook development

Para receber webhook local:

usar tunnel seguro temporário:

```text
Cloudflare Tunnel
ngrok
equivalente
```

Nunca usar URL temporária em produção.

---

# 129. Staging webhook

Staging deve ter URL estável.

Exemplo:

```text
https://api-staging.guildaplay.com/api/v1/webhooks/asaas
```

---

# 130. Swagger em produção

Pode ficar:

```text
desabilitado
```

ou:

```text
protegido
```

quando produção amadurecer.

Durante beta, pode permanecer habilitado se não expuser informações sensíveis.

---

# 131. Source maps

Se error tracking usar source maps:

- upload seguro;
- não expor source map publicamente se desnecessário.

---

# 132. Process memory

Acompanhar:

```text
memory
CPU
restart count
```

NestJS MVP deve consumir pouco.

---

# 133. Horizontal scaling

Não necessário inicialmente.

Primeiro:

```text
1 instance
```

simplifica jobs.

Escalar quando uso real justificar.

---

# 134. Single instance caveat

Uma instância é simples, mas pode ter downtime durante deploy.

Host com rolling deploy pode mitigar.

---

# 135. Worker future

Quando volume crescer:

```text
api
worker
```

Separar:

- webhooks pesados;
- jobs;
- emails;
- reconciliation.

Não necessário inicialmente.

---

# 136. Queue future

Pode usar:

```text
BullMQ
SQS
Cloud Tasks
equivalente
```

depois.

Não introduzir Redis/queue no MVP sem necessidade.

---

# 137. Email jobs

MVP pode enviar e-mail síncrono após persistência quando baixo volume.

Mas falha no e-mail não deve reverter pagamento.

Futuramente queue.

---

# 138. Provider failure isolation

Se envio de e-mail falhar após pagamento:

```text
payment continua PAID
```

Registrar falha de notificação separadamente.

---

# 139. API SLA interno

MVP não precisa SLA comercial formal.

Mas objetivo:

```text
alta disponibilidade suficiente para webhooks e pagamentos
```

---

# 140. Performance target inicial

Endpoints comuns:

```text
< 500 ms
```

quando sem provider externo.

Operações Asaas podem levar mais.

Não sacrificar correção por latência.

---

# 141. Timeout de request

Definir limites razoáveis no host/proxy.

Provider calls possuem timeout próprio.

---

# 142. Graceful provider errors

Nunca transformar timeout Asaas em:

```text
payment failed
```

Estado deve ficar:

```text
unknown/pending
```

até reconciliation quando necessário.

---

# 143. Maintenance mode

Pode existir env:

```text
MAINTENANCE_MODE
```

futuramente.

Não obrigatório no MVP.

Kill switch financeiro é mais importante.

---

# 144. Production support

Criar canal operacional simples:

```text
support email
```

Durante beta, contato direto também pode existir.

Toda ocorrência financeira deve ter:

```text
requestId
paymentId
userId
```

para investigação.

---

# 145. Data export

Fora do MVP.

Admin pode consultar via endpoint/SQL controlado inicialmente.

---

# 146. Compliance

Questões legais/contábeis definitivas exigem revisão profissional.

A infraestrutura deve facilitar:

- audit trail;
- retenção financeira;
- rastreabilidade.

---

# 147. Payment provider approval

Antes de vender:

confirmar com Asaas que o fluxo:

```text
GuildaPlay marketplace
+
split
+
mestres recebedores
```

está adequado à conta/contrato.

Sandbox funcional não garante aprovação comercial.

---

# 148. First month operational goal

Ao final do primeiro mês real:

```text
10 mesas
~40 jogadores
sem cobrança duplicada
webhooks estáveis
split estável
dashboard coerente
```

---

# 149. Definition of Done — Deployment

Deploy/operations da Fase 1 está pronto quando:

```text
[ ] development separado
[ ] staging separado
[ ] production separado
[ ] secrets isolados
[ ] API containerizada
[ ] build production
[ ] migrations seguras
[ ] Neon production
[ ] R2 production
[ ] Asaas sandbox
[ ] Asaas production
[ ] webhooks estáveis
[ ] health/liveness
[ ] logging
[ ] error tracking
[ ] rate limiting
[ ] feature flags financeiras
[ ] reconciliation job
[ ] PIX job seguro
[ ] rollback documentado
[ ] incident procedures
[ ] first pilot checklist
```

---

# 150. Ordem operacional final

```text
LOCAL
  |
  v
STAGING + ASAAS SANDBOX
  |
  v
M16 SANDBOX COMPLETE
  |
  v
PRODUCTION DEPLOY
PAYMENTS OFF
  |
  v
VERIFY
  |
  v
1 GM
1 TABLE
1 PLAYER
  |
  v
PAYMENTS ON
  |
  v
VERIFY MONEY + SPLIT
  |
  v
4 PLAYERS
  |
  v
3 TABLES
  |
  v
10 TABLES
```

---

# 151. Regra final para o Codex

Antes de alterar deploy, infraestrutura ou operação:

ler:

```text
docs/ARCHITECTURE.md
docs/AUTH_SECURITY.md
docs/PAYMENTS_ASAAS.md
docs/MVP_ROADMAP.md
docs/DEPLOYMENT_OPERATIONS.md
```

O Codex não deve:

1. colocar secrets no repositório;
2. usar mesma DB em dev e produção;
3. usar Asaas production em development;
4. executar migration destrutiva sem revisão;
5. executar cron financeiro sem idempotência;
6. assumir single-instance para sempre sem documentar;
7. marcar pagamento como falho por timeout de provider;
8. desabilitar webhook durante maintenance financeira;
9. apagar logs financeiros para resolver incidente;
10. apagar payment para reconciliar;
11. copiar dados reais para staging sem anonimização;
12. usar wildcard CORS em produção;
13. ativar pagamentos automaticamente após deploy;
14. migrar 10 mesas antes do pilot progressivo;
15. depender de frontend para operação da API.

A operação da GuildaPlay deve priorizar:

```text
correção financeira
>
segurança
>
rastreabilidade
>
disponibilidade
>
performance
```

O MVP só está pronto para crescimento depois que o fluxo financeiro estiver estável em produção.
