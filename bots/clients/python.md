# Python client — `disband-bot`

The official Python client. Uses only the standard library (`threading` +
`urllib`), so there is nothing to install except the client itself. Works on
Python 3.9+.

## Install

```bash
pip install disband-bot
```

or, from this monorepo:

```bash
pip install ./packages/disband-bot-python
```

## Quick start

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

Handlers may be plain or `async def`; both are supported.

## Constructor

### `Client(token, base_url="https://www.disband.dev", gateway_timeout=20)`

| Argument         | Default                      | Description                                  |
| ---------------- | ---------------------------- | -------------------------------------------- |
| `token`          | *(required)*                 | The bot token from **Settings → Bots**.      |
| `base_url`       | `"https://www.disband.dev"`  | API root (change for a custom domain).       |
| `gateway_timeout`| `20`                         | Seconds per gateway poll (1–20).             |

## Lifecycle

| Method   | Description                                                        |
| -------- | ------------------------------------------------------------------ |
| `run()`  | Connects, emits `ready`, starts the gateway loop in a background thread, and blocks forever. |
| `close()`| Stops the loop.                                                    |

## Events

Register with `client.on("name", handler)` — as a decorator or a plain call —
plus `once` for single-shot handlers.

| Event           | Args     | Notes                                                              |
| --------------- | -------- | -------------------------------------------------------------------|
| `ready`         | `user`   | `user["id"]`, `user["name"]`, `user["scopes"]`, etc.               |
| `messageCreate` | `message`| A new message in a server the bot can see.                          |
| `messageUpdate` | `message`| A message was edited (`content`, `edited_at` updated).             |
| `messageDelete` | `message`| A message was deleted (`content` empty; `id`/`channel_id` valid).  |
| `error`         | `error`  | Gateway errors. The loop retries automatically unless the token is invalid, in which case it stops. |

### `Message`

| Field         | Type             | Description                                        |
| ------------- | ---------------- | -------------------------------------------------- |
| `id`          | `str`            | Message id.                                        |
| `channel_id`  | `str`            | Channel id.                                        |
| `server_id`   | `str \| None`    | Server id.                                         |
| `author`      | `dict \| None`   | `{ "id", "username", "display_name", "avatar_url", "is_bot" }`. |
| `content`     | `str`            | Message text.                                      |
| `reply_to_id` | `str \| None`    | The message this replies to, if any.               |
| `mentions`    | `list`           | Mentioned users.                                   |
| `attachment`  | `dict \| None`   | `{ "url", "type" }` when the message has a file.   |
| `created_at`  | `str \| None`    | ISO timestamp.                                     |
| `edited_at`   | `str \| None`    | ISO timestamp of the last edit.                    |
| `display_id`  | `int \| None`    | The sequential display number.                     |
| `author_is_bot` | `bool`          | True when the sender was a bot (property).         |

**Methods** — `message.reply(content)` replies in the same channel.

## Methods

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

## Errors

The client raises subclasses of `DisbandError` with a `.status` and `.body`:

| Error            | When                                          |
| ---------------- | --------------------------------------------- |
| `AuthError`      | `401` — invalid or revoked token. The gateway loop stops on this. |
| `PermissionError`| `403` — missing scope or role permission.     |
| `RateLimitError` | `429` — includes `retry_after` seconds.       |
| `HttpError`      | Any other non-2xx status.                     |

Internally the client is a thin wrapper over the [HTTP API](../api-reference.md):
`REST.get/post/patch/delete` with `Authorization: Bot <token>`.