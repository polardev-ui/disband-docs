# Disband Docs

Everything you need to build on Disband.

## Bots

Disband bots are **self-hosted integrations**: you run the code, Disband relays
messages to and from it. Disband never hosts or executes your bot.

- **[Getting started](bots/getting-started.md)** — create a bot, grab its token,
  and invite it to a server. Takes about two minutes.
- **[How bots work](bots/index.md)** — scopes, invites, limits, and safety.
- **[Hosting your own bot](bots/hosting-your-own-bot.md)** — where to run the
  client and how to keep it alive.
- **[JavaScript client](bots/clients/javascript.md)** — `@disband/bot`.
  Zero dependencies; works on Node.js 18+, Deno, Bun, and the browser.
- **[Python client](bots/clients/python.md)** — `disband-bot`.
  Standard library only; works on Python 3.9+.
- **[API reference](bots/api-reference.md)** — the HTTP API both clients talk to.

## Themes

SUPER members can restyle the whole app with custom CSS, shipped skins, and
uploaded icons.

- **[Themes](themes/index.md)** — the CSS variables that are a stable API, the
  selectors that are safe to target, and a starter template.

## Download the clients

- **[@disband/bot](https://raw.githubusercontent.com/polardev-ui/disband-docs/main/zips/disband-bot-0.1.0.tgz)** — the JavaScript client
  (`npm install ./disband-bot-0.1.0.tgz`).
- **[disband-bot](https://raw.githubusercontent.com/polardev-ui/disband-docs/main/zips/disband-bot-python-0.1.0.tar.gz)** — the Python client
  (`pip install ./disband-bot-python-0.1.0.tar.gz`).