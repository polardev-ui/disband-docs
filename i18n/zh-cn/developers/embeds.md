# 嵌入

嵌入是指附加在消息上的结构化卡片：彩色条纹、标题、富文本、字段、图像和页脚。Disband使用Discord的嵌入形状和限制，因此为Discord网络钩子或机器人构建的嵌入通常保持不变。

嵌入式内容可以通过以下方式发送：

- [Webhook](webhooks.md)，执行体中包含`embeds`；
- [API 参考](../bots/api-reference.md)，在发送消息正文中包含`embeds`。

客户端消息无法直接设置嵌入。这防止了成员伪造webhook或嵌入卡。

## 一个完整的例子

```json
{
  "content": "A new release is ready.",
  "embeds": [
    {
      "title": "Disband 2.4.1",
      "description": "Fixes the **role picker** and improves uploads.",
      "url": "https://disband.dev/changelog",
      "color": 5793266,
      "timestamp": "2026-10-19T20:15:00.000Z",
      "author": {
        "name": "Release bot",
        "url": "https://disband.dev",
        "icon_url": "https://disband.dev/logo.png"
      },
      "thumbnail": {
        "url": "https://disband.dev/logo.png"
      },
      "fields": [
        { "name": "Channel", "value": "stable", "inline": true },
        { "name": "Build", "value": "1842", "inline": true },
        { "name": "Rollout", "value": "100% of spaces", "inline": false }
      ],
      "footer": {
        "text": "Disband releases",
        "icon_url": "https://disband.dev/logo.png"
      }
    }
  ]
}
```

`5793266`是`0x5865F2`，Disband的品牌蓝色。

## 嵌入对象

| 字段 | 类型 | 备注                                                       |
| ------------- | ------ | ----------------------------------------------------------- |
| `title`       | 字串 | 最多256个字符。当`url`设置为链接时，会以链接的形式呈现。 |
| `description` | 字串 | 最多4,096个字符。支持Markdown。                  |
| `url`         | 字串 | 使标题可点击。绝对`http`或`https` URL。 |
| `color`       | 数字 | `0xRRGGBB` 作为整数。`"#5865F2"` 字符串也有效。 |
| `timestamp` | 字串 | ISO 8601 日期和时间。显示在页脚中。                |
| `footer` | 对象 | `{ "text": "…", "icon_url": "…" }`。文本最多2048字。 |
| `author` | 对象 | `{ "name": "…", "url": "…", "icon_url": "…" }`。名称最多256个。 |
| `fields` | 数组 | 最多25个字段对象。见下文。                          |
| `image`       | 对象 | `{ "url": "…" }`。显示在描述下方。          |
| `thumbnail` | 对象 | `{ "url": "…" }`。显示在右侧。                   |
| `video`       | 对象 | 已接受兼容性；尚未渲染。              |
| `provider` | 对象 | 已接受兼容性；尚未渲染。 |

所有URL字段必须是绝对`http`或`https` URLs。包含用户名或密码的URLs被丢弃。不安全的URLs由客户端和服务器丢弃。

### 字段

```json
{
  "name": "Uptime",
  "value": "99.98% over 90 days",
  "inline": true
}
```

| 财产 | 类型 | 备注                                            |
| -------- | ------- | ------------------------------------------------ |
| `name` | 字串 | 必填。最多256个字符。 |
| `value` | 字串 | 必填。最多1,024个字符。Markdown有效。 |
| `inline` | 布林值 | `true` 在空间允许的情况下将字段并排放置。 |

如果字段中缺少或为空的`name`或`value`，则为硬性错误。如果你可能有空数据，请省略该字段或用破折号代替。

## Markdown

描述和字段值支持Disband的Markdown：粗体、斜体、删除线、行内代码、代码块、链接和自定义表情符号。标题、作者姓名和页脚文本是纯文本。

嵌入式文本中的提及会显示出来，但不会创建ping。如果你需要真正的提及通知，请使用`content`。

## 限制

| 限制                              | 值 |
| ---------------------------------- | ----- |
|每条消息的嵌入 | 10 |
| 标题                              | 256   |
| 描述                        | 4,096 |
| 每个嵌入的字段数 | 25 |
| 字段名称                         | 256   |
| 字段值                        | 1,024 |
| 页脚文本                        | 2,048 |
| 作者姓名                        | 256   |
| 所有嵌入的总字符数 | 6,000 |

总计包括标题、描述、页脚文本、作者姓名、字段名称和字段值。URLs和图像元数据不计入。

## 输入如何归一化

API在每个嵌入物到达数据库之前都进行验证：

- 丢弃了未知属性。
- 文字被修剪。过长的文字会被截断到限制值，而不是被拒绝。
- 无效的颜色会被丢弃。
- 无效的URLs被丢弃。有效的URL字段被保留。
- 丢弃无效的时间戳。
- 使用`Embed is empty`拒绝空置的嵌入。
- 没有名称或值的字段会被拒绝。
- 超过10个嵌入或总共超过6000个字符会被拒绝。

错误名称中的方括号标识了确切的项目，例如：

```text
embeds.0.fields.2: name and value are required
```

## 发送嵌入式内容

### 来自网络钩子

```bash
curl -X POST 'https://disband.dev/webhook/12345678/01234567890123456789012345' \
  -H 'Content-Type: application/json' \
  -d '{
    "content": "A new release is ready.",
    "embeds": [{
      "title": "Disband 2.4.1",
      "description": "Fixes the **role picker** and improves uploads.",
      "color": 5793266
    }]
  }'
```

### 来自一个机器人

```bash
curl -X POST 'https://www.disband.dev/api/v1/channels/CHANNEL_ID/messages' \
  -H "Authorization: Bot $DISBAND_BOT_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "embeds": [{
      "title": "Nightly build",
      "description": "All 412 tests passed.",
      "color": 5793266
    }]
  }'
```

当仅发送嵌入时，可以省略`content`。没有内容或嵌入的消息将被拒绝。

## 有亲属关系的

- [Webhook](webhooks.md) — 执行和管理webhook消息。
- [API 参考](../bots/api-reference.md) — 机器人消息端点。
