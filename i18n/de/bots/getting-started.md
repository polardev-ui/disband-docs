# Erste Schritte: Ihr erster Bot

Diese Seite führt Sie durch die Erstellung eines Bots, den Erhalt seines Tokens und die Einladung zum Server. Es dauert etwa zwei Minuten.

## 1. Erstellen Sie den Bot

Öffnen Sie **Einstellungen → Bots** in Disband und klicken Sie auf **Neuer Bot**.

- Gib ihm einen Namen. Der Name ist das, was in der Mitgliederliste und in den Nachrichten erscheint.
- Wählen Sie die **Bereiche** aus, die es benötigt. Beginnen Sie klein - Sie können immer einen anderen Bot erstellen
  Mit mehr Bereichen. Die vollständige Liste ist in der [Bots](index.md) verfügbar.
- Klicken Sie auf **Erstellen**.

Disband gibt einen **Token** zurück, der einmal angezeigt wird. Kopieren Sie ihn jetzt an einem sicheren Ort: Er wird nie wieder angezeigt und kann später nicht wiederhergestellt werden. Wenn Sie ihn verlieren, widerrufen Sie den Bot und erstellen Sie einen neuen.

Der Token ist das, was Ihr Code zur Authentifizierung verwendet:

```
Authorization: Bot <token>
```

## 2. Laden Sie den Bot auf einen Server ein

Öffnen Sie in **Einstellungen → Bots** den Bot, den Sie gerade erstellt haben:

1. Klicken Sie auf **Einladung generieren**.
2. Wählen Sie den Zielserver und den Umfang aus, den Sie erlauben möchten.
3. Senden Sie den resultierenden Link an den **Besitzer** dieses Servers.

Nur der Besitzer kann eine Bot-Einladung genehmigen. Einladungen laufen nach 7 Tagen ab.

## 3. Der Eigentümer genehmigt

Der Besitzer öffnet den Link und klickt auf **Genehmigen**. Der Bot wird Mitglied des Servers, begrenzt auf die Bereiche, die genehmigt wurden. (Die genehmigten Bereiche sind die Schnittstelle der Bereiche des Bot-Kontos und dessen Genehmigungen des Besitzers - Sie können nicht mehr genehmigen, als der Bot mit erstellt wurde.)

## 4. Kontaktieren Sie einen Kunden

Speichern Sie den Token in eine Umgebungsvariable und führen Sie einen der Clients aus:

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

Der Client verbindet sich mit dem Gateway, sendet `ready` und streamt dann Nachrichtenevents. Weitere Informationen zum vollständigen API finden Sie unter [JavaScript](clients/javascript.md) und [Python](clients/python.md).

## Was kommt als nächstes?

- Wenn der Bot dauerhaft laufen muss, siehe
  **[Eigenen Bot hosten](hosting-your-own-bot.md)**.
- Wenn Sie direkt mit dem API sprechen möchten (curl, eine andere Sprache, ein Webhook),
  Siehe die **[API-Referenz](api-reference.md)**.
