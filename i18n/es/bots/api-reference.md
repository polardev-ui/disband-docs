# Referencia de la API de bots

La API HTTP con el que hablan los bots. Ambas bibliotecas de clientes son envoltorios finos sobre exactamente estos puntos finales, por lo que esta página también es la receta para escribir un cliente en cualquier otro lenguaje.

## Base URL y autenticación

```
https://www.disband.dev
```

Cada solicitud envía:

| Encabezado | Valor                    |
| --------------- | ------------------------ |
| `Authorization` | `Bot <token>`            |
| `Content-Type` | `application/json`       |

Un token ausente o inválido devuelve `401 { "error": "Invalid bot token" }`. Un bot revocado devuelve lo mismo, por lo que un `401` significa "comprobar el token", no "reintentar".

Todos los puntos finales tienen un alcance: un bot solo puede leer o escribir lo que sus ámbitos (y las concesiones por servidor) permiten. Cada respuesta 4xx/5xx es JSON con un campo `error`.

## Lee antes de escribir

- Los bots son **de alcance de lectura** a menos que concedas `messages.write` / `channels.manage`.
- Las acciones de `channels.manage` también requieren que la cuenta del bot tenga el
  `manage_channels` **rol** en ese servidor.
- Ambos clientes tienen la información sobre los escopos por evento de mensaje: nada en la API
  Devuelve datos que al bot no se le concedió.

## El gateway (petición de actualización de eventos)

```
GET /api/v1/gateway?timeout=20
```

El gateway es un long-poll, no un websocket. La solicitud bloquea el lado del servidor hasta que esté disponible un evento o expire el tiempo de espera, luego devuelve lo que llegó. El cliente lo vuelve a ejecutar. El tiempo de espera se limita a 1-20 segundos.

Respuesta:

```json
{
  "events": [
    {
      "bot_id": "…",
      "type": "messageCreate",
      "payload": { "id": "…", "channel_id": "…", "server_id": "…", "content": "…" }
    }
  ]
}
```

`type` es `messageCreate`, `messageUpdate` o `messageDelete`. La entrega es **al menos una vez**: un bot que se bloquea entre la obtención y el procesamiento puede ver el mismo evento de nuevo. Manejarlos de forma idempotente (por `payload.id`).

### Carga útil de eventos

| Tipo             | Campos de carga útil                                        |
| ---------------- | ----------------------------------------------------- |
| `messageCreate` | El objeto de mensaje completo (a continuación).                      |
| `messageUpdate` | `id`, `channel_id`, `server_id`, `content`, `edited_at` |
| `messageDelete` | `id`, `channel_id`, `server_id`                       |

Objeto de mensaje:

```json
{
  "id": "…",
  "channel_id": "…",
  "server_id": "…",
  "author": { "id": "…", "username": "…", "display_name": "…", "avatar_url": "…", "is_bot": false },
  "content": "Deploy finished",
  "reply_to_id": null,
  "mentions": [],
  "embeds": [],
  "attachment_url": null,
  "attachment_type": null,
  "created_at": "2026-01-01T00:00:00Z",
  "edited_at": null,
  "display_id": 1234
}
```

Solo los bots con `messages.read` (ambos en la cuenta del bot **y** concedidos en ese servidor) reciben eventos.

## Puntos finales

### Mensajes

**POST `/api/v1/channels/:id/messages`** - envía un mensaje (`messages.write`).

```json
{
  "content": "Deploy finished",
  "reply_to_id": null,
  "embeds": [
    { "title": "Build 1842", "description": "All 412 tests passed.", "color": 5793266 }
  ]
}
```

`content` puede omitirse cuando `embeds` está presente. Los integraciones utilizan la forma y los límites de Discord; consulte [Embeds](../developers/embeds.md) para cada campo y los límites exactos. Un mensaje sin contenido ni integraciones se rechaza con `400`.

Devuelve `201` con `{ "message": { … } }`.

**OBTENGA `/api/v1/channels/:id/messages`** - lee mensajes (`messages.read`).

Consulta: `limit` (1-100, por defecto 50), `before` (id de mensaje, para paginación hacia atrás).

Devuelve `200` con `{ "messages": [ … ] }`.

### canal

**OBTENGA `/api/v1/servers/:id/channels`** - lista canales (`messages.read`).

Devuelve `{ "channels": [ … ] }`.

**POST `/api/v1/servers/:id/channels`** - crea un canal (`channels.manage` + rol `manage_channels`).

```json
{ "name": "deploys", "type": "text", "category_id": null }
```

Devuelve `201` con `{ "channel_id": "…" }`.

**PATCH `/api/v1/channels/:id`** - renombra un canal (`channels.manage`).

```json
{ "name": "deploys-2" }
```

Devuelve `{ "success": true }`.

**ELIMINAR `/api/v1/channels/:id`** - elimina un canal (`channels.manage`).

Devuelve `{ "success": true }`.

### Miembros

**OBTENGA `/api/v1/servers/:id/members`** - lista miembros (`members.read`).

Devuelve `{ "members": [ … ] }`.

### de despedida

**POST `/api/v1/servers/:id/leave`** - elimina al bot de un servidor.

Devuelve `{ "success": true }`.

### Invitaciones

**POST `/api/v1/bots/:botId/invites`** — genera una invitación para que el bot se una a un servidor.

```json
{ "server_id": "…", "scopes": ["messages.read", "messages.write"] }
```

Devuelve la invitación (incluyendo un `invite_url`) para enviarla al propietario del servidor. Solo el propietario puede aprobarla; las invitaciones caducan después de 7 días.

### Identidad (utilizada al arrancar)

**OBTENGA `/api/bot/me`** - devuelve la cuenta del bot, utilizada por los clientes para disparar `ready`. No forma parte de la superficie versificada de `v1`.

## Errores

| Estado | Significado                                                        | Ejemplos de campos `error`                              |
| ------ | -------------------------------------------------------------- | --------------------------------------------------- |
| `401` | Token ausente/invalido/revocado.                                 | `"Invalid bot token"`                               |
| `403` | Falta permiso de alcance o rol.                              | `"This bot does not have messages.write in that server"` |
| `404` | Canal/servidor no encontrado o no visible para el bot. | `"Channel not found"`                               |
| `429` | Tarifa limitada.                                                  | Incluye un encabezado `Retry-After`.                    |
| `503` | Tienda de respaldo no disponible (petición de puerta de enlace).                   | `"Event delivery unavailable."`                     |
| `5xx` | Error del servidor. Inténtelo de nuevo con un retraso.                              | `"Internal server error"`                           |

## Límites

- Hasta **5 bots por cuenta**; el token de un bot muere instantáneamente al revocarlo.
- Mensajes de hasta **4.000 caracteres**; `@everyone` necesita el `mention_everyone`
  Permiso de rol.
- Hasta **10 integraciones por mensaje**, con los mismos límites de campo que los webhooks. ver
  [Embeds](../developers/embeds.md).
- Se aplican límites de tasa por token de bot. Si ingresas `429`, honra `Retry-After`.

## Escribir tu propio cliente

1. `GET /api/bot/me` con `Authorization: Bot <token>` para resolver la identidad.
2. Bucle en `GET /api/v1/gateway?timeout=20`, manejar eventos por `type`.
3. Utilice los puntos finales anteriores con el mismo encabezado de autenticación; mapee `401` → "token malo",
   `403` → "permiso faltante", `429` → "acelerar y volver a intentarlo después de `Retry-After`".

## Webhooks son una superficie diferente

El bot API se autentica con `Authorization: Bot <token>` y puede leer eventos a través del gateway. Un [Webhooks](../developers/webhooks.md) es una URL secreta de un solo sentido: no hay cuenta de bot, no hay encabezado de autenticación y no hay capacidad para leer mensajes. Utilice un webhook para las notificaciones y un bot cuando necesite reaccionar al chat.

Los clientes oficiales son `@disband/bot` (JavaScript) y `disband-bot` (Python) - consulte las páginas [JavaScript](clients/javascript.md) y [Python](clients/python.md).
