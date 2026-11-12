# Python client — `disband-bot`

The official Python client. Uses only the standard library (`threading` +
`urllib`), so there is nothing to install except the client itself. Works on
Python 3.9+.

## Install

```bash
pip install disband-bot
```

## Quick start

```python
import os
from disband_bot import Client

client = Client(token=os.environ["DISBAND_BOT_TOKEN"])

@client.on("ready")
def on_ready(me):
    print("Logged in as", me["name"])

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

### `Client(token, base_url="https://www.disband.dev", gateway_timeout=20, allow_insecure_localhost=False, retry_rate_limits=True, max_retries=3)`

| Argument | Default | Description |
| --- | --- | --- |
| `token` | *(required)* | The bot token from **Settings → Bots**. |
| `base_url` | `"https://www.disband.dev"` | API root. |
| `gateway_timeout` | `20` | Seconds per gateway poll (1–20). |
| `allow_insecure_localhost` | `False` | Allow `http://localhost` for local development only. |
| `retry_rate_limits` | `True` | Wait out a `429`'s `Retry-After` and send the request again. |
| `max_retries` | `3` | How many `429`s to retry before raising `RateLimitError`. |

## Lifecycle

| Method | Description |
| --- | --- |
| `connect()` | Resolves identity, emits `ready`, and starts the gateway loop in a daemon thread. |
| `run()` | Connects and blocks until stopped. |
| `close()` | Stops the loop. |
| `user` / `connected` | Identity and connection state. |

## Events

| Event | Args | Notes |
| --- | --- | --- |
| `ready` | `user` dict | `id`, `user_id`, `name`, `username`, `avatar_url`, `scopes`. |
| `messageCreate` | `Message` | New message in a channel the bot can view. |
| `messageUpdate` | `Message` | Edited message. |
| `messageDelete` | `Message` | Deleted message (partial fields). |
| `reactionAdd` | `dict` | `message_id`, `channel_id`, `server_id`, `emoji`, `user_id`, `user`. |
| `reactionRemove` | `dict` | The same, without `user`. |
| `memberJoin` | `dict` | Someone joined a space (`members.read`). |
| `memberLeave` | `dict` | Someone left a space (`members.read`). |
| `memberUpdate` | `dict` | A member's roles changed (`members.read`). |
| `channelCreate` / `channelUpdate` / `channelDelete` | `dict` | `channel_id`, `server_id`, `channel`. Forum posts included. |
| `roleCreate` / `roleUpdate` / `roleDelete` | `dict` | `server_id`, `role_id`, `role` (`members.read` or `roles.manage`). |
| `serverUpdate` | `dict` | `server_id`, `server`: the space's name, icon, banner or owner changed. |
| `serverJoin` | `dict` | The bot was added: `server_id`, `server`, `scopes`. |
| `serverLeave` | `dict` | The bot was removed: `server_id`. |
| `scopesUpdate` | `dict` | The space changed the bot's scopes: `server_id`, `scopes`. |
| `interactionCreate` | `dict` | Slash command or button press for this bot. |
| `error` | `Exception` | Gateway/handler errors. The loop retries unless the token is invalid. |

```python
@client.on("reactionAdd")
def pin_on_pushpin(event):
    if event["emoji"] == "📌" and not (event.get("user") or {}).get("is_bot"):
        client.pin_message(event["channel_id"], event["message_id"])
```

### `Message`

Attributes: `id`, `channel_id`, `server_id`, `author`, `content`, `reply_to_id`,
`mentions`, `embeds`, `components`, `interaction`, `webhook_id`, `attachment`
(`{"url", "type"}` or `None`), `created_at`, `edited_at`, `display_id`,
`reactions` (from `get_message`), `raw`, `author_is_bot`.

Helpers: `reply(content=None, **options)`, `edit(content_or_patch=None, **patch)`,
`delete()`, `react(emoji)`, `unreact(emoji)`, `pin()`, `unpin()`.

## Methods

### Messages, reactions, and pins

```python
msg = client.send_message(channel_id, "Deploy finished", embeds=[...], components=[...], reply_to_id=msg_id)
client.edit_message(channel_id, message_id, content="Edited")
messages = client.list_messages(channel_id, limit=50, before=message_id)  # or after= / around=
message = client.get_message(channel_id, message_id)  # message.reactions
client.delete_message(channel_id, message_id)  # UUID or numeric display_id
deleted = client.bulk_delete_messages(channel_id, [uuid1, uuid2])  # UUIDs only, 1-100
client.send_typing(channel_id)  # "is typing..." for a few seconds

client.add_reaction(channel_id, message_id, "👍")
client.remove_reaction(channel_id, message_id, "👍")
reactions = client.list_reactions(channel_id, message_id)  # [{"emoji", "count", "me"}]
users = client.list_reaction_users(channel_id, message_id, "👍", limit=100)
client.remove_user_reaction(channel_id, message_id, "👍", user_id)  # manage_messages
removed = client.clear_reactions(channel_id, message_id, emoji="👍")  # omit emoji for all
pins = client.list_pins(channel_id)
client.pin_message(channel_id, message_id)
client.unpin_message(channel_id, message_id)
```

### Forum posts

```python
posts = client.list_forum_posts(forum_id, limit=50)
post, message = client.create_forum_post(forum_id, "Release notes", content="v2 is out", tags=["announcement"])
client.send_message(post["id"], "Questions welcome here.")  # a post is a channel
```

### The bot itself and users

```python
me = client.fetch_me()  # {"user": {...}, "bot": {...}}
client.set_status("Watching 12 servers")  # None clears it; up to 64 characters
servers = client.list_servers()
profile = client.get_user(user_id)  # shares a space, members.read
```

### Servers and audit

```python
server = client.get_server(server_id)
updated = client.update_server(server_id, name="New name", discoverable=True)
perms = client.get_server_permissions(server_id)
audit = client.list_audit_log(server_id, limit=100)
```

### Categories and channels

```python
categories = client.list_categories(server_id)
category = client.create_category(server_id, "Support")
client.update_category(category_id, name="Support", position=1)
client.delete_category(category_id)

channels = client.list_channels(server_id)  # visible only
channel = client.get_channel(channel_id)
channel_id = client.create_channel(server_id, "staff-chat", type="text", category_id=cat_id,
    topic="Staff", slow_mode_seconds=0, read_only=False,
    permissions=[
        {"role_id": everyone_role_id, "can_view": False},
        {"role_id": staff_role_id, "can_view": True, "can_post": True},
    ])
client.update_channel(channel_id, name="new-name", topic=None, slow_mode_seconds=10)
client.rename_channel(channel_id, "new-name")
client.delete_channel(channel_id)

overwrites = client.list_channel_permissions(channel_id)
client.set_channel_permission(channel_id, role_id, can_view=True, can_post=True)
client.delete_channel_permission(channel_id, role_id)
```

A private channel is a channel with role overwrites: deny `can_view` for
`@everyone` and allow it for the roles that should see it. Hidden channels are
omitted from lists and direct access returns 403/404.

### Members, bans, and roles

```python
members = client.list_members(server_id)  # or query="ali", role=role_id, limit=25
member = client.get_member(server_id, user_id)
client.kick_member(server_id, user_id)
client.timeout_member(server_id, user_id, 10, reason="Cooling off")
client.add_member_role(server_id, user_id, role_id)
client.remove_member_role(server_id, user_id, role_id)

bans = client.list_bans(server_id)
client.ban_member(server_id, user_id, reason="Spam")
client.unban_member(server_id, user_id)

roles = client.list_roles(server_id)
role = client.create_role(server_id, name="Ticket Staff", color="#5865f2",
    permissions={"send_messages": True}, self_assignable=False, position=2)
one = client.get_role(server_id, role_id)
client.update_role(server_id, role_id, name="Staff")
client.delete_role(server_id, role_id)
```

Moderation and role changes enforce hierarchy (no acting on the owner,
moderators, bots, yourself, or roles at/above the bot's highest role).

### Webhooks

```python
webhooks = client.list_webhooks(server_id)
webhook = client.create_webhook(server_id, channel_id=channel_id, name="Deploys")
one = client.get_webhook(webhook_id)
client.update_webhook(webhook_id, name="New name", reset_token=True)
client.delete_webhook(webhook_id)
```

Webhook objects include a posting `url` — treat it as a secret. Webhooks in
channels the bot cannot view are hidden.

### Commands and interactions

```python
commands = client.list_commands()
client.set_commands([{"name": "ping", "description": "Ping", "options": []}])  # bulk replace
client.upsert_command(name="ping", description="Ping", options=[])
client.delete_command("ping")

@client.on("interactionCreate")
def on_interaction(interaction):
    client.respond_to_interaction(interaction["id"], content="Pong!", ephemeral=True)
```

### Invites and lifecycle

```python
client.leave_server(server_id)
invite = client.create_invite(server_id, ["messages.read", "messages.write"])
# invite["invite_url"] -> send to the space owner
```

## Errors

| Error | When |
| --- | --- |
| `AuthError` | `401` — invalid or revoked token. The gateway loop stops on this. |
| `PermissionError` | `403` — missing scope, grant, or role permission. |
| `RateLimitError` | `429` — includes `retry_after` seconds. |
| `HttpError` | Any other non-2xx status. |

All carry `.status`, a message, and `.body`. See the [API reference](../api-reference.md)
and [Extended API](../../developers/extended-api.md) for endpoint-specific
behavior and limits.
