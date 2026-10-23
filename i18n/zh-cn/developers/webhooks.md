# Webhook

Webhook通过一个秘密的URL将消息发布到一个频道。它不需要机器人代码、网关循环和`Authorization`头——如果你可以发送HTTP请求，你就可以发布到Disband。

Webhooks与机器人是分开的。使用webhook从CI、监控、游戏服务器、表单或任何其他可以调用URL的东西发送单向通知。当你需要读取事件或处理消息时，请使用[机器人](../bots/index.md)。

## 创建一个webhook

你需要在空间中拥有**管理Webhooks**权限。

1. 打开**空间设置→集成→Webhooks**。
2. 选择一个频道，然后选择**新webhook**。
3. 给它起个名字，如果你愿意，还可以给它一个头像。
4. 复制网络钩子URL。

URL看起来像这样：

```text
https://disband.dev/webhook/12345678/01234567890123456789012345
```

| 部分 | 含义                                                        |
| ----------- | -------------------------------------------------------------- |
|空格键 | 八位数字用于识别空格。不是秘密。                |
|令牌 | 二十六位数字。这就是秘密。把它当成密码一样对待。 |

相同的端点也在`https://disband.dev/api/webhooks/<space key>/<token>`上提供服务。

从该屏幕中，你可以重命名网络钩子、重置其令牌或删除它。重置令牌会立即使旧的URL失效。删除网络钩子会停止它发布消息，但会保留它已经在频道中发送的消息。

## 执行一个webhook

将`POST`发送到webhook URL，并附上JSON的正文。

```bash
curl -X POST 'https://disband.dev/webhook/12345678/01234567890123456789012345' \
  -H 'Content-Type: application/json' \
  -d '{
    "content": "Deploy finished — **v2.4.1** is live.",
    "username": "Deploy bot",
    "avatar_url": "https://example.com/deploy.png"
  }'
```

成功请求返回`204 No Content`。添加`?wait=true`以接收创建的消息对象：

```bash
curl -X POST 'https://disband.dev/webhook/12345678/01234567890123456789012345?wait=true' \
  -H 'Content-Type: application/json' \
  -d '{ "content": "Hello from the other side." }'
```

### 身体字段

| 字段 | 类型 | 备注                                                                    |
| ----------------- | ------- | ------------------------------------------------------------------------ |
| `content`         | 字串 | 最多2000个字符。当至少有一个嵌入时，可以省略。 |
| `username`        | 字串 | 覆盖此消息的webhook名称。最多80个字符。         |
| `avatar_url` | 字串 | 覆盖此消息的头像。绝对`http`或`https` URL。 |
| `embeds`          | 数组 | 最多10个[嵌入](embeds.md)。                                             |
| `embed`           | 对象 | 继承单数形式。被视为`embeds: [embed]`。                      |
| `allowed_mentions`| 对象 | 控制ping。见下文。                                                |
| `tts`             | boolean | 已接受兼容性；目前忽略。                            |
| `flags`           | 编号 | 接受兼容性；目前忽略。                            |

`username`在任何封装中都不能包含`disband`或`clyde`。这防止了网络钩子冒充平台员工。

目前不支持文件附件。可以解析多部分请求，但文件不会存储；如果你需要上传文件，请使用机器人。

### 提及控制

默认情况下，webhook会解析用户提及和`@everyone` / `@here`，与Discord相同。

向没有人发送ping：

```json
{ "content": "Build 184 finished.", "allowed_mentions": { "parse": [] } }
```

允许用户提及，但不允许所有人：

```json
{
  "content": "Thanks @polar.",
  "allowed_mentions": { "parse": ["users"] }
}
```

当`@everyone`被禁用时，数据库仍然会存储该值，但不会发送通知。当字段完全缺失时，所有内容都会被解析。

## 消息对象

使用`?wait=true`，响应是一个Discord形状的消息。Disband使用`id`中的数字消息ID。

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

## 管理消息

Webhook可以获取、编辑和删除它发布的消息。使用执行响应中的数字消息ID。

| 方法 | 端点                                      | 结果                         |
| -------- | --------------------------------------------- | ------------------------------ |
| `GET` | `/webhook/<key>/<token>/messages/<id>` | 检索消息。 |
| `PATCH` | `/webhook/<key>/<token>/messages/<id>` | 编辑`content`和/或`embeds`。 |
| `DELETE` | `/webhook/<key>/<token>/messages/<id>`        | 删除消息。返回`204`。 |

编辑示例：

```bash
curl -X PATCH 'https://disband.dev/webhook/12345678/01234567890123456789012345/messages/4821' \
  -H 'Content-Type: application/json' \
  -d '{ "content": "Deploy finished — rolled back." }'
```

只有由该webhook撰写的消息才能更改。不同的webhook接收`404 Unknown Message`。

## 管理webhook本身

| 方法 | 端点                            | 结果                                      |
| -------- | ----------------------------------- | ------------------------------------------- |
| `GET` | `/webhook/<key>/<token>` | Webhook对象（名称、头像、频道、URL）。 |
| `PATCH` | `/webhook/<key>/<token>` | 用`{ "name": "New name" }`重命名它。 |
| `DELETE` | `/webhook/<key>/<token>` | 删除它。返回`204`。                   |

通过URL删除是永久性的，相当于在集成屏幕中删除它。

## 速率限制

每个webhook每2秒限**5个请求**。限制取决于令牌，因此一个嘈杂的webhook不能减慢另一个webhook的速度。

有限请求返回`429`：

```json
{
  "message": "You are being rate limited.",
  "retry_after": 1.34,
  "global": false
}
```

响应还带有`Retry-After`（整秒）和通常的`X-RateLimit-*`头。等待延迟，然后重试。

## 错误

错误使用Discord的形状：

```json
{ "message": "Unknown Webhook", "code": 10015 }
```

| 状态 | 代码 | 含义                                                    |
| ------ | ------- | ---------------------------------------------------------- |
| `400` | `50006` | 空消息：无内容和无嵌入。                   |
| `400` | `50035` | 内容无效、嵌入错误或内容超过2000个字符。 |
| `404` | `10015` | 未知webhook：空格键错误、令牌错误或已删除。 |
| `404` | `10008` | 未知消息。                                           |
| `429` | —       | 速度有限。尊重`Retry-After`。                        |
| `500` | —       | 服务器错误。请稍后再试。                          |

`404 Unknown Webhook`故意没有说是空格键还是令牌出了问题。

## 安全

- 任何持有URL的人都可以发布。请勿将其提交到公共存储库或放置
  它在客户端代码中。
- 将URL存储在与API密钥相同的秘密存储中。
- 如果令牌泄露，请立即重置令牌。旧的URL将立即停止工作。
- Webhook只向其配置的频道写入数据。它无法读取消息，
  列表成员，或更改空间设置。

## 有亲属关系的

- [嵌入](embeds.md) — 嵌入对象及其限制。
- [机器人](../bots/index.md) — 双向集成和事件交付。
- [API 参考](../bots/api-reference.md) — 机器人HTTP API，包括
  嵌入支持。
