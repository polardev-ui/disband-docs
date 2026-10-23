# はじめに: 最初のボット

このページでは、ボットの作成、トークンの取得、サーバーへの招待の手順を説明します。約2分かかります。

## 1. ボットを作成する

Disbandで**設定→ボット**を開き、**新しいボット**をクリックします。

- 名前を付けます。名前はメンバーリストやメッセージに表示されるものです。
- 必要な**範囲**を選択します。小さく始めてください。いつでも別のボットを作成できます
  より多くの範囲で。完全なリストは[ボット](index.md)にあります。
- **作成**をクリックします。

Disbandは**トークン**を返します。一度表示されます。今すぐ安全な場所にコピーしてください。もう二度と表示されず、後で取得できません。紛失した場合は、ボットをリボートして新しいボットを作成してください。

トークンは、コードが認証に使用するものです。

```
Authorization: Bot <token>
```

## 2. ボットをサーバーに招待する

**設定→ボット**で、作成したばかりのボットを開きます。

1. **招待状を生成**をクリックします。
2. ターゲットサーバーと許可する範囲を設定します。
3. その結果生じたリンクをそのサーバーの**所有者**に送信します。

ボット招待を承認できるのはオーナーだけです。招待は7日後に期限切れになります。

## 3. 所有者が承認します

所有者はリンクを開き、「承認」をクリックします。ボットは承認された範囲に限定されたサーバーのメンバーになります。（承認された範囲は、ボットアカウントの範囲と所有者が許可した範囲の交差点です。ボットが作成された範囲を超えることはできません。）

## 4. クライアントと連絡を取る

トークンを環境変数に保存し、クライアントのいずれかを実行します。

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

クライアントはゲートウェイに接続し、`ready`を発射し、次にメッセージイベントをストリーミングします。APIの詳細については、[JavaScript](clients/javascript.md)と[Python](clients/python.md)を参照してください。

## 次は何ですか

- ボットを永久に実行する必要がある場合は、次のを参照してください。
  **[独自のボットをホストする](hosting-your-own-bot.md)**。
- APIと直接話したい場合は（curl、別の言語、ウェブフック）、
  **[APIリファレンス](api-reference.md)**を参照してください。
