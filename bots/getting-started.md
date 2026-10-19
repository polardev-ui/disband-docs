# Getting started: your first bot

This page walks through creating a bot, getting its token, and inviting it to a
server. It takes about two minutes.

## 1. Create the bot

Open **Settings → Bots** in Disband and click **New bot**.

- Give it a name. The name is what appears in the member list and on messages.
- Pick the **scopes** it needs. Start small — you can always create another bot
  with more scopes. The full list is on the [bots overview](index.md).
- Click **Create**.

Disband returns a **token**, shown once. Copy it somewhere safe now: it is never
shown again and cannot be retrieved later. If you lose it, revoke the bot and
create a new one.

The token is what your code uses to authenticate:

```
Authorization: Bot <token>
```

## 2. Invite the bot to a server

In **Settings → Bots**, open the bot you just created:

1. Click **Generate invite**.
2. Pick the target server and the scope set to grant.
3. Send the resulting link to that server's **owner**.

Only the owner can approve a bot invite. Invites expire after 7 days.

## 3. The owner approves

The owner opens the link and clicks **Approve**. The bot becomes a member of the
server, limited to the scopes that were approved. (The approved scopes are the
intersection of the bot account's scopes and what the owner granted — you cannot
approve more than the bot was created with.)

## 4. Connect with a client

Save the token to an environment variable and run one of the clients:

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

The client connects to the gateway, fires `ready`, and then streams message
events. See [JavaScript](clients/javascript.md) and [Python](clients/python.md)
for the full API.

## What's next

- If the bot needs to keep running permanently, see
  **[Hosting your own bot](hosting-your-own-bot.md)**.
- If you want to talk to the API directly (curl, another language, a webhook),
  see the **[API reference](api-reference.md)**.