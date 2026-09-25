# GuildaPlay API — Authentication & Security

> Segurança e autenticação da API NestJS da GuildaPlay.
>
> Este documento deve ser lido junto com:
>
> - `docs/ARCHITECTURE.md`
> - `docs/DATA_MODEL.md`
>
> **Status:** Fase 1 — MVP comercial  
> **Escopo atual:** API primeiro. O frontend ainda não faz parte desta fase de implementação.
>
> A API deve ser completamente utilizável e testável via Swagger, cURL ou cliente HTTP antes da integração com qualquer frontend.

---

# 1. Objetivo

Definir como a API deve tratar:

- registro;
- login;
- logout;
- sessões;
- access token;
- refresh token;
- recuperação de senha;
- verificação de e-mail;
- roles;
- autorização por recurso;
- proteção contra IDOR;
- CORS;
- CSRF nos pontos aplicáveis;
- rate limiting;
- validação de entrada;
- headers de segurança;
- segredos;
- logs e auditoria;
- endpoints financeiros;
- integração segura com Asaas e R2.

O objetivo é ter uma base segura para:

```text
Client
   |
   | HTTPS
   v
NestJS API
   |
   +---- Neon PostgreSQL
   |
   +---- Asaas
   |
   +---- Cloudflare R2
```

O frontend futuro será apenas um consumidor da API.

---

# 2. Princípios obrigatórios

## 2.1 API-first

A API não pode depender do Next.js para:

- autenticar;
- validar autorização;
- acessar banco;
- calcular regras financeiras;
- validar ownership;
- criar cobranças;
- processar webhooks;
- fazer upload seguro;
- executar lógica de negócio.

Correto:

```text
Cliente -> NestJS API -> serviços externos
```

Incorreto:

```text
Cliente -> lógica sensível própria -> banco/gateway
```

---

## 2.2 Deny by default

Por padrão, endpoints devem exigir autenticação.

Somente rotas explicitamente marcadas como públicas podem ser acessadas sem usuário autenticado.

Exemplos públicos:

```text
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/forgot-password
POST /auth/reset-password
GET  /health
GET  /invitations/:token/preview
POST /webhooks/asaas
```

`POST /webhooks/asaas` é público apenas no sentido de não usar autenticação de usuário.

Ele deve possuir autenticação/validação própria do provedor.

---

## 2.3 Nunca confiar em dados de autorização enviados pelo cliente

O cliente nunca decide:

```text
userId
gmId
ownerId
platformFee
walletId
role
paymentStatus
subscriptionStatus
```

Exemplo incorreto:

```json
{
  "tableId": "...",
  "gmId": "qualquer-id",
  "platformFeeBps": 0
}
```

O backend deve obter o usuário autenticado pelo token e resolver os demais dados internamente.

---

## 2.4 Segurança financeira tem prioridade

Rotas relacionadas a:

- assinaturas;
- pagamentos;
- Pix;
- split;
- reembolso;
- conta de recebimento;
- webhooks;

devem possuir controles mais rigorosos de:

- autorização;
- idempotência;
- logs;
- auditoria;
- validação;
- tratamento de erros.

---

# 3. Estratégia de autenticação

A estratégia inicial será:

```text
Access Token
+
Refresh Token rotativo
```

## Access Token

Formato:

```text
JWT
```

Características:

- curta duração;
- enviado em `Authorization: Bearer <token>`;
- não deve conter dados sensíveis;
- validado pela API em cada requisição protegida.

TTL inicial recomendado:

```text
15 minutos
```

Configurável por variável de ambiente.

---

## Refresh Token

Formato:

```text
token aleatório opaco
```

Características:

- alta entropia;
- longa duração;
- rotacionado a cada refresh;
- somente o hash é persistido no banco;
- pode ser revogado;
- vinculado a uma sessão;
- reutilização de token antigo deve ser tratada como comportamento suspeito.

TTL inicial recomendado:

```text
30 dias
```

Configurável por variável de ambiente.

---

# 4. Conteúdo do Access Token

Payload mínimo recomendado:

```json
{
  "sub": "user-uuid",
  "sid": "session-uuid",
  "roles": ["USER", "GM"],
  "iat": 0,
  "exp": 0
}
```

Não colocar no JWT:

- senha;
- hash de senha;
- CPF;
- dados do Asaas;
- `walletId`;
- API keys;
- dados bancários;
- endereço;
- telefone sem necessidade;
- dados de cartão;
- valores financeiros;
- perfil completo do usuário.

`sub` deve ser o UUID interno de `users.id`.

---

# 5. Assinatura do JWT

Para o MVP, a API pode utilizar segredo simétrico forte para assinar access tokens.

Requisitos:

- segredo aleatório;
- pelo menos 256 bits de entropia;
- armazenado somente em secret/env da infraestrutura;
- nunca commitado no repositório;
- diferente dos segredos de Asaas, R2 e banco.

Nome sugerido:

```text
JWT_ACCESS_SECRET
```

A arquitetura deve permitir migração futura para chave assimétrica sem alterar os casos de uso do domínio.

---

# 6. Refresh token rotation

O refresh token deve ser rotacionado.

Fluxo:

```text
login
  |
  v
session criada
  |
  +---- access token A
  |
  +---- refresh token A
              |
              v
         /auth/refresh
              |
              v
     refresh A é invalidado
              |
              +---- access token B
              |
              +---- refresh token B
```

Se `refresh token A` aparecer novamente depois da rotação:

```text
token reutilizado
      |
      v
revogar sessão/família
      |
      v
exigir novo login
```

Isso reduz impacto de roubo de refresh token.

---

# 7. Armazenamento de tokens

Nunca persistir access token ou refresh token bruto.

Correto:

```text
refresh token bruto -> cliente
hash(refresh token) -> banco
```

O token deve ser gerado usando CSPRNG.

Não usar:

- UUID simples como refresh token;
- timestamp;
- sequência previsível;
- `Math.random()`;
- JWT de longa duração sem possibilidade de revogação.

---

# 8. Tabelas de autenticação

`DATA_MODEL.md` deixou as tabelas específicas de autenticação para este documento.

As seguintes tabelas devem ser adicionadas ao schema.

---

## 8.1 `auth_credentials`

Credencial local de e-mail/senha.

| Campo                 | Tipo        | Regra            |
| --------------------- | ----------- | ---------------- |
| `user_id`             | uuid        | PK/FK `users.id` |
| `password_hash`       | varchar     | obrigatório      |
| `password_changed_at` | timestamptz |                  |
| `created_at`          | timestamptz |                  |
| `updated_at`          | timestamptz |                  |

Regras:

- nunca armazenar senha em texto puro;
- não duplicar `email` nessa tabela;
- um usuário possui no máximo uma credencial local;
- arquitetura deve permitir outros providers futuramente sem alterar `users`.

---

## 8.2 `auth_sessions`

Representa uma sessão autenticada.

| Campo                | Tipo                  | Regra         |
| -------------------- | --------------------- | ------------- |
| `id`                 | uuid                  | PK            |
| `user_id`            | uuid                  | FK `users.id` |
| `refresh_token_hash` | varchar(255)          | obrigatório   |
| `token_family_id`    | uuid                  | obrigatório   |
| `user_agent`         | varchar(500) nullable |               |
| `ip_address`         | inet nullable         |               |
| `last_used_at`       | timestamptz           |               |
| `expires_at`         | timestamptz           |               |
| `revoked_at`         | timestamptz nullable  |               |
| `created_at`         | timestamptz           |               |

Índices:

```text
auth_sessions(user_id)
auth_sessions(token_family_id)
auth_sessions(expires_at)
```

Regras:

- sessão expirada não é válida;
- sessão revogada não é válida;
- refresh token anterior deve deixar de ser válido após rotação;
- logout deve revogar a sessão atual;
- "logout de todos os dispositivos" revoga todas as sessões do usuário.

---

## 8.3 `email_verification_tokens`

| Campo        | Tipo                 | Regra         |
| ------------ | -------------------- | ------------- |
| `id`         | uuid                 | PK            |
| `user_id`    | uuid                 | FK `users.id` |
| `token_hash` | varchar(255)         | UNIQUE        |
| `expires_at` | timestamptz          |               |
| `used_at`    | timestamptz nullable |               |
| `created_at` | timestamptz          |               |

O token bruto é enviado ao usuário.

Somente o hash permanece no banco.

TTL inicial recomendado:

```text
24 horas
```

---

## 8.4 `password_reset_tokens`

| Campo        | Tipo                 | Regra         |
| ------------ | -------------------- | ------------- |
| `id`         | uuid                 | PK            |
| `user_id`    | uuid                 | FK `users.id` |
| `token_hash` | varchar(255)         | UNIQUE        |
| `expires_at` | timestamptz          |               |
| `used_at`    | timestamptz nullable |               |
| `created_at` | timestamptz          |               |

TTL inicial recomendado:

```text
1 hora
```

Ao redefinir senha:

1. validar token;
2. alterar senha;
3. marcar token como utilizado;
4. revogar todas as sessões atuais;
5. exigir novo login.

---

# 9. Senhas

## 9.1 Hash

Usar:

```text
Argon2id
```

A configuração deve ser calibrada para o ambiente de produção.

Não hardcodar parâmetros inseguros apenas para deixar testes rápidos.

É aceitável usar parâmetros menores exclusivamente em ambiente `test`.

---

## 9.2 Política inicial

Recomendação:

```text
mínimo: 10 caracteres
máximo: 128 caracteres
```

Permitir:

- espaços;
- passphrases;
- símbolos;
- Unicode quando suportado corretamente.

Não exigir regras artificiais como:

```text
1 maiúscula
1 símbolo
1 número
```

como única defesa.

Nunca:

- truncar silenciosamente a senha;
- enviar senha por e-mail;
- registrar senha em log;
- retornar senha/hash pela API.

---

# 10. E-mail verificado

O usuário pode criar conta e autenticar antes da verificação, mas ações sensíveis devem exigir e-mail verificado.

Na Fase 1, exigir `email_verified_at != null` antes de:

- criar perfil de mestre ativo;
- criar mesa ativa;
- gerar convite para mesa;
- iniciar assinatura;
- iniciar pagamento;
- configurar conta de recebimento.

Pode ser permitido:

- login;
- leitura do próprio perfil;
- reenvio do e-mail de verificação;
- logout.

---

# 11. Endpoints de autenticação

Contrato conceitual inicial:

```text
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
POST /auth/logout-all

GET  /auth/me

POST /auth/verify-email
POST /auth/resend-verification

POST /auth/forgot-password
POST /auth/reset-password
```

Os contratos completos serão documentados posteriormente em `API_CONTRACTS.md`.

---

# 12. Registro

Fluxo:

```text
POST /auth/register
      |
      v
validar DTO
      |
      v
normalizar email
      |
      v
email já existe?
  |          |
 sim        não
  |          |
 erro       v
       hash senha
            |
            v
         users
            |
            v
    auth_credentials
            |
            v
role USER por padrão
            |
            v
token de verificação
```

Não conceder role `GM` ou `ADMIN` com base em valor enviado livremente pelo cliente.

Exemplo proibido:

```json
{
  "email": "...",
  "password": "...",
  "role": "ADMIN"
}
```

---

# 13. Login

Fluxo:

```text
POST /auth/login
      |
      v
email normalizado
      |
      v
buscar usuário
      |
      v
verificar password Argon2id
      |
      v
status ACTIVE?
      |
      v
criar auth_session
      |
      +---- access token
      |
      +---- refresh token
```

A resposta não deve revelar se:

- e-mail existe;
- senha estava incorreta;
- conta inexistente.

Mensagem externa preferida:

```text
Credenciais inválidas.
```

Logs internos podem diferenciar os motivos.

---

# 14. Transporte do refresh token

Como o consumidor web futuro ficará separado da API, a estratégia web preferida será:

```text
refresh token -> cookie HttpOnly
access token  -> response body
```

Características do cookie em produção:

```text
HttpOnly
Secure
SameSite=Lax
Path=/auth
```

Não usar:

```text
localStorage
```

para refresh token.

O frontend não está no escopo atual.

Durante desenvolvimento API-first:

- Swagger/cURL podem utilizar mecanismo auxiliar somente em ambiente local;
- não degradar o design de produção apenas para facilitar Swagger;
- nunca habilitar endpoint que exponha hashes/tokens persistidos.

---

# 15. CORS

CORS deve ser configurado por allowlist.

Exemplo futuro:

```text
https://app.guildaplay.com
```

Desenvolvimento:

```text
http://localhost:3000
```

Nunca usar em produção:

```text
Access-Control-Allow-Origin: *
```

junto com credenciais.

Configurações devem vir de:

```text
CORS_ALLOWED_ORIGINS
```

Lista separada por ambiente.

---

# 16. CSRF

As requisições normais da API utilizarão:

```text
Authorization: Bearer <access-token>
```

Portanto não dependem de cookie para autorização.

Os endpoints que utilizarem refresh cookie devem exigir proteção adicional.

No MVP:

1. `SameSite=Lax`;
2. `Secure` em produção;
3. validação estrita de `Origin`/`Referer` quando aplicável;
4. CORS por allowlist.

Se a arquitetura futura passar a autenticar requisições de negócio diretamente por cookie, implementar token CSRF explícito antes dessa mudança.

---

# 17. Guards e decorators NestJS

Estrutura sugerida:

```text
src/common/
├── decorators/
│   ├── current-user.decorator.ts
│   ├── public.decorator.ts
│   └── roles.decorator.ts
│
└── guards/
    ├── jwt-auth.guard.ts
    ├── roles.guard.ts
    └── verified-email.guard.ts
```

Exemplo conceitual:

```ts
@UseGuards(JwtAuthGuard)
@Get('me')
getMe(@CurrentUser() user: AuthenticatedUser) {}
```

Endpoints públicos:

```ts
@Public()
@Post('login')
login(...) {}
```

---

# 18. Global auth guard

Preferência:

- registrar `JwtAuthGuard` globalmente;
- liberar apenas endpoints com `@Public()`.

Isso é mais seguro que lembrar de adicionar guard em cada controller.

Fluxo:

```text
endpoint
   |
   v
é @Public()?
  |      |
 sim    não
  |      |
pass     v
      JWT válido?
        |     |
       não   sim
        |     |
       401    v
           request.user
```

---

# 19. Roles

Roles iniciais:

```text
USER
GM
ADMIN
```

Regras:

### `USER`

Pode:

- gerenciar próprio perfil;
- aceitar convite;
- participar de mesa;
- gerenciar próprias assinaturas/pagamentos permitidos.

### `GM`

Pode adicionalmente:

- possuir `gm_profile`;
- criar mesas;
- editar próprias mesas;
- gerar convites para próprias mesas;
- visualizar membros de próprias mesas;
- visualizar dashboard financeiro das próprias mesas.

### `ADMIN`

Pode executar operações administrativas documentadas.

`ADMIN` nunca deve ser concedido por endpoint público.

---

# 20. Role não substitui ownership

Esta regra é obrigatória.

Ser `GM` não significa poder editar qualquer mesa.

Incorreto:

```text
user.role == GM
=> pode PATCH /tables/:id
```

Correto:

```text
user.role == GM
AND
table.gm_id pertence ao gm_profile desse usuário
```

Exemplo:

```text
PATCH /tables/123
        |
        v
authenticated user
        |
        v
é GM?
        |
        v
mesa pertence a ele?
        |
        +---- não -> 403/404
        |
        +---- sim -> atualizar
```

A autorização por ownership deve ser verificada no `service` ou policy dedicada, não apenas no controller.

---

# 21. Matriz de autorização inicial

| Recurso/Ação                          |          USER | GM dono | Outro GM |         ADMIN |
| ------------------------------------- | ------------: | ------: | -------: | ------------: |
| Ver próprio usuário                   |            ✅ |      ✅ |       ✅ |            ✅ |
| Editar próprio usuário                |            ✅ |      ✅ |       ✅ |            ✅ |
| Criar gm profile                      |            ✅ |      ✅ |       ✅ |            ✅ |
| Criar mesa                            |            ❌ |      ✅ |       ✅ |            ✅ |
| Editar própria mesa                   |            ❌ |      ✅ |       ❌ |            ✅ |
| Arquivar própria mesa                 |            ❌ |      ✅ |       ❌ |            ✅ |
| Gerar convite da própria mesa         |            ❌ |      ✅ |       ❌ |            ✅ |
| Ver membros da própria mesa           | membro apenas |      ✅ |       ❌ |            ✅ |
| Aceitar convite recebido              |            ✅ |      ✅ |       ✅ |            ✅ |
| Criar própria assinatura              |            ✅ |      ✅ |       ✅ |            ✅ |
| Cancelar própria assinatura           |            ✅ |      ✅ |       ✅ |            ✅ |
| Ver pagamento próprio                 |            ✅ |      ✅ |       ✅ |            ✅ |
| Ver pagamentos da mesa                |            ❌ |      ✅ |       ❌ |            ✅ |
| Alterar status financeiro manualmente |            ❌ |      ❌ |       ❌ |    controlado |
| Processar webhook                     |            ❌ |      ❌ |       ❌ | provider only |

Essa tabela é conceitual e será refinada pelos contratos da API.

---

# 22. Proteção contra IDOR

Nunca considerar seguro um recurso apenas porque seu ID é UUID.

Exemplo de ataque:

```text
GET /tables/<uuid-de-outra-pessoa>/payments
```

A API deve verificar relacionamento/ownership em toda consulta sensível.

Repository não deve simplesmente executar:

```text
findById(id)
```

quando a operação exige ownership.

Preferir métodos como:

```text
findOwnedByGm(tableId, gmProfileId)
findPaymentOwnedByUser(paymentId, userId)
findSubscriptionOwnedByUser(subscriptionId, userId)
```

ou policy equivalente.

---

# 23. Convites

Tokens de convite seguem a mesma regra de segurança do `DATA_MODEL.md`.

```text
URL -> token bruto
DB  -> token_hash
```

O preview público de convite pode retornar apenas dados seguros:

```text
nome da mesa
sistema
dia/horário
valor mensal
nome público do mestre
quantidade de vagas
```

Não retornar:

- e-mails;
- IDs financeiros;
- membros;
- dados privados do mestre;
- dados de outros jogadores.

Aceitar convite exige autenticação.

---

# 24. Validação de DTOs

Usar DTOs NestJS para toda entrada externa.

Configurar globalmente `ValidationPipe`.

Preferência:

```ts
new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});
```

Nunca aceitar objetos livres diretamente em services.

Exemplo:

```text
HTTP
 |
 v
CreateTableDto
 |
 v
TablesController
 |
 v
TablesService
```

DTO não contém regra de domínio financeira sensível enviada pelo cliente.

---

# 25. Mass assignment

Evitar:

```ts
repository.create(dto);
```

quando `dto` pode possuir propriedades inesperadas.

O service deve mapear explicitamente campos permitidos.

Exemplo conceitual:

```ts
const table = {
  name: dto.name,
  description: dto.description,
  maxPlayers: dto.maxPlayers,
  // gmId vem do usuário autenticado
  gmId: currentGm.id,
};
```

---

# 26. Headers de segurança

Aplicar `helmet` ou configuração equivalente no bootstrap NestJS.

Desabilitar informação desnecessária sobre tecnologia.

Não expor:

```text
X-Powered-By
```

Configurações exatas podem variar conforme deploy, mas devem existir em produção.

---

# 27. HTTPS

Produção deve operar exclusivamente por HTTPS.

A aplicação pode confiar no proxy da infraestrutura somente quando configurado corretamente.

Cookies com refresh token em produção:

```text
Secure=true
```

---

# 28. Rate limiting

Usar `@nestjs/throttler` ou mecanismo equivalente.

Limites iniciais sugeridos:

| Endpoint                          | Limite inicial                  |
| --------------------------------- | ------------------------------- |
| `POST /auth/login`                | 5/min por IP + chave por e-mail |
| `POST /auth/register`             | 5/15min por IP                  |
| `POST /auth/forgot-password`      | 3/15min por IP/e-mail           |
| `POST /auth/resend-verification`  | 3/15min                         |
| `POST /auth/refresh`              | 30/min por sessão/IP            |
| `POST /invitations/:token/accept` | 10/min                          |
| operações financeiras             | limites específicos             |

Os valores devem ser configuráveis.

Não usar o rate limiter normal para descartar webhooks legítimos do Asaas.

Webhooks precisam de controles próprios.

---

# 29. Brute force

Além de rate limiting:

- registrar tentativas suspeitas sem armazenar senha;
- não informar se o e-mail existe;
- aplicar atraso/rate limit progressivo se necessário;
- permitir bloqueio operacional em caso de abuso.

Não implementar lockout permanente automático por poucas falhas, pois isso pode ser usado para DoS contra contas legítimas.

---

# 30. Recuperação de senha

Resposta pública deve ser neutra:

```text
Se existir uma conta para esse e-mail, enviaremos as instruções.
```

Fluxo:

```text
forgot-password
       |
       v
token aleatório
       |
       +---- hash -> DB
       |
       +---- raw token -> e-mail
```

Ao utilizar:

```text
reset-password
     |
     v
token válido?
     |
     v
senha nova
     |
     v
revogar sessões
```

---

# 31. Alteração de senha autenticada

Quando existir endpoint para alteração de senha:

- exigir senha atual;
- validar senha atual;
- aplicar nova senha;
- atualizar `password_changed_at`;
- revogar outras sessões;
- opcionalmente manter somente a sessão atual, rotacionada.

---

# 32. Segurança do Asaas

Regras obrigatórias:

- API key somente no backend;
- nunca retornar API key;
- nunca registrar API key em logs;
- nunca receber `walletId` arbitrário do frontend para split;
- vincular conta Asaas ao mestre internamente;
- validar autorização antes de criar cobrança;
- webhook é a fonte da verdade para status de pagamento;
- nunca permitir endpoint público para marcar pagamento como `PAID`;
- nunca permitir que mestre altere `provider_fee_cents`;
- nunca permitir que mestre altere `platform_fee_bps` diretamente.

A validação exata de webhook e os fluxos financeiros serão detalhados em:

```text
docs/PAYMENTS_ASAAS.md
```

---

# 33. Endpoints financeiros

Exemplos de operações proibidas ao cliente:

```text
PATCH /payments/:id
{
  "status": "PAID"
}
```

```text
PATCH /subscriptions/:id
{
  "platformFeeBps": 0
}
```

Status financeiros só podem mudar através de:

- casos de uso internos autorizados;
- eventos confirmados do provider;
- ação administrativa auditada quando prevista.

---

# 34. Idempotência

Operações que podem gerar efeito financeiro devem aceitar ou gerar chave idempotente.

Exemplos:

- criar assinatura;
- criar cobrança Pix;
- reembolsar;
- processar webhook.

O usuário clicar duas vezes em:

```text
Assinar
```

não pode criar duas assinaturas.

A estratégia detalhada ficará em `PAYMENTS_ASAAS.md`.

---

# 35. Webhooks

Endpoint:

```text
POST /webhooks/asaas
```

Regras:

1. autenticar/validar origem usando o mecanismo suportado/configurado pelo Asaas;
2. validar estrutura mínima;
3. persistir evento;
4. aplicar unique constraint em `provider_event_id`;
5. responder de forma adequada a duplicatas;
6. processar de forma idempotente;
7. não confiar em campos enviados por outro endpoint do cliente;
8. não registrar segredos;
9. auditar falhas.

Nunca usar somente IP allowlist como autenticação principal do webhook.

Detalhes específicos ficam em:

```text
PAYMENTS_ASAAS.md
```

---

# 36. Cloudflare R2

Credenciais R2 somente na API.

A API deve gerar presigned URLs.

Fluxo:

```text
client
  |
  | POST /uploads/presign
  v
API
  |
  | valida usuário + finalidade
  v
presigned URL
  |
  v
upload direto para R2
```

A API deve controlar:

- prefixo/path;
- owner;
- finalidade;
- tamanho;
- MIME permitido;
- expiração curta da URL.

Nunca permitir que o cliente escolha livremente uma key como:

```text
../../outro-usuario/avatar
```

---

# 37. MIME e tamanho de upload

Valores iniciais:

### Avatar

```text
image/jpeg
image/png
image/webp
```

Máximo:

```text
2 MB
```

### Capa de mesa

```text
image/jpeg
image/png
image/webp
```

Máximo:

```text
5 MB
```

Esses limites devem ser configuráveis.

A extensão do arquivo não é prova suficiente do tipo real.

---

# 38. Segredos e variáveis de ambiente

Nunca commit:

```text
.env
.env.production
```

Pode existir:

```text
.env.example
```

sem valores reais.

Segredos esperados futuramente:

```text
DATABASE_URL

JWT_ACCESS_SECRET
ACCESS_TOKEN_TTL
REFRESH_TOKEN_TTL

ASAAS_API_KEY
ASAAS_BASE_URL
ASAAS_WEBHOOK_SECRET

R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME

CORS_ALLOWED_ORIGINS
```

Os nomes exatos podem ser ajustados durante implementação, mas devem ficar centralizados em `config/`.

---

# 39. Configuração tipada

Criar validação de ambiente ao inicializar a aplicação.

Se variável obrigatória estiver ausente:

```text
aplicação deve falhar no startup
```

Preferir schema com:

- Zod;
- Joi;
- solução equivalente.

Não deixar a aplicação iniciar parcialmente configurada em produção.

---

# 40. Ambientes

Separar no mínimo:

```text
development
test
production
```

As credenciais nunca devem ser compartilhadas entre produção e desenvolvimento.

Asaas:

```text
development -> sandbox
production  -> produção
```

Neon:

preferir databases/branches separadas por ambiente.

R2:

preferir prefixos ou buckets separados conforme necessidade.

---

# 41. Logs

Logs podem conter:

- request ID;
- método;
- rota;
- status HTTP;
- duração;
- user ID interno quando autenticado;
- event ID;
- payment ID interno;
- erro sanitizado.

Nunca registrar:

- senha;
- hash da senha;
- access token completo;
- refresh token;
- API key;
- token de verificação;
- token de reset;
- token de convite bruto;
- número completo do cartão;
- CVV;
- payload sensível inteiro sem sanitização.

---

# 42. Request ID

Toda requisição deve possuir `requestId`.

Se não vier de proxy confiável, a API gera.

O `requestId` deve aparecer nos logs e, quando apropriado, na resposta de erro.

Isso permitirá rastrear:

```text
request
-> service
-> provider externo
-> erro
```

---

# 43. Tratamento de erros

Criar filter global de exceções.

Resposta de erro pública deve ser consistente.

Exemplo:

```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Dados inválidos.",
  "requestId": "..."
}
```

Produção não deve retornar:

- stack trace;
- query SQL;
- caminho local;
- segredo;
- detalhes internos do Asaas;
- exceção bruta.

---

# 44. 401 vs 403

Usar:

```text
401 Unauthorized
```

quando não há autenticação válida.

Usar:

```text
403 Forbidden
```

quando usuário autenticado não possui permissão.

Para recursos sensíveis em que revelar existência seja indesejado, pode-se retornar:

```text
404 Not Found
```

para evitar enumeração.

A decisão deve ser consistente por domínio.

---

# 45. Auditoria

Eventos relevantes de segurança e negócio devem gerar `audit_logs`.

Exemplos:

```text
USER_REGISTERED
EMAIL_VERIFIED
LOGIN_SUCCEEDED
LOGIN_FAILED
LOGOUT
ALL_SESSIONS_REVOKED

GM_PROFILE_CREATED
TABLE_CREATED
PLAYER_INVITED
PLAYER_JOINED_TABLE

SUBSCRIPTION_CREATED
SUBSCRIPTION_CANCELLED
PAYMENT_CONFIRMED
PAYMENT_OVERDUE
REFUND_CREATED

ADMIN_ACTION
```

Audit log não deve conter segredos.

---

# 46. Ações administrativas

Admin deve usar os mesmos princípios de autenticação.

No MVP:

- role `ADMIN`;
- rotas separadas;
- toda ação mutativa auditada;
- não fornecer endpoint genérico para editar qualquer coluna;
- não permitir alterar diretamente status financeiro sem caso de uso explícito.

Futuramente considerar MFA obrigatório para admins antes de ampliar poderes administrativos.

---

# 47. Segurança do banco

Somente a API deve conhecer `DATABASE_URL`.

A aplicação deve utilizar usuário/credencial com permissões adequadas.

Evitar:

- acesso público direto desnecessário;
- credencial administrativa de banco para runtime;
- SQL formado por concatenação de entrada.

TypeORM deve utilizar parâmetros para valores externos.

---

# 48. Transações de banco

Operações que alteram múltiplos registros relacionados devem utilizar transação quando necessário.

Exemplos:

```text
aceitar convite
+
criar table_member
```

```text
registrar evento financeiro
+
atualizar pagamento
+
atualizar assinatura
```

A transação local não torna chamada externa ao Asaas atômica.

Por isso integrações externas precisam de:

- idempotência;
- estados intermediários;
- reconciliação.

---

# 49. Segurança dos repositories

Repositories fazem persistência.

Não devem decidir permissões de usuário de maneira implícita.

O service deve controlar o caso de uso.

Porém métodos de repository podem receber ownership explicitamente para reduzir risco:

```ts
findOwnedTable(tableId, gmProfileId);
```

Preferível a:

```ts
findTable(tableId);
```

em operações privadas.

---

# 50. Segurança dos services

Services são responsáveis pelas regras de autorização ligadas ao negócio.

Exemplo:

```text
TablesController
      |
      v
TablesService.updateTable(
  currentUser,
  tableId,
  dto
)
      |
      v
resolver gm profile
      |
      v
verificar ownership
      |
      v
repository.update(...)
```

Nunca assumir que controller já validou ownership.

---

# 51. Segurança dos controllers

Controllers devem permanecer finos.

Responsáveis por:

- rota;
- status HTTP;
- DTO;
- decorators;
- usuário autenticado;
- delegação ao service.

Não colocar:

- SQL;
- chamadas diretas ao Asaas;
- cálculo de split;
- lógica complexa de autorização.

---

# 52. Swagger

Swagger estará habilitado para facilitar desenvolvimento API-first.

Regras:

- documentar Bearer auth;
- documentar DTOs;
- documentar códigos de erro relevantes;
- não exibir segredos reais;
- produção pode restringir ou desabilitar Swagger posteriormente.

Caminho inicial sugerido:

```text
/docs
```

Não confundir com a pasta de documentação do repositório.

Se necessário, usar:

```text
/api/docs
```

para Swagger.

---

# 53. Health check

Endpoint:

```text
GET /health
```

Pode ser público.

Resposta não deve expor:

- connection string;
- hostname interno;
- secrets;
- versão detalhada de dependências.

Exemplo:

```json
{
  "status": "ok"
}
```

Health checks internos mais detalhados podem existir separadamente e protegidos.

---

# 54. Dependências

Evitar dependências desnecessárias.

Pacotes iniciais esperados podem incluir:

```text
@nestjs/passport
passport
passport-jwt

@nestjs/jwt

argon2

class-validator
class-transformer

helmet

@nestjs/throttler
```

A escolha final deve considerar versões compatíveis no momento da implementação.

Não instalar biblioteca apenas por conveniência se o NestJS já cobre o caso adequadamente.

---

# 55. Estrutura sugerida do módulo `auth`

```text
src/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
│
├── dto/
│   ├── register.dto.ts
│   ├── login.dto.ts
│   ├── refresh.dto.ts
│   ├── forgot-password.dto.ts
│   ├── reset-password.dto.ts
│   └── verify-email.dto.ts
│
├── guards/
│   └── local-auth.guard.ts      # somente se necessário
│
├── strategies/
│   └── jwt.strategy.ts
│
├── repositories/
│   ├── auth-credentials.repository.ts
│   └── auth-sessions.repository.ts
│
├── services/
│   ├── password.service.ts
│   ├── token.service.ts
│   └── session.service.ts
│
└── types/
    └── authenticated-user.type.ts
```

A organização pode ser simplificada durante a implementação, mas responsabilidades devem permanecer separadas.

---

# 56. Estrutura comum de segurança

```text
src/common/
├── decorators/
│   ├── current-user.decorator.ts
│   ├── public.decorator.ts
│   └── roles.decorator.ts
│
├── guards/
│   ├── jwt-auth.guard.ts
│   ├── roles.guard.ts
│   └── verified-email.guard.ts
│
├── filters/
│   └── http-exception.filter.ts
│
└── interceptors/
    └── request-id.interceptor.ts
```

---

# 57. Ordem de implementação da autenticação

Como a API está sendo construída antes do frontend, seguir esta ordem:

```text
1. config/env validation

2. tabelas:
   users
   user_roles
   auth_credentials
   auth_sessions
   email_verification_tokens
   password_reset_tokens

3. PasswordService

4. TokenService

5. SessionService

6. POST /auth/register

7. POST /auth/login

8. JwtStrategy + global JwtAuthGuard

9. GET /auth/me

10. POST /auth/refresh

11. POST /auth/logout

12. POST /auth/logout-all

13. verificação de e-mail

14. recuperação/reset de senha

15. RolesGuard

16. ownership checks nos módulos de negócio

17. rate limiting

18. security headers

19. audit logs de auth

20. Swagger completo
```

---

# 58. Critério de pronto — Auth

A autenticação da API está pronta quando for possível, sem frontend:

```text
Swagger/cURL
    |
    v
registrar usuário
    |
    v
verificar e-mail
    |
    v
login
    |
    v
obter access token
    |
    v
GET /auth/me
    |
    v
refresh
    |
    v
access token anterior expira
    |
    v
logout
    |
    v
refresh deixa de funcionar
```

Também deve funcionar:

```text
forgot password
-> reset password
-> sessões anteriores revogadas
-> novo login
```

---

# 59. Critério de pronto — Authorization

Autorização está pronta quando:

- usuário A não consegue editar dados de usuário B;
- GM A não consegue editar mesa do GM B;
- jogador não consegue consultar pagamentos de outro jogador;
- jogador não consegue alterar status de pagamento;
- GM não consegue modificar `platform_fee_bps` arbitrariamente;
- GM não consegue informar `walletId` arbitrário em cobrança;
- somente ações administrativas explícitas aceitam role `ADMIN`;
- toda operação financeira importante possui ownership e auditoria.

---

# 60. Fora do escopo desta fase

Não implementar agora:

- OAuth Google;
- login Discord;
- login Apple;
- MFA geral;
- passkeys;
- SSO;
- organizações;
- permissions engine complexo;
- RBAC dinâmico;
- social login;
- autenticação do frontend;
- app mobile.

Esses recursos podem ser adicionados posteriormente.

---

# 61. Regras obrigatórias para o Codex

Antes de alterar autenticação ou segurança, o Codex deve consultar:

```text
docs/ARCHITECTURE.md
docs/DATA_MODEL.md
docs/AUTH_SECURITY.md
```

O Codex não deve:

1. mover autenticação para o frontend;
2. usar `localStorage` como requisito de arquitetura para refresh token;
3. armazenar refresh token bruto;
4. criar access token com duração longa para evitar implementar refresh;
5. colocar senha em `users`;
6. aceitar `role` arbitrário no registro;
7. confiar em IDs de owner enviados pelo cliente;
8. acessar Asaas diretamente em controller;
9. permitir mudança manual de status de pagamento por endpoint comum;
10. logar tokens, senhas ou API keys;
11. remover ownership checks para simplificar desenvolvimento;
12. usar CORS wildcard em produção;
13. hardcodar segredos;
14. considerar UUID uma proteção de autorização;
15. adicionar funcionalidades fora do MVP sem solicitação explícita.

---

# 62. Decisão resumida

A autenticação inicial da GuildaPlay será:

```text
NestJS API
   |
   +-- Email + senha
   |
   +-- Argon2id
   |
   +-- JWT access token curto
   |
   +-- refresh token opaco
   |      |
   |      +-- hash no PostgreSQL
   |      +-- rotação
   |      +-- revogação
   |
   +-- roles
   |
   +-- ownership
   |
   +-- audit logs
```

A API deve permanecer independente do frontend.

A integração web futura apenas consumirá os contratos definidos pela API, sem mover autenticação, autorização ou regras sensíveis para o cliente.
