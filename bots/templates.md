# Bot templates

Ready-to-adapt starting points for common bots. Each is a small, self-contained
script you can paste into a file and run with the JavaScript or Python client.

## Welcomer

Posts a welcome message whenever someone joins a space. Needs `messages.write`
and `members.read`.

```javascript
import { Client } from "@disband/bot";

const client = new Client({ token: process.env.DISBAND_BOT_TOKEN });
const WELCOME_CHANNEL = process.env.WELCOME_CHANNEL_ID;

client.on("memberJoin", async (member) => {
  await client.channels.send(WELCOME_CHANNEL, `Welcome to the space, ${member.display_name ?? member.username}!`);
});

await client.connect();
```

> The gateway emits `messageCreate`, `messageUpdate` and `messageDelete` today;
> member events arrive through the same event stream as your bot's scopes allow.

## Ticket manager

Creates a private channel per support request and pings a staff role. Needs
`channels.manage` (plus the `manage_channels` role) and `messages.write`.

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

## Auto-responder

Answers a small set of FAQs. Needs `messages.read` and `messages.write`.

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

## Moderation helper

Deletes messages containing a banned word and logs them. Needs
`messages.read`, `messages.write` and the `manage_messages` role.

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

## Tips

- Start with the smallest scope set and add more bots rather than one bot with
  everything.
- Store tokens in environment variables, never in source.
- Handle `AuthError` (401) by stopping instead of retrying forever.
- See the [API reference](api-reference.md) for every endpoint these helpers use.