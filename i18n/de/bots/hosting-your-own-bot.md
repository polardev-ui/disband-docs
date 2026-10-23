# Eigenen Bot hosten

Disband hostet oder führt Ihren Bot nicht aus. Sie führen den Client überall aus, wo Sie wollen, und er spricht mit Disband über eine Long-Polling-Gateway mit Hilfe des Bot-Tokens. Diese Seite behandelt die praktische Seite des Aufrechterhalts eines Bots.

## Wo man es ausführen kann

Jede Maschine, die outbound HTTPS-Anfragen stellen kann, funktioniert. Da der Gateway long-polling ist (Ihr Code hält eine Verbindung offen und Disband gibt Ereignisse zurück, wenn sie eintreffen), benötigen Sie keine öffentliche Adresse, eingehende Ports oder ein Websocket.

Gute Optionen, zuerst die billigsten:

| Gastgeber                       | Anmerkungen                                                                 |
| -------------------------- | --------------------------------------------------------------------- |
| Ein Laptop / Desktop | Gut für einen persönlichen Bot, der online ist, wenn Sie es sind. |
| Ein kleiner VPS (1 GB RAM) | ~4–6 $/Monat; der JavaScript-Client braucht fast nichts. |
| Eine Cloud-Funktion / Worker | Serverless funktioniert, wenn die Plattform einen langlebigen Prozess zulässt; die Clients sind stateless genug, um billig neu gestartet zu werden. |
| Ein Container / Pterodactyl | Die Kunden haben keine Laufzeitabhängigkeiten, daher funktioniert jedes Bild. |

## Was Sie eigentlich brauchen

- **JavaScript**: Node.js 18+, oder Deno, oder Bun. Null Laufzeitabhängigkeiten.
- **Python**: Python 3.9+. Nur die Standardbibliothek (Threading + `urllib`).

Es gibt keine Datenbank, keine Warteschlange und kein Framework zum Installieren.

## Es am Leben erhalten

Der Gateway schließt sich immer wieder auf sich selbst zurück; er verbindet sich automatisch wieder und versucht es erneut. Drei Dinge bringen echte Bots dazu, zu sterben:

1. **Crash-Schleifen.** Umwickeln Sie den Client in einen Supervisor und starten Sie ihn bei Fehlern neu:
   ```bash
   # systemd
   [Unit]
   Description=disband-bot
   After=network-online.target

   [Service]
   ExecStart=/usr/local/bin/node /opt/my-bot/index.js
   Restart=always
   RestartSec=3
   Environment=DISBAND_BOT_TOKEN=…

   [Install]
   WantedBy=multi-user.target
   ```

2. **Ablaufende Token.** Wenn der Bot widerrufen wird (oder eine Einladung abläuft, bevor er
   Genehmigt), gibt der Gateway API `401` zurück. Behandeln Sie es: Protokollieren Sie es deutlich und stoppen Sie,
   Statt ewig zu versuchen, wiederzugeben, stellen beide Clients dies als Ereignis `error` dar -
   JavaScript's `AuthError` / Python's `AuthError` - und der Schleife hört stattdessen auf
   Von Schlagen.

3. **Stille Konfigurationsdrift.** Bewahren Sie den Token in einer Umgebungsvariable oder einem Geheimnis auf.
   Speichern, nicht in der Quelle. Wenn Sie den Token drehen, starten Sie den Prozess neu mit
   Der neue Wert.

## Daten lesen und schreiben

Bots sprechen nur mit dem eingeschränkten HTTP-API. Um den Zustand abzufragen oder zu speichern, verwenden Sie beliebigen Speicher, den Sie bereits betreiben - eine Datei, eine Datenbank, Redis - dem Client ist das egal.

## Bots für mehrere Server

Ein Bot kann zu vielen Servern eingeladen werden. Die genehmigten Bereiche sind pro Server, daher kann ein Bot, der überall Nachrichten lesen kann, auch nur dort schreiben, wo der Besitzer `messages.write` gewährt hat. Ihr Code kann auf `message.server_id` aufgebrochen werden, wenn das Verhalten je nach Server unterschiedlich sein muss.

## Weitergehen

- Sehen Sie sich die **[API-Referenz](api-reference.md)** für die genauen Endpunkte an, die
  Kunden verwenden - nützlich, wenn Sie Ihren eigenen Client in einer anderen Sprache schreiben möchten.
- Die **[JavaScript](clients/javascript.md)** und **[Python](clients/python.md)**
  Referenzseiten enthalten jede Methode und jedes Ereignis.
