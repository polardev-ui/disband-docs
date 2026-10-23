# Client JavaScript — `@disband/bot`

Le client JavaScript officiel. Aucune dépendance de temps d'exécution - il utilise uniquement `fetch` et les globaux standard - et fonctionne à partir de Node.js 18+, Deno, Bun et le navigateur.

## installer

```bash
npm install @disband/bot
```

Ou, à partir de ce monorepo :

```bash
npm install /path/to/packages/bot
```

## Début rapide

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

## constructeur

### `new Client({ token, baseUrl?, gatewayTimeout? })`

| Option | Type | Définitif                                 | Description                                  |
| ---------------- | -------- | ----------------------------------- | -------------------------------------------- |
| `token`          | `string` | *(obligatoire)*                        | Le jeton bot de **Paramètres → Bots**.      |
| `baseUrl`        | `string` | `"https://www.disband.dev"`         | API racine (modifier pour un domaine personnalisé).       |
| `gatewayTimeout` | `number` | `20`                                | Secondes par sondage de gateway (1-20).             |

## Cycle de vie

| Méthode | Description |
| --------- | ----------- |
| `connect()` | Résout l'identité du bot (`GET /api/bot/me`), émet `ready` et lance la boucle de gateway. Résout une fois connecté. |
| `close()` | Arrête la boucle de gateway. |
| `connected` | Booléen : si la boucle est actuellement en cours d'exécution. |

## Événements

Inscrivez-vous avec `client.on(name, handler)` ; certains sont `async`. `once` et `off` fonctionnent de la même manière qu'eux dans `EventEmitter` de Node.

| Événement | Arguments | Notes                                                                   |
| ----------------- | -------- | ----------------------------------------------------------------------- |
| `ready`           | `user`   | `user.id`, `user.userId`, `user.name`, `user.username`, `user.avatarUrl`, `user.scopes`. |
| `messageCreate` | `message` | Un nouveau message dans un serveur que le bot peut voir.                                 |
| `messageUpdate` | `message` | Un message a été modifié (`content`, `editedAt` mis à jour). |
| `messageDelete` | `message` | Un message a été supprimé (`content` vide ; `id`/`channelId` valide). |
| `error`           | `error`  | Erreurs de gateway. La boucle réessaye automatiquement à moins que le jeton ne soit invalide, auquel cas il s'arrête. |
| `debug`           | `*`      | Observabilité à faible niveau.                                                |

### `Message`

| Champ | Type                | Description                                    |
| ----------- | ------------------- | ---------------------------------------------- |
| `id`        | `string`            | Identifiant du message.                                    |
| `channelId` | `string`                | Identifiant du canal.                                    |
| `serverId` | `string \| null` | Identifiant du serveur.                                     |
| `author` | `object \| null` | `{ id, username, display_name, avatar_url, is_bot }`. |
| `content` | `string` | Texte du message.                                  |
| `replyToId` | `string \| null` | Le message auquel cela répond, le cas échéant. |
| `mentions` | `array` | Utilisateurs mentionnés.                                |
| `attachment`| `object \| null` | `{ url, type }` lorsque le message contient un fichier. |
| `createdAt` | `string \| null` | Heure ISO.                                 |
| `editedAt` | `string \| null` | Heure ISO de la dernière modification. |
| `displayId` | `number \| null` | Le numéro d'affichage séquentiel.                 |

**Méthodes** - `message.reply(content)` (réponses dans le même canal) et le getter `message.authorIsBot` (vrai lorsque l'expéditeur était un bot).

## Méthodes

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

## Erreurs

Les erreurs lancées portent le statut et le corps :

| Erreur                | Quand                                                |
| ------------------ | --------------------------------------------------- |
| `AuthError` | `401` - jeton invalide ou révoqué. La boucle de gateway s'arrête à ce stade. |
| `PermissionError` | `403` - manquant de portée ou de permission de rôle. |
| `RateLimitError` | `429` - comprend des secondes `retryAfter`. |
| `HttpError` | Tout autre statut non 2xx.                           |

Internement, le client est un enveloppe mince sur le [Référence de l’API](../api-reference.md) : `REST.get/post/patch/delete` avec `Authorization: Bot <token>`.
