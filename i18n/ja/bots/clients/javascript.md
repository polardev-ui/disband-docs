# JavaScript クライアント — `@disband/bot`

公式のJavaScript クライアント。ゼロランタイム依存関係 - `fetch`と標準グローバルのみを使用し、Node.js 18+、Deno、Bun、およびブラウザから動作します。

## 設置する

```bash
npm install @disband/bot
```

または、このモノリポジトリから：

```bash
npm install /path/to/packages/bot
```

## クイックスタート

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

## 建設者

### `new Client({ token, baseUrl?, gatewayTimeout? })`

| オプション | タイプ | デフォルト                             | 説明                                  |
| ---------------- | -------- | ----------------------------------- | -------------------------------------------- |
| `token`          | `string` | *(必須)*                        | **設定 → ボット**からのボットトークン。      |
| `baseUrl`        | `string` | `"https://www.disband.dev"`         | API root (カスタムドメインに変更してください)。       |
| `gatewayTimeout` | `number` | `20`                                | ゲートウェイのポーリングあたりの秒数 (1–20)。             |

## ライフサイクル

| 方法 | 説明 |
| --------- | ----------- |
| `connect()` | ボットアイデンティティ（`GET /api/bot/me`）を解決し、`ready`を発射し、ゲートウェイループを開始します。接続されると一度解決します。 |
| `close()` | ゲートウェイループを停止します。 |
| `connected` | ボolean:ループが現在実行されているかどうか。 |

## イベント

`client.on(name, handler)`に登録してください。一部は`async`です。`once`と`off`はNodeの`EventEmitter`と同じように機能します。

| イベント | 引数 | メモ                                                                   |
| ----------------- | -------- | ----------------------------------------------------------------------- |
| `ready`           | `user`   | `user.id`, `user.userId`, `user.name`, `user.username`, `user.avatarUrl`, `user.scopes`. |
| `messageCreate` | `message` | ボットが見ることができるサーバー内の新しいメッセージ。                               |
| `messageUpdate` | `message` | メッセージが編集されました（`content`、`editedAt`が更新されました）。 |
| `messageDelete` | `message` | メッセージが削除されました（`content`は空で、`id`/`channelId`は有効です）。 |
| `error`           | `error`  | ゲートウェイエラー。トークンが無効でない限り、ループは自動的に再試行され、その場合、停止します。 |
| `debug`           | `*`      | 低レベルの可観測性。                                                |

### `Message`

| フィールド | タイプ                | 説明                                    |
| ----------- | ------------------- | ---------------------------------------------- |
| `id`        | `string`            | メッセージID。                                    |
| `channelId` | `string`            | チャンネルID。                                    |
| `serverId` | `string \| null` | サーバーID。                                     |
| `author` | `object \| null` | `{ id, username, display_name, avatar_url, is_bot }`. |
| `content` | `string` | メッセージテキスト。                                  |
| `replyToId` | `string \| null` | このメッセージに返信するメッセージ（該当する場合）。 |
| `mentions` | `array` | 言及されたユーザー。                               |
| `attachment`| `object \| null` | `{ url, type }` メッセージにファイルがある場合。 |
| `createdAt` | `string \| null` | ISOタイムスタンプ。                                 |
| `editedAt` | `string \| null` | 最後の編集時のISOタイムスタンプ。 |
| `displayId` | `number \| null` | 順次表示番号。                 |

**方法** — `message.reply(content)`（同じチャンネルでの返信）と`message.authorIsBot`ゲッター（送信者がボットであった場合の真）。

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

## エラー

スローされたエラーには、ステータスとボディが含まれます。

| エラー | いつ                                                |
| ------------------ | --------------------------------------------------- |
| `AuthError` | `401` — 無効または取り消されたトークンです。ゲートウェイループはこの時点で停止します。 |
| `PermissionError` | `403` — 範囲または役割の権限がありません。 |
| `RateLimitError` | `429` — `retryAfter`秒を含みます。 |
| `HttpError` | 他の2xx以外のステータス。                           |

内部的には、クライアントは[APIリファレンス](../api-reference.md)の上に薄いラップラーです。`REST.get/post/patch/delete`と`Authorization: Bot <token>`があります。
