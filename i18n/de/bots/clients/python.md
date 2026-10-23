# Python-Client — `disband-bot`

Der offizielle Python-Client. Verwendet nur die Standardbibliothek (`threading` + `urllib`), so dass es nichts zu installieren gibt, außer dem Client selbst. Funktioniert auf Python 3.9+.

## installieren

```bash
pip install disband-bot
```

Oder von diesem Monorepo:

```bash
pip install ./packages/disband-bot-python
```

## Schneller Start

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

Die Handläufer können einfach oder `async def` sein; beide werden unterstützt.

## Konstrukteur

### `Client(token, base_url="https://www.disband.dev", gateway_timeout=20)`

| Argument | Standardwert | Beschreibung                                  |
| ---------------- | ---------------------------- | -------------------------------------------- |
| `token`          | *(erforderlich)*                 | Der Bot-Token von **Einstellungen → Bots**.      |
| `base_url` | `"https://www.disband.dev"` | API root (Ändern Sie für eine benutzerdefinierte Domain). |
| `gateway_timeout`| `20`                         | Sekunden pro Gateway-Abfrage (1-20).             |

## Lebenszyklus

| Methode | Beschreibung                                                        |
| -------- | ------------------------------------------------------------------ |
| `run()` | Verbinden, senden von `ready`, starten des Gateway-Schleifens in einem Hintergrundthread und blockieren für immer. |
| `close()`| Stoppt den Schleifen.                                                    |

## Veranstaltungen

Registrieren Sie sich mit `client.on("name", handler)` - als Dekorator oder als einfache Anruf - plus `once` für Single-Shot-Handler.

| Ereignis | Argumente | Anmerkungen                                                                 |
| --------------- | -------- | -------------------------------------------------------------------|
| `ready`         | `user`   | `user["id"]`, `user["name"]`, `user["scopes"]`, etc.               |
| `messageCreate` | `message`| Eine neue Nachricht auf einem Server, den der Bot sehen kann.                          |
| `messageUpdate` | `message`| Eine Nachricht wurde bearbeitet (`content`, `edited_at` aktualisiert).             |
| `messageDelete` | `message`| Eine Nachricht wurde gelöscht (`content` leer; `id`/`channel_id` gültig). |
| `error`         | `error`  | Gateway-Fehler. Der Schleifenversuch wird automatisch wiederholt, es sei denn, der Token ist ungültig, in diesem Fall hört er auf. |

### `Message`

| Feld         | Typ             | Beschreibung                                        |
| ------------- | ---------------- | -------------------------------------------------- |
| `id`          | `str`            | Nachrichtennummer.                                        |
| `channel_id` | `str` | Kanal-ID.                                        |
| `server_id` | `str \| None` | Server-ID.                                         |
| `author`      | `dict \| None`   | `{ "id", "username", "display_name", "avatar_url", "is_bot" }`. |
| `content` | `str` | Nachrichtentext.                                      |
| `reply_to_id` | `str \| None` | Die Nachricht, auf die dies antwortet, falls vorhanden. |
| `mentions` | `list` | Genannte Benutzer.                                   |
| `attachment` | `dict \| None` | `{ "url", "type" }`, wenn die Nachricht eine Datei enthält. |
| `created_at` | `str \| None` | ISO-Zeitstempel.                                     |
| `edited_at` | `str \| None` | ISO-Zeitstempel der letzten Bearbeitung. |
| `display_id` | `int \| None` | Die sequenzielle Anzeige-Nummer. |
| `author_is_bot` | `bool`          | Wahr, wenn der Absender ein Bot war (Eigenschaft).         |

**Methoden** - `message.reply(content)` antwortet im selben Kanal.

## Methoden

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

## Fehler

Der Client erstellt Unterklassen von `DisbandError` mit einem `.status` und `.body`:

| Fehler            | Wann                                          |
| ---------------- | --------------------------------------------- |
| `AuthError` | `401` - ungültiger oder widerrufener Token. Der Gateway-Zyklus hört hier an. |
| `PermissionError`| `403` - fehlende Zugriffsberechtigung für den Bereich oder die Rolle. |
| `RateLimitError` | `429` - enthält `retry_after` Sekunden. |
| `HttpError` | Jeder andere nicht-2xx-Status.                     |

Intern ist der Client ein dünner Wrapper über den [API-Referenz](../api-reference.md): `REST.get/post/patch/delete` mit `Authorization: Bot <token>`.
