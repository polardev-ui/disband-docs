# Bot-Vorlagen

Bereite Anpassungsmöglichkeiten für gängige Bots bereit. Jeder ist ein kleines, selbstständiges Skript, das Sie in eine Datei einfügen und mit dem JavaScript- oder Python-Client ausführen können.

## Willkommener

Postet eine Willkommensnachricht, jedes Mal wenn jemand einem Raum beitritt. Braucht `messages.write` und `members.read`.

```javascript
import { Client } from "@disband/bot";

const client = new Client({ token: process.env.DISBAND_BOT_TOKEN });
const WELCOME_CHANNEL = process.env.WELCOME_CHANNEL_ID;

client.on("memberJoin", async (member) => {
  await client.channels.send(WELCOME_CHANNEL, `Welcome to the space, ${member.display_name ?? member.username}!`);
});

await client.connect();
```

> Der Gateway sendet heute `messageCreate`, `messageUpdate` und `messageDelete` aus;
> Mitgliederveranstaltungen werden über den gleichen Ereignisstrom empfangen, wie es die Reichweite Ihres Bots zulässt.

## Ticketmanager

Erstellt einen privaten Kanal pro Supportanfrage und pingt eine Mitarbeiterrolle. Er benötigt `channels.manage` (plus die Rolle `manage_channels`) und `messages.write`.

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

## Automatischer Antwortgeber

Beantwortet eine kleine Anzahl von häufig gestellten Fragen. Erfordert `messages.read` und `messages.write`.

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

## Moderationshilfe

Löscht Nachrichten, die ein gesperrtes Wort enthalten, und protokolliert sie. Erfordert `messages.read`, `messages.write` und die Rolle `manage_messages`.

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

## Tipps

- Beginnen Sie mit dem kleinsten Scope-Set und fügen Sie mehr Bots hinzu, anstatt nur einen Bot mit
  Alles.
- Speichern Sie Token in Umgebungsvariablen, niemals in der Quelle.
- Behandeln Sie `AuthError` (401) indem Sie stoppen anstatt ewig zu versuchen.
- Sehen Sie sich die [API-Referenz](api-reference.md) für jedes Endpunkt an, das diese Hilfsmittel verwenden.
