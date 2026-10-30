# Bots

Disband bots are self-hosted integrations. You run the code, Disband relays
messages to and from it. Disband never hosts or executes your bot's code.

## How it works

1. **Create a bot** in **Settings → Bots** (or the [Developers portal](https://disband.dev/developers/applications))
   and pick the scopes it needs. You get a token back — it is shown **once**.
2. Generate an **invite link** — targeted to a specific server, or a **general
   invite** that anyone can use (the recipient picks the server).
3. The server owner (or a channel manager) opens the link and approves. The bot
   becomes a member of the server.
4. You run one of the client libraries somewhere (a server, a cloud function,
   your laptop) and it connects to Disband with the token.

## Scopes

A bot's reach in a server is the **intersection** of the scopes you requested
when creating it and the scopes the owner approved for that specific server:

| Scope               | Description                                                          |
| ------------------- | -------------------------------------------------------------------- |
| `messages.read`     | Receive message events on the gateway and read messages/channels.     |
| `messages.write`    | Send and reply to messages in channels the bot can see.              |
| `messages.delete`   | Delete messages the bot can see.                                     |
| `messages.react`    | Add and remove reactions on messages.                                |
| `members.read`      | List the members of servers the bot has joined.                      |
| `channels.read`     | List channels and categories.                                       |
| `channels.manage`   | Create, rename, and delete channels — also needs the `manage_channels` role in the server. |
| `webhooks.manage`   | Create, edit, and delete webhooks.                                   |

## Token authentication

Every API call is authenticated with the bot token:

```
Authorization: Bot <token>
```

Bot tokens are **hashed at rest** — the raw token is never stored or retrievable.
If it leaks (or you no longer need the bot), revoke it in **Settings → Bots**;
revocation kills the token immediately.

## Customizing your bot

Bots can be customized from the **Developers portal** (`/developers/applications`):

- **Name** — the display name shown in the member list and on messages.
- **Avatar** — profile picture URL (any HTTPS image).
- **Banner** — banner image URL for the bot's profile.
- **Bio** — a short description shown on the bot's profile.
- **Scopes** — add or remove scopes at any time (existing grants are not
  affected until a new invite is approved).

## General invite links

When creating an invite, enable **General invite** to generate a link that anyone
can use. The recipient signs in to Disband, picks a space they manage, and
approves the bot there. Great for distributing bots publicly or in documentation.

Targeted invites (the default) lock the invite to a specific server and require
the bot owner to be a member of that server.

## Limits & safety

- Up to **5 bots per account**. A bot can be revoked at any time, which kills its
  token.
- Messages up to **4,000 characters**. Bots need the `mention_everyone` role
  permission to use `@everyone`.
- Only a server's **owner** or a **channel manager** can approve a bot invite.
  Invites expire after **7 days**.
- Bot tokens are hashed at rest; the raw token is never stored or retrievable.
- Bots can never reach the database directly — every action goes through scoped
  API endpoints.
- Rate limits apply per bot token. If you hit `429`, honor `Retry-After`.

## Install the clients

```bash
# JavaScript / TypeScript
npm install @disband/bot

# Python
pip install disband-bot
```

No zip downloads — install directly from npm and PyPI.

## Pick a path

- **[Getting started](getting-started.md)** — create a bot and invite it.
- **[Hosting your own bot](hosting-your-own-bot.md)** — where to run the client.
- **[JavaScript client](clients/javascript.md)** / **[Python client](clients/python.md)**.
- **[API reference](api-reference.md)** if you want to talk to the API directly.