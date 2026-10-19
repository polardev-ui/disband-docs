# Embeds

An embed is a structured card attached to a message: a coloured stripe, a title,
rich text, fields, images, and a footer. Disband uses Discord's embed shape and
limits, so an embed built for a Discord webhook or bot normally works unchanged.

Embeds can be sent by:

- [webhooks](webhooks.md), with `embeds` in the execute body;
- [bots](../bots/api-reference.md), with `embeds` in the send-message body.

Client-side messages cannot set embeds directly. That prevents a member from
forging a webhook or an embed card.

## A complete example

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

`5793266` is `0x5865F2`, Disband's brand blue.

## The embed object

| Field         | Type   | Notes                                                       |
| ------------- | ------ | ----------------------------------------------------------- |
| `title`       | string | Up to 256 characters. Rendered as a link when `url` is set. |
| `description` | string | Up to 4,096 characters. Supports Markdown.                  |
| `url`         | string | Makes the title clickable. Absolute `http` or `https` URL.  |
| `color`       | number | `0xRRGGBB` as an integer. A `"#5865F2"` string also works.  |
| `timestamp`   | string | ISO 8601 date and time. Shown in the footer.                |
| `footer`      | object | `{ "text": "…", "icon_url": "…" }`. Text up to 2,048.       |
| `author`      | object | `{ "name": "…", "url": "…", "icon_url": "…" }`. Name up to 256. |
| `fields`      | array  | Up to 25 field objects. See below.                          |
| `image`       | object | `{ "url": "…" }`. Displayed below the description.          |
| `thumbnail`   | object | `{ "url": "…" }`. Displayed to the right.                   |
| `video`       | object | Accepted for compatibility; not rendered yet.              |
| `provider`    | object | Accepted for compatibility; not rendered yet.              |

All URL fields must be absolute `http` or `https` URLs. URLs containing a
username or password are discarded. Unsafe image URLs are dropped by the client
as well as the server.

### Fields

```json
{
  "name": "Uptime",
  "value": "99.98% over 90 days",
  "inline": true
}
```

| Property | Type    | Notes                                            |
| -------- | ------- | ------------------------------------------------ |
| `name`   | string  | Required. Up to 256 characters.                  |
| `value`  | string  | Required. Up to 1,024 characters. Markdown works. |
| `inline` | boolean | `true` puts fields side by side where space permits. |

A field with a missing or empty `name` or `value` is a hard error. If you may
have empty data, omit the field or substitute a dash.

## Markdown

Descriptions and field values support Disband's Markdown: bold, italics,
strikethrough, inline code, code blocks, links, and custom emoji. Titles, author
names, and footer text are plain text.

Mentions inside embed text are displayed but do not create a ping. Use
`content` if you need a real mention notification.

## Limits

| Limit                              | Value |
| ---------------------------------- | ----- |
| Embeds per message                 | 10    |
| Title                              | 256   |
| Description                        | 4,096 |
| Fields per embed                   | 25    |
| Field name                         | 256   |
| Field value                        | 1,024 |
| Footer text                        | 2,048 |
| Author name                        | 256   |
| Total characters across all embeds | 6,000 |

The total includes titles, descriptions, footer text, author names, field names,
and field values. URLs and image metadata do not count.

## How input is normalised

The API validates every embed before it reaches the database:

- Unknown properties are dropped.
- Text is trimmed. Over-long text is truncated to the limit rather than rejected.
- Invalid colours are dropped.
- Invalid URLs are dropped. Valid URL fields are kept.
- Invalid timestamps are dropped.
- An empty embed is rejected with `Embed is empty`.
- A field without a name or value is rejected.
- More than 10 embeds, or more than 6,000 total characters, is rejected.

Square brackets in an error name identify the exact item, for example:

```text
embeds.0.fields.2: name and value are required
```

## Sending embeds

### From a webhook

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

### From a bot

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

When sending only embeds, `content` may be omitted. A message with neither
content nor embeds is rejected.

## Related

- [Webhooks](webhooks.md) — execute and manage webhook messages.
- [Bot API reference](../bots/api-reference.md) — the bot message endpoints.
