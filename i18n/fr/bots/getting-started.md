# Premiers pas : votre premier bot

Cette page vous guide dans la création d'un bot, la récupération de son jeton et l'invitation à un serveur. Cela prend environ deux minutes.

## 1. Créez le bot

Ouvrez **Paramètres → Bots** dans Disband et cliquez sur **Nouveau bot**.

- Donnez-lui un nom. Le nom est ce qui apparaît dans la liste des membres et sur les messages.
- Choisissez les **scopes** dont il a besoin. Commencez petit - vous pouvez toujours créer un autre bot.
  Avec plus de champs d'application. La liste complète se trouve sur l'[Bots](index.md).
- Cliquez sur **Créer**.

Disband renvoie un **token**, affiché une seule fois. Copiez-le quelque part en toute sécurité maintenant : il n'est jamais affiché à nouveau et ne peut pas être récupéré ultérieurement. Si vous le perdez, annulez le bot et créez un nouveau.

Le jeton est ce que votre code utilise pour se connecter :

```
Authorization: Bot <token>
```

## 2. Invitez le bot à un serveur

Dans **Paramètres → Bots**, ouvrez le bot que vous venez de créer :

1. Cliquez sur **Générer une invitation**.
2. Choisissez le serveur cible et définissez la portée à accorder.
3. Envoyez le lien résultant au **propriétaire** de ce serveur.

Seul le propriétaire peut approuver une invitation de bot. Les invitations expirent après 7 jours.

## 3. Le propriétaire approuve

Le propriétaire ouvre le lien et clique sur **Approuver**. Le bot devient membre du serveur, limité aux domaines approuvés. (Les domaines approuvés sont l'intersection des domaines du compte du bot et de ce que le propriétaire a accordé - vous ne pouvez pas approuver plus que ce avec quoi le bot a été créé.)

## 4. Se connecter avec un client

Enregistrez le jeton dans une variable d'environnement et exécutez l'un des clients :

```javascript
// JavaScript — install with: npm install /path/to/packages/bot
import { Client } from "@disband/bot";

const client = new Client({ token: process.env.DISBAND_BOT_TOKEN });

client.on("messageCreate", async (message) => {
  if (message.author?.is_bot) return;
  if (message.content !== "!ping") return;
  await message.reply("pong");
});

await client.connect();
```

```python
# Python — install with: pip install ./packages/disband-bot-python
from disband_bot import Client

client = Client(token=DISBAND_BOT_TOKEN)

@client.on("messageCreate")
def handle(message):
    if message.author_is_bot:
        return
    if message.content == "!ping":
        message.reply("pong")

client.run()
```

Le client se connecte au gateway, lance `ready`, puis diffuse les événements de messages. Consultez [JavaScript](clients/javascript.md) et [Python](clients/python.md) pour l'API complet.

## Qu'est-ce qui vient après ?

- Si le bot doit continuer à fonctionner de manière permanente, voir
  **[Héberger votre propre bot](hosting-your-own-bot.md)**.
- Si vous voulez parler directement au API (curl, une autre langue, un webhook),
  Voir la **[Référence de l’API](api-reference.md)**.
