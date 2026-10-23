# Einbettungen

Ein Einbettung ist eine strukturierte Karte, die an eine Nachricht angehängt ist: eine farbige Streifen, einen Titel, reichhaltigen Text, Felder, Bilder und einen Fußzeilen. Disband verwendet die Einbettungsform und -begrenzungen von Discord, so dass eine Einbettung, die für eine Discord-Webhook oder einen Bot erstellt wurde, normalerweise unverändert funktioniert.

Embeddings können per: gesendet werden.

- [Webhooks](webhooks.md), mit `embeds` im Ausführungskörper;
- [API-Referenz](../bots/api-reference.md), mit `embeds` im Nachrichtentext.

Client-seitige Nachrichten können keine Einbauten direkt festlegen. Das verhindert, dass ein Mitglied eine Webhook oder eine Einbauskarte gefälscht macht.

## Ein vollständiges Beispiel

```json
{
  "content": "A new release is ready.",
  "embeds": [
    {
      "title": "Disband 2.4.1",
      "description": "Fixes the **role picker** and improves uploads.",
      "url": "https://disband.dev/changelog",
      "color": 5793266,
      "timestamp": "2026-10-19T20:15:00.000Z",
      "author": {
        "name": "Release bot",
        "url": "https://disband.dev",
        "icon_url": "https://disband.dev/logo.png"
      },
      "thumbnail": {
        "url": "https://disband.dev/logo.png"
      },
      "fields": [
        { "name": "Channel", "value": "stable", "inline": true },
        { "name": "Build", "value": "1842", "inline": true },
        { "name": "Rollout", "value": "100% of spaces", "inline": false }
      ],
      "footer": {
        "text": "Disband releases",
        "icon_url": "https://disband.dev/logo.png"
      }
    }
  ]
}
```

`5793266` ist `0x5865F2`, das blaue Markenzeichen von Disband.

## Das eingebettete Objekt

| Feld | Typ | Anmerkungen                                                       |
| ------------- | ------ | ----------------------------------------------------------- |
| `title`       | Zeichenfolge | Bis zu 256 Zeichen. Wird als Link dargestellt, wenn `url` gesetzt ist. |
| `description` | Zeichenfolge | Bis zu 4.096 Zeichen. Unterstützt Markdown.                  |
| `url`         | Zeichenfolge | Macht den Titel anklickbar. Absolute `http` oder `https` URL.  |
| `color` | Zahl | `0xRRGGBB` als Ganzzahl. Auch eine `"#5865F2"`-Zeichenfolge funktioniert. |
| `timestamp` | Zeichenfolge | ISO 8601 Datum und Uhrzeit. Im Fußzeilen angezeigt.                |
| `footer`      | Objekt | `{ "text": "…", "icon_url": "…" }`. Text bis zu 2.048 Zeichen.       |
| `author`      | Objekt | `{ "name": "…", "url": "…", "icon_url": "…" }`. Name bis zu 256 Zeichen. |
| `fields`      | array  | Bis zu 25 Feldobjekte. siehe unten.                          |
| `image` | Objekt | `{ "url": "…" }`. Unten der Beschreibung angezeigt. |
| `thumbnail` | Objekt | `{ "url": "…" }`. Rechts angezeigt.                   |
| `video`       | Objekt | Akzeptiert für Kompatibilität; noch nicht gerendert.              |
| `provider` | Objekt | Akzeptiert für Kompatibilität; noch nicht gerendert. |

Alle Felder von URL müssen absolute `http` oder `https` URLs sein. URLs, das einen Benutzernamen oder ein Passwort enthält, wird verworfen. Unsichere Bilder von URLs werden vom Client sowie vom Server gelöscht.

### Feld

```json
{
  "name": "Uptime",
  "value": "99.98% over 90 days",
  "inline": true
}
```

| Immobilie | Typ | Anmerkungen                                            |
| -------- | ------- | ------------------------------------------------ |
| `name` | Zeichenfolge | Pflichtfeld. Bis zu 256 Zeichen. |
| `value` | Zeichenfolge | Pflichtfeld. Bis zu 1.024 Zeichen. Markdown funktioniert. |
| `inline` | boolesche | `true` legt Felder nebeneinander, wo Platz erlaubt. |

Ein Feld mit einem fehlenden oder leeren `name` oder `value` ist ein schwerer Fehler. Wenn Sie möglicherweise leere Daten haben, lassen Sie das Feld aus oder ersetzen Sie es durch einen Strich.

## Markdown

Beschreibungen und Feldwerte unterstützen Disband's Markdown: Fett, Kursiv, durchgestrichen, Inline-Code, Codeblöcke, Links und benutzerdefinierte Emojis. Titel, Autorennamen und Fußzeilentext sind reine Textdateien.

Nennungen innerhalb eingebetteter Texte werden angezeigt, aber erzeugen keinen Ping. Verwenden Sie `content`, wenn Sie eine echte Benachrichtigung über eine Nennung benötigen.

## Grenzen

| Limit                              | Wert |
| ---------------------------------- | ----- |
| Einbauten pro Nachricht                 | 10    |
| Titel                              | 256   |
| Beschreibung                        | 4.096 |
| Felder pro Einbettung                   | 25    |
| Feldname                         | 256   |
| Feldwert                        | 1.024 |
| Fußzeilentext                        | 2.048 |
| Autorenname                        | 256 |
| Gesamtzahl der Zeichen in allen Einbänden | 6.000 |

Die Gesamtzahl umfasst Titel, Beschreibungen, Fußzeilentext, Autorennamen, Feldnamen und Feldwerte. URLs und Bildmetadata werden nicht mitgezählt.

## Wie die Eingabe normalisiert wird

Der API validiert jedes eingebettete Element, bevor es die Datenbank erreicht:

- Unbekannte Eigenschaften werden gelöscht.
- Der Text wird abgeschnitten. Zu langer Text wird bis zum Limit abgeschnitten, anstatt abgelehnt zu werden.
- Ungültige Farben werden gelöscht.
- Ungültige URLs werden gelöscht. Gültige URL-Felder werden beibehalten.
- Ungültige Zeitstempel werden gelöscht.
- Ein leerer Einbettung wird mit `Embed is empty` abgelehnt.
- Ein Feld ohne Name oder Wert wird abgelehnt.
- Mehr als 10 Einbände oder mehr als 6.000 Zeichen insgesamt werden abgelehnt.

Quadratische Klammern in einem Fehlernamen identifizieren das genaue Element, zum Beispiel:

```text
embeds.0.fields.2: name and value are required
```

## Einbinden von Inhalten senden

### Von einem Webhook

```bash
curl -X POST 'https://disband.dev/webhook/12345678/01234567890123456789012345' \
  -H 'Content-Type: application/json' \
  -d '{
    "content": "A new release is ready.",
    "embeds": [{
      "title": "Disband 2.4.1",
      "description": "Fixes the **role picker** and improves uploads.",
      "color": 5793266
    }]
  }'
```

### Von einem Bot

```bash
curl -X POST 'https://www.disband.dev/api/v1/channels/CHANNEL_ID/messages' \
  -H "Authorization: Bot $DISBAND_BOT_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "embeds": [{
      "title": "Nightly build",
      "description": "All 412 tests passed.",
      "color": 5793266
    }]
  }'
```

Bei der Übermittlung nur von Einbinden kann `content` weggelassen werden. Eine Nachricht ohne Inhalt oder Einbinden wird abgelehnt.

## verwandt

- [Webhooks](webhooks.md) - Ausführen und Verwaltung von Webhook-Nachrichten.
- [API-Referenz](../bots/api-reference.md) - die Endpunkte der Bot-Nachrichtendienste.
