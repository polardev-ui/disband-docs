# Bot-API-Referenz

Der HTTP-API, mit dem Bots kommunizieren. Beide Client-Bibliotheken sind dünne Wrapper über genau diese Endpunkte, daher ist diese Seite auch das Rezept für die Erstellung eines Clients in einer anderen Sprache.

## Basisschlüssel URL und Authentifizierung

```
https://www.disband.dev
```

Jede Anfrage sendet:

| Header          | Wert                    |
| --------------- | ------------------------ |
| `Authorization` | `Bot <token>`            |
| `Content-Type` | `application/json` |

Ein fehlendes oder ungültiges Token gibt `401 { "error": "Invalid bot token" }` zurück. Ein widerrufenes Bot gibt das Gleiche zurück, daher bedeutet ein `401` "prüfen Sie das Token" - nicht "wiederholen Sie es".

Alle Endpunkte sind begrenzt: Ein Bot kann nur lesen oder schreiben, was seine Grenzen (und die Server-spezifischen Genehmigungen) erlauben. Jede 4xx/5xx-Antwort ist JSON mit einem Feld `error`.

## Lesen Sie vor dem Schreiben

- Bots sind **lesebeschränkt**, es sei denn, Sie gewähren `messages.write` / `channels.manage`.
- `channels.manage`-Aktionen erfordern auch, dass das Bot-Konto das
  `manage_channels` **Rolle** auf diesem Server.
- Beide Clients haben die Informationen über die Scope pro Nachrichtenevent: nichts in der API
  Gibt Daten zurück, die dem Bot nicht gewährt wurden.

## Der Gateway (Event-Long-Poll)

```
GET /api/v1/gateway?timeout=20
```

Der Gateway ist ein Long-Poll, kein Websocket. Die Anfrage blockiert die Serverseite, bis ein Ereignis verfügbar ist oder die Zeitüberschreitung abläuft, und gibt dann zurück, was angekommen ist. Der Client schließt sich dem an. Die Zeitüberschreitung wird auf 1-20 Sekunden begrenzt.

Antwort:

```json
{
  "events": [
    {
      "bot_id": "…",
      "type": "messageCreate",
      "payload": { "id": "…", "channel_id": "…", "server_id": "…", "content": "…" }
    }
  ]
}
```

`type` ist `messageCreate`, `messageUpdate` oder `messageDelete`. Die Lieferung erfolgt **mindestens einmal** - ein Bot, der zwischen dem Abrufen und der Verarbeitung abstürzt, kann das gleiche Ereignis erneut sehen. Behandeln Sie sie idempotent (durch `payload.id`).

### Ereignislasten

| Typ             | Ladungsfeld                                                |
| ---------------- | ----------------------------------------------------- |
| `messageCreate` | Das vollständige Nachrichtsobjekt (unten).                      |
| `messageUpdate` | `id`, `channel_id`, `server_id`, `content`, `edited_at` |
| `messageDelete` | `id`, `channel_id`, `server_id`                       |

Nachrichtsobjekt:

```json
{
  "id": "…",
  "channel_id": "…",
  "server_id": "…",
  "author": { "id": "…", "username": "…", "display_name": "…", "avatar_url": "…", "is_bot": false },
  "content": "Deploy finished",
  "reply_to_id": null,
  "mentions": [],
  "embeds": [],
  "attachment_url": null,
  "attachment_type": null,
  "created_at": "2026-01-01T00:00:00Z",
  "edited_at": null,
  "display_id": 1234
}
```

Nur Bots mit `messages.read` (beide auf dem Bot-Konto **und** in diesem Server erteilt) erhalten Ereignisse.

## Endpunkte

### Nachrichten

**POST `/api/v1/channels/:id/messages`** - sendet eine Nachricht (`messages.write`).

```json
{
  "content": "Deploy finished",
  "reply_to_id": null,
  "embeds": [
    { "title": "Build 1842", "description": "All 412 tests passed.", "color": 5793266 }
  ]
}
```

`content` kann weggelassen werden, wenn `embeds` vorhanden ist. Einbinden verwendet die Form und die Grenzen von Discord; siehe [Einbettungen](../developers/embeds.md) für jedes Feld und die genauen Grenzen. Eine Nachricht ohne Inhalt oder Einbinden wird mit `400` abgelehnt.

Gibt `201` mit `{ "message": { … } }` zurück.

**ERHALTEN SIE `/api/v1/channels/:id/messages`** - liest Nachrichten (`messages.read`).

Abfrage: `limit` (1-100, Standard 50), `before` (Nachrichtennummer, für rückwärtsgehende Pagination).

Gibt `200` mit `{ "messages": [ … ] }` zurück.

### Sender

**ERHALTEN SIE `/api/v1/servers/:id/channels`** - listet Kanäle auf (`messages.read`).

Gibt `{ "channels": [ … ] }` zurück.

**POST `/api/v1/servers/:id/channels`** - erstellt einen Kanal (`channels.manage` + `manage_channels`-Rolle).

```json
{ "name": "deploys", "type": "text", "category_id": null }
```

Gibt `201` mit `{ "channel_id": "…" }` zurück.

**PATCH `/api/v1/channels/:id`** - benennt einen Kanal um (`channels.manage`).

```json
{ "name": "deploys-2" }
```

Gibt `{ "success": true }` zurück.

**LÖSCHEN `/api/v1/channels/:id`** - löscht einen Kanal (`channels.manage`).

Gibt `{ "success": true }` zurück.

### Mitglieder

**ERHALTEN SIE `/api/v1/servers/:id/members`** - listet Mitglieder auf (`members.read`).

Gibt `{ "members": [ … ] }` zurück.

### Abschieds

**POST `/api/v1/servers/:id/leave`** - entfernt den Bot von einem Server.

Gibt `{ "success": true }` zurück.

### Einladungen

**POST `/api/v1/bots/:botId/invites`** - generiert eine Einladung für den Bot, sich einem Server anzuschließen.

```json
{ "server_id": "…", "scopes": ["messages.read", "messages.write"] }
```

Gibt die Einladung (einschließlich eines `invite_url`) zurück, um sie an den Serverbesitzer zu senden. Nur der Besitzer kann sie genehmigen; Einladungen laufen nach 7 Tagen ab.

### Identität (bei der Einschaltung verwendet)

**ERHALTEN SIE `/api/bot/me`** - gibt das Bot-Konto zurück, das von den Kunden verwendet wird, um `ready` zu starten. Nicht Teil der versionierten `v1`-Oberfläche.

## Fehler

| Status | Bedeutung                                                        | Beispiele für das Feld `error`                              |
| ------ | -------------------------------------------------------------- | --------------------------------------------------- |
| `401` | Fehlendes/ungültiges/entzogenes Token.                                 | `"Invalid bot token"`                               |
| `403` | Fehlende Zugriffsberechtigung für den Bereich oder die Rolle.                              | `"This bot does not have messages.write in that server"` |
| `404` | Kanal/Server nicht gefunden oder nicht für den Bot sichtbar. | `"Channel not found"`                               |
| `429` | Tarifbeschränkt.                                                  | Enthält einen `Retry-After`-Header.                    |
| `503` | Unterstützendes Geschäft nicht verfügbar (Gateway-Abfrage).                   | `"Event delivery unavailable."`                     |
| `5xx` | Serverfehler. Versuchen Sie es erneut mit einer Verzögerung.                              | `"Internal server error"`                           |

## Grenzen

- Bis zu **5 Bots pro Konto**; Der Token eines Bots stirbt sofort bei Widerruf.
- Nachrichten bis zu **4.000 Zeichen**; `@everyone` benötigt das `mention_everyone`
  Rolle-Berechtigung.
- Bis zu **10 Einbinden pro Nachricht**, mit den gleichen Feldbeschränkungen wie Webhooks. sehen
  [Einbettungen](../developers/embeds.md).
- Es gelten Ratebeschränkungen pro Bot-Token. Wenn Sie `429` eingeben, respektieren Sie `Retry-After`.

## Schreiben Sie Ihren eigenen Kunden

1. `GET /api/bot/me` mit `Authorization: Bot <token>` zur Lösung der Identität.
2. Schleife auf `GET /api/v1/gateway?timeout=20`, verarbeiten Sie Ereignisse durch `type`.
3. Verwenden Sie die oben genannten Endpunkte mit demselben Authentifizierungsheader; mappen Sie `401` → "falscher Token",
   `403` → "fehlende Berechtigung", `429` → "langsam werden und nach `Retry-After` erneut versuchen".

## Webhooks sind eine andere Oberfläche

Der Bot API authentifiziert sich mit `Authorization: Bot <token>` und kann Ereignisse über das Gateway lesen. Ein [Webhooks](../developers/webhooks.md) ist ein einseitiges Geheimnis URL: kein Bot-Konto, kein Authentifizierungsheader und keine Möglichkeit, Nachrichten zu lesen. Verwenden Sie einen Webhook für Benachrichtigungen und einen Bot, wenn Sie auf Chats reagieren müssen.

Die offiziellen Kunden sind `@disband/bot` (JavaScript) und `disband-bot` (Python) - siehe die Seiten [JavaScript](clients/javascript.md) und [Python](clients/python.md).
