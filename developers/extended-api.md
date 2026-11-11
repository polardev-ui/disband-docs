# Extended API and private channels

Planned additions for bots, integrations, and server-management tools. These
features are **not all shipped yet**; this page documents the intended contract
and security model so integrations can be designed against it.

## Private text channels

A private channel is a text channel whose existence and contents are visible only
to members and bots that have `can_view` for it.

### Visibility rules

- Private channels are omitted from channel lists unless the caller has
  `can_view`.
- `can_view` is evaluated from the caller's roles and channel permission
  overwrites.
- Category permissions can grant or deny access, but a channel-level overwrite
  always wins.
- Bots only receive events for channels they can view.
- Search, notifications, and unread counts exclude inaccessible channels.

### Permission overwrites

Each channel can have per-role overwrites:

| Field | Meaning |
| --- | --- |
| `can_view` | See the channel and its messages |
| `can_post` | Send messages |
| `can_react` | Add reactions |
| `can_attach` | Upload attachments |

A missing overwrite inherits from the role's server permissions.

### Private channel behavior

- Members without `can_view` cannot see the channel in the UI, API, or gateway.
- Members with `can_view` but not `can_post` can read but not write.
- Bots follow the same rules as users.
- Private channels are not discoverable by non-members.

## Extended API

All endpoints are versioned under `/api/v1`.

### Authentication

| Caller | Header |
| --- | --- |
| User | `Authorization: Bearer <session JWT>` |
| Bot | `Authorization: Bot <token>` |

- Missing or invalid credentials return `401`.
- Revoked bots return `401`.
- Every request is scoped to the caller's permissions.

### Authorization model

1. Resolve caller identity.
2. Resolve server membership.
3. Resolve effective roles.
4. Evaluate the required permission.
5. Deny by default.

No endpoint trusts client-supplied role IDs or permission flags.

### Rate limits

- Per user, bot, token, and endpoint.
- Higher limits for read endpoints than write endpoints.
- Ticket and webhook endpoints have stricter limits.
- Rate-limited responses return `429` with a retry hint.

## Bot scopes

Bot tokens are scoped. A bot can only use endpoints covered by its scopes.

| Scope | Allows |
| --- | --- |
| `channels:read` | List visible channels |
| `channels:write` | Create/update/delete channels |
| `messages:send` | Send messages |
| `messages:manage` | Edit/delete/pin messages |
| `members:read` | List members |
| `members:moderate` | Kick, ban, timeout |
| `roles:manage` | Assign/remove roles |
| `tickets:manage` | Create and manage ticket channels |
| `webhooks:manage` | Create and manage webhooks |
| `audit:read` | Read audit log |

Scopes are granted at bot creation and can be changed by server owners.

## Server endpoints

### Get server info

```
GET /api/v1/servers/{server_id}
```

Rules:
- Requires `servers:read`, `messages.read`, or `channels.manage`.
- Bot must be a member of the server.
- Returns basic server metadata and member count.
- Inaccessible servers return `404`.

### List categories

```
GET /api/v1/servers/{server_id}/categories
```

Rules:
- Requires `messages.read` or `channels.manage`.
- Bot must be a member of the server.
- Returns categories ordered by position.

## Channel endpoints

### Create channel

```
POST /api/v1/servers/{server_id}/channels
```

Body:

```json
{
  "name": "staff-only",
  "type": "text",
  "category_id": "optional-category-id",
  "visibility": "private",
  "permissions": [
    { "role_id": "role-id", "can_view": true, "can_post": true }
  ]
}
```

Rules:
- Requires `channels:write` and `manage_channels`.
- Bot must be a member of the server.
- Channel names are validated and normalized.
- Permission overwrites are validated against the caller's role hierarchy.

### Update channel

```
PATCH /api/v1/channels/{channel_id}
```

Rules:
- Requires `channels:write` and `manage_channels`.
- Cannot grant permissions the caller does not have.
- Private visibility changes are audited.

### Delete channel

```
DELETE /api/v1/channels/{channel_id}
```

Rules:
- Requires `channels:write` and `manage_channels`.
- Deleting a channel removes its messages and overwrites.
- Audit log entry is created.

## Message endpoints

### Send message

```
POST /api/v1/channels/{channel_id}/messages
```

Rules:
- Requires `messages:send` or `can_post`.
- Caller must have `can_view` for the channel.
- Attachments are validated for size and type.
- Mentions are validated against server members.
- Rate limits apply per user and channel.

### Edit message

```
PATCH /api/v1/messages/{message_id}
```

Rules:
- Authors can edit their own messages.
- Moderators with `manage_messages` can edit others' messages where allowed.
- Edits are audited.

### Delete message

```
DELETE /api/v1/messages/{message_id}
```

Rules:
- Authors can delete their own messages.
- Moderators with `manage_messages` can delete others' messages.
- Deletions are audited.

## Member and role endpoints

### Assign role

```
POST /api/v1/servers/{server_id}/members/{user_id}/roles
```

Rules:
- Requires `roles:manage` and `manage_roles`.
- Cannot assign roles equal to or higher than the caller's highest role.
- Changes are audited.

### Remove role

```
DELETE /api/v1/servers/{server_id}/members/{user_id}/roles/{role_id}
```

Rules:
- Requires `roles:manage` and `manage_roles`.
- Cannot remove roles equal to or higher than the caller's highest role.
- Changes are audited.

### Moderate member

```
POST /api/v1/servers/{server_id}/members/{user_id}/timeout
POST /api/v1/servers/{server_id}/members/{user_id}/ban
```

Rules:
- Requires `members:moderate` and the relevant moderation permission.
- Cannot moderate members with equal or higher role hierarchy.
- All actions are audited.

## Ticket endpoints

### Create ticket

```
POST /api/v1/servers/{server_id}/tickets
```

Body:

```json
{
  "title": "Billing issue",
  "category": "support",
  "private": true
}
```

Rules:
- Creates a private channel for the ticket.
- Only the opener, assigned staff, and moderators can view it.
- Requires `tickets:manage` or the server's configured ticket staff role.

### Claim ticket

```
POST /api/v1/tickets/{ticket_id}/claim
```

### Close ticket

```
POST /api/v1/tickets/{ticket_id}/close
```

Rules:
- Claiming and closing are audited.
- Closed tickets can be archived or deleted based on server settings.

## Audit endpoints

### Read audit log

```
GET /api/v1/servers/{server_id}/audit?limit=100
```

Rules:
- Requires `audit:read` or a role with `view_audit_log`.
- Returns the most recent 100 entries by default.
- Entries are ordered newest first.
- Inaccessible servers return `404`.

## Webhook endpoints

### Create webhook

```
POST /api/v1/channels/{channel_id}/webhooks
```

Rules:
- Requires `webhooks:manage` and `manage_webhooks`.
- Caller must have `can_view` for the channel.
- Webhook secrets are shown only once.

### Send webhook message

```
POST /api/v1/webhooks/{webhook_id}/{token}
```

Rules:
- Rate limited per webhook.
- Payload size and attachment limits apply.
- Cannot target private channels unless the webhook's owner has access.

## Security model

### Deny by default
Every request starts with no permissions. Permissions are added only through
verified roles and overwrites.

### Central permission checker
All routes use one permission function. No route implements its own permission
logic.

### Database enforcement
RLS policies mirror API permission checks. Even direct database access cannot
bypass channel visibility.

### Audit logging
Mutating actions write an `audit_log` row with:
- actor
- action
- target
- details
- timestamp

### Input validation
- IDs must be UUIDs.
- Names have length and character limits.
- Content has size limits.
- Attachments have type and size limits.

### Abuse prevention
- Rate limits per endpoint.
- Max channels, roles, webhooks, and tickets per server.
- Slow mode for channels.
- Mention limits.
- Bot scopes limit blast radius.

### Secret handling
- Bot tokens are hashed at rest.
- Tokens are shown only once.
- Webhook secrets are shown only once.
- No secrets are logged.

## Error responses

All errors are JSON:

```json
{ "error": "Human-readable message" }
```

Common statuses:
- `400` invalid input
- `401` missing or invalid credentials
- `403` permission denied
- `404` not found or inaccessible
- `409` conflict
- `429` rate limited
- `500` server error

Inaccessible resources return `404`, not `403`, to avoid leaking existence.

## Rollout plan
1. Add schema support for channel visibility.
2. Add central permission checker and RLS policies.
3. Add private channel filtering to all read endpoints.
4. Add bot scopes and token management.
5. Add channel, message, member, role, ticket, and webhook endpoints.
6. Add audit logging and rate limits.
7. Add tests for unauthorized access and permission bypass.
8. Update documentation.
9. Gradual rollout with monitoring.

## Open questions
- Should private channels support thread creation?
- Should ticket channels auto-archive after inactivity?
- Should bot scopes be server-specific or global per bot?
- Should webhook sends be allowed from unauthenticated contexts with a secret URL only?