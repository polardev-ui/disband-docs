# JavaScript 클라이언트 — `@disband/bot`

공식적인 JavaScript 클라이언트. 제로 런타임 의존성 - `fetch` 및 표준 전역 변수만 사용하며 - Node.js 18+, Deno, Bun 및 브라우저에서 작동합니다.

## 설치하다

```bash
npm install @disband/bot
```

또는, 이 단일 저장소에서:

```bash
npm install /path/to/packages/bot
```

## 빠른 시작

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

## 건설자

### `new Client({ token, baseUrl?, gatewayTimeout? })`

| 옵션           | 유형     | 기본값                             | 설명                                  |
| ---------------- | -------- | ----------------------------------- | -------------------------------------------- |
| `token`          | `string` | *(필수)*                        | **설정 → 봇**에서 가져온 봇 토큰.      |
| `baseUrl`        | `string` | `"https://www.disband.dev"`         | API 루트(사용자 지정 도메인을 위해 변경).       |
| `gatewayTimeout` | `number` | `20`                                | 게이트웨이 펌프당 초수(1–20).             |

## 수명주기

| 방법 | 설명 |
| --------- | ----------- |
| `connect()` | 봇 아이디(`GET /api/bot/me`)를 해결하고, `ready`를 발신하며, 게이트웨이 루프를 시작합니다. 연결되면 한 번 해결됩니다. |
| `close()` | 게이트웨이 루프를 중지합니다. |
| `connected` | 논리: 루프가 현재 실행되고 있는지 여부. |

## 이벤트

`client.on(name, handler)`로 등록하세요; 일부는 `async`입니다. `once`와 `off`는 Node의 `EventEmitter`에서와 동일한 방식으로 작동합니다.

| 이벤트             | 인수     | 참고                                                                   |
| ----------------- | -------- | ----------------------------------------------------------------------- |
| `ready`           | `user`   | `user.id`, `user.userId`, `user.name`, `user.username`, `user.avatarUrl`, `user.scopes`. |
| `messageCreate` | `message` | 봇이 볼 수 있는 서버에 있는 새 메시지.                               |
| `messageUpdate` | `message` | 메시지가 편집되었습니다(`content`, `editedAt` 업데이트됨).                    |
| `messageDelete` | `message` | 메시지가 삭제되었습니다(`content` 비어 있음; `id`/`channelId` 유효함). |
| `error`           | `error`  | 게이트웨이 오류. 토큰이 유효하지 않은 경우를 제외하고 루프는 자동으로 재시도하며, 이 경우 중지됩니다. |
| `debug`           | `*`      | 저 수준 관찰 가능성.                                                |

### `Message`

| 필드       | 유형                | 설명                                    |
| ----------- | ------------------- | ---------------------------------------------- |
| `id`        | `string`            | 메시지 아이디.                                    |
| `channelId` | `string`            | 채널 아이디.                                    |
| `serverId` | `string \| null` | 서버 ID.                                     |
| `author` | `object \| null` | `{ id, username, display_name, avatar_url, is_bot }`. |
| `content` | `string` | 메시지 텍스트.                                  |
| `replyToId` | `string \| null` | 이에 답하는 메시지, 만약 있는 경우. |
| `mentions` | `array` | 언급된 사용자.                               |
| `attachment`| `object \| null`    | 메시지에 파일이 있을 때 `{ url, type }`. |
| `createdAt` | `string \| null`    | ISO 타임 스탬프.                                 |
| `editedAt` | `string \| null` | 마지막 편집의 ISO 타임 스탬프.                |
| `displayId` | `number \| null` | 순차적인 디스플레이 번호.                 |

**방법** - `message.reply(content)`(같은 채널에서 답장)과 `message.authorIsBot` 가져오기기(보내는 사람이 봇일 때 참임).

## 방법들

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

## 오류

던진 오류는 상태와 내용을 가지고 있습니다:

| 오류              | 언제                                                |
| ------------------ | --------------------------------------------------- |
| `AuthError`        | `401` — 유효하지 않거나 취소된 토큰입니다. 게이트웨이 루프가 여기서 멈춥니다. |
| `PermissionError` | `403` - 스코프 또는 역할 권한이 누락되었습니다. |
| `RateLimitError` | `429` - `retryAfter` 초를 포함합니다.              |
| `HttpError`        | 2xx 이외의 다른 상태.                           |

내부적으로 클라이언트는 [API 참조](../api-reference.md) 위에 있는 얇은 래퍼입니다: `REST.get/post/patch/delete`와 `Authorization: Bot <token>`가 있습니다.
