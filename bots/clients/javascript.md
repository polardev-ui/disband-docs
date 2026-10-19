# JavaScript client — `@disband/bot`

The official JavaScript client. Zero runtime dependencies — it uses only `fetch`
and standard globals — and works from Node.js 18+, Deno, Bun, and the browser.

## Install

```bash
npm install @disband/bot
```

or, from this monorepo:

```bash
npm install /path/to/packages/bot
```

## Quick start

```javascript
import { Client } from "@disband/bot";

const client = new Client({ token: process.env.DISBAND_BOT_TOKEN });

client.on("ready", (me) => {
  console.log(`Logged in as ${me.name} (${me.scopes.join(", ")})`);
});

client.on("messageCreate", async (message) => {
  if (message.author?.is_bot) return;
  if (message.content !== "!ping") return;
  await message.reply("pong");
});

await client.connect();
```

## Constructor

### `new Client({ token, baseUrl?, gatewayTimeout? })`

| Option           | Type     | Default                             | Description                                  |
| ---------------- | -------- | ----------------------------------- | -------------------------------------------- |
| `token`          | `string` | *(required)*                        | The bot token from **Settings → Bots**.      |
| `baseUrl`        | `string` | `"https://www.disband.dev"`         | API root (change for a custom domain).       |
| `gatewayTimeout` | `number` | `20`                                | Seconds per gateway poll (1–20).             |

## Lifecycle

| Method    | Description |
| --------- | ----------- |
| `connect()` | Resolves the bot identity (`GET /api/bot/me`), emits `ready`, and starts the gateway loop. Resolves once connected. |
| `close()`   | Stops the gateway loop. |
| `connected` | Boolean: whether the loop is currently running. |

## Events

Register with `client.on(name, handler)`; some are `async`. `once` and `off`
work the same way they do in Node's `EventEmitter`.

| Event             | Args     | Notes                                                                   |
| ----------------- | -------- | ----------------------------------------------------------------------- |
| `ready`           | `user`   | `user.id`, `user.userId`, `user.name`, `user.username`, `user.avatarUrl`, `user.scopes`. |
| `messageCreate`   | `message`| A new message in a server the bot can see.                               |
| `messageUpdate`   | `message`| A message was edited (`content`, `editedAt` updated).                    |
| `messageDelete`   | `message`| A message was deleted (`content` empty; `id`/`channelId` valid).        |
| `error`           | `error`  | Gateway errors. The loop retries automatically unless the token is invalid, in which case it stops. |
| `debug`           | `*`      | Low-level observability.                                                |

### `Message`

| Field       | Type                | Description                                    |
| ----------- | ------------------- | ---------------------------------------------- |
| `id`        | `string`            | Message id.                                    |
| `channelId` | `string`            | Channel id.                                    |
| `serverId`  | `string \| null`    | Server id.                                     |
| `author`    | `object \| null`    | `{ id, username, display_name, avatar_url, is_bot }`. |
| `content`   | `string`            | Message text.                                  |
| `replyToId` | `string \| null`    | The message this replies to, if any.           |
| `mentions`  | `array`             | Mentioned users.                               |
| `attachment`| `object \| null`    | `{ url, type }` when the message has a file.   |
| `createdAt` | `string \| null`    | ISO timestamp.                                 |
| `editedAt`  | `string \| null`    | ISO timestamp of the last edit.                |
| `displayId` | `number \| null`    | The sequential display number.                 |

**Methods** — `message.reply(content)` (replies in the same channel) and the
`message.authorIsBot` getter (true when the sender was a bot).

## Methods

```javascript
await client.sendMessage(channelId, "Deploy finished");          // send
await message.reply("pong");                                      // reply to a received message

const messages = await client.listMessages(channelId, { limit: 25, before: "…" });
const channels  = await client.listChannels(serverId);
const members   = await client.listMembers(serverId);

const channelId = await client.createChannel(serverId, "deploys", { type: "text", categoryId: null });
await client.renameChannel(channelId, "deploys-2");
await client.deleteChannel(channelId);

await client.leaveServer(serverId);

const invite = await client.createInvite(serverId, ["messages.read", "messages.write"]);
// invite.invite_url -> send to the server owner
```

## Errors

Thrown errors carry the status and body:

| Error              | When                                                |
| ------------------ | --------------------------------------------------- |
| `AuthError`        | `401` — invalid or revoked token. The gateway loop stops on this. |
| `PermissionError`  | `403` — missing scope or role permission.           |
| `RateLimitError`   | `429` — includes `retryAfter` seconds.              |
| `HttpError`        | Any other non-2xx status.                           |

Internally the client is a thin wrapper over the [HTTP API](../api-reference.md):
`REST.get/post/patch/delete` with `Authorization: Bot <token>`.