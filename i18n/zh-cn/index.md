# Disband 文档

你在Disband上构建所需的一切。

## 机器人

Disband机器人是**自托管集成**：你运行代码，Disband负责在代码与服务器之间传递消息。Disband从不托管或执行你的机器人。

- **[开始使用](bots/getting-started.md)** — 创建一个机器人，获取其令牌，
  并将其邀请到服务器上。大约需要两分钟。
- **[机器人](bots/index.md)**——作用域、邀请、限制和安全。
- **[托管你自己的机器人](bots/hosting-your-own-bot.md)**——在哪里运行客户端，以及如何让它保持运行。
- **[JavaScript](bots/clients/javascript.md)** — `@disband/bot`。
  零依赖；适用于Node.js 18+、Deno、Bun和浏览器。
- **[Python](bots/clients/python.md)** — `disband-bot`。
  仅限标准库；适用于Python 3.9+。
- **[API 参考](bots/api-reference.md)** — 两个客户端通信所用的 HTTP API。

## 开发人员

使用 HTTP API 构建机器人，并将 Disband 集成到你的游戏和应用中。

- **[开发者](developers/index.md)**——概述，从这里开始，以及安全
  游戏/应用集成说明。
- **[机器人](bots/index.md)**——作用域、邀请、限制和安全。
- **[API 参考](bots/api-reference.md)** — 两个客户端通信所用的 HTTP API。
- **[模板](bots/templates.md)**——可随时调整的欢迎机器人、工单管理器等。
- **[Webhook](developers/webhooks.md)** — 从 CI、监控系统或游戏服务器通过一个秘密 URL 发布。无需机器人。
- **[嵌入](developers/embeds.md)** — 用于发布、警报和状态更新的 Discord 风格卡片。
- **[状态系统](developers/status.md)**——公共状态页面如何检查服务、记录运行时间并处理事件。

## 主题

SUPER会员可以使用自定义CSS、随附的皮肤和上传的图标来重新设计整个应用。

- **[主题](themes/index.md)**——作为稳定 API 的 CSS 变量、可安全指定的选择器，以及一个起始模板。

## 下载客户端

- **[@disband/bot](https://raw.githubusercontent.com/polardev-ui/disband-docs/main/zips/disband-bot-0.1.0.tgz)** — JavaScript客户端
  （`npm install ./disband-bot-0.1.0.tgz`）。
- **[disband-bot](https://raw.githubusercontent.com/polardev-ui/disband-docs/main/zips/disband-bot-python-0.1.0.tar.gz)** — Python客户端
  （`pip install ./disband-bot-python-0.1.0.tar.gz`）。
