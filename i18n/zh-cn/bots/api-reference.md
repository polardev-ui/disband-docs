# 机器人 API 参考

机器人交谈的HTTP API。这两个客户端库都是对这些端点的薄包装层，因此此页面也是用任何其他语言编写客户端的方法。

## 基础URL和认证

```
https://www.disband.dev
```

每个请求都会发送：

|标题          |值                    |
| --------------- | ------------------------ |
| `Authorization` | `Bot <token>`            |
| `Content-Type` | `application/json` |

缺失或无效的令牌返回`401 { "error": "Invalid bot token" }`。被撤销的机器人也返回相同的值，因此`401`意味着“检查令牌”——而不是“重试”。

所有端点都有作用域：机器人只能读取或写入其作用域（和每个服务器授予的权限）允许的内容。每4xx/5xx响应都是JSON，带有`error`字段。

## 写之前阅读

- 除非你授予`messages.write` / `channels.manage`，否则机器人是**读取作用域**的。
- `channels.manage`操作也要求机器人帐户持有
  `manage_channels`在该服务器中的**角色**。
- 两个客户端都掌握了每条消息事件的作用域信息：API中没有任何信息
  返回未授予的机器人数据。

## 网关（事件长时间轮询）

```
GET /api/v1/gateway?timeout=20
```

网关是一个长时延，而不是websocket。请求会阻塞服务器端，直到有事件可用或超时结束，然后返回到达的内容。客户端会循环处理它。超时被限制在1-20秒。

回复：

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

`type`是`messageCreate`、`messageUpdate`或`messageDelete`。交付是**至少一次**——在获取和处理之间崩溃的机器人可能会再次看到相同的事件。用`payload.id` idempotently处理它们。

### 事件有效载荷

|类型             | 有效载荷字段                                        |
| ---------------- | ----------------------------------------------------- |
| `messageCreate` | 完整消息对象（如下）。                      |
| `messageUpdate` | `id`, `channel_id`, `server_id`, `content`, `edited_at` |
| `messageDelete` | `id`, `channel_id`, `server_id`                       |

消息对象：

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

只有带有`messages.read`的机器人（在机器人帐户上**和**在该服务器上授予）才能接收事件。

## 端点

### 信息

**POST `/api/v1/channels/:id/messages`** — 发送一条消息（`messages.write`）。

```json
{
  "content": "Deploy finished",
  "reply_to_id": null,
  "embeds": [
    { "title": "Build 1842", "description": "All 412 tests passed.", "color": 5793266 }
  ]
}
```

当存在`embeds`时，`content`可以省略。嵌入使用Discord的形状和限制；有关每个字段和确切限制，请参阅[嵌入](../developers/embeds.md)。当`400`存在时，既没有内容也没有嵌入的消息会被拒绝。

将`201`与`{ "message": { … } }`一起返回。

**获取`/api/v1/channels/:id/messages`**——读取消息（`messages.read`）。

查询：`limit`（1-100，默认50），`before`（消息ID，用于倒页）。

将`200`与`{ "messages": [ … ] }`一起返回。

### 官方渠道

**获取`/api/v1/servers/:id/channels`**——列出频道（`messages.read`）。

返回`{ "channels": [ … ] }`。

**POST `/api/v1/servers/:id/channels`** — 创建一个频道（`channels.manage` + `manage_channels`角色）。

```json
{ "name": "deploys", "type": "text", "category_id": null }
```

将`201`与`{ "channel_id": "…" }`一起返回。

**补丁`/api/v1/channels/:id`**——重命名一个频道（`channels.manage`）。

```json
{ "name": "deploys-2" }
```

返回`{ "success": true }`。

**删除`/api/v1/channels/:id`**——删除一个频道（`channels.manage`）。

返回`{ "success": true }`。

### 成员

**获取`/api/v1/servers/:id/members`**——列出成员（`members.read`）。

返回`{ "members": [ … ] }`。

### 离开

**POST `/api/v1/servers/:id/leave`**——从服务器上删除机器人。

返回`{ "success": true }`。

### 邀请

**POST `/api/v1/bots/:botId/invites`** — 生成一个机器人加入服务器的邀请。

```json
{ "server_id": "…", "scopes": ["messages.read", "messages.write"] }
```

将邀请（包括`invite_url`）返回，以发送给服务器所有者。只有所有者才能批准；邀请将在7天后过期。

### 身份（在启动时使用）

**获取`/api/bot/me`**——返回客户端用于释放`ready`的机器人帐户。不是版本化的`v1`表面的组成部分。

## 错误

| 状态 | 含义                                                        | `error`字段示例                              |
| ------ | -------------------------------------------------------------- | --------------------------------------------------- |
| `401` | 缺少/无效/被撤销的令牌。                                 | `"Invalid bot token"`                               |
| `403` | 缺少作用域或角色权限。                              | `"This bot does not have messages.write in that server"` |
| `404` | 未找到频道/服务器，或机器人无法看到。 | `"Channel not found"`                               |
| `429` | 速率有限。                                                  | 包括`Retry-After`头。                    |
| `503` | 后台商店不可用（网关查询）。                   | `"Event delivery unavailable."`                     |
| `5xx` | 服务器错误。请稍后再试。                              | `"Internal server error"`                           |

## 限制

- 每个帐户最多**5个机器人**；机器人代币在撤销时立即失效。
- 消息最多**4,000个字符**；`@everyone`需要`mention_everyone`
  角色权限。
- 每条消息最多**10个嵌入**，与webhooks的字段限制相同。 看见
  [嵌入](../developers/embeds.md)。
- 每条机器人令牌都适用速率限制。如果你输入`429`，请尊重`Retry-After`。

## 编写你自己的客户端

1. `GET /api/bot/me`与`Authorization: Bot <token>`一起解决身份问题。
2. 在`GET /api/v1/gateway?timeout=20`上循环，通过`type`处理事件。
3. 使用上述端点与相同的身份验证头；映射`401` →“错误的令牌”，
   `403` →“缺少权限”，`429` →“在`Retry-After`后放慢速度并重试”。

## Webhooks是不同的表面

机器人API通过`Authorization: Bot <token>`进行身份验证，并可以通过网关读取事件。一个[Webhook](../developers/webhooks.md)是一个单向的秘密URL：没有机器人帐户，没有身份验证头，也没有读取消息的能力。使用webhook进行通知，当你需要对聊天做出反应时，请使用机器人。

官方客户端是`@disband/bot`（JavaScript）和`disband-bot`（Python）——请参阅[JavaScript](clients/javascript.md)和[Python](clients/python.md)页面。
