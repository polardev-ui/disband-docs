# Statusseite

Die Statusseite von Disband ist selbstgehostet. Sie ist nicht auf einen Statusdienst von Drittanbietern angewiesen, so dass sie immer noch genau berichten kann, wenn der Hauptwebhost API oder die Bereitstellung statischer Assets Probleme haben.

- Öffentliche Seite: [disband.dev/status](https://www.disband.dev/status)
- RSS-Feed: [disband.dev/status/feed.xml](https://www.disband.dev/status/feed.xml)
- Eigentümer-Admin: [disband.dev/status/admin](https://www.disband.dev/status/admin)

## Was die öffentliche Seite zeigt

Die Seite gruppiert Monitore nach Dienstleistung. Für jeden Monitor werden folgende Informationen angezeigt:

- der aktuelle Stand aus dem letzten Check;
- der Status und die Antwortzeit des HTTP-Checks;
- eine 90-tägige Betriebszeit-Bar, ein Segment pro Tag;
- das letzte Mal, als ein Scheck ausgezahlt wurde.

Unter den Monitoren befinden sich Vorfälle, geplante Wartungsarbeiten und Ankündigungen. Jeder öffnet eine Detailseite mit der vollständigen Aktualisierungszeitlinie. Der Feed veröffentlicht die letzten 25 Vorfälle, Wartungsfenster und veröffentlichte Ankündigungen als RSS 2.0.

## Schecks

Eine Supabase Edge-Funktion namens `status-probe` läuft jede Minute unter `pg_cron`. Sie untersucht alle eingeschalteten Monitore parallel und speichert eine Zeile pro Überprüfung.

Jeder Monitor hat:

| Setting         | Bedeutung                                                                |
| --------------- | ---------------------------------------------------------------------- |
| Name            | Die öffentliche Marke, zum Beispiel **Website**.                             |
| Gruppe | Der Abschnitt, unter dem er erscheint, zum Beispiel **Disband**. |
| URL             | Der absolute `http` oder `https` URL, um anzufordern.                         |
| Methode | `GET` oder `HEAD`. Standardmäßig ist `GET`.                                    |
| Erwarteter Status | Der genaue HTTP-Status, der als gesund gilt. Standardmäßig ist `200`. |
| Schlüsselwort | Optionale Textpassage, die im Antwortkörper erscheinen muss. |
| Zeitüberschreitung | 1–30 Sekunden. Standardmäßig 10 Sekunden.                                  |
| Headers | Optionale Anfrage-Header, auf der Serverseite gespeichert. |
| Aktiviert | Ob die Probe es überhaupt anfordert.                                  |
| Öffentlich | Ob es zum öffentlichen Snapshot beiträgt.                         |

Ein Monitor ist nur gesund, wenn der Statuscode **gleich** ist und der optionale Schlüsselwort vorhanden ist. Umleitungen werden befolgt. Ein Zeitüberschreitung, Netzwerkfehler, falscher Status oder fehlendes Schlüsselwort wird als fehlgeschlagener Check mit dem Grund aufgezeichnet.

Die Probe läuft unabhängig von der Web-App. Ein Fehler beim Web-Host stoppt die Aufzeichnung der Überprüfungen nicht.

## Geschichte und Betriebszeit

Jeder Scheck wird in `status_checks` gespeichert. Ein Datenbank-Trigger fasst jeden Scheck in `status_daily` zusammen, so dass die 90-Tage-Säule eine günstige Abfrage ist und nicht eine Aggregation über Millionen von Zeilen.

- Rohe Schecks werden **90 Tage** aufbewahrt.
- Tägliche Zusammenfassungen werden **180 Tage** aufbewahrt.
- Die öffentliche Seite zeigt die letzten **90 Tage** an.
- Das Tagessegment ist der Prozentsatz der erfolgreichen Überweisungen an diesem Tag.

Ein Loch - ein Tag ohne Kontrollen - wird als keine Daten angezeigt, nicht als Ausfallzeit.

## Automatische Vorfälle

Die Probe öffnet einen Vorfall automatisch, wenn ein Monitor **drei Kontrollen in Folge** fehlgeschlagen hat. Der Vorfall ist ein **großer** Vorfall, der mit diesem Monitor verbunden ist und mit der **Untersuchung** beginnt, mit einem automatisierten Update, das den letzten Fehler enthält.

Wenn der nächste Check erfolgreich ist, wird der Vorfall auf **Gelöst** umgestellt und ein Update erfasst, wie lange der Ausfall gedauert hat. Der Vorfall bleibt auf der Seite und im Feed mit seiner vollständigen Geschichte.

Wenn ein Dienst klappert, aber nicht dreimal hintereinander abstürzt, wird kein automatischer Vorfall eröffnet. Der Eigentümer kann trotzdem ein manuelles Update zu einem automatischen Vorfall hinzufügen, während dieser geöffnet ist.

## Manuelle Vorfälle, Wartung und Ankündigungen

Der Eigentümer kann drei Arten von Einträgen veröffentlichen:

| Art | Verwendung für                                                         |
| ------------- | --------------------------------------------------------------- |
| `incident` | Ein unerwartetes Problem.                                           |
| `maintenance` | Geplante Arbeit, optional mit Start- und Endzeit. |
| `announcement`| Eine allgemeine Servicehinweis, die keine Ausfallzeit ist.                 |

Ein Vorfall kann keinen, einen oder mehrere Monitore betreffen. Seine Auswirkung ist eine von `none`, `minor`, `major` oder `critical`.

Die Aktualisierungsstatus sind:

- `investigating`
- `identified`
- `monitoring`
- `resolved`
- `scheduled`
- `in_progress`
- `completed`
- `published`

Jede Aktualisierung fügt einen zeitstempelten Eintrag in die Ereigniszeitleiste hinzu und setzt den aktuellen Status des Ereignisses fest. Die Markierung einer Aktualisierung mit dem `resolved` oder `completed` setzt auch die behobene Zeit fest. Die Veröffentlichung einer späteren Aktualisierung mit einem anderen Status öffnet sie erneut.

## Allgemeiner Status

Die Banner werden in dieser Reihenfolge entschieden:

1. Ein aktives Wartungsfenster zeigt **Wartung im Gange** oder
   **Planmäßige Wartung** bevor es beginnt.
2. Ein aktiver Hauptausfall oder ein kritischer Vorfall sagt **Hauptausfall**.
3. Ein aktiver kleiner Vorfall sagt **Teilweise degradiert**.
4. Fehlende Monitore sagen **Teilweise beeinträchtigt** oder **Großer Ausfall**, wenn jedes
   Der öffentliche Monitor funktioniert nicht mehr.
5. Ohne Fehler und mindestens ein Ergebnis heißt es **Alle Systeme betriebsbereit**.
6. Bevor die ersten Schecks eintreffen, heißt es **Wartend auf die ersten Schecks**.

Lösungsgeschlossene Vorfälle haben keinen Einfluss auf den Banner.

## Privatsphäre

Der öffentliche Lesepfad ist eine Datenbankfunktion, nicht direktem Tabelleneintrag. Er gibt Monitornamen, Gruppen, Zustände, Latenz, Betriebszeit und Vorfälle zurück. Er weicht absichtlich aus:

- Überwachung von URLs;
- Anfrage-Header;
- Probenfehlertext;
- interne Kontroll-IDs;
- die Identitäten hinter den Ereignisaktualisierungen.

Die Basistabellen haben die Sicherheit auf Zeilenebene aktiviert, ohne öffentliche Richtlinien. Nur die Servicefunktion und die Probedarstellung können sie direkt lesen.

## Verwaltung

`/status/admin` ist auf den **Plattformbesitzer** beschränkt, der angemeldet ist. Es handelt sich nicht um eine Platzrolle und kann nicht an ein anderes Mitglied vergeben werden. Unauthentifizierte Anfragen erhalten `401`; andere angemeldete Konten erhalten `403`.

Der Admin-Bildschirm kann:

- Monitore erstellen, bearbeiten, aktivieren, deaktivieren, veröffentlichen oder löschen;
- sehen Sie sich die URL, Header und das letzte Ergebnis jedes Monitors an;
- Veröffentlichung von Vorfällen, Wartungsfenster und Ankündigungen;
- Zeitlinienaktualisierungen hinzufügen und die Auswirkungen oder betroffenen Dienste eines Vorfalls ändern;
- löschen Sie einen Monitor und seine Historie.

### Admin API

Der Bildschirm verwendet diese für Besitzer nur zugänglichen Routen:

| Methode                 | Endpunkt                                       |
| ---------------------- | ---------------------------------------------- |
| `GET`, `POST`          | `/api/status-admin/monitors`                   |
| `PATCH`, `DELETE`      | `/api/status-admin/monitors/{id}`              |
| `GET`, `POST`          | `/api/status-admin/incidents`                  |
| `PATCH`, `DELETE`      | `/api/status-admin/incidents/{id}`             |
| `POST`                 | `/api/status-admin/incidents/{id}/updates`     |

Sie akzeptieren den Supabase-Zugriffstoken des Eigentümers als `Authorization: Bearer <token>`. Es handelt sich um Implementierungsdetails des Admin-Bildschirms, nicht um ein öffentliches API; die Form kann sich ändern.

## Betriebliche Anmerkungen

- Die Probe authentifiziert sich mit einem Geheimnis, das in Supabase Vault unter gespeichert ist
  `status_probe_key`. Das Geheimnis wird innerhalb der Datenbank verglichen und ist nicht
  Zur Funktion zurückgekehrt.
- Die Aufgabe `pg_cron` heißt `status-probe`. Sie liest das Geheimnis aus dem Safe auf
  Jede Ausführung, so dass die Rotation des Geheimnisses keine Bearbeitung der Aufgabe erfordert.
- Die Edge-Funktion wird mit deaktivierter JWT-Verifizierung bereitgestellt, weil sie
  Authentifiziert stattdessen mit dem Vault-Geheimnis.
- Wenn die Probe selbst nicht mehr läuft, wird die Seite als veraltet angezeigt.
  **letztmals überprüfte** Zeiten. Das ist das Signal, den Cron-Job und Edge zu überprüfen.
  Funktionsprotokolle.

## verwandt

- [Webhooks](webhooks.md) - senden Sie Ausfallbenachrichtigungen in einen Kanal.
- [Einbettungen](embeds.md) - formatieren Sie diese Benachrichtigungen.
