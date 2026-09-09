# Hosting your own bot

Disband does not host or execute your bot. You run the client wherever you like,
and it talks to Disband over a long-polling gateway using the bot token. This page
covers the practical side of keeping a bot alive.

## Where to run it

Any machine that can make outbound HTTPS requests works. Since the gateway is
long-polling (your code holds a connection open, and Disband returns events when
they arrive), you do not need a public address, inbound ports, or a websocket.

Good options, cheapest first:

| Host                       | Notes                                                                 |
| -------------------------- | --------------------------------------------------------------------- |
| A laptop / desktop         | Fine for a personal bot that is online when you are.                  |
| A small VPS (1 GB RAM)     | ~$4–6/month; the JavaScript client needs almost nothing.              |
| A cloud function / worker  | Serverless works if the platform allows a long-lived process; the clients are stateless enough to restart cheaply. |
| A container / Pterodactyl  | The clients have zero runtime dependencies, so any image works.       |

## What you actually need

- **JavaScript**: Node.js 18+, or Deno, or Bun. Zero runtime dependencies.
- **Python**: Python 3.9+. Standard library only (threading + `urllib`).

There is no database, no queue, and no framework to install.

## Keeping it alive

The gateway loops forever on its own; it reconnects and retries automatically.
Three things tend to kill real bots:

1. **Crash loops.** Wrap the client in a supervisor and restart on failure:
   ```bash
   # systemd
   [Unit]
   Description=disband-bot
   After=network-online.target

   [Service]
   ExecStart=/usr/local/bin/node /opt/my-bot/index.js
   Restart=always
   RestartSec=3
   Environment=DISBAND_BOT_TOKEN=…

   [Install]
   WantedBy=multi-user.target
   ```

2. **Stale tokens.** If the bot is revoked (or an invite expires before it is
   approved), the gateway API returns `401`. Handle it: log clearly and stop,
   rather than retrying forever. Both clients surface this as an `error` event —
   JavaScript's `AuthError` / Python's `AuthError` — and the loop stops instead
   of hammering.

3. **Silent config drift.** Keep the token in an environment variable or secret
   store, not in the source. If you rotate the token, restart the process with
   the new value.

## Reading and writing data

Bots only talk to the scoped HTTP API. To poll or persist state, use any storage
you already operate — a file, a database, Redis — the client does not care.

## Multi-server bots

A bot can be invited to many servers. The approved scopes are per server, so a
bot that can read messages everywhere is also only ever writing where the owner
granted `messages.write`. Your code can branch on `message.server_id` if the
behaviour needs to differ per server.

## Going further

- See the **[API reference](api-reference.md)** for the exact endpoints the
  clients use — useful if you want to write your own client in another language.
- The **[JavaScript](clients/javascript.md)** and **[Python](clients/python.md)**
  reference pages include every method and event.