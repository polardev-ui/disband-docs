# Bot API reference

The HTTP API that bots talk to. The official client libraries wrap the core
message, channel, member, invite, and lifecycle endpoints; the extended
management endpoints are plain HTTP and are called directly with the same token.
This page is the recipe for writing a client in any language.

The extended management surface — private channels, categories, roles, audit,
bans, server settings, and webhooks — is documented in
[Extended API and private channels](../developers/extended-api.md). This page
covers the whole contract, with the extended endpoints summarised.

## Base URL and authentication

```
https://www.disband.dev
```

Every request sends:

| Header          | Value              |
| --------------- | ------------------ |
| `Authorization` | `Bot <token>`      |
| `Content-Type`  | `application/json` |

A missing or invalid token returns `401 { "error": "Invalid bot token" }`. A
revoked bot returns the same, so a `401` means "check the token" — not "retry".

All endpoints are scoped: a bot can only read or write what its scopes (and the
per-server grants) allow. Every 4xx/5xx response is JSON with an `error` field.

## Scopes

A bot's reach in a space is the **intersection** of:

1. the scopes chosen on the bot account, and
2. the scopes the space owner approved for that bot.

Lowering an account scope immediately trims it from existing space grants.
Adding it back does not restore the old grant; the bot must be approved again.

The scope names are dotted:

| Scope | Description |
| --- | --- |
| `messages.read` | Receive message events and read messages, channels, categories, and pins. |
| `messages.write` | Send and edit messages, and pin messages. |
| `messages.delete` | Delete and bulk-delete messages, and unpin messages. |
| `messages.react` | Add and remove the bot's reactions. |
| `members.read` | List members and read member/role details. |
| `members.kick` | Kick members. |
| `members.ban` | Ban, unban, and list bans. |
| `members.timeout` | Time out members. |
| `channels.read` | List channels and categories, read channel detail and overwrites. |
| `channels.manage` | Create, update, reorder, and delete channels and categories; set overwrites. |
| `webhooks.manage` | Create, edit, and delete webhooks. |
| `roles.manage` | Create, edit, and delete roles; assign roles; set channel overwrites. |
| `servers.read` | Read server metadata. |
| `audit.read` | Read the audit log. |

Management actions also need the matching **role permission** on the bot's
account in that space, such as `manage_channels`, `manage_roles`,
`manage_messages`, `manage_webhooks`, `manage_server`, or `pin_messages`.

## Read before writing

- Bots are read-scoped unless you grant a write scope.
- `channels.manage` actions also require the bot account to hold the
  `manage_channels` **role** in that server.
- `roles.manage` actions also require `manage_roles`.
- `webhooks.manage` actions also require `manage_webhooks`.
- Nothing in the API returns data the bot was not granted. Lists omit what the
  bot cannot see instead of returning it with a flag.
- Private channels are omitted from listings and their events are not delivered
  to bots without `can_view`. See
  [private channels](../developers/extended-api.md#private-text-channels).

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
      "id": 123,
      "type": "messageCreate",
      "payload": { "id": "…", "channel_id": "…", "server_id": "…", "content": "…" }
    }
  ]
}
```

### Event types

| Type | Payload | Required scope |
| --- | --- | --- |
| `messageCreate` | Full message object | `messages.read` on the bot and the space grant |
| `messageUpdate` | `id`, `channel_id`, `server_id`, `content`, `edited_at` | `messages.read` |
| `messageDelete` | `id`, `channel_id`, `server_id` | `messages.read` |
| `memberJoin` | `server_id`, `joined_at`, `user` | `members.read` on the space grant |
| `memberLeave` | `server_id`, `user_id` | `members.read` |
| `memberUpdate` | `server_id`, `user_id`, `roles` | `members.read` |
| `interactionCreate` | Interaction object (below) | Bot must be in the space |

Delivery is **at-least-once** — a bot that crashes between fetch and handling
may see the same event again. Handle them idempotently (by event or payload
`id`). Only channels the bot can view produce message events.

### Message object

```json
{
  "id": "…",
  "channel_id": "…",
  "server_id": "…",
  "author": { "id": "…", "username": "…", "display_name": "…", "avatar_url": "…", "is_bot": false },
  "content": "Deploy finished",
  "embeds": [],
  "components": [],
  "interaction": null,
  "webhook_id": null,
  "reply_to_id": null,
  "mentions": [],
  "attachment_url": null,
  "attachment_type": null,
  "created_at": "2026-01-01T00:00:00Z",
  "edited_at": null,
  "display_id": 1234
}
```

### Interaction object

```json
{
  "id": "…",
  "type": "command",
  "server_id": "…",
  "channel_id": "…",
  "user": { "id": "…", "username": "…", "display_name": "…", "avatar_url": "…" },
  "command": { "name": "weather", "options": { "city": "Berlin" } },
  "component": null,
  "created_at": "…",
  "expires_at": "…"
}
```

For a button press, `type` is `component` and `component` contains
`{ "custom_id": "…", "message_id": "…" }` instead of `command`.

## Endpoints

All paths below are relative to `https://www.disband.dev`.

### Messages

**GET `/api/v1/channels/:id/messages`** — reads messages (`messages.read`).

Query: `limit` (1–100, default 50), `before` (message UUID, for paging
backwards).

Returns `200` with `{ "messages": [ … ] }`, newest first.

**POST `/api/v1/channels/:id/messages`** — sends a message (`messages.write`).

```json
{
  "content": "Deploy finished",
  "reply_to_id": null,
  "embeds": [],
  "components": []
}
```

`content` is required unless `embeds` is non-empty. Up to 10 embeds and up to 5
action rows of 5 buttons. Returns `201` with `{ "message": { … } }`.

**PATCH `/api/v1/channels/:id/messages/:messageId`** — edits a message
(`messages.write` or `messages.delete`).

```json
{ "content": "Deploy finished (edited)", "embeds": [], "components": [] }
```

A bot can edit its own messages; editing someone else's needs
`manage_messages`. Omitting a field leaves it unchanged; `null` clears
`embeds`/`components`. Returns `{ "message": { … } }`.

**DELETE `/api/v1/channels/:id/messages/:messageId`** — deletes a message
(`messages.delete`).

A bot can always delete its own; deleting someone else's needs
`manage_messages`. Returns `204`.

**POST `/api/v1/channels/:id/messages/bulk-delete`** — deletes up to 100
messages (`messages.delete`).

```json
{ "message_ids": ["uuid", "uuid"] }
```

UUIDs only. Returns `{ "deleted": 12 }`.

`messageId` may be a UUID or the numeric `display_id` in the single-message
routes. Bulk delete accepts UUIDs only.

### Reactions

**PUT `/api/v1/channels/:id/messages/:messageId/reactions/:emoji`** — adds the
bot's reaction (`messages.react`).

`{emoji}` is URL-encoded and 1–32 characters. Returns
`{ "reaction": { "id": "…", "message_id": "…", "emoji": "✅" } }`.

**DELETE** the same path — removes the bot's reaction. Returns
`{ "removed": true }` or `{ "removed": false }`. Idempotent.

When a channel uses overwrites, `react` follows `can_react` and the role's
`add_reactions` permission.

### Pins

**GET `/api/v1/channels/:id/pins`** — lists pinned messages (`messages.read`).

Returns `{ "pins": [ … ] }`, newest pin first, each with the full `message` when
it still exists.

**PUT `/api/v1/channels/:id/pins/:messageId`** — pins a message
(`messages.write` or `messages.delete` + `pin_messages`).

Returns `{ "pin": { "id": "…", "message_id": "…", "channel_id": "…" } }`.
Idempotent.

**DELETE** the same path — unpins. Returns `{ "removed": true }` or
`{ "removed": false }`. Idempotent.

### Channels

**GET `/api/v1/servers/:id/channels`** — lists channels (`messages.read`,
`channels.read`, or `channels.manage`).

Returns only channels the bot can view, ordered by position:

```json
{
  "channels": [
    {
      "id": "…",
      "name": "general",
      "type": "text",
      "category_id": "…",
      "category_name": "Text Channels",
      "position": 0,
      "topic": "…",
      "slow_mode_seconds": 0,
      "read_only": false,
      "locked": false,
      "is_stage": false,
      "user_limit": null,
      "can_post": true,
      "can_react": true,
      "can_attach": true,
      "can_manage": false
    }
  ]
}
```

**POST `/api/v1/servers/:id/channels`** — creates a channel
(`channels.manage` + `manage_channels`).

```json
{
  "name": "deploys",
  "type": "text",
  "category_id": null,
  "topic": null,
  "slow_mode_seconds": 0,
  "read_only": false,
  "user_limit": null,
  "permissions": [
    { "role_id": "role-uuid", "can_view": false },
    { "role_id": "staff-role-uuid", "can_view": true, "can_post": true }
  ]
}
```

Returns `201` with `{ "channel_id": "…", "channel": { … } }`. To make a private
channel, deny `can_view` for `@everyone` and allow it for staff; see
[private channels](../developers/extended-api.md#private-text-channels).

**GET `/api/v1/channels/:id`** — channel detail (`messages.read`,
`channels.read`, or `channels.manage`).

Returns `{ "channel": { … } }`, including effective permissions and — when the
bot has `manage_channels` — its role overwrites. A channel the bot cannot view
returns `404`.

**PATCH `/api/v1/channels/:id`** — updates a channel (`channels.manage` +
`manage_channels`).

```json
{ "name": "deploys-2", "topic": "…", "slow_mode_seconds": 10, "category_id": null, "position": 1, "read_only": false, "locked": false, "user_limit": null }
```

Returns `{ "channel": { … } }`. Channels cannot change type.

**DELETE `/api/v1/channels/:id`** — deletes a channel and its messages
(`channels.manage` + `manage_channels`). Returns `204`.

### Channel permissions

**GET `/api/v1/channels/:id/permissions`** — lists the channel's role
overwrites (`channels.read`, `channels.manage`, or `roles.manage`).

Returns `{ "permissions": [ { "role_id": "…", "can_view": false, "can_post": null, "can_react": null, "can_attach": null } ] }`.

**PUT `/api/v1/channels/:id/permissions/:roleId`** — sets an overwrite
(`channels.manage` or `roles.manage`, plus `manage_channels`).

```json
{ "can_view": true, "can_post": true, "can_react": null, "can_attach": null }
```

`true` allows, `false` denies, `null` inherits. Returns `{ "ok": true }`.
The role must sit below the bot's highest role (`@everyone` excepted).

**DELETE** the same path — removes the override so the role inherits again.
Returns `{ "ok": true }`.

### Categories

**GET `/api/v1/servers/:id/categories`** — lists categories
(`messages.read`, `channels.read`, or `channels.manage`).

Returns `{ "categories": [ { "id": "…", "name": "…", "position": 0, "channel_count": 2 } ] }`.
`channel_count` only counts channels the bot can view.

**POST `/api/v1/servers/:id/categories`** — creates a category
(`channels.manage` + `manage_channels`).

```json
{ "name": "Support" }
```

Returns `201` with `{ "category": { … } }`.

**PATCH `/api/v1/categories/:id`** — renames or reorders
(`channels.manage` + `manage_channels`).

```json
{ "name": "Support", "position": 2 }
```

Returns `{ "category": { … } }`.

**DELETE `/api/v1/categories/:id`** — deletes a category. Its channels become
uncategorized. Returns `204`.

There are no category-level permissions; channel overwrites are authoritative.

### Servers

**GET `/api/v1/servers/:id`** — server metadata and member count
(`servers.read`, `messages.read`, `channels.read`, `channels.manage`, or
`members.read`).

Returns `{ "server": { "id": "…", "name": "…", "description": "…", "icon_url": "…", "banner_url": "…", "owner_id": "…", "created_at": "…", "discoverable": true, "verified": false, "member_count": 42 } }`.

**PATCH `/api/v1/servers/:id`** — updates server settings (`manage_server`).

```json
{ "name": "New name", "description": "…", "discoverable": true }
```

Returns `{ "server": { … } }`.

**GET `/api/v1/servers/:id/permissions`** — the bot's scopes, roles, highest
role position, and role-permission map in this space. Useful for feature
detection before attempting a management action.

### Members

**GET `/api/v1/servers/:id/members`** — lists members (`members.read`).

Returns `{ "members": [ … ] }`, sorted by display name.

**GET `/api/v1/servers/:id/members/:userId`** — member detail
(`members.read`). Returns `{ "member": { … } }` with roles and any active
timeout.

**DELETE `/api/v1/servers/:id/members/:userId`** — kicks a member
(`members.kick`). Returns `{ "ok": true }`.

**PATCH `/api/v1/servers/:id/members/:userId`** — times a member out
(`members.timeout`).

```json
{ "timeout_minutes": 10, "reason": "Cooling off" }
```

1–40,320 minutes. Returns
`{ "ok": true, "timed_out_until": "…" }`.

**PUT `/api/v1/servers/:id/members/:userId/roles/:roleId`** — gives a role
(`roles.manage` + `manage_roles`).

**DELETE** the same path — takes the role away. Both return `{ "ok": true }`.

Role and moderation actions protect the owner, moderators, other bots, and the
bot itself. Roles must sit below the bot's highest role.

### Bans

**GET `/api/v1/servers/:id/bans`** — lists bans, newest first
(`members.ban` or the `ban` role permission).

Returns `{ "bans": [ { "user_id": "…", "banned_by": "…", "reason": "…", "created_at": "…" } ] }`.

**PUT `/api/v1/servers/:id/bans/:userId`** — bans a user (`members.ban`).

```json
{ "reason": "Spam" }
```

Returns `{ "ok": true }`.

**DELETE** the same path — unbans (`members.ban` + `ban`). Returns
`{ "removed": true }` or `{ "removed": false }`.

### Roles

**GET `/api/v1/servers/:id/roles`** — lists roles, highest first
(`roles.manage` or `members.read`).

Returns `{ "roles": [ … ] }`, each with `display_id`, `permissions`,
`is_default`, `self_assignable`, and `manageable`.

**POST `/api/v1/servers/:id/roles`** — creates a role
(`roles.manage` + `manage_roles`).

```json
{ "name": "Ticket Staff", "color": "#5865f2", "permissions": { "send_messages": true }, "self_assignable": false, "position": 2 }
```

Returns `201` with `{ "role": { … } }`. A space can have 250 roles.

**GET `/api/v1/servers/:id/roles/:roleId`** — one role
(`roles.manage` or `members.read`).

**PATCH `/api/v1/servers/:id/roles/:roleId`** — edits a role
(`roles.manage` + `manage_roles`). Omitted fields stay unchanged. `@everyone`
cannot be edited.

**DELETE `/api/v1/servers/:id/roles/:roleId`** — deletes a role
(`roles.manage` + `manage_roles`). Returns `{ "ok": true }`.

`roleId` may be a UUID or numeric `display_id`.

Permission keys: `add_reactions`, `attach_files`, `ban`, `create_invites`,
`kick`, `manage_channels`, `manage_emojis`, `manage_messages`, `manage_roles`,
`manage_server`, `manage_webhooks`, `mention_everyone`, `pin_messages`,
`send_messages`, `timeout_members`, `view_audit_log`.

### Audit log

**GET `/api/v1/servers/:id/audit?limit=100`** — reads the audit log
(`audit.read` or the `view_audit_log` role permission).

Returns `{ "audit": [ { "id": "…", "actor_id": "…", "action": "channel.create", "target_type": "channel", "target_id": "…", "details": { … }, "created_at": "…" } ] }`,
newest first. `limit` is 1–100.

### Webhooks

**GET `/api/v1/servers/:id/webhooks`** — lists webhooks, newest first
(`webhooks.manage` + `manage_webhooks`).

Returns `{ "webhooks": [ … ] }`, each including its secret posting `url`.
Webhooks in channels the bot cannot view are omitted, and fetching, moving,
rotating, or deleting one of them returns `404`.

**POST `/api/v1/servers/:id/webhooks`** — creates a webhook
(`webhooks.manage` + `manage_webhooks`).

```json
{ "channel_id": "…", "name": "Deploys", "avatar_url": null }
```

Returns `201` with `{ "webhook": { … } }`.

**GET `/api/v1/webhooks/:webhookId`** — one webhook. **PATCH** updates
`name`, `avatar_url`, `channel_id`, or rotates the token with
`{ "reset_token": true }`. **DELETE** soft-deletes it and returns `204`.

Limits: 50 webhooks per space, 15 per channel. Treat webhook URLs as secrets.

### Slash commands

**GET `/api/v1/commands`** — lists the bot's commands.

**POST `/api/v1/commands`** — creates or updates one command by name.

```json
{
  "name": "weather",
  "description": "Show the forecast",
  "options": [
    { "name": "city", "description": "City name", "type": "string", "required": true }
  ]
}
```

**PUT `/api/v1/commands`** — replaces the whole command list.

**DELETE `/api/v1/commands?name=weather`** — removes one command.

Names are 1–32 lowercase letters, digits, `_`, or `-`. Descriptions are 1–100
characters. Up to 25 options and 100 commands per bot. Option types: `string`,
`integer`, `number`, `boolean`, `user`, `channel`, `role`.

### Interactions

**POST `/api/v1/interactions/:interactionId/callback`** — answers a slash
command or button press within 15 minutes.

```json
{ "content": "Here is the forecast", "ephemeral": true }
```

- `update: true` edits the message a button is on instead of posting a reply.
- `ephemeral: true` (or `flags: 64`) shows the reply only to the invoker.
- Up to 5 answers per interaction.
- No `messages.write` scope is needed; the member asked the bot directly.

### Leaving

**POST `/api/v1/servers/:id/leave`** — removes the bot from a server.

Returns `{ "success": true }`.

### Invites

**POST `/api/v1/bots/:botId/invites`** — generates an invite for the bot to join
a server.

```json
{ "server_id": "…", "scopes": ["messages.read", "messages.write"] }
```

The token must belong to that bot, the requested scopes must be a subset of the
bot's account scopes, and the caller must be a member of the target space.
Returns the invite `code` and `invite_url`. Targeted invites expire after 7
days.

General install links are created by the bot owner from the developers portal
(or `POST /api/bot/install-link`) and let the recipient pick a space they
manage.

### Bot management (owner only)

**POST `/api/bot/update`** — update a bot's name, avatar, banner, bio, or scopes.

```json
{ "botId": "…", "name": "New Name", "avatarUrl": "https://…", "bannerUrl": "https://…", "bio": "…", "scopes": ["messages.read", "messages.write"] }
```

All fields except `botId` are optional. Returns `{ "ok": true }`.

**POST `/api/bot/register`** — create a new bot.

```json
{ "name": "My Bot", "scopes": ["messages.read", "messages.write"] }
```

Returns `{ "bot": { … }, "token": "…" }`. The token is shown once.

**POST `/api/bot/revoke`** — revoke a bot's token.

```json
{ "botId": "…" }
```

Returns `{ "ok": true }`. Revocation is immediate and irreversible.

**POST `/api/bot/reset-token`** — rotate a bot's token. The old token stops
working immediately; the new token is shown once.

### Identity (used at startup)

**GET `/api/bot/me`** — returns the bot account, used by the clients to fire
`ready`. Not part of the versioned `v1` surface.

## Errors

| Status | Meaning                                                        | `error` field examples                              |
| ------ | -------------------------------------------------------------- | --------------------------------------------------- |
| `400`  | Missing/invalid input, unknown field, or limit exceeded.       | `"Channel name is required"`                        |
| `401`  | Missing/invalid/revoked token.                                 | `"Invalid bot token"`                               |
| `403`  | Missing scope or role permission, hierarchy violation, read-only. | `"This bot does not have messages.write in that server"` |
| `404`  | Channel/server/message/member/role not found or not visible.    | `"Channel not found"`                               |
| `429`  | Rate limited.                                                  | Includes a `Retry-After` header.                    |
| `503`  | Backing store unavailable (gateway polling).                   | `"Event delivery unavailable."`                     |
| `5xx`  | Server error. Retry with backoff.                              | `"Internal space error"`                            |

Some hidden resources return `403` instead of `404` (for example, reading
messages in a channel the bot cannot view). Treat both as "not available".

## Limits

- Up to **5 bots per account**; a bot's token dies instantly on revoke.
- Messages up to **4,000 characters**; `@everyone` needs the `mention_everyone`
  role permission.
- Up to 10 embeds and 5 action rows of 5 buttons per message.
- Up to 100 permission overwrites per channel, 250 roles per space, 100
  commands per bot, and 50 webhooks per space (15 per channel).
- Rate limits apply per bot token:
  - gateway long-poll: 15/min
  - reads: 120/min
  - writes: 60/min
  - invites: 10/min
  - registration: 10/day per owner
- If you hit `429`, honor `Retry-After`.

## Writing your own client

1. `GET /api/bot/me` with `Authorization: Bot <token>` to resolve identity.
2. Loop on `GET /api/v1/gateway?timeout=20`, handle events by `type`.
3. Use the endpoints above with the same auth header; map `401` → "bad token",
   `403` → "missing permission", `404` → "gone or invisible", `429` → "slow down
   and retry after `Retry-After`".
4. Before management actions, call
   `GET /api/v1/servers/:id/permissions` and check the role-permission map
   instead of guessing.

The official clients are `@disband/bot` (JavaScript) and `disband-bot` (Python)
— see the [JavaScript](clients/javascript.md) and [Python](clients/python.md)
pages. They wrap the core endpoints listed above, not the extended management
surface; call those with a plain HTTP request using the same `Authorization`
header. For private channels, tickets, categories, audit, bans, and webhooks,
see the [Extended API](../developers/extended-api.md).
