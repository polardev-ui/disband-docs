# 机器人模板

通用机器人即时可适应的起点。每个都是一个小型、独立的脚本，你可以粘贴到文件中，然后使用JavaScript或Python客户端运行。

## 欢迎者

每当有人加入一个空间时，都会发布欢迎信息。需要`messages.write`和`members.read`。

```javascript
import { Client } from "@disband/bot";

const client = new Client({ token: process.env.DISBAND_BOT_TOKEN });
const WELCOME_CHANNEL = process.env.WELCOME_CHANNEL_ID;

client.on("memberJoin", async (member) => {
  await client.channels.send(WELCOME_CHANNEL, `Welcome to the space, ${member.display_name ?? member.username}!`);
});

await client.connect();
```

> 今天，网关发送了`messageCreate`、`messageUpdate`和`messageDelete`；
> 会员事件通过与你的机器人作用域允许的相同事件流到达。

## 票务经理

根据每个支持请求创建一个私人频道，并向员工角色发送ping。需要`channels.manage`（以及`manage_channels`角色）和`messages.write`。

```javascript
import { Client } from "@disband/bot";

const client = new Client({ token: process.env.DISBAND_BOT_TOKEN });
const SUPPORT_CATEGORY = process.env.SUPPORT_CATEGORY_ID;
const STAFF_ROLE = process.env.STAFF_ROLE_ID;

client.on("messageCreate", async (message) => {
  if (message.author?.is_bot) return;
  if (!message.content.startsWith("!ticket")) return;

  const subject = message.content.slice("!ticket".length).trim() || "support";
  const channel = await client.channels.create({
    name: `ticket-${subject}`.slice(0, 32),
    parent_id: SUPPORT_CATEGORY,
  });
  await client.channels.send(channel.id, `<@&${STAFF_ROLE}> new ticket: ${subject}`);
  await message.reply(`Created ${channel.name}.`);
});

await client.connect();
```

## 自动响应器

回答一小组常见问题。需要`messages.read`和`messages.write`。

```python
from disband_bot import Client

client = Client(token=DISBAND_BOT_TOKEN)
FAQS = {
    "hours": "We're open Monday to Friday, 9 to 5.",
    "invite": "Ask an admin for an invite link.",
}

@client.on("messageCreate")
def handle(message):
    if message.author_is_bot:
        return
    key = message.content.strip().lower().lstrip("!")
    if key in FAQS:
        message.reply(FAQS[key])

client.run()
```

## 审核助手

删除包含禁用单词的消息并记录它们。需要`messages.read`、`messages.write`和`manage_messages`角色。

```javascript
const BANNED = ["spamword"];

client.on("messageCreate", async (message) => {
  if (message.author?.is_bot) return;
  if (BANNED.some((w) => message.content.toLowerCase().includes(w))) {
    await client.messages.delete(message.channel_id, message.id);
    await client.channels.send(message.channel_id, "A message was removed by the bot.");
  }
});
```

## 提示

- 从最小的作用域设置开始，添加更多的机器人，而不是一个机器人
  一切。
- 将令牌存储在环境变量中，永远不要存储在源代码中。
- 通过停止而不是永远重试来处理`AuthError`（401）。
- 有关这些辅助工具使用的每个端点的参考，请参阅[API 参考](api-reference.md)。
