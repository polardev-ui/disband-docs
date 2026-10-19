# Bot API reference

The HTTP API that bots talk to. Both client libraries are thin wrappers over
exactly these endpoints, so this page is also the recipe for writing a client in
any other language.

## Base URL and authentication

```
https://www.disband.dev
```

Every request sends:

| Header          | Value                    |
| --------------- | ------------------------ |
| `Authorization` | `Bot <token>`            |
| `Content-Type`  | `application/json`       |

A missing or invalid token returns `401 { "error": "Invalid bot token" }`. A
revoked bot returns the same, so a `401` means "check the token" — not "retry".

All endpoints are scoped: a bot can only read or write what its scopes (and the
per-server grants) allow. Every 4xx/5xx response is JSON with an `error` field.

## Read before writing

- Bots are **read-scoped** unless you grant `messages.write` / `channels.manage`.
- `channels.manage` actions also require the bot account to hold the
  `manage_channels` **role** in that server.
- Both clients hold the scoop on scopes per message event: nothing in the API
  returns data the bot was not granted.

## The gateway (event long-poll)

```
GET /api/v1/gateway?timeout=20
```

The gateway is a long-poll, not a websocket. The request blocks server-side
until an event is available or the timeout elapses, then returns what arrived.
The client loops on it. Timeout is clamped to 1–20 seconds.

Response:

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

`type` is `messageCreate`, `messageUpdate`, or `messageDelete`. Delivery is
**at-least-once** — a bot that crashes between fetch and handling may see the
same event again. Handle them idempotently (by `payload.id`).

### Event payloads

| Type             | Payload fields                                        |
| ---------------- | ----------------------------------------------------- |
| `messageCreate`  | The full message object (below).                      |
| `messageUpdate`  | `id`, `channel_id`, `server_id`, `content`, `edited_at` |
| `messageDelete`  | `id`, `channel_id`, `server_id`                       |

Message object:

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

Only bots with `messages.read` (both on the bot account **and** granted in that
server) receive events.

## Endpoints

### Messages

**POST `/api/v1/channels/:id/messages`** — sends a message (`messages.write`).

```json
{
  "content": "Deploy finished",
  "reply_to_id": null,
  "embeds": [
    { "title": "Build 1842", "description": "All 412 tests passed.", "color": 5793266 }
  ]
}
```

`content` may be omitted when `embeds` is present. Embeds use Discord's shape and
limits; see [Embeds](../developers/embeds.md) for every field and the exact
limits. A message with neither content nor embeds is rejected with `400`.

Returns `201` with `{ "message": { … } }`.

**GET `/api/v1/channels/:id/messages`** — reads messages (`messages.read`).

Query: `limit` (1–100, default 50), `before` (message id, for paging backwards).

Returns `200` with `{ "messages": [ … ] }`.

### Channels

**GET `/api/v1/servers/:id/channels`** — lists channels (`messages.read`).

Returns `{ "channels": [ … ] }`.

**POST `/api/v1/servers/:id/channels`** — creates a channel (`channels.manage` +
`manage_channels` role).

```json
{ "name": "deploys", "type": "text", "category_id": null }
```

Returns `201` with `{ "channel_id": "…" }`.

**PATCH `/api/v1/channels/:id`** — renames a channel (`channels.manage`).

```json
{ "name": "deploys-2" }
```

Returns `{ "success": true }`.

**DELETE `/api/v1/channels/:id`** — deletes a channel (`channels.manage`).

Returns `{ "success": true }`.

### Members

**GET `/api/v1/servers/:id/members`** — lists members (`members.read`).

Returns `{ "members": [ … ] }`.

### Leaving

**POST `/api/v1/servers/:id/leave`** — removes the bot from a server.

Returns `{ "success": true }`.

### Invites

**POST `/api/v1/bots/:botId/invites`** — generates an invite for the bot to join
a server.

```json
{ "server_id": "…", "scopes": ["messages.read", "messages.write"] }
```

Returns the invite (including an `invite_url`) to send to the server owner.
Only the owner can approve; invites expire after 7 days.

### Identity (used at startup)

**GET `/api/bot/me`** — returns the bot account, used by the clients to fire
`ready`. Not part of the versioned `v1` surface.

## Errors

| Status | Meaning                                                        | `error` field examples                              |
| ------ | -------------------------------------------------------------- | --------------------------------------------------- |
| `401`  | Missing/invalid/revoked token.                                 | `"Invalid bot token"`                               |
| `403`  | Missing scope or role permission.                              | `"This bot does not have messages.write in that server"` |
| `404`  | Channel/server not found or not visible to the bot.            | `"Channel not found"`                               |
| `429`  | Rate limited.                                                  | Includes a `Retry-After` header.                    |
| `503`  | Backing store unavailable (gateway polling).                   | `"Event delivery unavailable."`                     |
| `5xx`  | Server error. Retry with backoff.                              | `"Internal server error"`                           |

## Limits

- Up to **5 bots per account**; a bot's token dies instantly on revoke.
- Messages up to **4,000 characters**; `@everyone` needs the `mention_everyone`
  role permission.
- Up to **10 embeds per message**, with the same field limits as webhooks. See
  [Embeds](../developers/embeds.md).
- Rate limits apply per bot token. If you hit `429`, honor `Retry-After`.

## Writing your own client

1. `GET /api/bot/me` with `Authorization: Bot <token>` to resolve identity.
2. Loop on `GET /api/v1/gateway?timeout=20`, handle events by `type`.
3. Use the endpoints above with the same auth header; map `401` → "bad token",
   `403` → "missing permission", `429` → "slow down and retry after `Retry-After`".

## Webhooks are a different surface

The bot API authenticates with `Authorization: Bot <token>` and can read events
through the gateway. A [webhook](../developers/webhooks.md) is a one-way secret
URL: no bot account, no auth header, and no ability to read messages. Use a
webhook for notifications and a bot when you need to react to chat.

The official clients are `@disband/bot` (JavaScript) and `disband-bot` (Python)
— see the [JavaScript](clients/javascript.md) and [Python](clients/python.md)
pages.