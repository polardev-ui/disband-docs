# 开始使用：你的第一个机器人

本页面介绍如何创建机器人、获取其令牌并邀请它访问服务器。大约需要两分钟。

## 1.创建机器人

在Disband中打开**设置→机器人**，然后点击**新建机器人**。

- 给它一个名字。名字出现在成员列表和消息中。
- 选择它需要的**作用域**。从小开始——你总是可以创建另一个机器人
  具有更多的作用域。完整的列表在[机器人](index.md)上。
- 点击**创建**。

Disband返回一个**令牌**，显示一次。现在把它复制到安全的地方：它将不会再显示，以后也无法检索。如果你丢失了它，请撤销机器人并创建一个新的机器人。

令牌是你的代码用来身份验证的东西：

```
Authorization: Bot <token>
```

## 2.邀请机器人进入服务器

在**设置→机器人**中，打开你刚刚创建的机器人：

1. 点击**生成邀请**。
2. 选择目标服务器和要授予的作用域设置。
3. 将生成的链接发送给该服务器的**所有者**。

只有所有者才能批准机器人邀请。邀请将在7天后到期。

## 3. 业主批准

所有者打开链接并单击**批准**。机器人成为服务器成员，仅限于批准的作用域。（批准的作用域是机器人帐户作用域和所有者授予作用域的交集——你不能批准超过机器人创建时的作用域。）

## 4. 与客户端联系

将令牌保存到环境变量中，然后运行其中一个客户端：

```javascript
// JavaScript — install with: npm install /path/to/packages/bot
import { Client } from "@disband/bot";

const client = new Client({ token: process.env.DISBAND_BOT_TOKEN });

client.on("messageCreate", async (message) => {
  if (message.author?.is_bot) return;
  if (message.content !== "!ping") return;
  await message.reply("pong");
});

await client.connect();
```

```python
# Python — install with: pip install ./packages/disband-bot-python
from disband_bot import Client

client = Client(token=DISBAND_BOT_TOKEN)

@client.on("messageCreate")
def handle(message):
    if message.author_is_bot:
        return
    if message.content == "!ping":
        message.reply("pong")

client.run()
```

客户端连接到网关，发送`ready`，然后流式传输消息事件。有关API的完整内容，请参阅[JavaScript](clients/javascript.md)和[Python](clients/python.md)。

## 接下来是什么

- 如果机器人需要永久运行，请参阅
  **[托管你自己的机器人](hosting-your-own-bot.md)**。
- 如果你想直接与API交谈（curl、另一种语言、webhook），
  请参阅**[API 参考](api-reference.md)**。
