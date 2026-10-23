# Entwickler

Bauen Sie auf Disband auf: Bots, Integrationen und Tools, die mit Ihren Bereichen von außen kommunizieren. Alles hier ist selbstgehostet - Disband läuft Ihren Code nie aus.

## Was Sie bauen können

- **Bots** - selbstgehostete Konten, die Nachrichten lesen und schreiben, Kanäle verwalten,
  Und reagieren Sie auf Ereignisse über eine lange Abfragegateway. Sehen Sie sich die [Bots](../bots/index.md) an.
- **Webhooks** - einseitige Benachrichtigungen, die über ein geheimes URL veröffentlicht werden, ohne Bot
  Code oder Token. siehe [Webhooks](webhooks.md).
- **Eingebaute Karten** - strukturierte Versionshinweise, Benachrichtigungen und Statusaktualisierungen.
  Siehe [Einbettungen](embeds.md).
- **Benutzerdefinierte Kunden** - sprechen Sie direkt mit der HTTP-API, wenn Sie eine Sprache benötigen, die
  Versandkunden decken nicht ab. Die [API-Referenz](../bots/api-reference.md) ist
  Der Vertrag.
- **Status-Integrationen** - verfolgen Sie Disband-Vorfälle über RSS oder lesen Sie, wie die
  [Statusseite](status.md) führt Überprüfungen auf und öffnet Vorfälle.

## Beginnen Sie hier

1. **[Erste Schritte](../bots/getting-started.md)** - erstellen Sie einen Bot, holen Sie sich seinen
   Token, laden Sie es in einen Raum ein. Etwa zwei Minuten.
2. **[Eigenen Bot hosten](../bots/hosting-your-own-bot.md)** - wo Sie ihn ausführen können
   Der Kunde und wie man ihn am Leben hält.
3. **[JavaScript](../bots/clients/javascript.md)** oder
   **[Python](../bots/clients/python.md)**.
4. **[API-Referenz](../bots/api-reference.md)** für die genauen Endpunkte.
5. **[Webhooks](webhooks.md)** oder **[Einbettungen](embeds.md)**, wenn Sie nur
   Einwegbenachrichtigungen.
6. **[Statusseite](status.md)** für die öffentliche Statusseite und den RSS-Feed.

## Disband in ein Spiel oder eine App implementieren

Disband enthüllt ein einfaches HTTP-API, das mit einem Bot-Token authentifiziert ist. Es gibt keinen nativen SDK oder RPC-Runtime zum Verknüpfen - jede Stack, die HTTPS-Anfragen stellen kann, funktioniert. Eine typische Integration sieht wie folgt aus:

1. Erstellen Sie einen Bot unter **Einstellungen → Bots** und gewähren Sie ihm `messages.write` (und
   `channels.manage`, wenn es Kanäle erstellen sollte).
2. Laden Sie den Bot in den Bereich ein, in den Sie einstellen möchten.
3. Speichern Sie den Token im Geheimen Speicher Ihres Spiels oder Ihrer App - niemals auf der Client-Seite.
   Code, der an Spieler versendet wird.
4. Rufen Sie von Ihrem Backend die eingeschränkten Endpunkte auf:

   ```bash
   curl -X POST https://www.disband.dev/api/v1/channels/CHANNEL_ID/messages \
     -H "Authorization: Bot $DISBAND_BOT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"content": "Server restarted — 12 players online."}'
   ```

5. Um auf Chats von innerhalb Ihres Spiels zu reagieren, müssen Sie den Gateway lange abfragen und senden.
   `messageCreate`-Ereignisse in Ihre Spiellogik einbinden.

### Sicherheitshinweise

- Bot-Tokens werden im Ruhezustand hashed und nur einmal angezeigt. Widerrufen Sie sie sofort, wenn einer
  Leckagen.
- Bewahren Sie Token auf einem Server auf, den Sie kontrollieren. Das Versenden eines Tokens in einem Spielclient ermöglicht es
  Jeder, der sich als Ihr Bot ausgibt.
- Beschränken Sie die Möglichkeiten der Bots auf die geringsten Berechtigungen, die sie benötigen. Ein Bot, der nur zur Veröffentlichung verwendet wird, benötigt keine zusätzlichen Berechtigungen.
  `members.read` oder `channels.manage`.

## Themen für Entwickler

Wenn Sie einen markenbezogenen Client oder Skin erstellen, sind die Variablen CSS in der [Themen](../themes/index.md) die stabile Styling-API.

## Fragen

- Fehlerberichte: Erstellen Sie ein Problem oder senden Sie eine E-Mail an das Team.
- Verwenden Sie den Support in der App für Konto-spezifische Probleme.
