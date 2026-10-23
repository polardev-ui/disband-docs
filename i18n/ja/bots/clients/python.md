# Python クライアント — `disband-bot`

公式のPython クライアント。標準ライブラリ（`threading` + `urllib`）のみを使用するため、クライアント自体以外のインストールは必要ありません。Python 3.9+で動作します。

## 設置する

```bash
pip install disband-bot
```

または、このモノリポジトリから：

```bash
pip install ./packages/disband-bot-python
```

## クイックスタート

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

ハンドラーは単純なものか`async def`のものかどちらでも構いません。どちらもサポートされています。

## 建設者

### `Client(token, base_url="https://www.disband.dev", gateway_timeout=20)`

| 引数 | デフォルト                      | 説明                                  |
| ---------------- | ---------------------------- | -------------------------------------------- |
| `token`          | *(必須)*                 | **設定→ボット**からのボットトークン。      |
| `base_url` | `"https://www.disband.dev"` | API root (カスタムドメインに変更してください)。 |
| `gateway_timeout`| `20`                         | ゲートウェイポールの毎秒数（1〜20）。             |

## ライフサイクル

| 方法 | 説明                                                        |
| -------- | ------------------------------------------------------------------ |
| `run()` | 接続し、`ready`を発信し、バックグラウンドスレッドでゲートウェイループを開始し、永遠にブロックします。 |
| `close()`| ループを停止します。                                                    |

## イベント

`client.on("name", handler)`で登録します。装飾者または単純な呼び出しとして、単一ショットハンドラー用の`once`も登録します。

| イベント | 引数 | メモ                                                                 |
| --------------- | -------- | -------------------------------------------------------------------|
| `ready` | `user` | `user["id"]`、`user["name"]`、`user["scopes"]`など |
| `messageCreate` | `message`| ボットが見ることができるサーバー内の新しいメッセージ。                          |
| `messageUpdate` | `message`| メッセージが編集されました（`content`、`edited_at`が更新されました）。 |
| `messageDelete` | `message`| メッセージが削除されました（`content`は空で、`id`/`channel_id`は有効です）。 |
| `error`         | `error`  | ゲートウェイエラー。トークンが無効でない限り、ループは自動的に再試行され、その場合、停止します。 |

### `Message`

| フィールド | タイプ | 説明                                        |
| ------------- | ---------------- | -------------------------------------------------- |
| `id`          | `str`            | メッセージID。                                        |
| `channel_id` | `str` | チャンネルID。                                        |
| `server_id` | `str \| None` | サーバーID。                                         |
| `author`      | `dict \| None`   | `{ "id", "username", "display_name", "avatar_url", "is_bot" }`. |
| `content` | `str` | メッセージテキスト。                                      |
| `reply_to_id` | `str \| None` | このメッセージに返信するメッセージ（該当する場合）。 |
| `mentions` | `list` | 言及されたユーザー。                                   |
| `attachment` | `dict \| None` | メッセージにファイルがある場合の`{ "url", "type" }` |
| `created_at` | `str \| None` | ISOタイムスタンプ。                                     |
| `edited_at` | `str \| None` | 最後の編集時のISOタイムスタンプ。                    |
| `display_id` | `int \| None` | 順次表示番号。                     |
| `author_is_bot` | `bool` | 送信者がボットであった場合（プロパティ）は真です。 |

**方法** — `message.reply(content)`は同じチャンネルで返信します。

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

## エラー

クライアントは、`.status`と`.body`を使用して`DisbandError`の下位クラスを作成します。

| エラー | いつ                                          |
| ---------------- | --------------------------------------------- |
| `AuthError` | `401` — 無効または取り消されたトークンです。ゲートウェイループはこの時点で停止します。 |
| `PermissionError`| `403` — 範囲または役割の権限がありません。 |
| `RateLimitError` | `429` — `retry_after`秒を含みます。 |
| `HttpError` | 他の2xx以外のステータス。                     |

内部的には、クライアントは[APIリファレンス](../api-reference.md)の上に薄いラップラーです。`REST.get/post/patch/delete`と`Authorization: Bot <token>`があります。
