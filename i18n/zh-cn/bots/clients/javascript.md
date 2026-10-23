# JavaScript 客户端 — `@disband/bot`

官方JavaScript客户端。零运行时依赖项——它只使用`fetch`和标准全局——并且可以在Node.js 18+、Deno、Bun和浏览器上运行。

## 安装

```bash
npm install @disband/bot
```

或者，从这个单一版本库中：

```bash
npm install /path/to/packages/bot
```

## 快速启动

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

## 建造者

### `new Client({ token, baseUrl?, gatewayTimeout? })`

| 选项 | 类型 | 默认值 | 描述                                  |
| ---------------- | -------- | ----------------------------------- | -------------------------------------------- |
| `token`          | `string` | *(必填)*                        | 来自**设置→机器人**的机器人令牌。      |
| `baseUrl` | `string` | `"https://www.disband.dev"` | API根（更改为自定义域名）。 |
| `gatewayTimeout` | `number` | `20`                                | 每个网关查询的秒数（1-20）。             |

## 生命周期

| 方法 | 描述 |
| --------- | ----------- |
| `connect()` | 解决机器人身份（`GET /api/bot/me`），发送`ready`，并启动网关循环。连接后立即解决。 |
| `close()` | 停止网关循环。 |
| `connected` | 布林值：循环是否当前正在运行。 |

## 事件

注册`client.on(name, handler)`；有些是`async`。`once`和`off`的工作方式与Node的`EventEmitter`相同。

| 事件 | 参数 | 备注                                                                   |
| ----------------- | -------- | ----------------------------------------------------------------------- |
| `ready`           | `user`   | `user.id`, `user.userId`, `user.name`, `user.username`, `user.avatarUrl`, `user.scopes`. |
| `messageCreate` | `message` | 机器人可以看到的服务器中的一条新消息。                               |
| `messageUpdate` | `message` | 已编辑一条消息（`content`，`editedAt`已更新）。                    |
| `messageDelete` | `message` | 已删除一条消息（`content`为空；`id`/`channelId`有效）。 |
| `error`           | `error`  | 网关错误。除非令牌无效，否则循环将自动重试，在这种情况下，它将停止。 |
| `debug`           | `*`      | 低级可观察性。                                                |

### `Message`

| 字段 | 类型                | 描述                                    |
| ----------- | ------------------- | ---------------------------------------------- |
| `id`        | `string`            | 消息编号。                                    |
| `channelId` | `string`            | 频道ID。                                    |
| `serverId` | `string \| null` | 服务器ID。                                     |
| `author` | `object \| null` | `{ id, username, display_name, avatar_url, is_bot }`。 |
| `content` | `string` | 消息文本。                                  |
| `replyToId` | `string \| null` | 此回复的消息，如果有的话。 |
| `mentions` | `array` | 提及的用户。                               |
| `attachment`| `object \| null` | `{ url, type }` 当消息包含文件时。 |
| `createdAt` | `string \| null` | ISO时间戳。                                 |
| `editedAt` | `string \| null` | 上次编辑的ISO时间戳。                |
| `displayId` | `number \| null` | 顺序显示号码。                 |

**方法**——`message.reply(content)`（在同一频道中回复）和`message.authorIsBot`获取器（当发件人是机器人时为真）。

## 方法

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

## 错误

抛出的错误包含状态和体：

| 错误 | 当                                                |
| ------------------ | --------------------------------------------------- |
| `AuthError` | `401` — 无效或已撤销的令牌。网关循环在此处停止。 |
| `PermissionError` | `403` — 缺少作用域或角色权限。 |
| `RateLimitError` | `429` — 包括`retryAfter`秒。              |
| `HttpError`        | 任何其他非2xx状态。                           |

从内部来看，客户端是[API 参考](../api-reference.md)上的薄外壳：`REST.get/post/patch/delete`与`Authorization: Bot <token>`。
