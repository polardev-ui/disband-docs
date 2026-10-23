# 埋め込み

エンベッドは、メッセージに添付された構造化されたカードです。色付きのストライプ、タイトル、リッチテキスト、フィールド、画像、およびフッターです。DisbandはDiscordのエンベッド形状と制限を使用するため、Discordウェブフックまたはボット用に作成されたエンベッドは通常、変更せずに動作します。

埋め込みは以下によって送信できます。

- [Webhook](webhooks.md)、実行ボディに`embeds`が含まれている。
- [APIリファレンス](../bots/api-reference.md)、メッセージ送信ボディに`embeds`が含まれています。

クライアント側のメッセージは直接埋め込みを設定することはできません。これにより、メンバーがウェブフックや埋め込みカードを偽造することは防ぎます。

## 完全な例

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

`5793266`は`0x5865F2`、Disbandのブランドブルーです。

## 埋め込みオブジェクト

| フィールド | タイプ | メモ                                                       |
| ------------- | ------ | ----------------------------------------------------------- |
| `title`       | 文字列 | 最大256文字。`url`が設定されるとリンクとしてレンダリングされます。 |
| `description` | 文字列 | 最大4,096文字。Markdownをサポートします。                  |
| `url`         | 文字列 | タイトルをクリック可能にします。絶対的な`http`または`https` URL。 |
| `color`       | 番号 | 整数としての`0xRRGGBB`。`"#5865F2"`文字列でも動作します。 |
| `timestamp` | 文字列 | ISO 8601 日付と時間。フッターに表示されます。 |
| `footer`      | オブジェクト | `{ "text": "…", "icon_url": "…" }`。最大2,048文字までテキストを入力できます。       |
| `author` | オブジェクト | `{ "name": "…", "url": "…", "icon_url": "…" }`。最大256文字まで名前に入力できます。 |
| `fields` | 配列 | 最大25個のフィールドオブジェクト。以下を参照してください。                          |
| `image`       | オブジェクト | `{ "url": "…" }`。説明の下に表示されます。          |
| `thumbnail` | オブジェクト | `{ "url": "…" }`。右側に表示されます。                   |
| `video`       | オブジェクト | 互換性のために受け入れられました。まだレンダリングされていません。              |
| `provider` | オブジェクト | 互換性のために受け入れられました。まだレンダリングされていません。 |

すべてのURLフィールドは、絶対的な`http`または`https` URLsである必要があります。ユーザー名またはパスワードを含むURLsは無視されます。安全でない画像URLsは、クライアントとサーバーの両方でドロップされます。

### フィールド

```json
{
  "name": "Uptime",
  "value": "99.98% over 90 days",
  "inline": true
}
```

| 物件 | タイプ | メモ                                            |
| -------- | ------- | ------------------------------------------------ |
| `name` | 文字列 | 必須。最大256文字。 |
| `value` | 文字列 | 必須。最大1,024文字。Markdownは機能します。 |
| `inline` | ボolean | `true` は、スペースがある限り、フィールドを並べて配置します。 |

`name`または`value`が欠落または空になっているフィールドは、ハードエラーです。空のデータがある場合は、フィールドを省略するか、ダッシュに置き換えてください。

## Markdown

説明とフィールド値は、DisbandのMarkdownをサポートします。太字、斜体、下線、インラインコード、コードブロック、リンク、およびカスタム絵文字。タイトル、著者名、およびフッターテキストは、プレーンテキストです。

埋め込みテキスト内の言及は表示されますが、pingは作成されません。実際の言及通知が必要な場合は、`content`を使用してください。

## 制限

| 制限                              | 値 |
| ---------------------------------- | ----- |
| メッセージあたりの埋め込み数                 | 10 |
| タイトル                              | 256   |
| 説明                        | 4,096 |
| 埋め込みごとにフィールド数                   | 25    |
| フィールド名                         | 256   |
| フィールド値                        | 1,024 |
| フッターテキスト                        | 2,048 |
| 著者名                        | 256   |
| すべてのエンベッドの合計文字数 | 6,000 |

合計には、タイトル、説明、フッターテキスト、著者名、フィールド名、およびフィールド値が含まれます。URLsと画像メタデータはカウントされません。

## 入力がどのように正規化されるか

APIは、データベースに到達する前に、すべての埋め込みを検証します。

- 不明なプロパティはドロップされます。
- テキストはトリミングされます。長すぎるテキストは拒否されるのではなく、制限までトリミングされます。
- 無効な色は削除されます。
- 無効なURLsはドロップされます。有効なURLフィールドは保持されます。
- 無効なタイムスタンプは削除されます。
- 空の埋め込みは`Embed is empty`で拒否されます。
- 名前または値のないフィールドは拒否されます。
- 10以上の埋め込み、または合計6,000以上の文字は拒否されます。

エラー名の四角括弧は、正確なアイテムを識別します。たとえば：

```text
embeds.0.fields.2: name and value are required
```

## 埋め込みを送信する

### ウェブフックから

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

### ボットから

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

埋め込みのみを送信する場合、`content`は省略される場合があります。コンテンツも埋め込みも含まれていないメッセージは拒否されます。

## 関連した

- [Webhook](webhooks.md) — webhookメッセージの実行と管理。
- [APIリファレンス](../bots/api-reference.md) — ボットメッセージのエンドポイント。
