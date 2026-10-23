# Referência da API de bots

A API HTTP com o qual os bots conversam. Ambas as bibliotecas de cliente são capas finas sobre exatamente esses pontos finais, então esta página também é a receita para escrever um cliente em qualquer outra linguagem.

## Base URL e autenticação

```
https://www.disband.dev
```

Cada solicitação envia:

| Cabeçalho | Valor                    |
| --------------- | ------------------------ |
| `Authorization` | `Bot <token>`            |
| `Content-Type` | `application/json`       |

Um token ausente ou inválido retorna `401 { "error": "Invalid bot token" }`. Um bot revogado retorna o mesmo, então um `401` significa "verifique o token" - não "tente novamente".

Todos os pontos finais são definidos por escopo: um bot só pode ler ou escrever o que seus escopos (e as concessões por servidor) permitem. Cada resposta 4xx/5xx é JSON com um campo `error`.

## Leia antes de escrever

- Os bots são **leitor-espaço** a menos que você conceda `messages.write` / `channels.manage`.
- As ações `channels.manage` também exigem que a conta do bot mantenha o
  `manage_channels` **papel** nesse servidor.
- Ambos os clientes têm a informação privilegiada sobre os escopos por evento de mensagem: nada na API
  retorna dados que o bot não foi concedido.

## O portal (evento de pesquisa longa)

```
GET /api/v1/gateway?timeout=20
```

O gateway é um long-poll, não um websocket. O pedido bloqueia o lado do servidor até que um evento esteja disponível ou o tempo limite expire, então retorna o que chegou. O cliente faz um loop sobre isso. O tempo limite é limitado a 1 a 20 segundos.

Resposta:

```json
{
  "events": [
    {
      "bot_id": "…",
      "type": "messageCreate",
      "payload": { "id": "…", "channel_id": "…", "server_id": "…", "content": "…" }
    }
  ]
}
```

`type` é `messageCreate`, `messageUpdate` ou `messageDelete`. A entrega é **pelo menos uma vez** — um robô que trava entre a busca e o processamento pode ver o mesmo evento novamente. Trate-os idempotentemente (por `payload.id`).

### Carga útil de eventos

| Tipo             | Campos de carga útil                                        |
| ---------------- | ----------------------------------------------------- |
| `messageCreate` | O objeto de mensagem completo (abaixo).                      |
| `messageUpdate` | `id`, `channel_id`, `server_id`, `content`, `edited_at` |
| `messageDelete` | `id`, `channel_id`, `server_id`                       |

Objeto de mensagem:

```json
{
  "id": "…",
  "channel_id": "…",
  "server_id": "…",
  "author": { "id": "…", "username": "…", "display_name": "…", "avatar_url": "…", "is_bot": false },
  "content": "Deploy finished",
  "reply_to_id": null,
  "mentions": [],
  "embeds": [],
  "attachment_url": null,
  "attachment_type": null,
  "created_at": "2026-01-01T00:00:00Z",
  "edited_at": null,
  "display_id": 1234
}
```

Apenas bots com `messages.read` (ambos na conta do bot **e** concedidos nesse servidor) recebem eventos.

## Pontos finais

### Mensagens

**POST `/api/v1/channels/:id/messages`** — envia uma mensagem (`messages.write`).

```json
{
  "content": "Deploy finished",
  "reply_to_id": null,
  "embeds": [
    { "title": "Build 1842", "description": "All 412 tests passed.", "color": 5793266 }
  ]
}
```

`content` pode ser omitido quando `embeds` estiver presente. Os incorporados usam a forma e os limites de Discord; consulte [Embeds](../developers/embeds.md) para cada campo e os limites exatos. Uma mensagem sem conteúdo nem incorporados é rejeitada com `400`.

Retorna `201` com `{ "message": { … } }`.

**OBTER `/api/v1/channels/:id/messages`** — lê mensagens (`messages.read`).

Consulta: `limit` (1-100, padrão 50), `before` (id da mensagem, para paginação para trás).

Retorna `200` com `{ "messages": [ … ] }`.

### Canais

**OBTER `/api/v1/servers/:id/channels`** — lista canais (`messages.read`).

Retorna `{ "channels": [ … ] }`.

**POST `/api/v1/servers/:id/channels`** — cria um canal (`channels.manage` + `manage_channels` papel).

```json
{ "name": "deploys", "type": "text", "category_id": null }
```

Retorna `201` com `{ "channel_id": "…" }`.

**PATCH `/api/v1/channels/:id`** — renomeia um canal (`channels.manage`).

```json
{ "name": "deploys-2" }
```

Retorna `{ "success": true }`.

**EXCLUIR `/api/v1/channels/:id`** — exclui um canal (`channels.manage`).

Retorna `{ "success": true }`.

### Membros

**OBTER `/api/v1/servers/:id/members`** — lista membros (`members.read`).

Retorna `{ "members": [ … ] }`.

### de despedida

**POST `/api/v1/servers/:id/leave`** — remove o bot de um servidor.

Retorna `{ "success": true }`.

### Convites

**POST `/api/v1/bots/:botId/invites`** — gera um convite para o bot se juntar a um servidor.

```json
{ "server_id": "…", "scopes": ["messages.read", "messages.write"] }
```

Retorna o convite (incluindo um `invite_url`) para enviar ao proprietário do servidor. Apenas o proprietário pode aprovar; os convites expiram após 7 dias.

### Identidade (utilizada no início da inicialização)

**GET `/api/bot/me`** — retorna a conta do bot, usada pelos clientes para disparar `ready`. Não faz parte da superfície versificada `v1`.

## Erros

| Status | Significado                                                        | Exemplos de campo `error`                              |
| ------ | -------------------------------------------------------------- | --------------------------------------------------- |
| `401` | Token ausente/invalido/revogado.                                 | `"Invalid bot token"`                               |
| `403` | Falta permissão de escopo ou função.                              | `"This bot does not have messages.write in that server"` |
| `404` | Canal/servidor não encontrado ou não visível para o robô.            | `"Channel not found"`                               |
| `429` | Taxa limitada.                                                  | Inclui um cabeçalho `Retry-After`.                    |
| `503` | Loja de suporte indisponível (pesquisa de gateway).                   | `"Event delivery unavailable."`                     |
| `5xx` | Erro do servidor. Tente novamente com um atraso.                              | `"Internal server error"`                           |

## Limites

- Até **5 bots por conta**; o token de um bot morre instantaneamente na revogação.
- Mensagens de até **4.000 caracteres**; `@everyone` precisa do `mention_everyone`
  Permissão de função.
- Até **10 incorporações por mensagem**, com os mesmos limites de campo que os webhooks. ver
  [Embeds](../developers/embeds.md).
- Limites de taxa se aplicam por token de bot. Se você pressionar `429`, honre `Retry-After`.

## Escrevendo seu próprio cliente

1. `GET /api/bot/me` com `Authorization: Bot <token>` para resolver a identidade.
2. Loop em `GET /api/v1/gateway?timeout=20`, lidar com eventos por `type`.
3. Use os endepois acima com o mesmo cabeçalho de autenticação; mapeie `401` → "token ruim",
   `403` → "permissão ausente", `429` → "reduza a velocidade e tente novamente após `Retry-After`".

## Webhooks são uma superfície diferente

O bot API autentica com `Authorization: Bot <token>` e pode ler eventos através do gateway. Um [Webhooks](../developers/webhooks.md) é um URL secreto de um lado: sem conta de bot, sem cabeçalho de autenticação e sem capacidade de ler mensagens. Use um webhook para notificações e um bot quando precisar reagir ao bate-papo.

Os clientes oficiais são `@disband/bot` (JavaScript) e `disband-bot` (Python) — consulte as páginas [JavaScript](clients/javascript.md) e [Python](clients/python.md).
