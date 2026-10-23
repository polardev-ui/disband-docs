# Themen

Disband **SUPER** Mitglieder können die App neu gestalten: Wählen Sie eine der mitgelieferten Skins aus oder schreiben Sie Ihre eigene CSS und laden Sie Ihre eigenen Icons hoch. Ein Theme wird in Ihrem Konto gespeichert, so dass es bereits aktiviert ist, wenn Sie sich an einem anderen Ort anmelden.

Themen gelten für **Web und Desktop**. iOS und Android sind nativ erstellt und haben keine Stylesheet, auf die ein Thema angewendet werden kann, so dass Ihr Thema synchronisiert wird, aber nicht dort gezeichnet wird.

## Die versandten Skins

Neun sind eingebaut und ändern sich mehr als nur die Farbe - Ecken, Schriftarten und die Art und Weise, wie die Steuerungen gezeichnet werden:

- **Minecraft** - Pixeltyp, harte Kanten, kein gerader Winkel.
- **Call of Duty** - staubiges Khaki, gestanzte Caps, Filmkorn über allem.
- **2000er Jahre** - Tahoma, gebogene Steuerknöpfe, Windows XP blau.
- **Frutiger Aero** - glänzendes Glas, blau in grün, Licht trifft jeden Winkel.
- **Terminal** - grünes Phosphor auf Schwarz, monospaced, mit den Scanlinien.
- **Vaporwave** - heißer Rosa und Cyan über Lila, Chrom auf jeder Taste.
- **Papier** - warmes Off-Weiß und eine Serif; liest sich wie etwas, das gedruckt wurde.
- **Neon** - fast schwarz, mit magenta und cyan, die an jedem Rand abblenden.
- **Brutalist** - schwarz auf weiß, zwei-Pixel-Ränder, Schatten, die feste Blöcke sind.

Wählen Sie eines unter **Einstellungen → Themen**. Eine Skin und Ihr eigenes benutzerdefiniertes CSS arbeiten zusammen: Die Skin wird zuerst angewendet, so dass Ihr CSS sie anpassen kann, anstatt sie ersetzen zu müssen.

## Farbvariablen

Dies sind die stabilen API. Stellen Sie sie auf `:root` ein, und jede Oberfläche in der App folgt, einschließlich Bildschirmen, die nach dem Schreiben des Themes hinzugefügt wurden.

| Variabel                | Beeinflusst                                                        |
| ----------------------- | -------------------------------------------------------------- |
| `--bg-primary`          | Das Chat-Canvas - die größte Oberfläche in der App.              |
| `--bg-secondary`        | Panels neben ihm: Kanalliste, Mitgliederliste, Karten.            |
| `--bg-tertiary`         | Das äußerste Chrom, einschließlich der Serverleiste.               |
| `--bg-accent`           | Einbetten von Oberflächen: der Komponist, Codeblöcke, Eingaben.             |
| `--interactive-hover` | Zeile und Knopf überblättern.                                          |
| `--interactive-selected`| Die Zeile, auf der Sie sich derzeit befinden.                                  |
| `--brand`               | Primäre Tasten, Links, Fokusringe, Ihre eigenen Akzente.         |
| `--brand-hover`         | Das Gleiche, gedrückt.                                             |
| `--text-normal`         | Körpertext.                                                     |
| `--text-muted`          | Zeitstempel, sekundäre Beschriftungen, Platzhalter.                    |
| `--text-link`           | Links innerhalb von Nachrichten.                                         |
| `--status-online`       | Online-Punkt, Erfolgslagen.                                    |
| `--status-idle`         | Leerlaufpunkt, Warnungen.                                            |
| `--status-dnd`          | Keine Störung-Punkt, Fehler und zerstörerische Aktionen.            |
| `--status-offline`      | Offline Punkt.                                                   |
| `--divider`             | Jede Haarliniengrenze in der App.                              |
| `--super`               | Der Disband SUPER Akzent.                                      |

## Form und Typ

Disband zeichnet seine Ecken mit der Radiusskalierung von Tailwind, und diese Skala liest sich aus diesen Variablen ab. Die Einstellung einer variablen ändert sofort alle Ecken dieser Größe im Produkt - Sie müssen die Komponenten nicht finden.

| Variabel | Beeinflusst                                              |
| ------------------ | ---------------------------------------------------- |
| `--skin-radius-sm` | Tailwinds `rounded-sm`. Kleine Chips und Etiketten. |
| `--skin-radius-md` | `rounded-md` - die meisten Tasten und Eingaben. |
| `--skin-radius-lg` | `rounded-lg` - Karten und Panels.                    |
| `--skin-radius-xl` | `rounded-xl` - Modale, Anruffliesen. |
| `--skin-radius-2xl` | `rounded-2xl` - große Überlagerungen.                     |
| `--skin-radius-3xl` | `rounded-3xl` - die größten Oberflächen. |
| `--skin-font` | Die Benutzeroberfläche Schriftart für die gesamte App. |

Avatare und Statuspunkte sind absichtlich nicht auf dieser Liste: Sie sind Kreise, weil ein quadratisches Avatar die Mitgliederliste schwer zu lesen macht. Sie können sie immer noch quadratisch machen, indem Sie sie direkt ansprechen.

**Wenn Sie ein helles Thema erstellen**, stellen Sie `color-scheme: light` auf `:root` ein, damit die Scrollbalken und die native Steuerung mit ihm umschalten, und denken Sie daran, dass `--bg-tertiary` Text enthält: es ist die Serverbahn, also macht ein dunkler Wert dort mit dunklem `--text-normal` diese Etiketten unsichtbar, anstatt nur niedrig kontrastreich zu sein.

## Selektoren

Jeder Kontrollpunkt in Disband ist ein echtes `<button>`, `<input>` oder `<textarea>`, so dass Elementauswahlern die gesamte App erreichen und auch dann weiter funktionieren, wenn sich die App ändert:

```css
button { border-radius: 0; }
button:active { transform: translateY(1px); }
input, textarea { border: 1px solid var(--divider); }
```

Layoutklassen sind Tailwind-Dienstprogramme, und `[class*="bg-brand"]`-Stil-Selectoren funktionieren - aber sie sind keine unterstützten API. Dienstprogrammklassen ändern sich, wenn ein Bildschirm neu gestaltet wird, und ein Thema, das darauf basiert, wird bei einer bestimmten Veröffentlichung nicht mehr funktionieren. Die oben genannten Variablen werden dies nicht tun.

## Hochgeladenen Symbole

Laden Sie ein Bild in **Einstellungen → Themen** hoch und geben Sie ihm einen Namen. Es wird zu einer Variablen, die einen fertigen `url()` enthält:

```css
/* An icon uploaded as "send" */
.some-target {
  background-image: var(--icon-send);
}
```

Namen verwenden Kleinbuchstaben, Zahlen und Bindestriche, bis zu 40 Zeichen. Ein Thema kann bis zu 100 Symbole enthalten, und jedes Hochladen ist auf 2 MB begrenzt.

## Startervorlage

Kopieren Sie dies in den Editor und ändern Sie, was Sie möchten:

```css
/* ---------------------------------------------------------------
   A Disband theme. Everything here is optional — delete what you
   do not want to change.
   --------------------------------------------------------------- */

:root {
  /* Colours. These reach every surface in the app. */
  --bg-primary: #1b1b1f;
  --bg-secondary: #16161a;
  --bg-tertiary: #101013;
  --bg-accent: #131316;
  --interactive-hover: #26262c;
  --interactive-selected: #2f2f37;
  --brand: #7c5cff;
  --brand-hover: #6647e0;
  --text-normal: #ececf0;
  --text-muted: #9a9aa5;
  --divider: #2a2a31;

  /* Shape. One value here squares (or rounds) every matching
     corner in the product at once. */
  --skin-radius-md: 4px;
  --skin-radius-lg: 6px;

  /* Type. Any font already on the system, or one you name below. */
  --skin-font: "Inter", system-ui, sans-serif;
}

/* Buttons are ordinary <button> elements, so this reaches all of
   them — the composer, the toolbar, dialogs, everything. */
button {
  transition: transform 80ms ease;
}

button:active {
  transform: translateY(1px);
}

/* An icon you uploaded, referenced by the name you gave it. */
.my-custom-send::before {
  content: "";
  display: inline-block;
  width: 20px;
  height: 20px;
  background-image: var(--icon-send);
  background-size: contain;
}
```

## Was ist nicht erlaubt

Ihr CSS wird überprüft, bevor es angewendet wird, und alles, was entfernt wird, wird für Sie aufgeführt, anstatt leise gelöscht zu werden:

- `@import` - es würde jedes Mal beim Start ein Stylesheet von einem anderen Server laden.
- `<` und `>` - CSS hat keinen Nutzen für sie, und sie können die Stylesheet frühzeitig beenden.
- `expression()`- und `url()`-Werte, die nicht `https:` oder ein `data:`-Bild sind.
- Themen sind auf 100 KB von CSS begrenzt.

Webschriften können mit `@font-face` von einer `https:`-Adresse oder von einem von Ihnen hochgeladenen Symbol geladen werden.

## Wenn Ihr Abonnement endet

Themes sind eine SUPER-Funktion, so dass wenn eine Zahlung fehlschlägt, Ihr Theme nicht mehr angewendet wird und Disband wieder sein normales Aussehen annimmt - mit einer Meldung, die erklärt, warum, anstatt leise seine Form zu ändern.

**Nichts wird gelöscht.** Ihre Haut, Ihr CSS und Ihre Symbole bleiben auf Ihrem Konto; melden Sie sich erneut an und sie werden genau so zurückgegeben, wie Sie sie verlassen haben.
