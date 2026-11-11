# Extended API and private channels

The extended bot API is **shipped**. It adds private text channels, category and
channel management, message editing and bulk tools, pins and reactions, richer
member and role tools, audit log reads, server settings, and webhook management.
Everything is versioned under `/api/v1`.

This page is the deep reference for those surfaces. The
[API reference](../bots/api-reference.md) covers the core message and gateway
contract, and [Webhooks](webhooks.md) covers posting through a webhook URL.

## Authentication

Every endpoint uses the bot token:

```http
Authorization: Bot <token>
Content-Type: application/json
```

A missing, invalid, or revoked token returns:

```json
{ "error": "Invalid bot token" }
```

with status `401`. There is no unauthenticated read path in this API.

## Scopes

A bot has an account-level scope list chosen when it is created (and editable by
its owner), plus a **per-space grant** approved when the bot joins that space.
The effective scopes are the intersection of the two.

Lowering a bot's account scopes applies immediately: the removed scopes are
trimmed from every existing space grant. Adding a scope back does not restore old
grants; the bot has to be approved for that scope again.

| Scope | What it unlocks |
| --- | --- |
| `messages.read` | Gateway message events, message history, channel and category lists, channel detail, pinned messages |
| `messages.write` | Send and edit messages and pin messages |
| `messages.delete` | Delete messages, bulk delete, unpin messages, edit messages |
| `messages.react` | Add and remove the bot's reactions |
| `members.read` | Member list, member detail, role list |
| `members.kick` | Kick members |
| `members.ban` | Ban, unban, and list bans |
| `members.timeout` | Time out members |
| `channels.read` | Channel and category lists, channel detail, channel permission list |
| `channels.manage` | Create, update, reorder, and delete channels and categories; set channel overwrites |
| `webhooks.manage` | List, create, update, and delete webhooks |
| `roles.manage` | Create, edit, and delete roles; assign and remove roles; manage channel overwrites |
| `servers.read` | Read a space's name, description, icon, banner, and member count |
| `audit.read` | Read the audit log |

> Earlier drafts of this page used colon names such as `channels:read` and
> `messages:send`. Those names were never accepted in production. Use the dotted
> names above.

### The two authorization gates

Most write endpoints require **both**:

1. the relevant scope, granted on the bot **and** in that space, and
2. a role permission on the bot's account in that space.

For example, creating a channel needs `channels.manage` and the
`manage_channels` role permission. A bot with the scope but not the role
permission gets `403`.

Reads are usually scope-only. A few read endpoints also accept a role
permission as an alternative; those exceptions are called out below.

Every check is deny-by-default and runs against the bot's real account, roles,
and channel overwrites. Client-supplied role IDs or permission flags are never
trusted.

## Private text channels

There is no `visibility` column and no separate private-channel object. A
private channel is a normal text channel with **role permission overwrites** in
`channel_permissions`.

### Overwrite fields

| Field | Meaning |
| --- | --- |
| `can_view` | See the channel, its metadata, and its messages |
| `can_post` | Send messages |
| `can_react` | Add reactions |
| `can_attach` | Upload attachments |

Each field is `true` (allow), `false` (deny), or `null` (inherit).

### How to make a channel private

1. Deny `can_view` for the `@everyone` role.
2. Allow `can_view` for each staff or participant role that should see it.

`@everyone` is the default role in the space — the role with `is_default: true`
in `GET /api/v1/servers/{server_id}/roles`.

```bash
curl -X POST https://www.disband.dev/api/v1/servers/SERVER_ID/channels \
  -H "Authorization: Bot $DISBAND_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "staff-chat",
    "type": "text",
    "permissions": [
      { "role_id": "EVERYONE_ROLE_ID", "can_view": false },
      { "role_id": "STAFF_ROLE_ID", "can_view": true, "can_post": true }
    ]
  }'
```

Notes:

- `role_id` in channel creation must be a role **UUID**. Use the `id` field from
  `GET /api/v1/servers/{server_id}/roles`.
- Up to 100 overwrites can be supplied when creating a channel.
- A role used in an overwrite must sit below the bot's highest role.
- `@everyone` is always allowed as an overwrite target.

### Viewing rules

- Access is evaluated per role. If **any** role assigned to the member (including
  `@everyone`) allows the permission, the member has it. A `false` overwrite on
  one role does not veto another role's `true`; it only withholds that role's
  grant.
- For `can_view`, a role with no row inherits the `@everyone` overwrite. If
  `@everyone` has no row either, it is allowed.
- For `can_post`, `can_react`, and `can_attach`, a role with no overwrite falls
  back to that role's server permissions (`send_messages`, `add_reactions`,
  `attach_files`).
- If a channel has no overwrites at all, every member can view it and posting is
  governed by the normal server permissions and `read_only`.
- The space **owner**, members with **Administrator**, and members with the
  **`manage_channels`** role permission bypass channel overwrites and can always
  view every channel. This is intentional: space managers can always audit what
  is in their space.
- A channel with `read_only: true` blocks posting for everyone except the
  bypasses above. It does not block reading.

### What a bot without access sees

- `GET /servers/{id}/channels` silently omits channels the bot cannot view.
- `GET /channels/{id}` returns `404` and the message `Channel not found`.
- Message reads and writes return `403` with `Channel permission denied`.
- Gateway events are only queued for channels the bot can view. A private
  channel's events never reach a bot that cannot see it.

Treat both `403` and `404` as "not available to this bot"; do not build logic
that depends on the exact status for a hidden channel.

### No category-level permissions

Production has **no `category_permissions` table**. Categories are for display
and ordering only. Channel-level overwrites are authoritative. Do not design an
integration around inheriting permissions from a category — it does not happen.

### Bot access to the channels it creates

A bot follows the same overwrite rules as everyone else. If it creates a
channel that denies `@everyone` and does not allow a role the bot has, the bot
will not be able to read or post in its own new channel. Either:

- give the bot's highest role `can_view: true` in the new channel, or
- give the bot a role with `manage_channels` / Administrator (which bypasses
  overwrites).

`POST /servers/{id}/channels` still returns `201` with the new `channel_id` in
this case; `channel` may be `null` because the follow-up detail read is denied.

## Ticket systems

Disband deliberately does **not** implement ticket objects, claiming, or
transcripts in the API. It exposes the primitives a ticket bot needs:

- categories and channels,
- private channels with role overwrites,
- roles and member role assignment,
- messages, embeds, buttons, and interactions,
- audit logging.

A typical private ticket flow:

1. **Find or create a category** for tickets (`GET`/`POST
   /servers/{id}/categories`).
2. **Create a per-ticket role** with `POST /servers/{id}/roles` (requires
   `roles.manage` + `manage_roles`). The role must sit below the bot's highest
   role.
3. **Assign that role to the opener** with
   `PUT /servers/{id}/members/{user_id}/roles/{role_id}`. The target must be
   below the bot's highest role and must not be the space owner.
4. **Create the ticket channel** with `can_view: false` for `@everyone`,
   `can_view: true` for the ticket role, and `can_view: true` for the staff
   role. Include the bot's own role if the bot does not have
   `manage_channels`.
5. **Post the ticket panel** with a message containing buttons. Button presses
   arrive on the gateway as `interactionCreate` events; answer them through the
   interaction callback endpoint.
6. **Close the ticket** by deleting the channel and the per-ticket role.

Every ticket role counts toward the **250 roles per space** limit. Plan for
that: a role-per-ticket design supports roughly 249 simultaneously open tickets
(plus the `@everyone` role and any permanent staff roles). If you need more,
reuse a smaller set of staff channels rather than one channel per ticket.

For private **staff** channels, skip the per-ticket role: deny `@everyone`, and
allow the existing staff role. That costs no extra roles.

## Endpoint reference

All paths are relative to `https://www.disband.dev`.

### Servers

| Method | Path | Scope | Role permission |
| --- | --- | --- | --- |
| `GET` | `/api/v1/servers/{server_id}` | Any of `servers.read`, `messages.read`, `channels.read`, `channels.manage`, `members.read` | — |
| `PATCH` | `/api/v1/servers/{server_id}` | Any granted scope | `manage_server` |
| `GET` | `/api/v1/servers/{server_id}/permissions` | Any granted scope | — |

`GET` returns server metadata plus `member_count`:

```json
{
  "server": {
    "id": "…",
    "name": "Space",
    "description": "…",
    "icon_url": "…",
    "banner_url": null,
    "owner_id": "…",
    "created_at": "…",
    "discoverable": true,
    "verified": false,
    "member_count": 42
  }
}
```

`PATCH` accepts `name`, `description`, and `discoverable`:

```json
{ "name": "New name", "description": "New description", "discoverable": true }
```

Unknown fields are rejected with `400`. The bot must be a member of the space;
otherwise the response is `403`.

`GET /permissions` is a self-check endpoint. It returns the bot's granted
scopes, its role IDs, its highest role position, and a map of the role
permissions it currently holds:

```json
{
  "server_id": "…",
  "user_id": "…",
  "scopes": ["messages.read", "channels.manage"],
  "permissions": {
    "add_reactions": true,
    "attach_files": true,
    "ban": false,
    "create_invites": true,
    "kick": false,
    "manage_channels": true,
    "manage_emojis": false,
    "manage_messages": false,
    "manage_roles": false,
    "manage_server": false,
    "manage_webhooks": false,
    "mention_everyone": false,
    "pin_messages": false,
    "send_messages": true,
    "timeout_members": false,
    "view_audit_log": false
  },
  "highest_role_position": 3,
  "roles": ["…"]
}
```

### Categories

| Method | Path | Scope | Role permission |
| --- | --- | --- | --- |
| `GET` | `/api/v1/servers/{server_id}/categories` | Any of `messages.read`, `channels.read`, `channels.manage` | — |
| `POST` | `/api/v1/servers/{server_id}/categories` | `channels.manage` | `manage_channels` |
| `PATCH` | `/api/v1/categories/{category_id}` | `channels.manage` | `manage_channels` |
| `DELETE` | `/api/v1/categories/{category_id}` | `channels.manage` | `manage_channels` |

`GET` returns categories ordered by position. `channel_count` counts only the
channels the bot can view, so private channels are not leaked through it:

```json
{
  "categories": [
    { "id": "…", "server_id": "…", "name": "Text Channels", "position": 0, "channel_count": 2 }
  ]
}
```

`POST` body: `{ "name": "Support" }`. Returns `201` with
`{ "category": { … } }`.

`PATCH` body: `{ "name": "Renamed", "position": 2 }`. Position is a
zero-based whole number. Returns `{ "category": { … } }`.

`DELETE` returns `204`. Its channels become uncategorized; they are not deleted.

### Channels

| Method | Path | Scope | Role permission |
| --- | --- | --- | --- |
| `GET` | `/api/v1/servers/{server_id}/channels` | Any of `messages.read`, `channels.read`, `channels.manage` | — |
| `POST` | `/api/v1/servers/{server_id}/channels` | `channels.manage` | `manage_channels` |
| `GET` | `/api/v1/channels/{channel_id}` | Any of `messages.read`, `channels.read`, `channels.manage` | — |
| `PATCH` | `/api/v1/channels/{channel_id}` | `channels.manage` | `manage_channels` |
| `DELETE` | `/api/v1/channels/{channel_id}` | `channels.manage` | `manage_channels` |

`GET /servers/{id}/channels` returns only channels the bot can view, ordered by
position. Each channel includes effective `can_post`, `can_react`, `can_attach`,
and `can_manage` flags:

```json
{
  "channels": [
    {
      "id": "…",
      "server_id": "…",
      "category_id": "…",
      "category_name": "Text Channels",
      "name": "general",
      "type": "text",
      "position": 0,
      "topic": "…",
      "slow_mode_seconds": 0,
      "read_only": false,
      "locked": false,
      "is_stage": false,
      "user_limit": null,
      "created_at": "…",
      "can_post": true,
      "can_react": true,
      "can_attach": true,
      "can_manage": false
    }
  ]
}
```

`POST` body:

```json
{
  "name": "staff-only",
  "type": "text",
  "category_id": null,
  "topic": "Staff discussion",
  "slow_mode_seconds": 0,
  "read_only": false,
  "user_limit": null,
  "permissions": [
    { "role_id": "@everyone-uuid", "can_view": false },
    { "role_id": "staff-uuid", "can_view": true, "can_post": true }
  ]
}
```

- `type` is `text` or `voice` (default `text`).
- Names are trimmed, lowercased, and limited to 100 characters.
- Topics are up to 1,024 characters.
- `slow_mode_seconds` is 0–21,600.
- `user_limit` is 0–99 for voice channels, or `null`.
- `permissions` is optional, up to 100 role overwrites.
- Returns `201` with `{ "channel_id": "…", "channel": { … } }`.
- `channel` can be `null` if creating the overwrites made the channel invisible
  to the bot; see "Bot access to the channels it creates".

`GET /channels/{id}` returns `{ "channel": { … } }` with the same fields plus
`can_view: true` and, when the bot has `manage_channels`, a `permissions` array:

```json
{
  "permissions": [
    {
      "role_id": "…",
      "role_name": "@everyone",
      "can_view": false,
      "can_post": null,
      "can_react": null,
      "can_attach": null
    }
  ]
}
```

`PATCH` accepts any of `name`, `topic`, `slow_mode_seconds`, `category_id`,
`position`, `read_only`, `locked`, `user_limit`, and `type`:

```json
{ "name": "deploys-2", "topic": null, "slow_mode_seconds": 10, "position": 1 }
```

- `type` is accepted only if it equals the current type; channels cannot change
  type.
- `category_id` may be a category UUID or `null`.
- Unknown fields return `400`.
- Returns `{ "channel": { … } }`.

`DELETE` removes the channel and its messages, then returns `204`. This is
audited.

### Channel permission overwrites

| Method | Path | Scope | Role permission |
| --- | --- | --- | --- |
| `GET` | `/api/v1/channels/{channel_id}/permissions` | Any of `channels.read`, `channels.manage`, `roles.manage` | — |
| `PUT` | `/api/v1/channels/{channel_id}/permissions/{role_id}` | `channels.manage` or `roles.manage` | `manage_channels` |
| `DELETE` | `/api/v1/channels/{channel_id}/permissions/{role_id}` | `channels.manage` or `roles.manage` | `manage_channels` |

`GET` returns the raw overwrite rows, highest role first:

```json
{
  "permissions": [
    { "role_id": "…", "can_view": false, "can_post": null, "can_react": null, "can_attach": null }
  ]
}
```

`PUT` body — every field is optional and defaults to `null`:

```json
{ "can_view": true, "can_post": true, "can_react": null, "can_attach": null }
```

`true` allows, `false` denies, and `null` clears the override. Returns
`{ "ok": true }`.

`DELETE` clears the role's row entirely, so it inherits again. Returns
`{ "ok": true }`.

`role_id` may be a role UUID or a numeric role `display_id` on these two routes.
The role must be below the bot's highest role, except `@everyone`.

### Messages

| Method | Path | Scope | Role permission |
| --- | --- | --- | --- |
| `GET` | `/api/v1/channels/{channel_id}/messages` | `messages.read` | — |
| `POST` | `/api/v1/channels/{channel_id}/messages` | `messages.write` | `send_messages` |
| `PATCH` | `/api/v1/channels/{channel_id}/messages/{message_id}` | `messages.write` or `messages.delete` | `manage_messages` to edit someone else's |
| `DELETE` | `/api/v1/channels/{channel_id}/messages/{message_id}` | `messages.delete` | `manage_messages` to delete someone else's |
| `POST` | `/api/v1/channels/{channel_id}/messages/bulk-delete` | `messages.delete` | `manage_messages` to delete someone else's |

`GET` query: `limit` (1–100, default 50) and `before` (a message UUID for
backwards paging). Returns `{ "messages": [ … ] }`, newest first.

`POST` body:

```json
{
  "content": "Deploy finished",
  "reply_to_id": null,
  "embeds": [],
  "components": []
}
```

- `content` is required unless `embeds` is non-empty.
- Content is up to 4,000 characters.
- Up to 10 embeds; see [Embeds](embeds.md).
- Up to 5 action rows of 5 buttons; see the button schema below.
- `@everyone` / `@here` needs the `mention_everyone` role permission.
- Returns `201` with `{ "message": { … } }`.

`PATCH` accepts `content`, `embeds`, and `components`. Omitting a field leaves it
unchanged; sending `null` for `embeds` or `components` clears it. A bot can edit
its own messages; editing someone else's needs `manage_messages`. Returns
`{ "message": { … } }`.

`DELETE` returns `204`. A bot can always delete its own messages; deleting
someone else's needs `manage_messages`.

`POST /messages/bulk-delete` body:

```json
{ "message_ids": ["uuid", "uuid"] }
```

- 1–100 **UUIDs**. Numeric `display_id` values are not accepted here.
- Duplicates, unknown IDs, and IDs from other channels are ignored; the
  response reports how many rows were actually deleted: `{ "deleted": 12 }`.
- Deleting someone else's messages needs `manage_messages`.

`message_id` in the single-message routes may be a UUID or the numeric
`display_id` shown in the app.

### Reactions

| Method | Path | Scope | Role permission |
| --- | --- | --- | --- |
| `PUT` | `/api/v1/channels/{channel_id}/messages/{message_id}/reactions/{emoji}` | `messages.react` | `add_reactions` |
| `DELETE` | `/api/v1/channels/{channel_id}/messages/{message_id}/reactions/{emoji}` | `messages.react` | `add_reactions` |

`{emoji}` is URL-encoded and 1–32 characters. Both routes manage only the bot's
own reaction. `PUT` is idempotent and returns:

```json
{ "reaction": { "id": "…", "message_id": "…", "emoji": "✅" } }
```

`DELETE` is idempotent and returns `{ "removed": true }` or
`{ "removed": false }` if the reaction was not there.

### Pins

| Method | Path | Scope | Role permission |
| --- | --- | --- | --- |
| `GET` | `/api/v1/channels/{channel_id}/pins` | Any of `messages.read`, `channels.read`, `channels.manage` | — |
| `PUT` | `/api/v1/channels/{channel_id}/pins/{message_id}` | `messages.write` or `messages.delete` | `pin_messages` |
| `DELETE` | `/api/v1/channels/{channel_id}/pins/{message_id}` | `messages.write` or `messages.delete` | `pin_messages` |

`GET` returns pinned messages, newest pin first:

```json
{
  "pins": [
    {
      "id": "…",
      "message_id": "…",
      "content": "…",
      "author_id": "…",
      "author": { "id": "…", "username": "…", "display_name": "…", "avatar_url": "…", "is_bot": false },
      "pinned_by": "…",
      "created_at": "…",
      "message": { "…": "the full message, or null if it was deleted" }
    }
  ]
}
```

`PUT` is idempotent and returns
`{ "pin": { "id": "…", "message_id": "…", "channel_id": "…" } }`.
`DELETE` is idempotent and returns `{ "removed": true }` or
`{ "removed": false }`.

### Members

| Method | Path | Scope | Role permission |
| --- | --- | --- | --- |
| `GET` | `/api/v1/servers/{server_id}/members` | `members.read` | — |
| `GET` | `/api/v1/servers/{server_id}/members/{user_id}` | `members.read` | — |
| `DELETE` | `/api/v1/servers/{server_id}/members/{user_id}` | `members.kick` | — |
| `PATCH` | `/api/v1/servers/{server_id}/members/{user_id}` | `members.timeout` | — |
| `PUT` | `/api/v1/servers/{server_id}/members/{user_id}/roles/{role_id}` | `roles.manage` | `manage_roles` |
| `DELETE` | `/api/v1/servers/{server_id}/members/{user_id}/roles/{role_id}` | `roles.manage` | `manage_roles` |

`GET` list returns members sorted by display name:

```json
{
  "members": [
    {
      "id": "…",
      "username": "…",
      "display_name": "…",
      "avatar_url": "…",
      "is_bot": false,
      "status": "online",
      "role": "member",
      "roles": ["role-uuid"],
      "joined_at": "…"
    }
  ]
}
```

`GET` one returns profile details, roles, highest role position, and any active
timeout:

```json
{
  "member": {
    "id": "…",
    "username": "…",
    "display_name": "…",
    "avatar_url": "…",
    "bio": "…",
    "status": "online",
    "is_bot": false,
    "is_owner": false,
    "joined_at": "…",
    "role": "member",
    "roles": [{ "id": "…", "name": "Staff", "color": "#5865f2", "position": 3, "is_default": false }],
    "highest_role_position": 3,
    "timed_out_until": null
  }
}
```

`DELETE` kicks the member and returns `{ "ok": true }`.

`PATCH` times a member out:

```json
{ "timeout_minutes": 10, "reason": "Cooling off" }
```

- `timeout_minutes` is required and must be 1–40,320 (28 days).
- Returns `{ "ok": true, "timed_out_until": "2026-11-11T12:00:00Z" }`.

Kicks and timeouts protect the space owner, moderators (anyone with `kick`,
`ban`, or `manage_server`), bots, and the calling bot itself.

Role assignment:

- The role must be below the bot's highest role.
- The target member must be below the bot's highest role.
- The target cannot be the space owner.
- `@everyone` cannot be given or taken.
- Both routes return `{ "ok": true }` and are idempotent.

`role_id` may be a UUID or numeric `display_id`.

### Bans

| Method | Path | Scope | Role permission |
| --- | --- | --- | --- |
| `GET` | `/api/v1/servers/{server_id}/bans` | `members.ban`, or the `ban` role permission | — |
| `PUT` | `/api/v1/servers/{server_id}/bans/{user_id}` | `members.ban` | — |
| `DELETE` | `/api/v1/servers/{server_id}/bans/{user_id}` | `members.ban` | `ban` |

`GET` returns bans, newest first:

```json
{
  "bans": [
    { "user_id": "…", "banned_by": "…", "reason": "…", "created_at": "…" }
  ]
}
```

`PUT` body is optional: `{ "reason": "…" }` (up to 500 characters). Returns
`{ "ok": true }`. The same target protections as kick apply.

`DELETE` unbans and returns `{ "removed": true }` or `{ "removed": false }`.
Unlike `PUT`, unban requires the `ban` role permission as well as the scope.

### Roles

| Method | Path | Scope | Role permission |
| --- | --- | --- | --- |
| `GET` | `/api/v1/servers/{server_id}/roles` | `roles.manage` or `members.read` | — |
| `POST` | `/api/v1/servers/{server_id}/roles` | `roles.manage` | `manage_roles` |
| `GET` | `/api/v1/servers/{server_id}/roles/{role_id}` | `roles.manage` or `members.read` | — |
| `PATCH` | `/api/v1/servers/{server_id}/roles/{role_id}` | `roles.manage` | `manage_roles` |
| `DELETE` | `/api/v1/servers/{server_id}/roles/{role_id}` | `roles.manage` | `manage_roles` |

Roles are returned highest first and include a `manageable` flag:

```json
{
  "roles": [
    {
      "id": "…",
      "display_id": "383216538525554",
      "name": "Staff",
      "color": "#5865f2",
      "position": 3,
      "permissions": { "send_messages": true, "manage_messages": true },
      "is_default": false,
      "self_assignable": false,
      "manageable": true
    }
  ]
}
```

Create body:

```json
{
  "name": "Ticket Staff",
  "color": "#5865f2",
  "permissions": { "send_messages": true, "add_reactions": true },
  "self_assignable": false,
  "position": 2
}
```

- `name` is required (1–100 characters).
- `color` is a hex colour like `#5865f2`. Omitted or `null` uses the default
  grey on create and leaves the current colour on edit.
- `permissions` is an object of permission names to booleans. Omitted keys are
  `false` on create. On edit the map is merged, so omitted keys keep their
  current value.
- `position` is 1 or greater and must be below the bot's highest role.
- A space can have at most 250 roles.
- Returns `201` with `{ "role": { … } }`.

Permission keys:

`add_reactions`, `attach_files`, `ban`, `create_invites`, `kick`,
`manage_channels`, `manage_emojis`, `manage_messages`, `manage_roles`,
`manage_server`, `manage_webhooks`, `mention_everyone`, `pin_messages`,
`send_messages`, `timeout_members`, `view_audit_log`.

`PATCH` accepts `name`, `color`, `permissions`, `self_assignable`, and
`position`; omitted fields stay unchanged. `permissions` is merged into the
existing map, so omitted keys keep their current value. `@everyone` cannot be
edited or deleted. Returns `{ "role": { … } }`.

`DELETE` returns `{ "ok": true }`. `role_id` may be a UUID or numeric
`display_id`.

### Audit log

| Method | Path | Scope | Role permission |
| --- | --- | --- | --- |
| `GET` | `/api/v1/servers/{server_id}/audit` | `audit.read`, or the `view_audit_log` role permission | — |

Unlike most endpoints, this one accepts **either** the scope **or** the role
permission. Query `limit` is 1–100 (default 100). Entries are newest first:

```json
{
  "audit": [
    {
      "id": "…",
      "server_id": "…",
      "actor_id": "…",
      "action": "channel.create",
      "target_type": "channel",
      "target_id": "…",
      "details": { "name": "staff-chat", "bot": "…" },
      "created_at": "…"
    }
  ]
}
```

Actions written by the extended API include:

`category.create`, `category.update`, `category.delete`, `channel.create`,
`channel.update`, `channel.delete`, `channel.permissions`, `message.edit`,
`message.delete`, `message.bulk_delete`, `message.pin`, `message.unpin`,
`member.kick`, `member.ban`, `member.unban`, `member.timeout`,
`member.role_add`, `member.role_remove`, `role.create`, `role.update`,
`role.delete`, `server.update`, `webhook.create`, `webhook.update`,
`webhook.token_reset`, `webhook.delete`, `bot.invite.approve`.

### Webhooks

| Method | Path | Scope | Role permission |
| --- | --- | --- | --- |
| `GET` | `/api/v1/servers/{server_id}/webhooks` | `webhooks.manage` | `manage_webhooks` |
| `POST` | `/api/v1/servers/{server_id}/webhooks` | `webhooks.manage` | `manage_webhooks` |
| `GET` | `/api/v1/webhooks/{webhook_id}` | `webhooks.manage` | `manage_webhooks` |
| `PATCH` | `/api/v1/webhooks/{webhook_id}` | `webhooks.manage` | `manage_webhooks` |
| `DELETE` | `/api/v1/webhooks/{webhook_id}` | `webhooks.manage` | `manage_webhooks` |

`GET /servers/{id}/webhooks` returns webhooks newest first. Every object
includes its posting `url`. Treat that URL as a secret. Webhooks that live in a
channel the bot cannot view are omitted; reading, moving, rotating, or deleting
one of them returns `404`.

```json
{
  "webhooks": [
    {
      "id": "…",
      "server_id": "…",
      "channel_id": "…",
      "name": "Deploys",
      "avatar_url": null,
      "url": "https://disband.dev/webhook/…/…",
      "created_at": "…",
      "last_used_at": null
    }
  ]
}
```

`POST` body:

```json
{ "channel_id": "…", "name": "Deploys", "avatar_url": null }
```

- `channel_id` is required and must be a text channel the bot can view.
- `name` is optional (1–80 characters); a random name is used if omitted.
- `avatar_url` must be an HTTPS image URL or `null`.
- Returns `201` with `{ "webhook": { … } }`.

`GET /webhooks/{id}` returns `{ "webhook": { … } }`.

`PATCH` body:

```json
{ "name": "New name", "avatar_url": null, "channel_id": "…", "reset_token": true }
```

- `channel_id` must be a visible text channel in the same space.
- `reset_token: true` rotates the URL; the old URL stops working immediately.
- Returns the updated `{ "webhook": { … } }`.

`DELETE` soft-deletes the webhook and returns `204`. Messages it already posted
remain.

Limits: 50 webhooks per space, 15 per channel. Webhook sends are rate limited
separately at the public webhook URL.

### Gateway

```
GET /api/v1/gateway?timeout=20
```

The gateway is a long-poll. `timeout` is clamped to 1–20 seconds; the request
returns as soon as events are available.

Event types:

| Type | Delivered when |
| --- | --- |
| `messageCreate` | A message is posted in a channel the bot can view |
| `messageUpdate` | A message in a visible channel is edited |
| `messageDelete` | A message in a visible channel is deleted |
| `memberJoin` | Someone joins a space the bot is in (`members.read` in that space) |
| `memberLeave` | Someone leaves a space the bot is in (`members.read` in that space) |
| `memberUpdate` | A member's roles change (`members.read` in that space) |
| `interactionCreate` | Someone runs the bot's slash command or presses its button |

Message events require `messages.read` on both the bot and the space grant.
Member events require `members.read` on the space grant. Interaction events
require the bot to be in the space. Delivery is at-least-once: handle events
idempotently by event ID.

### Slash commands

| Method | Path | Scope |
| --- | --- | --- |
| `GET` | `/api/v1/commands` | Any authenticated bot |
| `PUT` | `/api/v1/commands` | Any authenticated bot |
| `POST` | `/api/v1/commands` | Any authenticated bot |
| `DELETE` | `/api/v1/commands?name=weather` | Any authenticated bot |

Commands are global to the bot: every space the bot is in offers them.

```json
{
  "name": "weather",
  "description": "Show the forecast",
  "options": [
    { "name": "city", "description": "City name", "type": "string", "required": true }
  ]
}
```

- Command names are 1–32 lowercase letters, digits, `_`, or `-`.
- Descriptions are 1–100 characters.
- Up to 25 options per command; option types are `string`, `integer`, `number`,
  `boolean`, `user`, `channel`, and `role`.
- Required options must come before optional ones.
- Up to 100 commands per bot.
- `PUT` replaces the whole list (bulk overwrite); `POST` creates or updates one
  by name; `DELETE` needs `?name=`.

### Interactions

```
POST /api/v1/interactions/{interaction_id}/callback
```

Answer a slash command or button press within 15 minutes:

```json
{
  "content": "Here is the forecast",
  "embeds": [],
  "components": [],
  "update": false,
  "ephemeral": false
}
```

- `update: true` edits the message the button is on instead of posting a reply.
- `ephemeral: true` (or Discord's `flags: 64`) shows the reply only to the person
  who ran the command.
- Up to 5 answers per interaction.
- Answering does not require `messages.write`; the member invoked the bot
  directly.

The `interactionCreate` payload contains the interaction `id`, `type`
(`command` or `component`), `server_id`, `channel_id`, the invoking `user`, and
either `command: { name, options }` or
`component: { custom_id, message_id }`.

### Invites

```
POST /api/v1/bots/{bot_id}/invites
```

```json
{ "server_id": "…", "scopes": ["messages.read", "channels.manage"] }
```

- The token must belong to that bot.
- The requested scopes must be a subset of the bot's account scopes and must be
  valid scope names.
- The caller must be a member of the target space.
- Returns `{ "code": "…", "invite_url": "…" }`. Invites expire after 7 days.
- Rate limit: 10 per minute per bot.

General install links are created by the bot owner from the developers portal or
`POST /api/bot/install-link`; they are reusable and let the recipient pick a
space they manage.

## Rate limits

Limits are per bot token and persist across server instances. The in-memory
limiter is a burst pre-filter; the database enforces the full window.

| Bucket | Limit |
| --- | --- |
| Gateway long-poll | 15 requests per minute |
| Reads | 120 per minute |
| Writes | 60 per minute |
| Invite creation | 10 per minute |
| Bot registration | 10 per day per owner |

A limited request returns `429` with a `Retry-After` header and a JSON error.
Honour the header rather than retrying immediately.

The database also enforces:

- 4,000 characters per message,
- 100 permission overwrites per channel,
- 250 roles per space,
- 100 slash commands per bot,
- 50 webhooks per space and 15 per channel,
- 1–100 messages per bulk delete,
- 1–28 days per timeout,
- 500-character ban and timeout reasons.

## Errors

All errors are JSON:

```json
{ "error": "Human-readable message" }
```

| Status | Meaning |
| --- | --- |
| `400` | Invalid input, unknown field, malformed ID, or limit exceeded |
| `401` | Missing, invalid, or revoked bot token |
| `403` | Missing scope or grant, missing role permission, hierarchy violation, read-only channel, or restricted bot |
| `404` | Resource missing or not visible to the bot |
| `429` | Rate limited; honour `Retry-After` |
| `500` | Internal error; retry with backoff |
| `503` | Event delivery temporarily unavailable (gateway only) |

Some hidden resources return `403` and some return `404`. This is intentional in
places to avoid leaking whether a channel exists, but it is not perfectly
uniform. Treat both as "not available".

## Security model

- **Deny by default.** Every request starts with no access. Access is added only
  by the bot's scopes, the space grant, and the bot account's roles.
- **Two gates.** Account scopes alone are not enough; the space owner must also
  grant the scope. Role permissions are a third gate for management actions.
- **Central checks.** Every route authenticates with the same bot-token lookup
  and every database RPC re-checks the bot's membership, scopes, and role
  permissions. A route cannot bypass the RPC checks by passing a different ID.
- **No direct table access.** Bot tokens are not Supabase keys. All reads and
  writes go through the service-role RPCs and route handlers.
- **Hierarchy.** Bots can only manage roles below their own highest role, and
  cannot kick, ban, time out, or edit the roles of the owner, moderators, other
  bots, or themselves.
- **Secrets.** Bot tokens are hashed at rest and shown once. Webhook URLs are
  secrets; anyone with the URL can post. `reset_token` rotates them.
- **Audit.** Management and moderation mutations write an audit row with the
  actor, action, target, and a small details object. The actor is the bot's user
  account; the details include the bot ID where useful. Reactions are not
  audited; message edits, single and bulk deletes, pins, and all channel,
  category, role, member, server, and webhook management changes are.
- **Visibility.** Channel lists, channel detail, messages, pins, reactions, and
  gateway events all check `can_view`. Private channel contents do not leak to
  bots or members who cannot see the channel.

## Migrating from the pre-release draft

If you built against the earlier "planned" version of this page:

- Scope names are dotted (`messages.write`, `channels.manage`, `audit.read`),
  not colon-separated.
- Private channels use `channel_permissions` overwrites; there is no
  `visibility: "private"` field and no `category_permissions` table.
- `POST /channels` returns `{ "channel_id", "channel" }`, not just a bare ID.
- `PATCH` and `DELETE` return the updated resource or `204`, not
  `{ "success": true }`.
- Webhook management lives under `/servers/{id}/webhooks` and `/webhooks/{id}`,
  not `/channels/{id}/webhooks`.
- Ticket endpoints do not exist. Use categories, private channels, roles, and
  interactions to build tickets.
