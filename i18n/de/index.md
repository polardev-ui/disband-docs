# Disband-Dokumentation

Alles, was Sie benötigen, um auf Disband aufzubauen.

## Bots

Disband-Bots sind **selbstgehostete Integrationen**: Sie führen den Code aus, Disband leitet Nachrichten an und von ihm weiter. Disband hostet oder führt Ihren Bot nie aus.

- **[Erste Schritte](bots/getting-started.md)** - erstellen Sie einen Bot, holen Sie sich seinen Token,
  und laden Sie ihn auf einen Server ein. Es dauert etwa zwei Minuten.
- **[Bots](bots/index.md)** - Berechtigungen, Einladungen, Limits und Sicherheit.
- **[Eigenen Bot hosten](bots/hosting-your-own-bot.md)** - wo Sie den Client ausführen und wie Sie ihn am Leben halten.
- **[JavaScript](bots/clients/javascript.md)** - `@disband/bot`.
  Keine Abhängigkeiten; funktioniert auf Node.js 18+, Deno, Bun und dem Browser.
- **[Python](bots/clients/python.md)** - `disband-bot`.
  Nur die Standardbibliothek; funktioniert auf Python 3.9+.
- **[API-Referenz](bots/api-reference.md)** - die HTTP-API, mit der beide Clients kommunizieren.

## Entwickler

Erstellen Sie Bots und integrieren Sie Disband in Ihre Spiele und Apps mit der HTTP-API.

- **[Entwickler](developers/index.md)** - Übersicht, hier starten und Sicherheit
  Hinweise für Spiele-/App-Integrationen.
- **[Bots](bots/index.md)** - Berechtigungen, Einladungen, Limits und Sicherheit.
- **[API-Referenz](bots/api-reference.md)** - die HTTP-API, mit der beide Clients kommunizieren.
- **[Vorlagen](bots/templates.md)** - bereitgestellte Willkommensbots, Ticketmanager und mehr.
- **[Webhooks](developers/webhooks.md)** - Veröffentlichung aus CI, Monitoring oder einem Spielserver über eine geheime URL. Kein Bot erforderlich.
- **[Einbettungen](developers/embeds.md)** - Karten im Discord-Stil für Veröffentlichungen,
  Warnmeldungen und Statusaktualisierungen.
- **[Statusseite](developers/status.md)** - wie die öffentliche Statusseite Dienste prüft, Betriebszeit aufzeichnet und Vorfälle behandelt.

## Themen

SUPER-Mitglieder können die gesamte App mit benutzerdefiniertem CSS, mitgelieferten Skins und hochgeladenen Icons neu gestalten.

- **[Themen](themes/index.md)** - die CSS-Variablen, die eine stabile API sind, die
  Selektoren, die sicher verwendet werden können, und eine Vorlage zum Einstieg.

## Clients herunterladen

- **[@disband/bot](https://raw.githubusercontent.com/polardev-ui/disband-docs/main/zips/disband-bot-0.1.0.tgz)** - der JavaScript-Client
  (`npm install ./disband-bot-0.1.0.tgz`).
- **[disband-bot](https://raw.githubusercontent.com/polardev-ui/disband-docs/main/zips/disband-bot-python-0.1.0.tar.gz)** - der Python-Client
  (`pip install ./disband-bot-python-0.1.0.tar.gz`).
