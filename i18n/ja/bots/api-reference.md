# ボット API リファレンス

ボットが話すHTTP API。両方のクライアントライブラリは、まさにこれらのエンドポイントに対する薄いラップラーであり、このページは他の言語でクライアントを書くためのレシピでもあります。

## ベースURLと認証

```
https://www.disband.dev
```

すべてのリクエストは送信されます。

| ヘッダー          | 値                    |
| --------------- | ------------------------ |
| `Authorization` | `Bot <token>`            |
| `Content-Type` | `application/json` |

トークンが欠落しているか無効な場合は`401 { "error": "Invalid bot token" }`が返されます。取り消されたボットも同じ結果を返しますので、`401`は「トークンを確認する」を意味し、「再試行」を意味するものではありません。

すべてのエンドポイントは範囲が設定されています。ボットは、範囲（およびサーバーごとの許可）が許可する内容のみを読み込むか書き込むことができます。4xx/5xxの応答はすべて、JSONで、`error`フィールドが付属しています。

## 書く前に読む

- `messages.write` / `channels.manage`を許可しない限り、ボットは**読み取り範囲**です。
- `channels.manage`アクションには、ボットアカウントが保持しているものが必要です。
  `manage_channels` **そのサーバーでの役割**。
- 両方のクライアントは、メッセージイベントごとのスコープに関する情報を把握しています。APIには何もありません。
  ボットが許可されなかったデータが返されます。

## ゲートウェイ（イベントロングポーリング）

```
GET /api/v1/gateway?timeout=20
```

ゲートウェイはwebsocketではなくlong-pollです。イベントが利用可能になるかタイムアウトが経過するまで、リクエストはサーバー側をブロックし、その後、到着したものを返します。クライアントはそれについてループします。タイムアウトは1〜20秒に制限されます。

応答：

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

`type`は`messageCreate`、`messageUpdate`、または`messageDelete`です。配信は**少なくとも1回**行われます。フェッチと処理の間にクラッシュするボットは、同じイベントを再び見る場合があります。それらを同等性的に処理します（`payload.id`によって）。

### イベントペイロード

| タイプ | ペイロードフィールド                                        |
| ---------------- | ----------------------------------------------------- |
| `messageCreate` | 完全なメッセージオブジェクト（以下）。                      |
| `messageUpdate` | `id`、`channel_id`、`server_id`、`content`、`edited_at` |
| `messageDelete` | `id`、`channel_id`、`server_id`                       |

メッセージオブジェクト：

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

`messages.read`を持つボット（ボットアカウントとそのサーバーで付与されているものの両方）だけがイベントを受信します。

## エンドポイント

### メッセージ

**POST `/api/v1/channels/:id/messages`** — メッセージ（`messages.write`）を送信します。

```json
{
  "content": "Deploy finished",
  "reply_to_id": null,
  "embeds": [
    { "title": "Build 1842", "description": "All 412 tests passed.", "color": 5793266 }
  ]
}
```

`content`は、`embeds`が存在する場合に省略される場合があります。エンベッドはDiscordの形状と制限を使用します。各フィールドと正確な制限については、[埋め込み](../developers/embeds.md)を参照してください。コンテンツもエンベッドも含まれていないメッセージは、`400`で拒否されます。

`201`と`{ "message": { … } }`を一緒に返します。

**`/api/v1/channels/:id/messages`を取得する** - メッセージを読み取ります（`messages.read`）。

クエリ：`limit`（1〜100、デフォルト50）、`before`（メッセージID、逆方向にページング用）。

`200`と`{ "messages": [ … ] }`を一緒に返します。

### チャンネル

**`/api/v1/servers/:id/channels`を取得する** - チャンネルリスト（`messages.read`）。

`{ "channels": [ … ] }`を返します。

**POST `/api/v1/servers/:id/channels`** — チャネルを作成します（`channels.manage` + `manage_channels` ロール）。

```json
{ "name": "deploys", "type": "text", "category_id": null }
```

`201`と`{ "channel_id": "…" }`を一緒に返します。

**PATCH `/api/v1/channels/:id`** — チャンネル名を変更します（`channels.manage`）。

```json
{ "name": "deploys-2" }
```

`{ "success": true }`を返します。

**`/api/v1/channels/:id`を削除する** — チャンネル（`channels.manage`）を削除します。

`{ "success": true }`を返します。

### メンバー

**`/api/v1/servers/:id/members`を取得する** - メンバーリスト（`members.read`）。

`{ "members": [ … ] }`を返します。

### 去る

**POST `/api/v1/servers/:id/leave`** — ボットをサーバーから削除します。

`{ "success": true }`を返します。

### 招待状

**POST `/api/v1/bots/:botId/invites`** — ボットがサーバーに参加するための招待状を生成します。

```json
{ "server_id": "…", "scopes": ["messages.read", "messages.write"] }
```

サーバー所有者に送信する招待状（`invite_url`を含む）を返します。承認できるのは所有者だけです。招待状は7日後に期限切れになります。

### アイデンティティ（起動時に使用）

**GET `/api/bot/me`** — クライアントが`ready`を発射するために使用するボットアカウントを返します。バージョン付き`v1`サーフェスの一部ではありません。

## エラー

| ステータス | 意味                                                        | `error` フィールドの例                              |
| ------ | -------------------------------------------------------------- | --------------------------------------------------- |
| `401` | トークンが見つかりません/無効/取り消されています。                                 | `"Invalid bot token"`                               |
| `403` | 範囲または役割の権限がありません。                              | `"This bot does not have messages.write in that server"` |
| `404` | チャンネル/サーバーが見つかりませんでしたか、またはボットには表示されていませんか。 | `"Channel not found"`                               |
| `429` | レート制限あり。                                                  | `Retry-After`ヘッダーが含まれています。                    |
| `503` | バックアップストアが利用できません（ゲートウェイポーリング）。 | `"Event delivery unavailable."` |
| `5xx` | サーバーエラー。バックオフして再試行してください。                              | `"Internal server error"`                           |

## 制限

- アカウントあたり最大**5つのボット**。ボットのトークンは取り消されるとすぐに失効します。
- **4,000文字**までのメッセージ；`@everyone`には`mention_everyone`が必要です
  役割の許可。
- メッセージあたり**最大10個のエンベッド**、ウェブフックと同じフィールド制限。 見てみる
  [埋め込み](../developers/embeds.md)。
- レート制限はボットトークンごとに適用されます。`429`にヒットした場合、`Retry-After`を尊重してください。

## 独自のクライアントを書く

1. 1. `GET /api/bot/me`と`Authorization: Bot <token>`を使用して、アイデンティティを解決します。
2. `GET /api/v1/gateway?timeout=20`でループし、`type`でイベントを処理します。
3. 上記のエンドポイントに同じ認証ヘッダーを使用し、`401` →「バッドトークン」にマッピングします。
   `403` → 「許可がありません」、`429` → 「`Retry-After`の後、速度を落として再試行してください」。

## Webhooksは別の表面です

ボットAPIは`Authorization: Bot <token>`と認証し、ゲートウェイを介してイベントを読み取ることができます。 [Webhook](../developers/webhooks.md) は一方通行の秘密のURLです。ボットアカウント、認証ヘッダー、メッセージの読み取り機能はありません。通知にはウェブフックを使用し、チャットに反応する必要がある場合はボットを使用します。

公式クライアントは`@disband/bot`（JavaScript）と`disband-bot`（Python）です。[JavaScript](clients/javascript.md)と[Python](clients/python.md)ページを参照してください。
