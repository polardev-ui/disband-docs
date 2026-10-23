# Bots

Disband-Bots sind selbstgehostete Integrationen. Sie führen den Code aus, Disband leitet Nachrichten an und von ihm weiter. Disband hostet oder führt niemals den Code Ihres Bots aus.

## Wie es funktioniert

1. **Erstellen Sie einen Bot** in **Einstellungen → Bots** und wählen Sie die Bereiche aus, die er benötigt. Sie erhalten
   Ein Token zurück - es wird **einmal** angezeigt.
2. In **Einstellungen → Bots** generieren Sie einen **Einladungslink** für den Server, den Sie möchten
   Der Bot, dem man beitreten kann, und schicke ihn an den **Besitzer** dieses Servers.
3. Der Besitzer öffnet den Link und genehmigt ihn. Der Bot wird Mitglied des Servers.
4. Sie betreiben eine der Client-Bibliotheken irgendwo (einen Server, eine Cloud-Funktion,
   Ihr Laptop) und es verbindet sich mit Disband mit dem Token.

## Anwendungsbereich

Das Reichweite eines Bots in einem Server ist die **Kollision** der Bereiche, die Sie bei der Erstellung des Servers angefordert haben, und der Bereiche, die der Besitzer für diesen bestimmten Server genehmigt hat:

| Umfang             | Beschreibung                                                          |
| ----------------- | -------------------------------------------------------------------- |
| `messages.read` | Erhalten Sie Nachrichtenevents am Gateway und lesen Sie Nachrichten/Kanäle. |
| `messages.write` | Senden und antworten Sie auf Nachrichten in Kanälen, die der Bot sehen kann. |
| `members.read` | Liste die Mitglieder der Server auf, denen der Bot beigetreten ist.                      |
| `channels.manage` | Channels erstellen, umbenennen und löschen - erfordert auch die Rolle `manage_channels` im Server. |

## Token-Authentifizierung

Jeder API-Anruf wird mit dem Bot-Token authentifiziert:

```
Authorization: Bot <token>
```

Bot-Tokens werden **in Ruhe hashed** - der Roh-Token wird nie gespeichert oder wiederhergestellt. Wenn er durchgesickert (oder Sie den Bot nicht mehr benötigen), widerrufen Sie ihn in **Einstellungen → Bots**; die Widerrufung tötet den Token sofort.

## Grenzen & Sicherheit

- Bis zu **5 Bots pro Konto**. Ein Bot kann jederzeit widerrufen werden, was seine
  Token.
- Nachrichten bis zu **4.000 Zeichen**. Bots benötigen die Rolle `mention_everyone`
  Genehmigung zur Verwendung von `@everyone`.
- Nur der **Besitzer** eines Servers kann eine Bot-Einladung genehmigen. Einladungen laufen nach
  **7 Tage**.
- Bot-Tokens werden im Ruhezustand hashed; der Roh-Token wird nie gespeichert oder wiederhergestellt.
- Bots können die Datenbank nie direkt erreichen - jede Aktion geht durch scoped
  API Endpunkte.

## Wähle einen Weg

- **[Erste Schritte](getting-started.md)** - erstellen Sie einen Bot und laden Sie ihn ein.
- **[Eigenen Bot hosten](hosting-your-own-bot.md)** - wo Sie den Client ausführen.
- **[JavaScript](clients/javascript.md)** / **[Python](clients/python.md)**.
- **[API-Referenz](api-reference.md)** wenn Sie direkt mit dem API sprechen möchten.
- **[Vorlagen](templates.md)** - bereitgestellte Willkommensbots, Ticketmanager und mehr.
