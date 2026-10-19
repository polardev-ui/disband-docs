# Bots

Disband bots are self-hosted integrations. You run the code, Disband relays
messages to and from it. Disband never hosts or executes your bot's code.

## How it works

1. **Create a bot** in **Settings → Bots** and pick the scopes it needs. You get
   a token back — it is shown **once**.
2. In **Settings → Bots**, generate an **invite link** for the server you want
   the bot to join, and send it to that server's **owner**.
3. The owner opens the link and approves. The bot becomes a member of the server.
4. You run one of the client libraries somewhere (a server, a cloud function,
   your laptop) and it connects to Disband with the token.

## Scopes

A bot's reach in a server is the **intersection** of the scopes you requested
when creating it and the scopes the owner approved for that specific server:

| Scope             | Description                                                          |
| ----------------- | -------------------------------------------------------------------- |
| `messages.read`   | Receive message events on the gateway and read messages/channels.    |
| `messages.write`  | Send and reply to messages in channels the bot can see.              |
| `members.read`    | List the members of servers the bot has joined.                      |
| `channels.manage` | Create, rename, and delete channels — also needs the `manage_channels` role in the server. |

## Token authentication

Every API call is authenticated with the bot token:

```
Authorization: Bot <token>
```

Bot tokens are **hashed at rest** — the raw token is never stored or retrievable.
If it leaks (or you no longer need the bot), revoke it in **Settings → Bots**;
revocation kills the token immediately.

## Limits & safety

- Up to **5 bots per account**. A bot can be revoked at any time, which kills its
  token.
- Messages up to **4,000 characters**. Bots need the `mention_everyone` role
  permission to use `@everyone`.
- Only a server's **owner** can approve a bot invite. Invites expire after
  **7 days**.
- Bot tokens are hashed at rest; the raw token is never stored or retrievable.
- Bots can never reach the database directly — every action goes through scoped
  API endpoints.

## Pick a path

- **[Getting started](getting-started.md)** — create a bot and invite it.
- **[Hosting your own bot](hosting-your-own-bot.md)** — where to run the client.
- **[JavaScript client](clients/javascript.md)** / **[Python client](clients/python.md)**.
- **[API reference](api-reference.md)** if you want to talk to the API directly.
- **[Bot templates](templates.md)** — ready-to-adapt welcomers, ticket managers, and more.