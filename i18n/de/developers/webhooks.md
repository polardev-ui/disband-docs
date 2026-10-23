# Webhooks

Ein Webhook veröffentlicht Nachrichten in einem Kanal über einen geheimen URL. Er benötigt keinen Botcode, keinen Gateway-Loop und keinen `Authorization`-Header - wenn Sie eine HTTP-Anfrage stellen können, können Sie auf Disband posten.

Webhooks sind von Bots getrennt. Verwenden Sie einen Webhook für einseitige Benachrichtigungen von CI, Überwachung, Spielservern, Formularen oder allem anderen, was eine URL anrufen kann. Verwenden Sie einen [Bots](../bots/index.md), wenn Sie Ereignisse lesen oder auf Nachrichten reagieren müssen.

## Erstellen Sie einen Webhook

Sie benötigen die Berechtigung **Manage Webhooks** im Bereich.

1. Öffnen Sie **Raum-Einstellungen → Integrationen → Webhooks**.
2. Wählen Sie einen Kanal und wählen Sie **Neue Webhook** aus.
3. Gib ihm einen Namen und, wenn du möchtest, ein Avatar.
4. Kopieren Sie den Webhook URL.

Der URL sieht so aus:

```text
https://disband.dev/webhook/12345678/01234567890123456789012345
```

| Teil     | Bedeutung                                                        |
| ----------- | -------------------------------------------------------------- |
| Leerzeichen-Taste | Acht Ziffern, die das Leerzeichen identifizieren. Nicht geheim.                |
| Token | Sechsundzwanzig Ziffern. Das ist der Geheimcode. Behandeln Sie ihn wie ein Passwort. |

Das gleiche Endpunkt wird auch bei `https://disband.dev/api/webhooks/<space key>/<token>` bedient.

Von diesem Bildschirm aus können Sie den Webhook umbenennen, seinen Token zurücksetzen oder ihn löschen. Die Zurücksetzung des Tokens macht den alten URL sofort ungültig. Die Löschung des Webhooks verhindert, dass er veröffentlicht, lässt aber Nachrichten zurück, die er bereits im Kanal gesendet hat.

## Einen Webhook ausführen

Senden Sie einen `POST` an den Webhook URL mit einem JSON-Body.

```bash
curl -X POST 'https://disband.dev/webhook/12345678/01234567890123456789012345' \
  -H 'Content-Type: application/json' \
  -d '{
    "content": "Deploy finished — **v2.4.1** is live.",
    "username": "Deploy bot",
    "avatar_url": "https://example.com/deploy.png"
  }'
```

Eine erfolgreiche Anfrage gibt `204 No Content` zurück. Füge stattdessen `?wait=true` hinzu, um das erstellte Nachrichtsobjekt zu erhalten:

```bash
curl -X POST 'https://disband.dev/webhook/12345678/01234567890123456789012345?wait=true' \
  -H 'Content-Type: application/json' \
  -d '{ "content": "Hello from the other side." }'
```

### Körperfelder

| Feld             | Typ    | Anmerkungen                                                                    |
| ----------------- | ------- | ------------------------------------------------------------------------ |
| `content`         | Zeichenfolge | Bis zu 2.000 Zeichen. Kann weggelassen werden, wenn mindestens ein eingebettetes Element vorhanden ist. |
| `username`        | Zeichenfolge | Überschreibt den Webhook-Name für diese Nachricht. Bis zu 80 Zeichen.         |
| `avatar_url`      | Zeichenfolge | Überschreibt das Avatar für diese Nachricht. Absolute `http` oder `https` URL.    |
| `embeds`          | array   | Bis zu 10 [Einbettungen](embeds.md).                                             |
| `embed`           | Objekt | Ältere Singularform. Wird als `embeds: [embed]` behandelt.                      |
| `allowed_mentions`| Objekt | Steuert Ping-Anrufe. siehe unten.                                                |
| `tts`             | boolesche | Akzeptiert für Kompatibilität; derzeit ignoriert.                            |
| `flags`           | Nummer | Akzeptiert für Kompatibilität; derzeit ignoriert.                            |

`username` kann keine `disband` oder `clyde` enthalten, in irgendeiner Schreibweise. Das verhindert, dass ein Webhook das Aussehen von Plattformmitarbeitern annimmt.

Dateiaufhängungen werden noch nicht unterstützt. Eine mehrteilige Anfrage kann analysiert werden, aber Dateien werden nicht gespeichert; verwenden Sie einen Bot, wenn Sie Dateien hochladen müssen.

### Kontrollierung erwähnen

Standardmäßig parst ein Webhook sowohl Benutzernennungen als auch `@everyone` / `@here`, genau wie Discord.

Um niemanden zu pingen:

```json
{ "content": "Build 184 finished.", "allowed_mentions": { "parse": [] } }
```

Um Benutzernamen zuzulassen, aber nicht allen:

```json
{
  "content": "Thanks @polar.",
  "allowed_mentions": { "parse": ["users"] }
}
```

Die Datenbank speichert `@everyone` immer noch, wenn es unterdrückt wird, aber keine Benachrichtigung wird gesendet. Wenn das Feld ganz fehlt, wird alles parstiert.

## Nachrichtsobjekte

Mit `?wait=true` ist die Antwort eine Nachricht in Form von Discord. Disband verwendet seine numerische Nachrichtennummer in `id`.

```json
{
  "id": "4821",
  "type": 0,
  "content": "Deploy finished.",
  "channel_id": "…",
  "guild_id": "…",
  "author": {
    "id": "…",
    "username": "Deploy bot",
    "avatar": "https://example.com/deploy.png",
    "discriminator": "0000",
    "bot": true
  },
  "attachments": [],
  "embeds": [],
  "mentions": [],
  "mention_roles": [],
  "mention_everyone": false,
  "pinned": false,
  "tts": false,
  "timestamp": "2026-10-19T20:15:00.000Z",
  "edited_timestamp": null,
  "flags": 0,
  "components": [],
  "webhook_id": "…"
}
```

## Nachrichten verwalten

Ein Webhook kann Nachrichten abrufen, bearbeiten und löschen, die er gepostet hat. Verwenden Sie die numerische Nachrichtennummer aus der Ausführungsantwort.

| Methode | Endpunkt                                      | Ergebnis                         |
| -------- | --------------------------------------------- | ------------------------------ |
| `GET` | `/webhook/<key>/<token>/messages/<id>` | Die Nachricht abrufen. |
| `PATCH` | `/webhook/<key>/<token>/messages/<id>` | Bearbeiten Sie `content` und/oder `embeds`. |
| `DELETE` | `/webhook/<key>/<token>/messages/<id>`        | Löschen Sie die Nachricht. Gibt `204` zurück. |

Beispiel bearbeiten:

```bash
curl -X PATCH 'https://disband.dev/webhook/12345678/01234567890123456789012345/messages/4821' \
  -H 'Content-Type: application/json' \
  -d '{ "content": "Deploy finished — rolled back." }'
```

Nur Nachrichten, die von dieser Webhook verfasst wurden, können geändert werden. Eine andere Webhook erhält `404 Unknown Message`.

## Verwalten Sie den Webhook selbst

| Methode | Endpunkt                            | Ergebnis                                      |
| -------- | ----------------------------------- | ------------------------------------------- |
| `GET` | `/webhook/<key>/<token>` | Webhook Objekt (Name, Avatar, Kanal, URL). |
| `PATCH` | `/webhook/<key>/<token>` | Benennen Sie es mit `{ "name": "New name" }` um. |
| `DELETE` | `/webhook/<key>/<token>`            | Löschen Sie es. Gibt `204` zurück.                   |

Das Löschen über den URL ist dauerhaft und entspricht dem Löschen in der Integrationsansicht.

## Geschwindigkeitsbegrenzungen

Jeder Webhook ist auf **5 Anfragen pro 2 Sekunden** begrenzt. Die Grenze ist auf dem Token basierend, so dass ein lauter Webhook einen anderen nicht verlangsamen kann.

Eine eingeschränkte Anfrage liefert `429` zurück:

```json
{
  "message": "You are being rate limited.",
  "retry_after": 1.34,
  "global": false
}
```

Die Antwort enthält auch `Retry-After` (ganze Sekunden) und die üblichen `X-RateLimit-*`-Header. Warten Sie auf die Verzögerung und versuchen Sie es erneut.

## Fehler

Fehler verwenden die Form von Discord:

```json
{ "message": "Unknown Webhook", "code": 10015 }
```

| Status | Code | Bedeutung                                                    |
| ------ | ------- | ---------------------------------------------------------- |
| `400` | `50006` | Leerer Nachricht: kein Inhalt und keine Einbinden.                   |
| `400` | `50035` | Ungültiger Inhalt, falsche Einbettung oder Inhalt über 2.000 Zeichen. |
| `404` | `10015` | Ungewisser Webhook: falsche Leerzeichen-Taste, falscher Token oder gelöscht. |
| `404` | `10008` | Ungewisses Nachricht.                                           |
| `429` | —       | Gebührenbegrenzt. Ehre `Retry-After`.                        |
| `500` | —       | Serverfehler. Versuchen Sie es erneut mit einer Verzögerung.                          |

Ein `404 Unknown Webhook` sagt absichtlich nicht, ob die Leerzeichentaste oder der Token falsch war.

## Sicherheit

- Jeder mit dem URL kann posten. Veröffentlichen Sie es nicht in einem öffentlichen Repository oder stellen Sie es nicht bereit.
  Es ist in der Client-Seite des Codes enthalten.
- Speichern Sie das URL imselben Geheimfach, das Sie für die API-Schlüssel verwenden.
- Stellen Sie das Token sofort wieder her, wenn es durchläuft. Der alte URL hört sofort auf zu funktionieren.
- Ein Webhook schreibt nur an seinen konfigurierten Kanal. Er kann keine Nachrichten lesen,
  Mitglieder der Liste anzeigen oder die Platzierungseinstellungen ändern.

## verwandt

- [Einbettungen](embeds.md) - das Embedding-Objekt und seine Grenzen.
- [Bots](../bots/index.md) - bidirektionale Integrationen und Ereignisdurchgabe.
- [API-Referenz](../bots/api-reference.md) - der Bot HTTP-API, einschließlich
  Einbinden von Unterstützung.
