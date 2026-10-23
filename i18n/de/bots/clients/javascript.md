# JavaScript-Client — `@disband/bot`

Der offizielle JavaScript-Client. Null Laufzeitabhängigkeiten - er verwendet nur `fetch` und Standardglobale - und funktioniert von Node.js 18+, Deno, Bun und dem Browser.

## installieren

```bash
npm install @disband/bot
```

Oder von diesem Monorepo:

```bash
npm install /path/to/packages/bot
```

## Schneller Start

```javascript
import { Client } from "@disband/bot";

const client = new Client({ token: process.env.DISBAND_BOT_TOKEN });

client.on("ready", (me) => {
  console.log(`Logged in as ${me.name} (${me.scopes.join(", ")})`);
});

client.on("messageCreate", async (message) => {
  if (message.author?.is_bot) return;
  if (message.content !== "!ping") return;
  await message.reply("pong");
});

await client.connect();
```

## Konstrukteur

### `new Client({ token, baseUrl?, gatewayTimeout? })`

| Option | Typ | Standard | Beschreibung |
| ---------------- | -------- | ----------------------------------- | -------------------------------------------- |
| `token`          | `string` | *(erforderlich)*                        | Der Bot-Token von **Einstellungen → Bots**.      |
| `baseUrl`        | `string` | `"https://www.disband.dev"`         | API root (Ändern Sie für eine benutzerdefinierte Domain).       |
| `gatewayTimeout` | `number` | `20`                                | Sekunden pro Gateway-Abfrage (1-20).             |

## Lebenszyklus

| Methode | Beschreibung |
| --------- | ----------- |
| `connect()` | Löscht die Bot-Identität (`GET /api/bot/me`), sendet `ready` und startet den Gateway-Zyklus. Löscht sich nach der Verbindung. |
| `close()` | Stoppt den Gateway-Zyklus. |
| `connected` | Boolescher Wert: ob der Schleifenlauf derzeit läuft. |

## Veranstaltungen

Registrieren Sie sich mit `client.on(name, handler)`; einige sind `async`. `once` und `off` funktionieren genauso wie sie in Nodes `EventEmitter` funktionieren.

| Ereignis             | Argumente | Anmerkungen                                                                   |
| ----------------- | -------- | ----------------------------------------------------------------------- |
| `ready`           | `user`   | `user.id`, `user.userId`, `user.name`, `user.username`, `user.avatarUrl`, `user.scopes`. |
| `messageCreate` | `message` | Eine neue Nachricht auf einem Server, die der Bot sehen kann.                                 |
| `messageUpdate` | `message` | Eine Nachricht wurde bearbeitet (`content`, `editedAt` aktualisiert).                    |
| `messageDelete` | `message` | Eine Nachricht wurde gelöscht (`content` leer; `id`/`channelId` gültig). |
| `error`           | `error`  | Gateway-Fehler. Der Schleifenversuch wird automatisch wiederholt, es sei denn, der Token ist ungültig, in diesem Fall hört er auf. |
| `debug`           | `*`      | Beobachtbarkeit auf niedrigem Niveau.                                                |

### `Message`

| Feld | Typ                | Beschreibung                                    |
| ----------- | ------------------- | ---------------------------------------------- |
| `id`        | `string`            | Nachrichtennummer.                                    |
| `channelId` | `string`            | Kanal-ID.                                    |
| `serverId` | `string \| null` | Server-ID.                                     |
| `author` | `object \| null` | `{ id, username, display_name, avatar_url, is_bot }`. |
| `content` | `string` | Nachrichtentext.                                  |
| `replyToId` | `string \| null` | Die Nachricht, auf die dies antwortet, falls vorhanden. |
| `mentions` | `array` | Genannte Benutzer.                                 |
| `attachment`| `object \| null` | `{ url, type }` wenn die Nachricht eine Datei enthält. |
| `createdAt` | `string \| null`    | ISO-Zeitstempel.                                 |
| `editedAt` | `string \| null` | ISO-Zeitstempel der letzten Bearbeitung. |
| `displayId` | `number \| null` | Die sequenzielle Anzeige-Nummer.                 |

**Methoden** - `message.reply(content)` (Antworten im selben Kanal) und der `message.authorIsBot`-Getter (wahr, wenn der Absender ein Bot war).

## Methoden

```javascript
await client.sendMessage(channelId, "Deploy finished");          // send
await message.reply("pong");                                      // reply to a received message

const messages = await client.listMessages(channelId, { limit: 25, before: "…" });
const channels  = await client.listChannels(serverId);
const members   = await client.listMembers(serverId);

const channelId = await client.createChannel(serverId, "deploys", { type: "text", categoryId: null });
await client.renameChannel(channelId, "deploys-2");
await client.deleteChannel(channelId);

await client.leaveServer(serverId);

const invite = await client.createInvite(serverId, ["messages.read", "messages.write"]);
// invite.invite_url -> send to the server owner
```

## Fehler

Geworfene Fehler tragen den Status und den Körper bei:

| Fehler                | Wenn                                                |
| ------------------ | --------------------------------------------------- |
| `AuthError`        | `401` - ungültiger oder widerrufener Token. Der Gateway-Zyklus hört hier an. |
| `PermissionError` | `403` - fehlende Zugriffsberechtigung für den Bereich oder die Rolle. |
| `RateLimitError` | `429` - enthält `retryAfter` Sekunden. |
| `HttpError` | Jeder andere nicht-2xx-Status.                           |

Intern ist der Client ein dünner Wrapper über den [API-Referenz](../api-reference.md): `REST.get/post/patch/delete` mit `Authorization: Bot <token>`.
