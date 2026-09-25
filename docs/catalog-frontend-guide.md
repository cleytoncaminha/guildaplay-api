# Guia do frontend — Catálogo Dados da Guilda

Este documento descreve o contrato disponível para o frontend do catálogo de RPG da GuildaPlay: consulta pública, área pessoal, colaboração, moderação, avaliações e curadoria.

## Base e convenções

- Base local: `http://localhost:3000/api/v1`
- Documentação interativa: `http://localhost:3000/api/docs`
- As respostas de sucesso usam, em geral, `{ "data": ... }`.
- Listas paginadas retornam `{ "data": [], "meta": { "page", "limit", "total", "totalPages" } }`.
- Envie JSON com `Content-Type: application/json`.
- Para rotas protegidas, envie `Authorization: Bearer <accessToken>`.
- A API usa o cabeçalho `X-Request-Id`. O frontend pode enviá-lo; erros também devolvem `requestId` quando disponível.

Formato de erro:

```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Dados inválidos.",
  "requestId": "..."
}
```

Erros mais frequentes: `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409), `VALIDATION_ERROR` (400) e `RATE_LIMITED` (429).

## Autenticação e permissões

Use `POST /auth/login` para obter `data.accessToken`. O token contém as roles do usuário.

| Perfil | Pode usar |
| --- | --- |
| Visitante | busca, detalhe de itens, avaliações publicadas, coleções públicas e listas temáticas publicadas |
| `USER` | tudo de visitante, listas pessoais, coleções, avaliações, sugestões e denúncias |
| `ADMIN` | tudo acima e CRUD editorial, moderação, denúncias, avaliações e curadorias |

Não exiba controles administrativos só pela role no cliente: trate também `401` e `403` retornados pela API.

### Cadastro e perfil de usuário

O cadastro é público e **sempre cria uma conta com a role `USER`**. O frontend não envia role e não existe rota pública para criar `ADMIN`.

| Método e rota | Autenticação | Uso |
| --- | --- | --- |
| `POST /auth/register` | não | cria conta comum |
| `POST /auth/login` | não | autentica e retorna `accessToken` |
| `GET /auth/me` | Bearer | sessão, roles e dados mínimos do usuário |
| `POST /auth/refresh` | cookie | renova token de acesso |
| `POST /auth/logout` | Bearer | encerra a sessão atual |
| `POST /auth/logout-all` | Bearer | encerra todas as sessões |
| `POST /auth/verify-email` | não | confirma e-mail com token |
| `POST /auth/resend-verification` | não | reenvia confirmação de e-mail |
| `POST /auth/forgot-password` | não | solicita recuperação de senha |
| `POST /auth/reset-password` | não | redefine senha com token |
| `GET /users/me` | Bearer | perfil completo do usuário autenticado |
| `PATCH /users/me` | Bearer | altera perfil permitido |

Payload de cadastro:

```json
{
  "name": "Ana Jogadora",
  "email": "ana@example.com",
  "password": "uma-senha-com-pelo-menos-10-caracteres"
}
```

Resposta de cadastro não retorna access token; após cadastrar, direcione para confirmação de e-mail e/ou login. Em ambiente de desenvolvimento, o token de confirmação pode ser devolvido no cabeçalho `X-Development-Verification-Token`; isso não deve ser usado em produção.

Payload de atualização de perfil:

```json
{
  "name": "Ana Jogadora",
  "timezone": "America/Sao_Paulo",
  "country": "BR"
}
```

## Enums de referência

```ts
type CatalogItemType =
  | 'CORE_BOOK'
  | 'SETTING'
  | 'ADVENTURE'
  | 'SUPPLEMENT'
  | 'TOOL';

type CatalogStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
type ExperienceLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
type CreatorRole =
  | 'AUTHOR' | 'DESIGNER' | 'ILLUSTRATOR'
  | 'EDITOR' | 'TRANSLATOR' | 'OTHER';

type RelationType =
  | 'REQUIRES' | 'SUPPLEMENT_OF' | 'ADVENTURE_FOR'
  | 'SETTING_FOR' | 'EDITION_OF' | 'EXPANSION_OF'
  | 'COMPATIBLE_WITH';
```

## Catálogo público

### Busca

`GET /catalog/items`

| Query | Tipo | Observação |
| --- | --- | --- |
| `q` | string | busca em título e aliases |
| `systemId`, `publisherId` | UUID | filtros editoriais |
| `type` | `CatalogItemType` | tipo do item |
| `genre` | string | slug da categoria |
| `languageCode` | string | filtra por edição, por exemplo `pt-BR` |
| `year` | number | ano de lançamento original |
| `experienceLevel` | enum | nível de experiência |
| `sort` | `TITLE`, `RELEASE_YEAR`, `NEWEST` | padrão: `TITLE` |
| `order` | `ASC`, `DESC` | padrão: `ASC` |
| `page`, `limit` | number | `limit` máximo: 100 |

Somente itens `PUBLISHED` aparecem. Cada item inclui sistemas, criadores, categorias, tags, aliases, edições, fontes, relações publicáveis, mídias assinadas e:

```ts
reviews: {
  averageRating: number | null;
  reviewCount: number;
}
```

### Detalhe e avaliações

- `GET /catalog/items/:slug`
- `GET /catalog/items/:slug/reviews?page=1&limit=20`

O segundo endpoint devolve avaliações apenas com status `PUBLISHED`, o resumo de notas em `summary` e autor público (`id`, `name`). A página de detalhe deve usar o `slug`, não o UUID interno.

## Mídias de catálogo

Fluxo de upload:

1. `POST /media/upload-url` autenticado, com `purpose` (`CATALOG_COVER` ou `CATALOG_IMAGE`), `mimeType`, `sizeBytes` e `catalogItemId`.
2. Enviar o arquivo diretamente para a URL temporária recebida.
3. `POST /media/:assetId/complete` autenticado.

O frontend recebe URLs temporárias na leitura do item; não deve persistir essas URLs.

## Listas pessoais

Os estados são **combináveis**: um item pode ser `TENHO` e `JOGUEI` ao mesmo tempo.

Mapeamento de interface:

| Rótulo | Campo |
| --- | --- |
| TENHO | `hasItem` |
| QUERO | `wantsItem` |
| JOGUEI | `playedItem` |
| FAVORITO | `isFavorite` |

### Rotas

| Método e rota | Uso |
| --- | --- |
| `GET /catalog/me/items` | lista pessoal; aceita os filtros booleanos `hasItem`, `wantsItem`, `playedItem`, `isFavorite`, `page`, `limit` |
| `PUT /catalog/me/items/:catalogItemId` | cria/atualiza os marcadores e comentário privado |
| `DELETE /catalog/me/items/:catalogItemId` | remove o item de todas as listas pessoais |

Exemplo de atualização:

```json
{
  "hasItem": true,
  "playedItem": true,
  "isFavorite": false,
  "privateComment": "Joguei uma campanha em 2025."
}
```

`privateComment` nunca aparece em respostas públicas. O frontend deve enviar `null` para apagá-lo.

## Coleções pessoais

Coleções organizam itens manualmente e podem ser públicas.

| Método e rota | Uso |
| --- | --- |
| `POST /catalog/me/collections` | cria `{ name, description?, isPublic? }` |
| `GET /catalog/me/collections` | lista todas as coleções do dono |
| `GET /catalog/me/collections/:collectionId` | detalhe, inclusive coleção privada |
| `PATCH /catalog/me/collections/:collectionId` | altera nome, descrição ou visibilidade |
| `DELETE /catalog/me/collections/:collectionId` | remove a coleção |
| `POST /catalog/me/collections/:collectionId/items/:catalogItemId` | adiciona item com `{ position? }` |
| `DELETE /catalog/me/collections/:collectionId/items/:catalogItemId` | remove item |
| `GET /catalog/collections/:collectionId` | consulta pública; retorna 404 se privada |

Itens de coleção só podem ser itens publicados. A leitura pública não inclui estados pessoais nem comentários privados.

## Avaliações

| Método e rota | Uso |
| --- | --- |
| `GET /catalog/reviews/mine` | lista as avaliações do usuário, inclusive pendentes/rejeitadas |
| `PUT /catalog/reviews/:catalogItemId` | cria ou edita a avaliação do usuário para o item |
| `DELETE /catalog/reviews/:catalogItemId` | remove a própria avaliação |

Payload:

```json
{
  "rating": 9,
  "content": "Ótimo ponto de entrada para o sistema."
}
```

- `rating` é inteiro de 1 a 10.
- Há uma avaliação por usuário e item.
- Uma criação ou edição muda o status para `PENDING` e zera a decisão anterior.
- Apenas avaliações `PUBLISHED` entram em média, contagem e página pública.
- A área “Minhas avaliações” deve mostrar `status` e `moderationReason`.

## Colaboração e denúncias

### Sugestões editoriais

| Método e rota | Uso |
| --- | --- |
| `POST /catalog/submissions` | cria proposta `CREATE_ITEM` ou `UPDATE_ITEM` |
| `GET /catalog/submissions/mine` | lista propostas próprias |
| `GET /catalog/submissions/mine/:submissionId` | detalhe de proposta própria |

Payload base:

```json
{
  "type": "UPDATE_ITEM",
  "catalogItemId": "uuid-obrigatorio-em-update",
  "payload": {
    "title": "Novo título",
    "summary": "Resumo atualizado"
  }
}
```

Para `CREATE_ITEM`, o payload aprovado precisa conter `title`, `slug` e `type`. O item criado fica em `DRAFT`; publicação continua sendo decisão editorial separada.

### Denúncias

`POST /catalog/reports`

```ts
type ReportTarget = 'ITEM' | 'MEDIA';
type ReportReason =
  | 'DUPLICATE' | 'INACCURATE' | 'COPYRIGHT'
  | 'INAPPROPRIATE' | 'OTHER';
```

Exemplo de duplicidade:

```json
{
  "targetType": "ITEM",
  "catalogItemId": "uuid-do-item-denunciado",
  "reason": "DUPLICATE",
  "duplicateOfCatalogItemId": "uuid-do-outro-item",
  "description": "Os dois registros representam a mesma edição."
}
```

`duplicateOfCatalogItemId` só é aceito em denúncias `DUPLICATE`. A API encaminha o caso para moderação; não faz merge automático.

## Administração editorial

Todas as rotas abaixo exigem `ADMIN` e usam o prefixo `/admin/catalog`.

| Recurso | Rotas |
| --- | --- |
| Editoras | `POST/GET /publishers`, `GET/PATCH /publishers/:publisherId` |
| Criadores | `POST/GET /creators`, `GET/PATCH /creators/:creatorId` |
| Categorias | `POST/GET /categories`, `PATCH /categories/:categoryId` |
| Tags | `POST/GET /tags`, `PATCH /tags/:tagId` |
| Sistemas | `POST/GET /systems`, `GET/PATCH /systems/:systemId`, `POST /systems/:systemId/publish`, `POST /systems/:systemId/archive` |
| Itens | `POST/GET /items`, `GET/PATCH /items/:itemId`, `POST /items/:itemId/publish`, `POST /items/:itemId/archive` |
| Edições | `POST/GET /editions`, `GET/PATCH /editions/:editionId` |
| Aliases | `POST /items/:itemId/aliases`, `PATCH /items/:itemId/aliases/:aliasId` |
| Fontes | `POST /items/:itemId/sources`, `PATCH /items/:itemId/sources/:sourceId` |
| Relações | `POST /items/:itemId/relations`, `DELETE /items/:itemId/relations/:relationId` |

Criação de item:

```json
{
  "type": "CORE_BOOK",
  "title": "Livro Básico",
  "slug": "livro-basico",
  "summary": "Resumo curto",
  "description": "Descrição completa",
  "originalReleaseYear": 2024,
  "experienceLevel": "BEGINNER",
  "systemIds": ["uuid"],
  "categoryIds": ["uuid"],
  "tagIds": ["uuid"],
  "creators": [{ "creatorId": "uuid", "role": "AUTHOR" }]
}
```

`PATCH` aceita os mesmos campos de forma parcial. Slugs usam minúsculas, números e hífens (`^[a-z0-9]+(?:-[a-z0-9]+)*$`).

## Moderação administrativa

| Método e rota | Uso |
| --- | --- |
| `GET /admin/catalog/submissions/pending` | fila de sugestões |
| `POST /admin/catalog/submissions/:submissionId/approve` | aprova e aplica a proposta editorial permitida |
| `POST /admin/catalog/submissions/:submissionId/reject` | rejeita proposta |
| `GET /admin/catalog/reports/pending` | fila de denúncias |
| `POST /admin/catalog/reports/:reportId/resolve` | resolve ou descarta denúncia |
| `GET /admin/catalog/reviews/pending` | fila de avaliações |
| `POST /admin/catalog/reviews/:reviewId/moderate` | publica ou rejeita avaliação |

Payloads:

```json
// aprovar/rejeitar proposta
{ "reason": "Texto revisado e aprovado." }

// resolver denúncia
{ "status": "RESOLVED", "note": "Registro confirmado como correto." }

// moderar avaliação
{ "status": "PUBLISHED", "reason": "Conteúdo adequado." }
```

Status de denúncia: `PENDING`, `RESOLVED`, `DISMISSED`.
Status de avaliação: `PENDING`, `PUBLISHED`, `REJECTED`.

## Listas temáticas e curadoria

Listas temáticas são diferentes das coleções pessoais: são editoriais, administradas por `ADMIN` e aparecem publicamente quando publicadas.

### Público

- `GET /catalog/lists?page=1&limit=20`
- `GET /catalog/lists/:slug`

### Administração

| Método e rota | Uso |
| --- | --- |
| `POST /admin/catalog/lists` | cria lista em `DRAFT` |
| `GET /admin/catalog/lists` | lista todas, inclusive rascunhos e arquivadas |
| `GET /admin/catalog/lists/:listId` | detalhe administrativo |
| `PATCH /admin/catalog/lists/:listId` | altera título, slug e descrição |
| `POST /admin/catalog/lists/:listId/publish` | publica |
| `POST /admin/catalog/lists/:listId/archive` | arquiva |
| `POST /admin/catalog/lists/:listId/items/:catalogItemId` | inclui item `{ position? }` |
| `DELETE /admin/catalog/lists/:listId/items/:catalogItemId` | remove item |

Payload de criação:

```json
{
  "title": "Boas portas de entrada para RPG",
  "slug": "boas-portas-de-entrada",
  "description": "Seleção editorial para quem está começando."
}
```

Uma lista pode ser publicada a partir de `DRAFT` e arquivada a partir de `DRAFT` ou `PUBLISHED`. Listas `ARCHIVED` não podem voltar a ser publicadas. A API só aceita itens publicados em uma curadoria.

## Regras de visibilidade para a interface

- Nunca mostrar itens `DRAFT` ou `ARCHIVED` em páginas públicas.
- Guardar comentários pessoais apenas no estado autenticado do dono.
- Exibir coleções por UUID apenas se forem públicas; `404` é o comportamento esperado para coleção privada de outro usuário.
- Ao editar avaliação, informar que ela voltará para análise.
- Exibir listas temáticas apenas se o endpoint público as retornar.
- Usar os campos `status` devolvidos pelas áreas pessoais e administrativas; não inferir estado apenas pela ação local.

## Checklist de integração

1. Configurar cliente HTTP com base URL versionada e interceptador de Bearer token.
2. Implementar tratamento uniforme do envelope de erro e mostrar `requestId` no suporte técnico.
3. Construir busca pública com URL sincronizada aos filtros.
4. Separar estado público, estado pessoal autenticado e área administrativa.
5. Revalidar a busca/detalhe após publicar item, aprovar sugestão ou moderar avaliação.
6. Não persistir URLs assinadas de mídia; recarregar o item quando necessário.
7. Usar o Swagger como fonte complementar e atualizada de schemas: `/api/docs`.
