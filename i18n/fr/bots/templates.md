# Modèles de bots

Points de départ prêts à être adaptés pour les bots courants. Chacun est un petit script autonome que vous pouvez coller dans un fichier et exécuter avec le client JavaScript ou Python.

## Accueillant

Publie un message de bienvenue chaque fois que quelqu'un rejoint un espace. Nécessite `messages.write` et `members.read`.

```javascript
import { Client } from "@disband/bot";

const client = new Client({ token: process.env.DISBAND_BOT_TOKEN });
const WELCOME_CHANNEL = process.env.WELCOME_CHANNEL_ID;

client.on("memberJoin", async (member) => {
  await client.channels.send(WELCOME_CHANNEL, `Welcome to the space, ${member.display_name ?? member.username}!`);
});

await client.connect();
```

> Le portail émet aujourd'hui `messageCreate`, `messageUpdate` et `messageDelete` ;
> Les événements des membres arrivent via le même flux d'événements que les scopes de votre bot le permettent.

## Gestionnaire de billets

Crée un canal privé par demande de support et envoie un ping à un rôle du personnel. Nécessite `channels.manage` (plus le rôle `manage_channels`) et `messages.write`.

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

## Répondeur automatique

Réponds à un petit ensemble de questions fréquemment posées. Nécessite `messages.read` et `messages.write`.

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

## Assistant de modération

Supprime les messages contenant un mot interdit et les enregistre. Nécessite `messages.read`, `messages.write` et le rôle `manage_messages`.

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

## Conseils

- Commencez par le plus petit ensemble de scopes et ajoutez plus de bots plutôt qu'un seul bot avec
  Tout.
- Stocker les jetons dans les variables d'environnement, jamais dans la source.
- Gérer `AuthError` (401) en arrêtant au lieu de réessayer pour toujours.
- Consultez la référence [Référence de l’API](api-reference.md) pour chaque point d'extrémité que ces aides utilisent.
