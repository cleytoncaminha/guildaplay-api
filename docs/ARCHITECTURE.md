# GuildaPlay API — Architecture

> Documento-base da API para orientar o Codex durante o desenvolvimento.
>
> **Status:** Fase 1 — MVP comercial
> **Responsabilidade principal:** gestão de mesas, jogadores e cobranças recorrentes para mestres de RPG.

---

## 1. Objetivo da API

A API da GuildaPlay será o núcleo de negócio da plataforma.

Nesta primeira fase, ela deve permitir que um mestre:

1. crie sua conta e perfil;
2. crie uma mesa;
3. configure o valor mensal da mesa;
4. convide jogadores por link;
5. acompanhe os jogadores vinculados à mesa;
6. receba pagamentos via Asaas;
7. utilize Pix mensal ou cartão recorrente;
8. tenha o split da plataforma aplicado automaticamente;
9. acompanhe pagamentos pagos, pendentes, vencidos e cancelados.

O MVP **não é um marketplace público ainda**. O objetivo inicial é validar cobrança e gestão financeira com mesas reais já existentes.

---

## 2. Stack

### Backend

- **Node.js**
- **NestJS**
- **TypeScript**
- **REST API**
- **Swagger / OpenAPI**

### Banco de dados

- **PostgreSQL**
- **Neon**
- ORM/query builder: **TypeORM**

### Arquivos

- **Cloudflare R2**
- uploads via **presigned URLs**

### Pagamentos

- **Asaas**
- Pix
- cartão recorrente
- assinaturas
- split
- webhooks

### Infraestrutura

A API deverá ser deployável independentemente do frontend.

Frontend e backend são aplicações separadas.

Arquitetura esperada:

```text
Browser
   |
   v
Next.js Frontend
   |
   | HTTPS / REST
   v
NestJS API
   |
   +----------------+----------------+----------------+
   |                |                |                |
   v                v                v                v
 Neon             Asaas             R2          Email Provider
PostgreSQL       Payments          Storage        (futuro)
```

---

## 3. Regras arquiteturais obrigatórias

### 3.1 O frontend nunca acessa o banco diretamente

Correto:

```text
Frontend -> API -> Neon
```

Incorreto:

```text
Frontend -> Neon
```

Toda autorização e regra de negócio deve passar pela API.

---

### 3.2 O frontend nunca possui segredos do Asaas

Todas as ações sensíveis do Asaas devem acontecer na API.

```text
Frontend -> GuildaPlay API -> Asaas
```

A chave de API do Asaas nunca deve ser enviada ao browser.

---

### 3.3 Webhook é a fonte da verdade para pagamentos

Nunca considerar um pagamento confirmado apenas porque o usuário retornou de um checkout.

Fluxo correto:

```text
Asaas
  |
  v
POST /webhooks/asaas
  |
  v
Validar evento
  |
  v
Persistir evento
  |
  v
Atualizar pagamento/assinatura
```

O sistema deve ser **idempotente**.

O mesmo evento recebido duas vezes não pode gerar duas alterações financeiras.

---

### 3.4 A integração Asaas deve ser isolada

Não espalhar chamadas HTTP ao Asaas pelos módulos da aplicação.

Deve existir um módulo/provider dedicado.

Exemplo:

```text
BillingService
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

Interface conceitual:

```ts
interface PaymentProvider {
  createCustomer(...args: unknown[]): Promise<unknown>;
  createSubscription(...args: unknown[]): Promise<unknown>;
  createPixPayment(...args: unknown[]): Promise<unknown>;
  cancelSubscription(...args: unknown[]): Promise<unknown>;
  refundPayment(...args: unknown[]): Promise<unknown>;
}
```

Os contratos reais serão definidos em código quando os casos de uso forem implementados.

---

### 3.5 Billing != Asaas

O módulo `billing` representa as regras financeiras da GuildaPlay.

O módulo `asaas` representa somente a integração com o provedor externo.

Exemplo:

```text
billing/
  regra: plataforma cobra 8%

asaas/
  responsabilidade: traduzir essa regra para chamadas da API Asaas
```

Isso permite trocar o gateway futuramente sem reescrever toda a lógica de negócio.

---

## 4. Estrutura inicial de módulos

```text
src/
├── app.module.ts
├── main.ts
│
├── config/
│
└── database/
    ├── database.module.ts
    ├── data-source.ts
    └── migrations/
│
├── auth/
├── users/
├── gm-profiles/
├── tables/
├── table-members/
├── invitations/
│
├── billing/
├── subscriptions/
├── payments/
├── asaas/
├── webhooks/
│
├── uploads/
├── audit/
├── admin/
│
├── common/
│   ├── decorators/
│   ├── guards/
│   ├── interceptors/
│   ├── filters/
│   ├── pipes/
│   └── utils/
│
└── health/
```

Não criar módulos futuros sem necessidade real.

---

## 5. Responsabilidades dos módulos

### `auth`

Responsável por:

- registro;
- login;
- logout;
- refresh/session;
- recuperação de senha;
- validação de autenticação.

A estratégia exata de autenticação será detalhada em documento próprio.

---

### `users`

Representa a identidade principal de uma pessoa na plataforma.

Um usuário pode:

- jogar;
- ser mestre;
- exercer ambos os papéis.

Não criar tabelas de autenticação completamente separadas para jogador e mestre.

---

### `gm-profiles`

Informações específicas de quem atua como mestre.

Exemplos:

- nome público;
- bio;
- status;
- dados necessários para recebimento;
- identificadores externos do Asaas quando aplicável.

---

### `tables`

Representa uma mesa/campanha de RPG.

Responsabilidades:

- criar;
- editar;
- pausar;
- arquivar;
- configurar valor mensal;
- definir limite de jogadores;
- informações de agenda.

---

### `table-members`

Representa a relação entre jogador e mesa.

Exemplos de status:

```text
INVITED
ACTIVE
PAST_DUE
SUSPENDED
LEFT
REMOVED
```

Status definitivos serão documentados no `DATA_MODEL.md`.

---

### `invitations`

Permite ao mestre gerar links de convite.

Exemplo:

```text
https://app.guildaplay.com/invite/abc123
```

A API deve controlar:

- token;
- validade;
- mesa associada;
- quantidade de usos quando necessário;
- aceite do convite.

---

### `billing`

Camada de regras financeiras da GuildaPlay.

Responsável por:

- valor da mensalidade;
- percentual da plataforma;
- cálculo conceitual do split;
- ciclo de cobrança;
- regras de cancelamento;
- definição do que deve ser cobrado.

**Taxa padrão inicial da plataforma: 8%.**

A taxa não deve ficar hardcoded em múltiplos lugares do sistema.

Ela precisa ser configurável por mesa/mestre/plano no futuro.

---

### `subscriptions`

Representa cobranças recorrentes.

Responsável por:

- criação;
- ativação;
- cancelamento;
- status;
- próxima cobrança;
- associação jogador <-> mesa <-> Asaas.

---

### `payments`

Representa cobranças individuais.

Responsável por registrar internamente:

- valor bruto;
- status;
- vencimento;
- pagamento;
- método;
- ID externo do Asaas;
- informações necessárias para auditoria.

O banco da GuildaPlay deve manter seu próprio histórico.

Não depender exclusivamente da API Asaas para reconstruir o estado financeiro.

---

### `asaas`

Adapter/provider da API externa.

Responsável por operações como:

- cliente;
- cobrança;
- assinatura;
- Pix;
- split;
- cancelamento;
- reembolso;
- consulta externa.

O módulo não deve conter regras de produto da GuildaPlay.

---

### `webhooks`

Responsável por receber e processar eventos externos.

Inicialmente:

```text
POST /webhooks/asaas
```

Todo evento deve ser registrado antes ou durante seu processamento de maneira idempotente.

Criar tabela de eventos com `provider_event_id` único.

---

### `uploads`

Responsável por gerar URLs assinadas do R2.

Fluxo:

```text
Frontend
   |
   | solicita upload
   v
API
   |
   | gera presigned URL
   v
Frontend
   |
   | upload direto
   v
Cloudflare R2
```

A API deve validar:

- tipo MIME;
- tamanho máximo;
- finalidade do upload;
- usuário autorizado.

---

### `audit`

Registra ações importantes.

Exemplos:

```text
TABLE_CREATED
PLAYER_INVITED
PLAYER_JOINED_TABLE
SUBSCRIPTION_CREATED
SUBSCRIPTION_CANCELLED
PAYMENT_CONFIRMED
PAYMENT_OVERDUE
REFUND_CREATED
PLAYER_REMOVED
```

Pagamentos precisam ser auditáveis.

---

### `admin`

Painel administrativo futuro consumirá este módulo.

No MVP precisa existir suporte mínimo para:

- consultar usuários;
- consultar mestres;
- consultar mesas;
- consultar pagamentos;
- consultar eventos de webhook;
- identificar falhas de processamento.

---

## 6. Estrutura interna dos módulos

Preferência inicial:

```text
module/
├── module.controller.ts
├── module.service.ts
├── module.repository.ts
├── module.module.ts
├── dto/
├── types/
└── exceptions/
```

Fluxo preferencial:

```text
Controller
   |
   v
Service
   |
   +------> External Provider
   |
   v
Repository
   |
   v
Database
```

### Controllers

Devem:

- receber HTTP;
- validar DTO;
- chamar service;
- retornar response.

Não devem conter lógica de negócio complexa.

### Services

Devem conter os casos de uso e regras de negócio.

### Repositories

Devem centralizar acesso persistente quando isso trouxer clareza.

Evitar abstração desnecessária para queries triviais.

---

## 7. API REST

Usar endpoints orientados a recursos.

Exemplos previstos:

```text
POST   /auth/register
POST   /auth/login
POST   /auth/logout
GET    /me

POST   /tables
GET    /tables/:id
PATCH  /tables/:id
POST   /tables/:id/pause

POST   /tables/:id/invitations
POST   /invitations/:token/accept

GET    /tables/:id/members
DELETE /tables/:id/members/:memberId

POST   /subscriptions
GET    /subscriptions/:id
DELETE /subscriptions/:id

POST   /payments/pix
GET    /payments/:id

POST   /webhooks/asaas
```

Estes endpoints são direcionais, não um contrato definitivo.

O contrato final deve ser atualizado conforme implementação.

---

## 8. OpenAPI / Swagger

Swagger deve existir desde o início.

Endpoint sugerido:

```text
/api/docs
```

Objetivos:

- documentar contratos;
- facilitar testes;
- servir de referência para o frontend;
- permitir geração futura de client TypeScript.

Todo endpoint público deve ter DTOs claros.

---

## 9. Autenticação e autorização

A aplicação terá frontend e API separados.

Princípios obrigatórios:

- não armazenar credenciais sensíveis em `localStorage` se for evitável;
- cookies/tokens devem ser tratados de maneira segura;
- rotas privadas precisam de autenticação;
- autorização deve verificar propriedade dos recursos.

Exemplo:

Um mestre não pode editar uma mesa de outro mestre apenas conhecendo o `tableId`.

Autenticação será detalhada em `AUTH_SECURITY.md`.

---

## 10. Segurança financeira

### Nunca armazenar

- número completo de cartão;
- CVV;
- dados sensíveis de cartão;
- chave secreta do Asaas em banco acessível ao frontend.

### Sempre

- usar HTTPS em produção;
- validar webhooks;
- implementar idempotência;
- registrar eventos financeiros;
- tratar retries;
- controlar autorização;
- manter secrets somente no ambiente servidor.

---

## 11. Valores monetários

Nunca utilizar `float` para dinheiro.

Preferir:

- valores em centavos (`integer`), ou
- `numeric/decimal` com precisão explícita.

Exemplo conceitual:

```text
R$150,00 = 15000 centavos
```

A escolha definitiva deve ser consistente em toda a API e descrita em `DATA_MODEL.md`.

---

## 12. Datas e timezone

Persistir datas absolutas em UTC quando aplicável.

Mesas precisam guardar timezone explicitamente.

Exemplo:

```text
America/Sao_Paulo
America/Argentina/Buenos_Aires
```

Não assumir timezone do servidor.

---

## 13. Erros

A API deve ter formato previsível.

Exemplo:

```json
{
  "statusCode": 400,
  "code": "TABLE_FULL",
  "message": "A mesa não possui vagas disponíveis."
}
```

Evitar expor:

- stack traces;
- SQL;
- secrets;
- respostas internas completas do Asaas.

---

## 14. Logs

Logs devem ajudar a diagnosticar problemas sem expor dados sensíveis.

Registrar pelo menos:

- request relevante;
- erros;
- integração externa;
- ID do evento webhook;
- IDs internos relacionados.

Nunca logar:

- tokens completos;
- API keys;
- dados completos de cartão;
- segredos.

---

## 15. Ambientes

Ter no mínimo:

```text
local
staging/sandbox
production
```

Pagamento deve utilizar sandbox do Asaas antes de produção.

Variáveis esperadas conceitualmente:

```text
DATABASE_URL=
ASAAS_API_KEY=
ASAAS_API_URL=
ASAAS_WEBHOOK_TOKEN=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_URL=
FRONTEND_URL=
```

Não versionar `.env` real.

Manter `.env.example` atualizado.

---

## 16. Health check

Criar endpoint:

```text
GET /health
```

Retorno básico:

```json
{
  "status": "ok"
}
```

Pode evoluir futuramente para verificar dependências.

---

## 17. Testes mínimos

### Unitários

Prioridade para:

- billing;
- cálculo/regras de comissão;
- autorização;
- transformação de eventos Asaas.

### Integração

- repositories;
- endpoints principais;
- integração Asaas sandbox quando possível.

### E2E críticos

Antes de produção:

```text
01 mestre cria mesa
02 mestre gera convite
03 jogador aceita convite
04 assinatura cartão criada
05 Pix criado
06 pagamento confirmado
07 pagamento vencido
08 assinatura cancelada
09 webhook duplicado
10 reembolso
11 split configurado corretamente
12 usuário não autorizado tenta editar mesa
```

---

## 18. Idempotência

Operações financeiras precisam tolerar retries.

Casos críticos:

- criação de assinatura;
- processamento de webhook;
- confirmação de pagamento;
- reembolso.

Nunca presumir que uma requisição externa ocorrerá exatamente uma vez.

---

## 19. Escopo do MVP

### Incluído

- autenticação;
- usuário;
- perfil de mestre;
- mesas;
- membros;
- convites;
- billing mensal;
- cartão recorrente;
- Pix mensal;
- split da plataforma;
- webhooks;
- dashboard financeiro via API;
- uploads básicos;
- auditoria mínima;
- admin mínimo.

### Fora do MVP

Não implementar agora:

- marketplace público de mesas;
- busca avançada;
- matchmaking;
- grupos procurando mestre;
- avaliações;
- chat;
- fórum;
- comunidade;
- catálogo estilo Ludopedia;
- marketplace de usados;
- produtos digitais;
- app mobile;
- integração Discord;
- VTT;
- IA;
- Pix Automático.

Esses itens pertencem a fases posteriores.

---

## 20. Critério de conclusão da Fase 1

A Fase 1 estará concluída quando for possível executar em produção, com dinheiro real, o seguinte fluxo:

```text
Mestre cria conta
        |
        v
Mestre configura perfil
        |
        v
Mestre cria mesa de R$150/mês
        |
        v
Mestre gera link de convite
        |
        v
Jogador cria conta
        |
        v
Jogador entra na mesa
        |
        +-------------------+
        |                   |
        v                   v
Cartão recorrente         Pix mensal
        |                   |
        +---------+---------+
                  |
                  v
                Asaas
                  |
                  v
               Webhook
                  |
                  v
GuildaPlay atualiza pagamento
                  |
         +--------+--------+
         |                 |
         v                 v
Dashboard mestre    Dashboard jogador
```

O primeiro rollout deve ser gradual:

```text
1 mestre + 1 mesa + ~4 jogadores
                ↓
3 mesas + ~12 jogadores
                ↓
10 mesas + ~40 jogadores
```

exemplo

src/
└── tables/
    ├── dto/
    │   ├── create-table.dto.ts
    │   ├── update-table.dto.ts
    │   └── table-response.dto.ts
    ├── tables.controller.ts
    ├── tables.service.ts
    ├── tables.repository.ts
    └── tables.module.ts
---


fluxo

HTTP Request
   ↓
Controller
   ↓
DTO validation
   ↓
Service
   ↓
Repository
   ↓
Neon/PostgreSQL


## 21. Regras para o Codex

Ao trabalhar neste repositório, o Codex deve:

1. ler este arquivo antes de mudanças arquiteturais relevantes;
2. respeitar a separação entre `billing` e `asaas`;
3. não colocar lógica de negócio complexa em controllers;
4. não permitir acesso direto do frontend ao Neon;
5. não expor secrets ao frontend;
6. considerar webhooks como fonte da verdade de pagamento;
7. garantir idempotência em fluxos financeiros;
8. atualizar a documentação quando alterar decisões arquiteturais;
9. não implementar funcionalidades explicitamente marcadas como fora do MVP sem solicitação;
10. preferir soluções simples e compatíveis com o escopo atual;
11. não alterar contratos existentes silenciosamente;
12. criar migrations para mudanças de schema;
13. manter `.env.example` atualizado;
14. manter Swagger/OpenAPI coerente com os endpoints implementados;
15. executar testes relevantes antes de considerar uma etapa concluída.

---

## 22. Princípio principal

> **A GuildaPlay API deve começar simples, mas os fluxos financeiros precisam nascer corretos.**

O objetivo da Fase 1 não é construir todo o ecossistema de RPG.

É provar que mestres conseguem administrar suas mesas e receber mensalidades de forma mais simples através da GuildaPlay.

---

## 23. Módulo Catalog: Dados da Guilda

`src/catalog` é um domínio independente para o catálogo público de RPG. Nesta
etapa, possui entidades TypeORM, persistência e CRUD editorial protegido por
`ADMIN` para sistemas de RPG, itens de catálogo, edições, editoras, criadores,
categorias, tags, aliases, fontes e suas associações.

Há endpoints públicos de leitura para itens publicados, com busca e filtros;
avaliações, favoritos e contribuição comunitária continuam fora do escopo. O
upload de capa e imagens de catálogo usa o módulo Media/R2 e exige ADMIN.
Recursos futuros do catálogo não devem reutilizar `game_tables` como registros
de catálogo.
