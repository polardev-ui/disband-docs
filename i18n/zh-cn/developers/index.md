# 开发者

在Disband的基础上构建：从外部与你的空间交谈的机器人、集成和工具。这里的一切都是自托管的——Disband从不运行你的代码。

## 你可以建造什么

- **机器人**——自托管帐户，用于读取和写入消息，管理频道，
  并通过长期投票网关对事件做出反应。请参阅[机器人](../bots/index.md)。
- **Webhooks** — 通过一个秘密的URL发布的一向通知，没有机器人
  代码或令牌。请参阅[Webhook](webhooks.md)。
- **嵌入式卡片**——结构化发布说明、警报和状态更新。
  请参阅[嵌入](embeds.md)。
- **自定义客户端**——如果你需要一种语言，请直接与HTTP API交谈
  发货客户端不涵盖。[API 参考](../bots/api-reference.md)是
  合同。
- **状态集成**——通过RSS关注Disband事件，或阅读如何
  [状态系统](status.md)记录检查并打开事件。

## 从这里开始

1. **[开始使用](../bots/getting-started.md)** — 创建一个机器人，获取它的
   令牌，邀请它进入一个空间。大约两分钟。
2. **[托管你自己的机器人](../bots/hosting-your-own-bot.md)** — 在哪里运行客户端，以及如何让它保持运行。
3. **[JavaScript](../bots/clients/javascript.md)**或
   **[Python](../bots/clients/python.md)**。
4. **[API 参考](../bots/api-reference.md)**用于确切的端点。
5. **[Webhook](webhooks.md)**或**[嵌入](embeds.md)**，如果你只需要
   单向通知。
6. **[状态系统](status.md)**用于公共状态页面和RSS提要。

## 将Disband实施到游戏或应用中

Disband暴露了一个用机器人令牌认证的普通HTTP API。没有原生SDK或RPC运行时可以链接——任何可以发送HTTPS请求的堆栈都有效。一个典型的集成看起来像这样：

1. 在**设置→机器人**中创建一个机器人，并授予它`messages.write`（以及
   `channels.manage`，如果它应该创建频道）。
2. 邀请机器人进入你想要发布的空间。
3. 将代币存储在你的游戏或应用的秘密存储中——永远不要存储在客户端中
   发送到玩家的代码。
4. 从你的后端，调用作用域内的端点：

   ```bash
   curl -X POST https://www.disband.dev/api/v1/channels/CHANNEL_ID/messages \
     -H "Authorization: Bot $DISBAND_BOT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"content": "Server restarted — 12 players online."}'
   ```

5. 在游戏内响应聊天，长时间查询网关并发送
   `messageCreate`事件传递到你的游戏逻辑中。

### 安全注意事项

- 机器人代币在静止状态下进行哈希，只显示一次。如果有一个，请立即撤销
  泄漏。
- 将代币保存在你控制的服务器上。在游戏客户端中发送代币可以让
  任何人冒充你的机器人。
- 将机器人作用域限制到他们需要的最低特权。仅发布的机器人不需要
  `members.read`或`channels.manage`。

## 开发者主题

如果你正在构建品牌客户端或皮肤，[主题](../themes/index.md)中的CSS变量是稳定的样式API。

## 问题

- 错误报告：打开一个问题或给团队发电子邮件。
- 对于特定帐户的问题，请使用应用内支持。
