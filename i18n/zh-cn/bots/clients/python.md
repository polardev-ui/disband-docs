# Python 客户端 — `disband-bot`

官方Python客户端。只使用标准库（`threading` + `urllib`），因此除了客户端本身之外，没有需要安装的东西。适用于Python 3.9+。

## 安装

```bash
pip install disband-bot
```

或者，从这个单一版本库中：

```bash
pip install ./packages/disband-bot-python
```

## 快速启动

```python
from disband_bot import Client

client = Client(token=DISBAND_BOT_TOKEN)

@client.on("ready")
def on_ready(me):
    print(f"Logged in as {me['name']} ({', '.join(me['scopes'])})")

@client.on("messageCreate")
def on_message(message):
    if message.author_is_bot:
        return
    if message.content == "!ping":
        message.reply("pong")

client.run()  # connects and blocks forever
```

处理器可以是普通或`async def`；两者均受支持。

## 建造者

### `Client(token, base_url="https://www.disband.dev", gateway_timeout=20)`

| 参数 | 默认值                      | 描述                                  |
| ---------------- | ---------------------------- | -------------------------------------------- |
| `token`          | *(必填)*                 | 来自**设置→机器人**的机器人令牌。      |
| `base_url` | `"https://www.disband.dev"` | API根（更改为自定义域名）。 |
| `gateway_timeout`| `20`                         | 每个网关查询的秒数（1-20）。             |

## 生命周期

| 方法 | 描述                                                        |
| -------- | ------------------------------------------------------------------ |
| `run()` | 连接，发送`ready`，在后台线程中启动网关循环，并永久阻塞。 |
| `close()`| 停止循环。                                                    |

## 事件

注册`client.on("name", handler)`——作为装饰器或普通调用——以及`once`用于单次调用处理器。

| 事件 | 参数 | 备注                                                              |
| --------------- | -------- | -------------------------------------------------------------------|
| `ready`         | `user`   | `user["id"]`, `user["name"]`, `user["scopes"]`, etc.               |
| `messageCreate` | `message`| 机器人可以看到的服务器中的一条新消息。                          |
| `messageUpdate` | `message`| 一条消息已被编辑（`content`，`edited_at`已更新）。             |
| `messageDelete` | `message`| 已删除一条消息（`content`为空；`id`/`channel_id`有效）。 |
| `error`         | `error`  | 网关错误。除非令牌无效，否则循环将自动重试，在这种情况下，它将停止。 |

### `Message`

| 字段 | 类型 | 描述                                        |
| ------------- | ---------------- | -------------------------------------------------- |
| `id`          | `str`            | 消息编号。                                        |
| `channel_id` | `str` | 频道ID。                                        |
| `server_id` | `str \| None` | 服务器ID。                                         |
| `author` | `dict \| None` | `{ "id", "username", "display_name", "avatar_url", "is_bot" }`。 |
| `content` | `str` | 消息文本。                                      |
| `reply_to_id` | `str \| None` | 此回复的消息，如果有的话。 |
| `mentions` | `list` | 提及的用户。                                   |
| `attachment` | `dict \| None` | `{ "url", "type" }` 当消息包含文件时。 |
| `created_at` | `str \| None` | ISO时间戳。                                     |
| `edited_at` | `str \| None` | 上次编辑的ISO时间戳。                    |
| `display_id` | `int \| None` | 顺序显示号码。                     |
| `author_is_bot` | `bool` | 当发件人是机器人（属性）时为真。 |

**方法**——`message.reply(content)`在同一频道回复。

## 方法

```python
client.send_message(channel_id, "Deploy finished")            # send
message.reply("pong")                                          # reply to a received message

messages = client.list_messages(channel_id, limit=25, before="…")
channels = client.list_channels(server_id)
members  = client.list_members(server_id)

channel_id = client.create_channel(server_id, "deploys")
client.rename_channel(channel_id, "deploys-2")
client.delete_channel(channel_id)

client.leave_server(server_id)

invite = client.create_invite(server_id, ["messages.read", "messages.write"])
# invite["invite_url"] -> send to the server owner
```

## 错误

客户端使用`.status`和`.body`创建`DisbandError`的子类：

|错误            | 当                                          |
| ---------------- | --------------------------------------------- |
| `AuthError` | `401` — 无效或已撤销的令牌。网关循环在此处停止。 |
| `PermissionError`| `403` — 缺少作用域或角色权限。 |
| `RateLimitError` | `429` — 包括`retry_after`秒。 |
| `HttpError` | 任何其他非2xx状态。                     |

从内部来看，客户端是[API 参考](../api-reference.md)上的薄外壳：`REST.get/post/patch/delete`与`Authorization: Bot <token>`。
