# Developers

Build on top of Disband: bots, integrations, and tools that talk to your spaces
from the outside. Everything here is self-hosted — Disband never runs your code.

## What you can build

- **Bots** — self-hosted accounts that read and write messages, manage channels,
  and react to events over a long-polling gateway. See the [bots overview](../bots/index.md).
- **Webhooks** — one-way notifications posted through a secret URL, with no bot
  code or token. See [Webhooks](webhooks.md).
- **Embedded cards** — structured release notes, alerts, and status updates.
  See [Embeds](embeds.md).
- **Custom clients** — talk to the HTTP API directly if you need a language the
  shipped clients don't cover. The [API reference](../bots/api-reference.md) is
  the contract.
- **Status integrations** — follow Disband incidents over RSS, or read how the
  [status system](status.md) records checks and opens incidents.

## Start here

1. **[Getting started](../bots/getting-started.md)** — create a bot, grab its
   token, invite it to a space. About two minutes.
2. **[Hosting your own bot](../bots/hosting-your-own-bot.md)** — where to run
   the client and how to keep it alive.
3. **[JavaScript client](../bots/clients/javascript.md)** or
   **[Python client](../bots/clients/python.md)**.
4. **[API reference](../bots/api-reference.md)** for the exact endpoints.
5. **[Webhooks](webhooks.md)** or **[embeds](embeds.md)** if you only need
   one-way notifications.
6. **[Status system](status.md)** for the public status page and RSS feed.

## Implementing Disband into a game or app

Disband exposes a plain HTTP API authenticated with a bot token. There is no
native SDK or RPC runtime to link — any stack that can make HTTPS requests works.
A typical integration looks like this:

1. Create a bot in **Settings → Bots** and grant it `messages.write` (and
   `channels.manage` if it should create channels).
2. Invite the bot to the space you want to post into.
3. Store the token in your game or app's secret store — never in client-side
   code that ships to players.
4. From your backend, call the scoped endpoints:

   ```bash
   curl -X POST https://www.disband.dev/api/v1/channels/CHANNEL_ID/messages \
     -H "Authorization: Bot $DISBAND_BOT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"content": "Server restarted — 12 players online."}'
   ```

5. To react to chat from inside your game, long-poll the gateway and dispatch
   `messageCreate` events to your game logic.

### Security notes

- Bot tokens are hashed at rest and shown only once. Revoke immediately if one
  leaks.
- Keep tokens on a server you control. Shipping a token in a game client lets
  anyone impersonate your bot.
- Scope bots to the least privilege they need. A posting-only bot does not need
  `members.read` or `channels.manage`.

## Themes for developers

If you are building a branded client or skin, the CSS variables in the
[themes guide](../themes/index.md) are the stable styling API.

## Questions

- Bug reports: open an issue or email the team.
- For account-specific problems, use in-app support.