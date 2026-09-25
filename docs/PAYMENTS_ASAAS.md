# GuildaPlay API — Payments with Asaas

> Integração financeira da Fase 1 do MVP comercial da GuildaPlay.
>
> Este documento deve ser lido junto com:
>
> - `docs/ARCHITECTURE.md`
> - `docs/DATA_MODEL.md`
> - `docs/AUTH_SECURITY.md`
>
> **Status:** Fase 1 — MVP comercial  
> **Escopo atual:** API NestJS primeiro.  
> **Gateway inicial:** Asaas.
>
> Objetivo principal:
>
> ```text
> Mestre cria mesa
>      |
>      v
> define R$ 150/mês
>      |
>      v
> convida jogadores
>      |
>      v
> jogador escolhe
> cartão recorrente ou Pix mensal
>      |
>      v
> Asaas processa
>      |
>      v
> split automático
>      |
>      +---- GuildaPlay
>      |
>      +---- Mestre
> ```
>
> A taxa padrão inicial da GuildaPlay é:
>
> ```text
> 8% do valor líquido distribuível da cobrança
> ```
>
> No banco:
>
> ```text
> platform_fee_bps = 800
> ```

---

# 1. Objetivo

Definir como a API deve implementar:

- integração com Asaas;
- cadastro de cliente pagador;
- conta/carteira financeira do mestre;
- cartão recorrente;
- Pix mensal;
- split;
- taxa da plataforma;
- checkout;
- cobranças;
- assinaturas;
- webhooks;
- idempotência;
- reconciliação;
- cancelamento;
- atraso;
- falha de cartão;
- reembolso;
- auditoria;
- segurança financeira.

Este documento não define a UI.

O frontend futuro apenas consumirá os contratos da API.

---

# 2. Princípios obrigatórios

## 2.1 Asaas é provider, não domínio

O domínio da GuildaPlay deve continuar existindo independentemente do Asaas.

Correto:

```text
GuildaPlay Subscription
       |
       v
Asaas Subscription
```

Incorreto:

```text
Asaas Subscription = única representação da assinatura
```

A API deve possuir IDs internos e estados internos.

---

## 2.2 Billing não deve depender diretamente do SDK/HTTP do Asaas

Arquitetura:

```text
Controller
   |
   v
Billing / Subscription / Payment Service
   |
   v
PaymentProvider
   |
   v
AsaasPaymentProvider
   |
   v
Asaas API
```

A regra:

```text
platform_fee_bps = 800
```

pertence ao domínio GuildaPlay.

A tradução dessa regra para payload Asaas pertence ao provider.

---

## 2.3 Webhook é a fonte da verdade

Nunca marcar pagamento como pago apenas porque:

- checkout redirecionou para success URL;
- chamada HTTP de criação retornou `200`;
- frontend informou sucesso;
- usuário mostrou comprovante;
- pagamento aparece localmente como iniciado.

Fluxo:

```text
Asaas
  |
  v
Webhook
  |
  v
persistir evento
  |
  v
processar idempotentemente
  |
  v
atualizar estado interno
```

---

## 2.4 Dinheiro nunca usa float

Internamente:

```text
R$ 150,00 = 15000 cents
```

Payloads do Asaas podem exigir decimal.

A conversão deve acontecer somente na borda do provider.

Exemplo:

```text
15000 cents
   |
   v
150.00
   |
   v
Asaas
```

Nunca usar `number` em cálculos monetários complexos sem controle explícito de precisão.

---

## 2.5 IDs externos não substituem IDs internos

Correto:

```text
payments.id
payments.provider_payment_id
```

Incorreto:

```text
payments.id = ID do Asaas
```

---

# 3. Topologia financeira inicial

## 3.1 Conta originadora

Para o MVP, a estratégia preferida é:

```text
Conta GuildaPlay no Asaas
       |
       v
cria cobrança / checkout
       |
       v
define split para wallet do mestre
```

A conta da GuildaPlay é a originadora da cobrança.

O mestre precisa possuir uma conta/carteira Asaas válida, identificada por:

```text
provider_wallet_id
```

em:

```text
gm_payment_accounts
```

---

## 3.2 Regra de split

Como a conta originadora não deve informar seu próprio `walletId` no split, o payload direciona ao mestre a parcela dele.

Taxa padrão da plataforma:

```text
8%
```

Parcela percentual esperada do mestre:

```text
92%
```

Conceitualmente:

```text
netValue da cobrança
       |
       +---- 92% -> Mestre
       |
       +----  8% -> permanece na conta GuildaPlay
```

Importante:

```text
8% NÃO significa necessariamente 8% do valor bruto pago pelo jogador.
```

A taxa percentual do split é aplicada conforme a regra do Asaas sobre o valor líquido disponível.

Por isso:

- `gross_amount_cents` registra o valor pago/cobrado;
- `provider_fee_cents` registra a taxa efetiva do Asaas quando conhecida;
- `platform_fee_cents` registra a participação efetiva da GuildaPlay;
- `gm_net_amount_cents` registra o valor efetivo do mestre.

Não estimar valores históricos apenas usando:

```text
gross * 8%
```

quando o provider disponibilizar valores efetivos.

---

# 4. Confirmação operacional antes da produção

Antes de movimentar dinheiro real, validar com o Asaas:

1. modelo de marketplace da GuildaPlay;
2. criação/uso de contas ou subcontas para mestres;
3. obtenção de `walletId`;
4. regras de KYC dos mestres;
5. limites de split;
6. regras comerciais aplicáveis à conta;
7. tratamento fiscal/operacional adequado;
8. disponibilidade dos recursos necessários em produção.

O ambiente sandbox serve para validar integração técnica.

Ele não substitui aprovação operacional/comercial do modelo real.

---

# 5. Métodos de pagamento do MVP

A Fase 1 terá:

```text
CARD_RECURRING
PIX_MANUAL
```

Fora da Fase 1:

```text
PIX_AUTOMATIC
BOLETO como opção principal
parcelamento
cash
transferência manual
```

---

# 6. Diferença importante: cartão recorrente x Pix mensal

## 6.1 Cartão recorrente

Será representado externamente por uma assinatura Asaas.

Fluxo:

```text
GuildaPlay subscription
       |
       v
Asaas recurring checkout/subscription
       |
       v
Asaas gera cobranças futuras
       |
       v
PAYMENT_* webhooks
```

---

## 6.2 Pix mensal

No MVP, Pix não será tratado como assinatura recorrente nativa do Asaas.

A GuildaPlay controlará a recorrência internamente e criará uma cobrança Pix individual a cada ciclo.

Fluxo:

```text
GuildaPlay subscription PIX_MANUAL
       |
       v
chegou novo ciclo mensal
       |
       v
GuildaPlay cria payment interno
       |
       v
API cria cobrança PIX no Asaas
       |
       v
obtém QR Code
       |
       v
jogador paga
       |
       v
webhook confirma
```

`provider_subscription_id` permanece:

```text
NULL
```

para `PIX_MANUAL`.

---

# 7. Pix Automático

Pix Automático fica explicitamente fora da primeira entrega.

Motivo:

- possui fluxo de autorização próprio;
- possui ciclo de vida adicional;
- exige tratamento específico de autorização;
- adiciona complexidade desnecessária antes da validação inicial.

O modelo deve permitir futura adição de:

```text
PIX_AUTOMATIC
```

sem substituir `PIX_MANUAL`.

---

# 8. Cliente pagador

Antes de criar cobrança ou assinatura, deve existir um customer no Asaas.

Tabela:

```text
payment_customers
```

Fluxo:

```text
usuário vai pagar pela primeira vez
       |
       v
buscar payment_customer ASAAS
       |
       +---- existe -> reutilizar
       |
       +---- não existe
                  |
                  v
          Asaas create customer
                  |
                  v
      salvar provider_customer_id
```

Criar lazy.

Não criar customer Asaas para todo usuário no registro.

---

# 9. Dados pessoais enviados ao Asaas

Enviar somente os dados necessários para a operação.

Não duplicar indiscriminadamente no banco GuildaPlay todos os dados retornados pelo provider.

Nunca armazenar:

- número completo do cartão;
- CVV;
- API key do Asaas;
- token de cartão bruto;
- dados bancários desnecessários.

---

# 10. Conta financeira do mestre

Tabela:

```text
gm_payment_accounts
```

Campos relevantes:

```text
provider = ASAAS
provider_account_id
provider_wallet_id
status
```

Status:

```text
PENDING
ACTIVE
BLOCKED
DISCONNECTED
```

Mesa paga só pode ser ativada se o mestre possuir conta financeira apta para split.

Regra:

```text
gm_payment_account.status == ACTIVE
```

antes de iniciar cobrança real.

---

# 11. Onboarding financeiro do mestre

Fluxo conceitual:

```text
GM cria perfil
   |
   v
inicia onboarding financeiro
   |
   v
conta Asaas é associada/criada
   |
   v
KYC/configuração do provider
   |
   v
walletId conhecido
   |
   v
gm_payment_accounts = ACTIVE
```

A implementação exata do onboarding deve respeitar o modelo aprovado pelo Asaas.

Não inventar fluxo alternativo que exija armazenar API key individual de cada mestre.

---

# 12. Billing plan

A cobrança de uma mesa vem de:

```text
billing_plans
```

Exemplo:

```text
amount_cents = 15000
currency = BRL
interval = MONTHLY
platform_fee_bps = 800
```

O plano é versionável.

Mudança de preço:

```text
R$150 -> R$180
```

não deve alterar pagamentos antigos.

Preferir:

```text
arquivar plano anterior
+
criar novo billing_plan
```

---

# 13. Snapshot da taxa

Ao criar uma assinatura:

```text
subscription.billing_plan_id
```

aponta para os termos aceitos.

Ao criar cada payment:

```text
platform_fee_bps
```

deve receber snapshot da taxa daquele ciclo.

Assim:

```text
taxa futura muda
```

não reescreve:

```text
pagamentos históricos
```

---

# 14. Assinatura interna

`subscriptions` representa o relacionamento financeiro GuildaPlay.

Não é sinônimo de assinatura Asaas.

Exemplos:

```text
CARD_RECURRING
-> possui provider_subscription_id

PIX_MANUAL
-> provider_subscription_id = NULL
```

Status internos:

```text
PENDING
ACTIVE
PAST_DUE
PAUSED
CANCELED
ENDED
```

---

# 15. Estados: assinatura interna x Asaas

Não copiar enum Asaas diretamente para o domínio.

Criar mapper:

```text
Asaas state
    |
    v
AsaasMapper
    |
    v
GuildaPlay subscription_status
```

Isso evita acoplamento.

O provider pode possuir estados que não fazem sentido para o domínio e vice-versa.

---

# 16. Pagamento interno

Cada cobrança individual gera:

```text
payments
```

Mesmo quando originada por assinatura Asaas.

Fluxo:

```text
Asaas subscription
      |
      v
nova cobrança
      |
      v
PAYMENT_CREATED
      |
      v
upsert payment interno
```

Para Pix manual:

```text
GuildaPlay cria payment interno
      |
      v
cria cobrança Asaas
      |
      v
salva provider_payment_id
```

---

# 17. Identificação de origem

Usar `externalReference` sempre que o recurso Asaas utilizado permitir.

Valor recomendado:

```text
guildaplay:<resource>:<internal-id>
```

Exemplos:

```text
guildaplay:subscription:5b...
guildaplay:payment:a7...
guildaplay:checkout:31...
```

Não colocar dados pessoais no `externalReference`.

Ele serve para:

- conciliação;
- suporte;
- recuperação após falha parcial;
- investigação de inconsistência.

---

# 18. Idempotency key interna

Toda operação financeira iniciada pela GuildaPlay deve possuir chave idempotente.

Exemplos:

```text
create-card-subscription:<subscription-id>
create-pix-payment:<payment-id>
refund:<refund-id>
```

A implementação pode persistir uma tabela dedicada no futuro ou usar constraints/estado do recurso.

No MVP, no mínimo:

- IDs internos pré-criados;
- unique constraints;
- locks/transações quando necessário;
- não repetir chamadas externas se o recurso já possuir ID provider.

---

# 19. Regra de criação antes da chamada externa

Para operações relevantes, preferir:

```text
1. criar registro interno PENDING
2. commit
3. chamar Asaas
4. atualizar provider ID
```

em vez de:

```text
1. chamar Asaas
2. depois tentar criar registro interno
```

Motivo:

se o passo 2 falhar no segundo modelo, pode existir cobrança no Asaas sem referência local.

Quando a chamada externa ocorrer depois do registro interno, a operação pode ser reconciliada.

---

# 20. Falha parcial

Exemplo:

```text
subscription interna criada
      |
      v
Asaas cria checkout
      |
      v
API perde conexão antes de salvar ID
```

A operação não pode simplesmente ser repetida cegamente.

Estratégias:

- `externalReference`;
- consulta/reconciliação;
- idempotency control interno;
- logs estruturados;
- status intermediário.

---

# 21. Checkout de cartão recorrente

Para o MVP, preferir Checkout hospedado do Asaas para cartão.

Benefícios:

- GuildaPlay não recebe número do cartão;
- reduz superfície PCI;
- Asaas controla captura de dados de cartão;
- checkout pode criar recorrência;
- facilita primeira entrega.

Fluxo:

```text
POST GuildaPlay create card subscription
       |
       v
validar:
player
table member
billing plan
GM payment account
       |
       v
criar subscription interna PENDING
       |
       v
obter/criar Asaas customer
       |
       v
criar Checkout RECURRENT
       |
       v
configurar split
       |
       v
salvar provider checkout ID
       |
       v
retornar checkout URL/ID seguro
```

O redirect de sucesso:

```text
NÃO ativa assinatura.
```

---

# 22. Checkout recorrente: eventos esperados

Acompanhar pelo menos:

```text
CHECKOUT_PAID
SUBSCRIPTION_CREATED
PAYMENT_CREATED
PAYMENT_CONFIRMED
PAYMENT_RECEIVED
```

Também tratar:

```text
CHECKOUT_CANCELED
CHECKOUT_EXPIRED

SUBSCRIPTION_UPDATED
SUBSCRIPTION_INACTIVATED
SUBSCRIPTION_DELETED

SUBSCRIPTION_SPLIT_DISABLED
SUBSCRIPTION_SPLIT_DIVERGENCE_BLOCK
SUBSCRIPTION_SPLIT_DIVERGENCE_BLOCK_FINISHED
```

E eventos relevantes de falha/estorno/chargeback de pagamento.

---

# 23. Checkout pago não é igual a split liquidado

Separar conceitos:

```text
checkout pago
```

de:

```text
split liquidado
```

O evento relevante para liquidação de split é:

```text
PAYMENT_SPLIT_DONE
```

Pode haver mais de um split em arquiteturas futuras.

No MVP normalmente haverá um recebedor externo:

```text
GM
```

A participação da GuildaPlay permanece na conta originadora.

---

# 24. Criação da assinatura externa

Após conclusão do checkout recorrente, armazenar:

```text
provider_subscription_id
```

quando o evento/consulta identificar a assinatura criada.

Não depender de ordem perfeita entre:

```text
CHECKOUT_PAID
SUBSCRIPTION_CREATED
PAYMENT_CREATED
```

O processador deve tolerar eventos fora de ordem.

---

# 25. Upsert de assinatura por webhook

Ao receber `SUBSCRIPTION_CREATED`:

```text
1. identificar recurso interno
2. localizar subscription
3. se provider_subscription_id vazio:
      preencher
4. se já preenchido e diferente:
      gerar alerta
5. atualizar estado compatível
6. registrar audit log
```

Nunca criar duplicata apenas porque webhook foi repetido.

---

# 26. Cobranças geradas por assinatura

Cada cobrança gerada pela assinatura possui ciclo próprio.

Ao receber:

```text
PAYMENT_CREATED
```

e houver:

```text
payment.subscription = provider_subscription_id
```

a API deve:

```text
localizar subscription interna
      |
      v
determinar ciclo
      |
      v
criar/upsert payment interno
```

---

# 27. Determinação de ciclo

Um payment interno precisa possuir:

```text
period_start
period_end
due_date
```

Para recorrência mensal, o ciclo deve ser determinado de forma consistente.

Não inferir apenas pelo mês atual do servidor.

Usar:

- configuração da assinatura;
- due date;
- período interno esperado;
- timezone/regras do plano quando aplicável.

---

# 28. Cartão: ativação inicial

A assinatura do jogador só deve se tornar:

```text
ACTIVE
```

quando houver confirmação financeira adequada da primeira cobrança.

Não ativar apenas com:

```text
SUBSCRIPTION_CREATED
```

Uma assinatura criada não significa que o primeiro pagamento foi recebido.

---

# 29. `PAYMENT_CONFIRMED` x `PAYMENT_RECEIVED`

Conceitualmente:

```text
PAYMENT_CONFIRMED
```

significa que o pagamento foi confirmado, mas o valor pode ainda não estar disponível.

```text
PAYMENT_RECEIVED
```

indica recebimento/disponibilidade conforme o fluxo do Asaas.

Para acesso à mesa, o MVP pode considerar o pagamento operacionalmente pago a partir de:

```text
PAYMENT_CONFIRMED
```

ou evento equivalente seguro, desde que a regra seja consistente.

Para conciliação financeira e split, usar os estados/eventos financeiros efetivos do provider.

A decisão de produto deve ser configurada explicitamente.

Recomendação MVP:

```text
PAYMENT_CONFIRMED -> payment.status = PAID
PAYMENT_RECEIVED  -> manter PAID + atualizar dados financeiros
```

---

# 30. Falha de cartão

Eventos de falha devem mapear para estado interno.

Exemplos relevantes incluem falha de captura e reprovação.

Fluxo:

```text
falha
  |
  v
payment.status = FAILED
  |
  v
subscription.status = PAST_DUE
  |
  v
audit log
  |
  v
notificação futura
```

Não remover jogador automaticamente da mesa na primeira falha.

---

# 31. Risk analysis

Cartão pode possuir estados intermediários de análise de risco.

Não marcar como pago em:

```text
PAYMENT_AWAITING_RISK_ANALYSIS
```

Tratar como:

```text
PENDING
```

até evento definitivo.

---

# 32. Pix mensal

`PIX_MANUAL` é recorrência do domínio GuildaPlay.

Não é assinatura Pix do Asaas.

Cada ciclo:

```text
scheduler / job
       |
       v
subscriptions PIX_MANUAL com next_due_date
       |
       v
criar payment interno PENDING
       |
       v
criar cobrança Asaas PIX
       |
       v
salvar provider_payment_id
       |
       v
obter QR Code
```

---

# 33. Scheduler para Pix

A API precisa de um mecanismo de jobs.

Para MVP, pode ser:

```text
@nestjs/schedule
```

desde que o ambiente de deploy suporte execução confiável.

Se a infraestrutura serverless impedir garantia adequada, migrar o job para:

- cron externo;
- worker persistente;
- serviço de jobs.

A arquitetura não deve assumir que um processo web efêmero executará cron de forma confiável.

---

# 34. Job de geração de cobrança Pix

Executar diariamente.

Busca:

```text
subscriptions
WHERE payment_method = PIX_MANUAL
AND status IN (ACTIVE, PAST_DUE)
AND next_due_date <= geração_limite
```

Para cada subscription:

```text
já existe payment para period_start?
        |
        +---- sim -> não criar outro
        |
        +---- não -> criar
```

A unique constraint:

```text
UNIQUE(subscription_id, period_start)
```

é uma segunda barreira contra duplicidade.

---

# 35. Antecedência do Pix

Configuração inicial recomendada:

```text
gerar cobrança 5 dias antes do vencimento
```

Deve ser configurável.

Exemplo:

```text
due_date = 2026-10-05
generate_at = 2026-09-30
```

Não hardcodar diretamente no job.

---

# 36. Criação da cobrança Pix

Payload conceitual:

```text
customer
billingType = PIX
value
dueDate
externalReference
split
```

O provider converte:

```text
amount_cents -> decimal
```

e:

```text
platform_fee_bps -> percentual do GM
```

---

# 37. QR Code Pix

Depois de criar a cobrança:

```text
GET /payments/{providerPaymentId}/pixQrCode
```

O Asaas retorna dados como:

```text
encodedImage
payload
expirationDate
```

A API GuildaPlay pode retornar ao consumidor:

```text
paymentId interno
status
amount
dueDate
pixCopyPaste
pixQrCode
expirationDate
```

Não persistir imagem Base64 indefinidamente se não houver necessidade.

Pode buscar novamente no provider quando necessário.

---

# 38. Pagamento Pix

Ao receber confirmação:

```text
PAYMENT_CONFIRMED / PAYMENT_RECEIVED
```

a API:

```text
payment.status = PAID
payment.paid_at = timestamp
subscription.status = ACTIVE
```

e calcula/atualiza snapshots financeiros quando os dados estiverem disponíveis.

---

# 39. Pix vencido

Ao atingir estado vencido:

```text
payment.status = OVERDUE
subscription.status = PAST_DUE
```

O jogador continua associado à mesa.

A decisão de suspensão de acesso será uma regra de produto posterior.

---

# 40. Próximo ciclo Pix

Quando payment for pago:

```text
subscription.next_due_date
```

deve apontar para o próximo ciclo.

Não criar todos os pagamentos do ano antecipadamente.

---

# 41. Split percentual

Conversão:

```text
platform_fee_bps = 800
```

Parcela destinada ao GM:

```text
10000 - 800 = 9200 bps
```

No provider:

```text
92.00%
```

Nunca confiar em percentual enviado pelo cliente.

O backend resolve a taxa a partir de:

```text
billing_plan.platform_fee_bps
```

e/ou snapshot financeiro.

---

# 42. Função de cálculo

Criar função de domínio pura:

```text
getGmSplitPercentageBps(platformFeeBps)
```

Regra:

```text
gmSplitBps = 10000 - platformFeeBps
```

Constraints:

```text
0 <= platformFeeBps <= 10000
0 <= gmSplitBps <= 10000
```

Para MVP:

```text
platform = 800
gm = 9200
```

---

# 43. Split não deve ser calculado no controller

Proibido:

```ts
@Post()
create(@Body() dto) {
  const gmPercent = 100 - dto.platformFee;
}
```

Correto:

```text
Controller
   |
   v
BillingService
   |
   v
BillingPlan
   |
   v
SplitPolicy
   |
   v
AsaasProvider
```

---

# 44. Persistência do split esperado

Ao criar payment:

```text
payment_splits
```

deve registrar a expectativa.

Para o GM:

```text
recipient_type = GM
gm_profile_id
provider_wallet_id
percentage_bps = 9200
status = PENDING
```

A participação da plataforma também pode ser registrada como snapshot lógico:

```text
recipient_type = PLATFORM
percentage_bps = 800
```

mesmo que não exista split explícito no provider para a conta originadora.

Isso facilita relatórios.

---

# 45. Liquidação do split

Ao receber:

```text
PAYMENT_SPLIT_DONE
```

identificar o split pelo provider.

Atualizar:

```text
payment_splits.status = CONFIRMED
```

e valor efetivo quando disponível.

Não considerar split confirmado apenas por:

```text
PAYMENT_RECEIVED
```

se o provider possui evento específico de split.

---

# 46. Divergência de split

Tratar:

```text
SUBSCRIPTION_SPLIT_DIVERGENCE_BLOCK
```

como incidente financeiro.

Fluxo:

```text
evento
  |
  v
subscription -> PAUSED ou estado interno compatível
  |
  v
registrar webhook
  |
  v
audit log
  |
  v
alerta administrativo
```

Depois:

```text
SUBSCRIPTION_SPLIT_DIVERGENCE_BLOCK_FINISHED
```

permite reconciliar e reativar conforme estado externo.

Não ignorar esse evento.

Uma divergência pode impedir geração de novas cobranças.

---

# 47. Split desabilitado

Evento:

```text
SUBSCRIPTION_SPLIT_DISABLED
```

deve:

```text
1. registrar incidente
2. impedir confiança cega em próximas cobranças
3. marcar assinatura para revisão
4. alertar admin
```

Não continuar cobrando normalmente sem investigar.

---

# 48. Status financeiro interno

## Payment

```text
PENDING
PAID
OVERDUE
FAILED
CANCELED
REFUNDED
PARTIALLY_REFUNDED
```

## Subscription

```text
PENDING
ACTIVE
PAST_DUE
PAUSED
CANCELED
ENDED
```

## Split

```text
PENDING
CONFIRMED
FAILED
CANCELED
```

---

# 49. Mapping de eventos de cobrança

Mapa inicial:

```text
PAYMENT_CREATED
-> PENDING

PAYMENT_UPDATED
-> atualizar dados permitidos

PAYMENT_AWAITING_RISK_ANALYSIS
-> PENDING

PAYMENT_APPROVED_BY_RISK_ANALYSIS
-> PENDING até confirmação financeira

PAYMENT_REPROVED_BY_RISK_ANALYSIS
-> FAILED

PAYMENT_CREDIT_CARD_CAPTURE_REFUSED
-> FAILED

PAYMENT_CONFIRMED
-> PAID

PAYMENT_RECEIVED
-> PAID

PAYMENT_OVERDUE
-> OVERDUE

PAYMENT_DELETED
-> CANCELED quando aplicável

PAYMENT_REFUNDED
-> REFUNDED quando total

PAYMENT_PARTIALLY_REFUNDED
-> PARTIALLY_REFUNDED

PAYMENT_SPLIT_DONE
-> split CONFIRMED
```

Antes de codificar o mapper final, conferir a lista atual de eventos na documentação oficial do Asaas.

Não presumir que esta lista é eterna.

---

# 50. Webhook endpoint

Endpoint:

```text
POST /webhooks/asaas
```

Controller dedicado:

```text
AsaasWebhookController
```

Service:

```text
AsaasWebhookService
```

Handlers específicos:

```text
PaymentWebhookHandler
SubscriptionWebhookHandler
CheckoutWebhookHandler
```

Evitar um único método gigante com dezenas de `if`.

---

# 51. Segurança do webhook

Validar o mecanismo de autenticação configurado no Asaas.

A credencial/token de webhook:

- fica somente no backend;
- vem de env;
- nunca é logada;
- não é retornada ao cliente.

Não usar somente IP como segurança.

---

# 52. Persist-first

Ao receber evento:

```text
1. validar autenticação
2. extrair provider_event_id
3. tentar inserir webhook_events
4. se UNIQUE conflict:
      retornar sucesso
5. marcar PROCESSING
6. processar
7. marcar PROCESSED
```

Se falhar:

```text
status = FAILED
last_error sanitizado
```

---

# 53. Entrega at least once

Assumir sempre:

```text
mesmo evento pode chegar novamente
```

Então:

```text
provider + provider_event_id
```

deve ser único.

Duplicata não é erro operacional.

Resposta:

```text
2xx
```

sem reaplicar efeito.

---

# 54. Eventos fora de ordem

Exemplo possível:

```text
PAYMENT_CONFIRMED
chega antes do PAYMENT_CREATED processado localmente
```

O handler deve tentar:

1. localizar payment por provider ID;
2. localizar subscription por provider subscription ID;
3. localizar por `externalReference`;
4. criar/upsert informação mínima quando seguro;
5. marcar evento para retry/reconciliação se não houver contexto suficiente.

Não descartar silenciosamente.

---

# 55. Evento desconhecido

Se Asaas enviar novo tipo de evento:

```text
persistir
status = IGNORED
```

com log estruturado.

Não retornar erro apenas porque a aplicação ainda não usa aquele evento, desde que autenticação e payload básico sejam válidos.

---

# 56. Retries internos

Webhook que falhou por erro transitório pode ser reprocessado.

Admin MVP deve permitir:

```text
reprocessar webhook
```

O processamento continua idempotente.

`attempts` deve ser incrementado.

---

# 57. Reconciliação

Webhooks são principal mecanismo, mas não devem ser a única possibilidade de recuperação.

Criar serviço:

```text
PaymentsReconciliationService
```

Responsável por comparar recursos internos com Asaas em situações específicas.

Exemplos:

- webhook perdido;
- estado inconsistente;
- suporte;
- deploy durante evento;
- falha parcial.

---

# 58. Job de reconciliação

No MVP, executar periodicamente para:

```text
payments PENDING antigos
payments OVERDUE inconsistentes
subscriptions PENDING antigas
webhook_events FAILED
splits PENDING antigos
```

Não consultar todos os pagamentos do sistema em loop agressivo.

Reconciliar somente candidatos.

---

# 59. Cancelamento da assinatura

## Cartão recorrente

Quando jogador solicitar cancelamento:

```text
subscription.cancel_at_period_end = true
```

Regra inicial recomendada:

```text
não gerar/cobrar novo ciclo
mas manter vínculo até fim do período já pago
```

Na data final:

```text
subscription.status = CANCELED
```

A forma exata de cancelar/inativar a recorrência externa deve respeitar comportamento Asaas.

---

# 60. Inativar x remover assinatura externa

Preferir inativação quando a intenção for pausa temporária.

Remoção externa é encerramento definitivo da recorrência.

O service deve distinguir:

```text
pause
cancel
end
```

mesmo que o provider tenha operações diferentes.

---

# 61. Pausar mesa

Se GM pausar uma mesa:

```text
game_table.status = PAUSED
```

a política inicial deve:

```text
não criar novas assinaturas
não gerar novas cobranças Pix
inativar/pausar recorrências conforme decisão do negócio
```

Não apagar histórico.

---

# 62. Remover jogador

Remover jogador de mesa não deve apagar assinatura/pagamentos.

Fluxo:

```text
table_member.status = REMOVED
       |
       v
encerrar renovação futura
       |
       v
preservar período pago/histórico
```

---

# 63. Reembolso

Reembolso é operação financeira de alto risco.

Nunca permitir:

```text
PATCH payment.status = REFUNDED
```

Fluxo:

```text
criar refunds PENDING
       |
       v
validar autorização
       |
       v
validar amount
       |
       v
Asaas refund
       |
       v
aguardar evento/resultado
       |
       v
refund CONFIRMED
```

---

# 64. Reembolso total e parcial

O modelo deve suportar:

```text
full refund
partial refund
```

Mesmo que a UI inicial exponha apenas reembolso total para simplificar.

A soma dos refunds confirmados:

```text
<= gross_amount_cents
```

---

# 65. Refund com split

Quando cobrança possui split, o reembolso pode afetar as partes envolvidas.

Não assumir que a GuildaPlay pode devolver tudo sem considerar:

- saldo disponível;
- valor do mestre;
- split original;
- taxa do provider.

O provider deve receber os dados de refund/split adequados conforme o caso.

---

# 66. Taxa do provider no reembolso

Não assumir que taxa do Asaas será devolvida.

O sistema deve preservar:

```text
gross amount
provider fee
refund amount
split effects
```

separadamente.

Isso evita relatórios falsos.

---

# 67. Estados do refund

Internos:

```text
PENDING
CONFIRMED
FAILED
CANCELED
```

Não marcar `CONFIRMED` apenas porque endpoint de refund respondeu inicialmente se houver processamento posterior.

Usar eventos/reconciliação.

---

# 68. Chargeback

Chargeback de cartão precisa ser tratado mesmo que seja raro no beta.

Ao receber evento correspondente:

```text
registrar webhook
       |
       v
payment deixa de ser considerado financeiro definitivo
       |
       v
audit
       |
       v
alerta admin
```

O modelo interno pode ser expandido posteriormente com estado dedicado se necessário.

No MVP, não ignorar.

---

# 69. Disputa financeira

Não implementar sistema completo de disputa na Fase 1.

Mas toda inconsistência financeira precisa de capacidade administrativa de:

- localizar usuário;
- localizar mesa;
- localizar subscription;
- localizar payment;
- localizar provider IDs;
- visualizar webhooks;
- visualizar audit logs;
- reconciliar;
- reprocessar evento.

---

# 70. API key do Asaas

Variáveis:

```text
ASAAS_API_KEY
ASAAS_BASE_URL
ASAAS_WEBHOOK_SECRET
```

Nunca:

- commit;
- log;
- retornar;
- colocar no frontend.

Sandbox:

```text
https://api-sandbox.asaas.com
```

Produção deve usar base URL oficial de produção configurada por env.

---

# 71. HTTP client

Criar client dedicado.

Exemplo:

```text
src/asaas/
├── asaas.module.ts
├── asaas.client.ts
├── asaas-payment.provider.ts
├── mappers/
├── dto/
└── types/
```

Client responsável por:

- base URL;
- autenticação;
- timeout;
- headers;
- serialização;
- erros técnicos;
- request ID/correlation quando aplicável.

---

# 72. Timeout

Toda chamada ao Asaas deve possuir timeout.

Não permitir request HTTP externo pendurado indefinidamente.

Erros de timeout:

```text
não significam automaticamente que operação não ocorreu
```

Pode ter ocorrido:

```text
request processada no Asaas
+
response perdida
```

Por isso reconciliação/idempotência são obrigatórias.

---

# 73. Retry HTTP

Não aplicar retry automático cego em:

```text
POST criar cobrança
POST criar assinatura
POST refund
```

sem estratégia idempotente.

GETs podem possuir retry limitado para falhas transitórias.

POST financeiro deve primeiro considerar:

- externalReference;
- estado interno;
- consulta de reconciliação.

---

# 74. Mapeamento de erro

Asaas errors devem virar erros internos consistentes.

Exemplos:

```text
PAYMENT_PROVIDER_VALIDATION_ERROR
PAYMENT_PROVIDER_UNAVAILABLE
PAYMENT_METHOD_REJECTED
GM_PAYMENT_ACCOUNT_NOT_READY
PAYMENT_ALREADY_EXISTS
SUBSCRIPTION_ALREADY_ACTIVE
```

Não retornar payload bruto do Asaas para usuário comum.

---

# 75. Logs de provider

Logar:

```text
operation
internal resource ID
provider resource ID
status HTTP
duration
requestId
```

Não logar:

- API key;
- cartão;
- CVV;
- tokens;
- payload completo sensível.

---

# 76. Circuit breaker

Não é obrigatório no primeiro commit.

Mas provider deve ficar isolado para permitir adicionar:

- circuit breaker;
- retry policy;
- metrics;

sem reescrever services de domínio.

---

# 77. Estrutura sugerida do módulo `billing`

```text
src/billing/
├── billing.module.ts
├── billing.service.ts
├── billing-policy.service.ts
├── split-policy.service.ts
├── repositories/
└── types/
```

Responsabilidades:

- validar billing plan;
- obter taxa;
- calcular participação percentual esperada;
- validar mestre apto;
- criar contexto financeiro.

---

# 78. Estrutura sugerida do módulo `subscriptions`

```text
src/subscriptions/
├── subscriptions.module.ts
├── subscriptions.controller.ts
├── subscriptions.service.ts
├── subscriptions.repository.ts
├── dto/
│   ├── create-subscription.dto.ts
│   └── cancel-subscription.dto.ts
└── jobs/
    └── pix-billing.job.ts
```

---

# 79. Estrutura sugerida do módulo `payments`

```text
src/payments/
├── payments.module.ts
├── payments.controller.ts
├── payments.service.ts
├── payments.repository.ts
├── refunds.service.ts
├── reconciliation.service.ts
└── dto/
```

---

# 80. Estrutura sugerida do módulo `asaas`

```text
src/asaas/
├── asaas.module.ts
├── asaas.client.ts
├── asaas-payment.provider.ts
├── asaas-customer.service.ts
├── asaas-checkout.service.ts
├── asaas-subscription.service.ts
├── asaas-payment.service.ts
├── asaas-refund.service.ts
├── asaas.mapper.ts
└── types/
```

Não é obrigatório criar todos os arquivos no primeiro commit.

Criar conforme os casos de uso surgirem.

---

# 81. Estrutura sugerida de webhooks

```text
src/webhooks/
├── webhooks.module.ts
├── asaas-webhook.controller.ts
├── asaas-webhook.service.ts
├── handlers/
│   ├── checkout-webhook.handler.ts
│   ├── subscription-webhook.handler.ts
│   └── payment-webhook.handler.ts
└── repositories/
    └── webhook-events.repository.ts
```

---

# 82. PaymentProvider

Interface conceitual:

```ts
interface PaymentProvider {
  createCustomer(input: CreateCustomerInput): Promise<ProviderCustomer>;

  createRecurringCheckout(
    input: CreateRecurringCheckoutInput,
  ): Promise<ProviderCheckout>;

  createPixPayment(
    input: CreatePixPaymentInput,
  ): Promise<ProviderPayment>;

  getPixQrCode(
    providerPaymentId: string,
  ): Promise<ProviderPixQrCode>;

  pauseSubscription(
    providerSubscriptionId: string,
  ): Promise<void>;

  cancelSubscription(
    providerSubscriptionId: string,
  ): Promise<void>;

  refundPayment(
    input: RefundPaymentInput,
  ): Promise<ProviderRefund>;

  getPayment(
    providerPaymentId: string,
  ): Promise<ProviderPayment>;

  getSubscription(
    providerSubscriptionId: string,
  ): Promise<ProviderSubscription>;
}
```

Não retornar tipos HTTP crus.

---

# 83. DTO público não é DTO Asaas

Separar:

```text
CreateSubscriptionDto
```

de:

```text
AsaasCreateCheckoutRequest
```

O controller trabalha com DTO GuildaPlay.

O provider trabalha com DTO Asaas.

Nunca reutilizar payload externo como contrato público.

---

# 84. `CreateSubscriptionDto`

Conceitualmente deve precisar de pouco:

```text
tableId
paymentMethod
```

Não receber:

```text
amount
platformFee
gmWalletId
providerCustomerId
```

Esses dados são resolvidos internamente.

---

# 85. Criar assinatura de cartão — caso de uso

Fluxo completo:

```text
authenticated user
      |
      v
CreateSubscriptionDto
      |
      v
localizar table
      |
      v
localizar table_member
      |
      v
validar membership
      |
      v
validar não existe active subscription
      |
      v
obter active billing_plan
      |
      v
obter GM payment account ACTIVE
      |
      v
obter/criar payment_customer
      |
      v
criar subscription PENDING
      |
      v
criar recurring checkout Asaas
      |
      v
salvar provider checkout reference
      |
      v
retornar dados seguros do checkout
```

---

# 86. Concorrência ao criar assinatura

Dois requests simultâneos não podem criar duas assinaturas.

Proteções:

```text
partial unique index / constraint
transaction
status check
idempotency key
```

Não confiar somente no frontend desabilitando botão.

---

# 87. Criar cobrança Pix — caso de uso

Fluxo:

```text
PIX_MANUAL subscription
      |
      v
novo ciclo
      |
      v
create payment PENDING
      |
      v
resolve billing plan snapshot
      |
      v
resolve GM wallet
      |
      v
Asaas create PIX payment + split
      |
      v
save provider_payment_id
      |
      v
get QR code
```

---

# 88. Consultar QR Pix

Endpoint futuro deve receber:

```text
paymentId interno
```

e nunca exigir que cliente envie provider ID.

Service:

```text
verificar ownership
      |
      v
localizar provider_payment_id
      |
      v
provider.getPixQrCode()
```

---

# 89. Dashboard financeiro do GM

Dados devem vir do banco GuildaPlay, não consultar Asaas em tempo real para cada card.

Exemplo:

```text
expected
received
pending
overdue
```

são agregações de:

```text
payments
```

Sincronizadas por webhook/reconciliation.

---

# 90. Receita esperada

Para uma mesa:

```text
4 jogadores
x R$150
= R$600 gross esperado
```

Mas dashboard deve distinguir:

```text
gross billed
provider fees
platform revenue
gm net
```

quando dados estiverem disponíveis.

Não mostrar tudo como "receita do mestre".

---

# 91. Dashboard do jogador

Também usar dados internos:

```text
payment status
due date
paid_at
payment method
```

Pix QR pode ser buscado sob demanda.

---

# 92. Valores derivados

Não persistir valor derivado se ele puder ser obtido com segurança e não for necessário para auditoria.

Mas valores financeiros efetivos devem ser snapshot quando relevantes:

```text
provider_fee_cents
platform_fee_cents
gm_net_amount_cents
```

porque podem mudar de interpretação/preço no futuro.

---

# 93. Datas e timezone

Due date é `date`.

Eventos externos possuem timestamps.

Persistir timestamps em UTC.

Horário da mesa não deve controlar diretamente horário de vencimento.

Billing possui calendário próprio.

---

# 94. Dia de cobrança

O MVP pode definir o vencimento por assinatura/mesa.

Se existir campo futuro:

```text
billing_day
```

validar:

```text
1..28
```

para evitar complexidade de meses curtos no MVP.

Se necessário, adicionar ao modelo via migration explícita.

Não inferir o dia automaticamente a partir da data de entrada sem decisão de produto.

---

# 95. Primeiro ciclo

Decisão inicial sugerida:

```text
primeira cobrança = imediata
```

e depois:

```text
mensal
```

Mas isso deve ser configurável pelo caso de uso.

Não hardcodar comportamento irreversível no provider.

---

# 96. Trial

Trial gratuito fica fora do MVP financeiro.

Se for adicionado:

```text
trial_ends_at
```

deve existir no domínio.

Não simular trial criando cobrança R$0 sem necessidade.

---

# 97. Pró-rata

Pró-rata fica fora da Fase 1.

Se jogador entra no meio do mês:

decisão inicial simples:

```text
paga o valor integral do ciclo contratado
```

ou:

```text
primeiro vencimento definido pelo mestre
```

A regra final será definida como produto.

Não implementar pró-rata automaticamente agora.

---

# 98. Mudança de método

Trocar:

```text
PIX_MANUAL -> CARD_RECURRING
```

ou:

```text
CARD_RECURRING -> PIX_MANUAL
```

não deve alterar pagamentos históricos.

Preferir:

```text
encerrar assinatura atual
+
criar nova subscription
```

a partir do próximo período.

---

# 99. Mudança de preço

Não modificar assinatura financeira silenciosamente.

Fluxo:

```text
novo billing plan
      |
      v
aplicar em novas assinaturas
```

Para assinaturas existentes, definir posteriormente:

- migração com consentimento;
- próximo ciclo;
- grandfathering.

No MVP, preservar termos existentes é a opção mais segura.

---

# 100. Integridade da mesa

Não cobrar se:

```text
game_table.status != ACTIVE
```

exceto caso de ciclo já emitido antes da pausa, conforme regra de negócio.

---

# 101. Integridade do membro

Não criar nova assinatura se:

```text
table_member.status != ACTIVE
```

Aceite de convite deve ocorrer antes de iniciar pagamento.

---

# 102. Capacidade

Antes de ativar assinatura, verificar se ainda existe vaga.

Condição deve considerar concorrência.

Fluxo ideal:

```text
aceitar convite/reserva de vaga
       |
       v
membership ativo
       |
       v
pagamento
```

No MVP de mesas existentes, convites podem reservar a posição do jogador.

---

# 103. Audit logs financeiros

Gerar pelo menos:

```text
PAYMENT_CUSTOMER_CREATED
GM_PAYMENT_ACCOUNT_CONNECTED

SUBSCRIPTION_CREATED
SUBSCRIPTION_ACTIVATED
SUBSCRIPTION_PAST_DUE
SUBSCRIPTION_PAUSED
SUBSCRIPTION_CANCELED

PAYMENT_CREATED
PAYMENT_CONFIRMED
PAYMENT_RECEIVED
PAYMENT_OVERDUE
PAYMENT_FAILED

PAYMENT_SPLIT_CONFIRMED
PAYMENT_SPLIT_FAILED

REFUND_REQUESTED
REFUND_CONFIRMED
REFUND_FAILED

ASAAS_WEBHOOK_FAILED
PAYMENT_RECONCILED
```

---

# 104. Dados de webhook

`webhook_events.payload` pode armazenar payload relevante, mas deve ser sanitizado se necessário.

Não propagar payload bruto para frontend.

Retention pode ser definida futuramente.

---

# 105. Reprocessamento manual

Admin endpoint futuro:

```text
POST /admin/webhooks/:id/reprocess
```

Requisitos:

- ADMIN;
- audit log;
- não permitir reprocessar evento já PROCESSING simultaneamente;
- handler idempotente.

---

# 106. Reconciliação manual

Admin deve poder solicitar:

```text
reconcile payment
reconcile subscription
```

por ID interno.

Não expor endpoint genérico:

```text
sync everything
```

sem controle.

---

# 107. Observabilidade mínima

Métricas futuras úteis:

```text
payment_created_total
payment_confirmed_total
payment_failed_total
payment_overdue_total
webhook_failed_total
webhook_duplicate_total
reconciliation_total
split_failed_total
```

No MVP, logs estruturados já são obrigatórios.

---

# 108. Health do provider

Não chamar Asaas em todo:

```text
GET /health
```

Health básico deve continuar rápido.

Pode existir futuramente:

```text
GET /internal/health/dependencies
```

protegido.

---

# 109. Sandbox

Toda implementação financeira começa em sandbox.

Sequência mínima:

```text
1. customer
2. GM wallet/account
3. recurring checkout
4. first card payment
5. recurring payment generated
6. PIX payment
7. QR code
8. webhook
9. split
10. refund
```

Só depois produção.

---

# 110. Cenários manuais obrigatórios antes da primeira cobrança real

Mesmo sem `TESTING.md`, validar manualmente:

```text
01 criar customer
02 criar recurring checkout
03 checkout pago
04 subscription vinculada
05 primeira cobrança confirmada
06 split liquidado
07 segunda cobrança gerada
08 cartão recusado
09 cobrança Pix criada
10 Pix pago
11 Pix vencido
12 webhook duplicado
13 webhook fora de ordem
14 cancelamento
15 refund
16 split divergence simulável/observável
17 perda de response após criação
18 reconciliation
```

Registrar resultados.

---

# 111. Primeira cobrança real

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
```

Depois:

```text
10 mesas
```

---

# 112. Feature flag de produção

Criar flag/env:

```text
PAYMENTS_ENABLED
```

Em ambiente de desenvolvimento:

```text
true
```

com sandbox.

Na preparação de produção:

```text
false
```

até validação final.

Isso permite deploy sem liberar cobrança acidentalmente.

---

# 113. Feature flag de Pix

Opcional:

```text
PIX_PAYMENTS_ENABLED
```

Permite ligar cartão primeiro, depois Pix.

---

# 114. Feature flag de refunds

Reembolso via API pode começar:

```text
REFUNDS_ENABLED=false
```

e ser ativado após validação.

Admin ainda pode ter fluxo operacional manual temporário documentado.

---

# 115. Provider mode

Env:

```text
ASAAS_ENV=sandbox
```

ou:

```text
ASAAS_ENV=production
```

A aplicação deve falhar startup se combinação de URL/key for inconsistente quando pagamentos estão habilitados.

---

# 116. Configuração financeira

Não usar:

```text
PLATFORM_FEE=8
```

como única fonte.

A taxa vem de:

```text
billing_plans.platform_fee_bps
```

Pode existir default de criação:

```text
DEFAULT_PLATFORM_FEE_BPS=800
```

mas pagamento usa snapshot do plano.

---

# 117. Precisão ao converter BPS

Exemplo:

```text
800 bps = 8.00%
9200 bps = 92.00%
```

Conversão para provider deve ser centralizada.

Não repetir:

```ts
fee / 100
```

espalhado.

---

# 118. Não hardcodar taxa do Asaas

Taxa do provider:

```text
não pertence a constante fixa da aplicação
```

Ela pode mudar por:

- meio de pagamento;
- negociação;
- promoção;
- plano da conta;
- momento.

Persistir valor efetivo quando conhecido.

---

# 119. Não repassar provider fee manualmente no MVP

O MVP não adicionará surcharge separado ao jogador.

Preço exibido:

```text
R$150/mês
```

Jogador paga:

```text
R$150
```

As taxas são consideradas na distribuição financeira.

Qualquer mudança futura dessa regra exige decisão comercial/jurídica explícita.

---

# 120. Não permitir pagamento por fora no fluxo interno

O módulo financeiro não deve armazenar:

```text
PIX manual para CPF do mestre
comprovante enviado pelo jogador
status pago manualmente
```

O Pix aceito no MVP é cobrança criada pelo Asaas e confirmada via webhook.

---

# 121. Pagamento manual administrativo

Se no futuro houver exceção operacional:

```text
manual adjustment
```

deve ser entidade separada e auditada.

Não reutilizar `PAID` como botão admin sem evidência.

Fora do MVP.

---

# 122. API Contracts

Endpoints públicos definitivos serão documentados em:

```text
docs/API_CONTRACTS.md
```

Este documento define comportamentos, não URLs finais.

---

# 123. Ordem de implementação financeira

Seguir:

```text
1. Asaas config
2. Asaas HTTP client
3. PaymentProvider interface
4. customer integration
5. GM payment account integration
6. billing policy
7. split policy
8. internal subscription service
9. recurring card checkout
10. checkout webhooks
11. subscription webhooks
12. payment webhooks
13. first card payment reconciliation
14. split event handling
15. PIX manual subscription
16. PIX billing job
17. PIX payment creation
18. QR code retrieval
19. overdue handling
20. cancellation
21. refund
22. reconciliation service
23. admin webhook tools
24. sandbox validation
25. production pilot
```

Não implementar refunds antes do fluxo base estar estável.

---

# 124. Critério de pronto — cartão recorrente

Está pronto quando, somente via API/Swagger:

```text
1. usuário autenticado entra numa mesa
2. cria subscription CARD_RECURRING
3. recebe checkout Asaas
4. conclui checkout sandbox
5. webhook cria/vincula provider subscription
6. primeira cobrança vira PAID
7. split é identificado
8. dashboard API reflete pagamento
9. próxima cobrança é reconhecida
10. cancelamento impede novos ciclos
```

---

# 125. Critério de pronto — Pix mensal

Está pronto quando:

```text
1. subscription PIX_MANUAL existe
2. job gera payment interno
3. API cria cobrança PIX Asaas
4. API recupera QR Code
5. jogador paga sandbox
6. webhook muda payment para PAID
7. split é identificado
8. próximo vencimento é calculado
9. duplicidade de job não cria segunda cobrança
10. Pix vencido muda para OVERDUE
```

---

# 126. Critério de pronto — split

Está pronto quando:

```text
billing plan = 800 bps
      |
      v
provider recebe regra de 92% para GM
      |
      v
pagamento é recebido
      |
      v
PAYMENT_SPLIT_DONE
      |
      v
payment_splits = CONFIRMED
```

E valores efetivos ficam auditáveis.

---

# 127. Critério de pronto — webhook

Está pronto quando:

```text
evento original
-> processado

mesmo evento novamente
-> 2xx
-> nenhum efeito duplicado
```

E:

```text
evento com erro transitório
-> FAILED
-> pode ser reprocessado
```

---

# 128. Critério de pronto — reconciliação

Está pronta quando um pagamento interno PENDING com `provider_payment_id` consegue ser consultado no Asaas e corrigido para o estado real sem:

- duplicar cobrança;
- alterar outro payment;
- perder histórico.

---

# 129. Fora do escopo

Não implementar agora:

- Pix Automático;
- marketplace de produtos;
- escrow próprio;
- carteira interna GuildaPlay;
- saldo virtual;
- créditos;
- gift cards;
- cupons;
- parcelamento;
- pró-rata;
- trial;
- múltiplas moedas;
- múltiplos gateways;
- checkout próprio de cartão;
- armazenamento de cartão;
- emissão fiscal automática;
- antecipação;
- payouts manuais;
- transferências Pix feitas pela GuildaPlay;
- split entre múltiplos mestres;
- divisão entre jogadores;
- planos Pro;
- comissão variável dinâmica por volume.

---

# 130. Regras obrigatórias para o Codex

Antes de alterar pagamentos, o Codex deve ler:

```text
docs/ARCHITECTURE.md
docs/DATA_MODEL.md
docs/AUTH_SECURITY.md
docs/PAYMENTS_ASAAS.md
```

O Codex não deve:

1. criar cobrança diretamente no controller;
2. colocar chamadas Asaas em módulos aleatórios;
3. armazenar cartão/CVV;
4. confiar em valor enviado pelo frontend;
5. confiar em taxa enviada pelo frontend;
6. confiar em `walletId` enviado pelo frontend;
7. marcar pagamento como pago por redirect;
8. marcar pagamento como pago manualmente sem caso de uso;
9. ignorar webhook duplicado;
10. assumir ordem perfeita de webhook;
11. fazer retry cego de POST financeiro;
12. calcular split com float espalhado;
13. hardcodar 8% em diversos arquivos;
14. hardcodar taxa do Asaas;
15. usar provider ID como PK;
16. apagar pagamentos;
17. apagar refunds;
18. apagar webhook events;
19. tratar Pix manual como assinatura Pix nativa;
20. implementar Pix Automático nesta fase;
21. implementar marketplace nesta fase;
22. criar nova cobrança se já existe payment do mesmo ciclo;
23. permitir duas subscriptions ativas para o mesmo table member;
24. confiar em successUrl como confirmação;
25. retornar erro bruto do Asaas ao cliente.

---

# 131. Decisão resumida

A Fase 1 financeira da GuildaPlay funcionará assim:

```text
                       GUILDAPLAY API
                             |
               +-------------+-------------+
               |                           |
               v                           v
       CARD_RECURRING                  PIX_MANUAL
               |                           |
               v                           v
      Checkout recorrente         Job mensal GuildaPlay
             Asaas                         |
               |                           v
               v                   Cobrança Pix Asaas
        Asaas Subscription                 |
               |                           v
               +-------------+-------------+
                             |
                             v
                          Payment
                             |
                             v
                         Webhooks
                             |
                             v
                  Estado interno GuildaPlay
                             |
                             v
                         Split 92/8
                             |
                 +-----------+-----------+
                 |                       |
                 v                       v
              Mestre                GuildaPlay
```

Taxa padrão:

```text
GuildaPlay = 8%
Mestre     = 92%
```

sobre a base líquida usada pelo split do provider.

A GuildaPlay não armazenará dados completos de cartão.

O Asaas executará a infraestrutura financeira.

O Neon manterá o histórico operacional e financeiro necessário para que a GuildaPlay continue sendo a fonte de verdade do seu próprio domínio.
