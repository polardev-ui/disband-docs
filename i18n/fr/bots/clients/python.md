# Client Python — `disband-bot`

Le client officiel Python. Utilise uniquement la bibliothèque standard (`threading` + `urllib`), donc il n'y a rien à installer à part le client lui-même. Fonctionne sur Python 3.9+.

## installer

```bash
pip install disband-bot
```

Ou, à partir de ce monorepo :

```bash
pip install ./packages/disband-bot-python
```

## Début rapide

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

Les gestionnaires peuvent être simples ou `async def` ; les deux sont pris en charge.

## constructeur

### `Client(token, base_url="https://www.disband.dev", gateway_timeout=20)`

| Argument | Défaillance | Description                                  |
| ---------------- | ---------------------------- | -------------------------------------------- |
| `token`          | *(obligatoire)*                 | Le jeton bot de **Paramètres → Bots**.      |
| `base_url` | `"https://www.disband.dev"` | API racine (modifier pour un domaine personnalisé). |
| `gateway_timeout`| `20`                         | Secondes par sondage de gateway (1-20).             |

## Cycle de vie

| Méthode | Description                                                        |
| -------- | ------------------------------------------------------------------ |
| `run()` | Connexion, émission de `ready`, démarrage de la boucle de gateway dans un thread en arrière-plan et blocage permanent. |
| `close()`| Arrête la boucle.                                                    |

## Événements

Inscrivez-vous avec `client.on("name", handler)` - en tant que décorateur ou appel simple - plus `once` pour les gestionnaires à tir unique.

| Événement | Arguments | Notes                                                              |
| --------------- | -------- | -------------------------------------------------------------------|
| `ready`         | `user`   | `user["id"]`, `user["name"]`, `user["scopes"]`, etc.               |
| `messageCreate` | `message`| Un nouveau message sur un serveur que le bot peut voir.                          |
| `messageUpdate` | `message`| Un message a été modifié (`content`, `edited_at` mis à jour).             |
| `messageDelete` | `message`| Un message a été supprimé (`content` vide ; `id`/`channel_id` valide). |
| `error`         | `error`  | Erreurs de gateway. La boucle réessaye automatiquement à moins que le jeton ne soit invalide, auquel cas il s'arrête. |

### `Message`

| Champ | Type | Description                                        |
| ------------- | ---------------- | -------------------------------------------------- |
| `id`          | `str`            | Identifiant du message.                                        |
| `channel_id` | `str` | Identifiant du canal.                                        |
| `server_id` | `str \| None` | Identifiant du serveur.                                         |
| `author`      | `dict \| None`   | `{ "id", "username", "display_name", "avatar_url", "is_bot" }`. |
| `content` | `str` | Texte du message.                                      |
| `reply_to_id` | `str \| None` | Le message auquel cela répond, le cas échéant. |
| `mentions` | `list` | Utilisateurs mentionnés.                                   |
| `attachment` | `dict \| None` | `{ "url", "type" }` lorsque le message contient un fichier. |
| `created_at` | `str \| None` | Heure ISO.                                     |
| `edited_at` | `str \| None` | Heure ISO de la dernière modification. |
| `display_id` | `int \| None` | Le numéro d'affichage séquentiel.                     |
| `author_is_bot` | `bool` | Vrai lorsque l'expéditeur était un bot (propriété). |

**Méthodes** - `message.reply(content)` répond dans le même canal.

## Méthodes

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

## Erreurs

Le client crée des sous-classes de `DisbandError` avec un `.status` et un `.body` :

| Erreur            | Quand                                          |
| ---------------- | --------------------------------------------- |
| `AuthError` | `401` - jeton invalide ou révoqué. La boucle de gateway s'arrête à ce stade. |
| `PermissionError`| `403` - manquant de portée ou de permission de rôle. |
| `RateLimitError` | `429` - comprend des secondes `retry_after`. |
| `HttpError` | Tout autre statut non 2xx.                     |

Internement, le client est un enveloppe mince sur le [Référence de l’API](../api-reference.md) : `REST.get/post/patch/delete` avec `Authorization: Bot <token>`.
