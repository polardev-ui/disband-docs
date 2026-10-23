# ボットテンプレート

一般的なボット用の適応可能な出発点です。それぞれは、ファイルに貼り付けてJavaScriptまたはPython クライアントで実行できる小さな、独立したスクリプトです。

## 歓迎者

誰かがスペースに参加するたびにウェルカムメッセージを投稿します。`messages.write`と`members.read`が必要です。

```javascript
import { Client } from "@disband/bot";

const client = new Client({ token: process.env.DISBAND_BOT_TOKEN });
const WELCOME_CHANNEL = process.env.WELCOME_CHANNEL_ID;

client.on("memberJoin", async (member) => {
  await client.channels.send(WELCOME_CHANNEL, `Welcome to the space, ${member.display_name ?? member.username}!`);
});

await client.connect();
```

> ゲートウェイは本日`messageCreate`、`messageUpdate`、`messageDelete`を発信しています。
> メンバーイベントは、ボットの範囲が許可する範囲内で、同じイベントストリームを通じて到着します。

## チケットマネージャー

サポートリクエストごとにプライベートチャンネルを作成し、スタッフロールにpingします。`channels.manage`（および`manage_channels`ロール）と`messages.write`が必要です。

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

## 自動応答者

いくつかのよくある質問に答えます。`messages.read`と`messages.write`が必要です。

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

## モデレーションヘルパー

禁止された単語を含むメッセージを削除し、ログに記録します。`messages.read`、`messages.write`、`manage_messages`の役割が必要です。

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

## チップス

- 最も小さな範囲セットから始めて、1つのボットではなく、より多くのボットを追加します。
  すべて。
- トークンを環境変数に保存し、ソースには保存しないでください。
- `AuthError` (401) を処理するには、永遠に再試行するのではなく、停止します。
- これらのヘルパーが使用する各エンドポイントについては、[APIリファレンス](api-reference.md) を参照してください。
