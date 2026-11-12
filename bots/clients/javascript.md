# JavaScript client — `@disband/bot`

The official JavaScript client. Zero runtime dependencies — it uses only `fetch`
and standard globals — and works from Node.js 18+, Deno, Bun, and the browser.

## Install

```bash
npm install @disband/bot
```

## Quick start

```javascript
import { Client } from "@disband/bot";

const client = new Client({ token: process.env.DISBAND_BOT_TOKEN });

client.on("ready", (me) => {
  console.log(`Logged in as ${me.name}`);
});

client.on("messageCreate", async (message) => {
  if (message.authorIsBot) return;
  if (message.content === "!ping") await message.reply("pong");
});

await client.connect();
```

## Constructor

### `new Client(options)`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `token` | `string` | *(required)* | The bot token from **Settings → Bots**. |
| `baseUrl` | `string` | `"https://www.disband.dev"` | API root. |
| `gatewayTimeout` | `number` | `20` | Seconds per gateway poll (1–20). |
| `requestTimeout` | `number` | `max((gatewayTimeout+10)*1000, 30000)` | Per-request timeout in ms. |
| `allowInsecureLocalhost` | `boolean` | `false` | Allow `http://localhost` for local development only. |
| `retryRateLimits` | `boolean` | `true` | Wait out a `429`'s `Retry-After` and send the request again. |
| `maxRetries` | `number` | `3` | How many `429`s to retry before throwing `RateLimitError`. |

## Lifecycle

| Method | Description |
| --- | --- |
| `connect()` | Resolves identity, emits `ready`, and starts the gateway loop. Resolves once connected. |
| `close()` | Stops the gateway loop. |
| `connected` | Boolean: whether the loop is running. |
| `user` | The bot identity after `connect()`. |

## Events

| Event | Args | Notes |
| --- | --- | --- |
| `ready` | `user` | `user.id`, `user.userId`, `user.name`, `user.username`, `user.avatarUrl`, `user.scopes`. |
| `messageCreate` | `Message` | New message in a channel the bot can view. |
| `messageUpdate` | `Message` | Edited message. |
| `messageDelete` | `Message` | Deleted message (partial fields; `id`/`channelId`/`serverId` present). |
| `reactionAdd` | payload | `message_id`, `channel_id`, `server_id`, `emoji`, `user_id`, `user`. |
| `reactionRemove` | payload | The same, without `user`. |
| `memberJoin` | payload | Someone joined a space (`members.read`). |
| `memberLeave` | payload | Someone left a space (`members.read`). |
| `memberUpdate` | payload | A member's roles changed (`members.read`). |
| `channelCreate` / `channelUpdate` / `channelDelete` | payload | `channel_id`, `server_id`, `channel`. Forum posts included. |
| `roleCreate` / `roleUpdate` / `roleDelete` | payload | `server_id`, `role_id`, `role` (`members.read` or `roles.manage`). |
| `serverUpdate` | payload | `server_id`, `server`: the space's name, icon, banner or owner changed. |
| `serverJoin` | payload | The bot was added: `server_id`, `server`, `scopes`. |
| `serverLeave` | payload | The bot was removed: `server_id`. |
| `scopesUpdate` | payload | The space changed the bot's scopes: `server_id`, `scopes`. |
| `interactionCreate` | payload | Slash command or button press for this bot. |
| `error` | `Error` | Gateway/handler errors. The loop retries unless the token is invalid. |
| `debug` | `string` | Low-level diagnostics (unknown event types, rate-limit retries). |

```javascript
client.on("reactionAdd", async ({ channel_id, message_id, emoji, user }) => {
  if (emoji === "📌" && !user?.is_bot) await client.pinMessage(channel_id, message_id);
});

client.on("serverJoin", async ({ server }) => {
  console.log(`Added to ${server.name}`);
});
```

### `Message`

Fields: `id`, `channelId`, `serverId`, `author`, `content`, `replyToId`,
`mentions`, `embeds`, `components`, `interaction`, `webhookId`, `attachment`
(`{ url, type }` or `null`), `createdAt`, `editedAt`, `displayId`,
`reactions` (from `getMessage`), `raw`.

Helpers: `authorIsBot`, `reply(content, options?)`, `edit(patch)`, `delete()`,
`react(emoji)`, `unreact(emoji)`, `pin()`, `unpin()`.

## Methods

### Messages, reactions, and pins

```javascript
await client.sendMessage(channelId, "Deploy finished", { replyToId, embeds, components });
await client.editMessage(channelId, messageId, { content: "Edited", embeds, components });
const messages = await client.listMessages(channelId, { limit: 50, before }); // or after / around
const message = await client.getMessage(channelId, messageId); // message.reactions
await client.deleteMessage(channelId, messageId); // UUID or numeric display_id
const deleted = await client.bulkDeleteMessages(channelId, [uuid1, uuid2]); // UUIDs only, 1-100
await client.sendTyping(channelId); // "is typing…" for a few seconds

await client.addReaction(channelId, messageId, "👍");
await client.removeReaction(channelId, messageId, "👍");
const reactions = await client.listReactions(channelId, messageId); // [{ emoji, count, me }]
const users = await client.listReactionUsers(channelId, messageId, "👍", { limit: 100 });
await client.removeUserReaction(channelId, messageId, "👍", userId); // manage_messages
const removed = await client.clearReactions(channelId, messageId, { emoji: "👍" }); // omit emoji for all
const pins = await client.listPins(channelId);
await client.pinMessage(channelId, messageId);
await client.unpinMessage(channelId, messageId);
```

### Forum posts

```javascript
const posts = await client.listForumPosts(forumId, { limit: 50 });
const { post, message } = await client.createForumPost(forumId, {
  title: "Release notes",
  content: "v2 is out",
  tags: ["announcement"], // the forum's own tags
});
await client.sendMessage(post.id, "Questions welcome here."); // a post is a channel
```

### The bot itself and users

```javascript
const { user, bot } = await client.fetchMe();
await client.setStatus("Watching 12 servers"); // null clears it; up to 64 characters
const servers = await client.listServers(); // [{ id, name, icon_url, owner_id, scopes, joined_at }]
const profile = await client.getUser(userId); // shares a space, members.read
```

### Servers and audit

```javascript
const server = await client.getServer(serverId);
const updated = await client.updateServer(serverId, { name, description, discoverable });
const perms = await client.getServerPermissions(serverId);
const entries = await client.listAuditLog(serverId, { limit: 100 });
```

### Categories and channels

```javascript
const categories = await client.listCategories(serverId);
const category = await client.createCategory(serverId, "Support");
await client.updateCategory(categoryId, { name, position });
await client.deleteCategory(categoryId);

const channels = await client.listChannels(serverId); // visible only
const channel = await client.getChannel(channelId);
const channelId = await client.createChannel(serverId, "staff-chat", {
  type: "text",
  categoryId,
  topic,
  slowModeSeconds: 0,
  readOnly: false,
  userLimit: null,
  permissions: [
    { role_id: everyoneRoleId, can_view: false },
    { role_id: staffRoleId, can_view: true, can_post: true },
  ],
});
await client.updateChannel(channelId, { name, topic, slow_mode_seconds, category_id, position, read_only, locked, user_limit });
await client.renameChannel(channelId, "new-name");
await client.deleteChannel(channelId);

const overwrites = await client.listChannelPermissions(channelId);
await client.setChannelPermission(channelId, roleId, { can_view: true, can_post: true, can_react: null, can_attach: null });
await client.deleteChannelPermission(channelId, roleId);
```

A private channel is a channel with role overwrites: deny `can_view` for
`@everyone` and allow it for the roles that should see it. Hidden channels are
omitted from lists and direct access returns 403/404.

### Members, bans, and roles

```javascript
const members = await client.listMembers(serverId); // or { query: "ali", role: roleId, limit: 25 }
const member = await client.getMember(serverId, userId);
await client.kickMember(serverId, userId);
await client.timeoutMember(serverId, userId, 10, "Cooling off");
await client.addMemberRole(serverId, userId, roleId);
await client.removeMemberRole(serverId, userId, roleId);

const bans = await client.listBans(serverId);
await client.banMember(serverId, userId, { reason: "Spam" });
await client.unbanMember(serverId, userId);

const roles = await client.listRoles(serverId);
const role = await client.createRole(serverId, { name, color: "#5865f2", permissions: { send_messages: true }, self_assignable: false, position: 2 });
const one = await client.getRole(serverId, roleId);
await client.updateRole(serverId, roleId, { name, color, permissions, self_assignable, position });
await client.deleteRole(serverId, roleId);
```

Moderation and role changes enforce hierarchy (no acting on the owner,
moderators, bots, yourself, or roles at/above the bot's highest role).

### Webhooks

```javascript
const webhooks = await client.listWebhooks(serverId);
const webhook = await client.createWebhook(serverId, { channel_id, name, avatar_url });
const one = await client.getWebhook(webhookId);
await client.updateWebhook(webhookId, { name, avatar_url, channel_id, reset_token: true });
await client.deleteWebhook(webhookId);
```

Webhook objects include a posting `url` — treat it as a secret. Webhooks in
channels the bot cannot view are hidden.

### Commands and interactions

```javascript
const commands = await client.listCommands();
await client.setCommands([{ name: "ping", description: "Ping", options: [] }]); // bulk replace
await client.upsertCommand({ name: "ping", description: "Ping", options: [] });
await client.deleteCommand("ping");

client.on("interactionCreate", async (interaction) => {
  await client.respondToInteraction(interaction.id, { content: "Pong!", ephemeral: true });
});
```

### Invites and lifecycle

```javascript
await client.leaveServer(serverId);
const invite = await client.createInvite(serverId, ["messages.read", "messages.write"]);
// invite.invite_url -> send to the server owner
```

## Errors

| Error | When |
| --- | --- |
| `AuthError` | `401` — invalid or revoked token. The gateway loop stops on this. |
| `PermissionError` | `403` — missing scope, grant, or role permission. |
| `RateLimitError` | `429` — includes `retryAfter` seconds. |
| `HttpError` | Any other non-2xx status. |

All carry `status`, `message`, and `body`. See the [API reference](../api-reference.md)
and [Extended API](../../developers/extended-api.md) for endpoint-specific
behavior and limits.
