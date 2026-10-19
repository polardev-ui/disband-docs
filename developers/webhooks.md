# Webhooks

A webhook posts messages into one channel through a secret URL. It needs no
bot code, no gateway loop, and no `Authorization` header — if you can make an
HTTP request, you can post to Disband.

Webhooks are separate from bots. Use a webhook for one-way notifications from
CI, monitoring, game servers, forms, or anything else that can call a URL. Use a
[bot](../bots/index.md) when you need to read events or act on messages.

## Create a webhook

You need the **Manage Webhooks** permission in the space.

1. Open **Space Settings → Integrations → Webhooks**.
2. Choose a channel and select **New webhook**.
3. Give it a name and, if you like, an avatar.
4. Copy the webhook URL.

The URL looks like this:

```text
https://disband.dev/webhook/12345678/01234567890123456789012345
```

| Part        | Meaning                                                        |
| ----------- | -------------------------------------------------------------- |
| Space key   | Eight digits identifying the space. Not secret.                |
| Token       | Twenty-six digits. This is the secret. Treat it like a password. |

The same endpoint is also served at
`https://disband.dev/api/webhooks/<space key>/<token>`.

From that screen you can rename the webhook, reset its token, or delete it.
Resetting the token immediately invalidates the old URL. Deleting the webhook
stops it posting, but leaves messages it has already sent in the channel.

## Execute a webhook

Send a `POST` to the webhook URL with a JSON body.

```bash
curl -X POST 'https://disband.dev/webhook/12345678/01234567890123456789012345' \
  -H 'Content-Type: application/json' \
  -d '{
    "content": "Deploy finished — **v2.4.1** is live.",
    "username": "Deploy bot",
    "avatar_url": "https://example.com/deploy.png"
  }'
```

A successful request returns `204 No Content`. Add `?wait=true` to receive the
created message object instead:

```bash
curl -X POST 'https://disband.dev/webhook/12345678/01234567890123456789012345?wait=true' \
  -H 'Content-Type: application/json' \
  -d '{ "content": "Hello from the other side." }'
```

### Body fields

| Field             | Type    | Notes                                                                    |
| ----------------- | ------- | ------------------------------------------------------------------------ |
| `content`         | string  | Up to 2,000 characters. May be omitted when at least one embed is present. |
| `username`        | string  | Overrides the webhook name for this message. Up to 80 characters.         |
| `avatar_url`      | string  | Overrides the avatar for this message. Absolute `http` or `https` URL.    |
| `embeds`          | array   | Up to 10 [embeds](embeds.md).                                             |
| `embed`           | object  | Legacy singular form. Treated as `embeds: [embed]`.                      |
| `allowed_mentions`| object  | Controls pings. See below.                                                |
| `tts`             | boolean | Accepted for compatibility; currently ignored.                            |
| `flags`           | number  | Accepted for compatibility; currently ignored.                            |

`username` cannot contain `disband` or `clyde`, in any casing. That prevents a
webhook impersonating platform staff.

File attachments are not supported yet. A multipart request can be parsed, but
files are not stored; use a bot if you need to upload files.

### Mention control

By default a webhook parses both user mentions and `@everyone` / `@here`, the
same as Discord.

To ping nobody:

```json
{ "content": "Build 184 finished.", "allowed_mentions": { "parse": [] } }
```

To allow user mentions but not everyone:

```json
{
  "content": "Thanks @polar.",
  "allowed_mentions": { "parse": ["users"] }
}
```

The database still stores `@everyone` when it is suppressed, but no notification
is sent. When the field is missing entirely, everything is parsed.

## Message objects

With `?wait=true`, the response is a Discord-shaped message. Disband uses its
numeric message id in `id`.

```json
{
  "id": "4821",
  "type": 0,
  "content": "Deploy finished.",
  "channel_id": "…",
  "guild_id": "…",
  "author": {
    "id": "…",
    "username": "Deploy bot",
    "avatar": "https://example.com/deploy.png",
    "discriminator": "0000",
    "bot": true
  },
  "attachments": [],
  "embeds": [],
  "mentions": [],
  "mention_roles": [],
  "mention_everyone": false,
  "pinned": false,
  "tts": false,
  "timestamp": "2026-10-19T20:15:00.000Z",
  "edited_timestamp": null,
  "flags": 0,
  "components": [],
  "webhook_id": "…"
}
```

## Manage messages

A webhook can fetch, edit, and delete messages it posted. Use the numeric message
id from the execute response.

| Method   | Endpoint                                      | Result                         |
| -------- | --------------------------------------------- | ------------------------------ |
| `GET`    | `/webhook/<key>/<token>/messages/<id>`        | Fetch the message.             |
| `PATCH`  | `/webhook/<key>/<token>/messages/<id>`        | Edit `content` and/or `embeds`. |
| `DELETE` | `/webhook/<key>/<token>/messages/<id>`        | Delete the message. Returns `204`. |

Edit example:

```bash
curl -X PATCH 'https://disband.dev/webhook/12345678/01234567890123456789012345/messages/4821' \
  -H 'Content-Type: application/json' \
  -d '{ "content": "Deploy finished — rolled back." }'
```

Only messages authored by that webhook can be changed. A different webhook
receives `404 Unknown Message`.

## Manage the webhook itself

| Method   | Endpoint                            | Result                                      |
| -------- | ----------------------------------- | ------------------------------------------- |
| `GET`    | `/webhook/<key>/<token>`            | Webhook object (name, avatar, channel, URL). |
| `PATCH`  | `/webhook/<key>/<token>`            | Rename it with `{ "name": "New name" }`.     |
| `DELETE` | `/webhook/<key>/<token>`            | Delete it. Returns `204`.                   |

Deleting through the URL is permanent and equivalent to deleting it in the
Integrations screen.

## Rate limits

Each webhook is limited to **5 requests per 2 seconds**. The limit is keyed on
the token, so one noisy webhook cannot slow another one down.

A limited request returns `429`:

```json
{
  "message": "You are being rate limited.",
  "retry_after": 1.34,
  "global": false
}
```

The response also carries `Retry-After` (whole seconds) and the usual
`X-RateLimit-*` headers. Wait for the delay, then retry.

## Errors

Errors use Discord's shape:

```json
{ "message": "Unknown Webhook", "code": 10015 }
```

| Status | Code    | Meaning                                                    |
| ------ | ------- | ---------------------------------------------------------- |
| `400`  | `50006` | Empty message: no content and no embeds.                   |
| `400`  | `50035` | Invalid body, bad embed, or content over 2,000 characters. |
| `404`  | `10015` | Unknown webhook: bad space key, bad token, or deleted.     |
| `404`  | `10008` | Unknown message.                                           |
| `429`  | —       | Rate limited. Honour `Retry-After`.                        |
| `500`  | —       | Server error. Retry with backoff.                          |

A `404 Unknown Webhook` deliberately does not say whether the space key or the
token was wrong.

## Security

- Anyone with the URL can post. Do not commit it to a public repository or put
  it in client-side code.
- Store the URL in the same secret store you use for API keys.
- Reset the token immediately if it leaks. The old URL stops working at once.
- A webhook only writes to its configured channel. It cannot read messages,
  list members, or change space settings.

## Related

- [Embeds](embeds.md) — the embed object and its limits.
- [Bots](../bots/index.md) — two-way integrations and event delivery.
- [Bot API reference](../bots/api-reference.md) — the bot HTTP API, including
  embed support.
