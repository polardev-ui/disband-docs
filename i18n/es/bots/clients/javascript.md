# Cliente JavaScript — `@disband/bot`

El cliente oficial JavaScript. Sin dependencias de tiempo de ejecución cero: solo utiliza `fetch` y globales estándar, y funciona desde Node.js 18+, Deno, Bun y el navegador.

## instalar

```bash
npm install @disband/bot
```

O, desde este monorepo:

```bash
npm install /path/to/packages/bot
```

## Inicio rápido

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

## Constructor

### `new Client({ token, baseUrl?, gatewayTimeout? })`

| Opción | Tipo | Por defecto                             | Descripción                                  |
| ---------------- | -------- | ----------------------------------- | -------------------------------------------- |
| `token`          | `string` | *(obligatorio)*                        | El token del bot de **Configuración → Bots**.      |
| `baseUrl`        | `string` | `"https://www.disband.dev"`         | API raíz (cambia para un dominio personalizado).       |
| `gatewayTimeout` | `number` | `20`                                | Segundos por encuesta de puerta de enlace (1-20).             |

## Ciclo de vida

| Método | Descripción |
| --------- | ----------- |
| `connect()` | Resuelve la identidad del bot (`GET /api/bot/me`), emite `ready` y inicia el bucle del gateway. Resuelve una vez conectado. |
| `close()` | Detiene el bucle del gateway. |
| `connected` | Booleano: si el bucle está actualmente en ejecución. |

## Eventos

Regístrese con `client.on(name, handler)`; algunos son `async`. `once` y `off` funcionan de la misma manera que lo hacen en `EventEmitter` de Node.

| Evento             | Argumentos | Notas                                                                   |
| ----------------- | -------- | ----------------------------------------------------------------------- |
| `ready`           | `user`   | `user.id`, `user.userId`, `user.name`, `user.username`, `user.avatarUrl`, `user.scopes`. |
| `messageCreate` | `message` | Un nuevo mensaje en un servidor que el bot puede ver.                                 |
| `messageUpdate` | `message` | Se ha editado un mensaje (`content`, `editedAt` actualizado). |
| `messageDelete` | `message` | Se ha eliminado un mensaje (`content` vacío; `id`/`channelId` válido). |
| `error`           | `error`  | Errores del gateway. El bucle intenta de nuevo automáticamente a menos que el token sea inválido, en cuyo caso se detiene. |
| `debug`           | `*`      | Observabilidad de bajo nivel.                                                |

### `Message`

| Campo | Tipo                | Descripción                                    |
| ----------- | ------------------- | ---------------------------------------------- |
| `id`        | `string`            | ID del mensaje.                                    |
| `channelId` | `string`                | ID del canal.                                    |
| `serverId` | `string \| null` | ID del servidor.                                     |
| `author` | `object \| null` | `{ id, username, display_name, avatar_url, is_bot }`. |
| `content` | `string` | Texto del mensaje.                                  |
| `replyToId` | `string \| null` | El mensaje a al que responde, si corresponde. |
| `mentions` | `array` | Usuarios mencionados.                                |
| `attachment`| `object \| null` | `{ url, type }` cuando el mensaje tiene un archivo. |
| `createdAt` | `string \| null` | Fecha y hora ISO.                                 |
| `editedAt` | `string \| null` | Fecha y hora ISO de la última edición. |
| `displayId` | `number \| null` | El número de visualización secuencial.                 |

**Métodos** — `message.reply(content)` (respuestas en el mismo canal) y el recuperador de `message.authorIsBot` (verdadero cuando el remitente era un bot).

## Métodos

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

## Errores

Los errores lanzados llevan el estado y el cuerpo:

| Error              | Cuando                                                |
| ------------------ | --------------------------------------------------- |
| `AuthError` | `401` - token inválido o revocado. El bucle del gateway se detiene en este punto. |
| `PermissionError` | `403` - falta de permiso de alcance o rol. |
| `RateLimitError` | `429` - incluye segundos `retryAfter`. |
| `HttpError` | Cualquier otro estado no 2xx.                           |

Internamente, el cliente es un envoltorio delgado sobre el [Referencia de la API](../api-reference.md): `REST.get/post/patch/delete` con `Authorization: Bot <token>`.
