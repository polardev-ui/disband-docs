# Webhooks

Un webhook publica mensajes en un canal a través de una URL secreta. No necesita código de bot, ningún bucle de puerta de enlace ni encabezado `Authorization`: si puedes hacer una solicitud de HTTP, puedes publicar en Disband.

Webhooks son separados de los bots. Usa un webhook para notificaciones de un solo sentido desde CI, monitoreo, servidores de juegos, formularios u cualquier otra cosa que pueda llamar a un URL. Usa un [Bots](../bots/index.md) cuando necesites leer eventos o actuar sobre mensajes.

## Crear un webhook

Necesitas el permiso **Administrar Webhooks** en el espacio.

1. Abre **Configuración del espacio → Integraciones → Webhooks**.
2. Elija un canal y seleccione **Nuevo webhook**.
3. Dale un nombre y, si quieres, un avatar.
4. Copie el webhook URL.

El URL se ve así:

```text
https://disband.dev/webhook/12345678/01234567890123456789012345
```

| Parte | Significado                                                                |
| ----------- | -------------------------------------------------------------- |
| Tecla de espacio | Ocho dígitos que identifican el espacio. No es secreto.                |
| Token | Veintiséis dígitos. Este es el secreto. Trátalo como una contraseña. |

El mismo punto final también se sirve en `https://disband.dev/api/webhooks/<space key>/<token>`.

Desde esa pantalla puedes cambiar el nombre del webhook, restablecer su token o eliminarlo. Restablecer el token invalida inmediatamente el viejo URL. Eliminar el webhook detiene su publicación, pero deja los mensajes que ya ha enviado en el canal.

## Ejecutar un webhook

Envíe un `POST` al webhook URL con un cuerpo JSON.

```bash
curl -X POST 'https://disband.dev/webhook/12345678/01234567890123456789012345' \
  -H 'Content-Type: application/json' \
  -d '{
    "content": "Deploy finished — **v2.4.1** is live.",
    "username": "Deploy bot",
    "avatar_url": "https://example.com/deploy.png"
  }'
```

Una solicitud exitosa devuelve `204 No Content`. Añade `?wait=true` para recibir el objeto de mensaje creado en su lugar:

```bash
curl -X POST 'https://disband.dev/webhook/12345678/01234567890123456789012345?wait=true' \
  -H 'Content-Type: application/json' \
  -d '{ "content": "Hello from the other side." }'
```

### Campos del cuerpo

| Campo             | Tipo    | Notas                                                                    |
| ----------------- | ------- | ------------------------------------------------------------------------ |
| `content`         | cadena | Hasta 2.000 caracteres. Puede omitirse cuando haya al menos un elemento incorporado presente. |
| `username`        | cadena | Sustituye el nombre de la webhook para este mensaje. Hasta 80 caracteres.         |
| `avatar_url` | cadena | Sustituye el avatar para este mensaje. `http` o `https` URL absoluto. |
| `embeds`          | array   | Hasta 10 [Embeds](embeds.md).                                             |
| `embed`           | objeto | Forma singular heredada. Tratado como `embeds: [embed]`.                      |
| `allowed_mentions`| objeto | Controla los pings. Ver a continuación.                                                |
| `tts`             | booleano | Aceptado para compatibilidad; actualmente ignorado.                            |
| `flags`           | número | Aceptado para compatibilidad; actualmente ignorado.                            |

`username` no puede contener `disband` o `clyde`, en ningún formato. Esto evita que una webhook se haga pasar por personal de la plataforma.

Los archivos adjuntos aún no son compatibles. Se puede analizar una solicitud multipartida, pero los archivos no se almacenan; utilice un bot si necesita subir archivos.

### Mencionar control

Por defecto, un webhook analiza tanto las menciones de usuarios como `@everyone` / `@here`, lo mismo que Discord.

Para enviar un ping a nadie:

```json
{ "content": "Build 184 finished.", "allowed_mentions": { "parse": [] } }
```

Para permitir menciones de usuarios pero no a todos:

```json
{
  "content": "Thanks @polar.",
  "allowed_mentions": { "parse": ["users"] }
}
```

La base de datos todavía almacena `@everyone` cuando está suprimido, pero no se envía ninguna notificación. Cuando el campo está completamente ausente, todo se analiza.

## Objetos de mensajes

Con `?wait=true`, la respuesta es un mensaje en forma de Discord. Disband utiliza su identificador de mensaje numérico en `id`.

```json
{
  "id": "4821",
  "type": 0,
  "content": "Deploy finished.",
  "channel_id": "…",
  "guild_id": "…",
  "author": {
    "id": "…",
    "username": "Deploy bot",
    "avatar": "https://example.com/deploy.png",
    "discriminator": "0000",
    "bot": true
  },
  "attachments": [],
  "embeds": [],
  "mentions": [],
  "mention_roles": [],
  "mention_everyone": false,
  "pinned": false,
  "tts": false,
  "timestamp": "2026-10-19T20:15:00.000Z",
  "edited_timestamp": null,
  "flags": 0,
  "components": [],
  "webhook_id": "…"
}
```

## Administrar mensajes

Un webhook puede recuperar, editar y eliminar los mensajes que ha publicado. Utilice el ID numérico del mensaje de la respuesta de ejecución.

| Método | Punto final                                      | Resultado                         |
| -------- | --------------------------------------------- | ------------------------------ |
| `GET` | `/webhook/<key>/<token>/messages/<id>` | Obtener el mensaje. |
| `PATCH` | `/webhook/<key>/<token>/messages/<id>` | Editar `content` y/o `embeds`. |
| `DELETE` | `/webhook/<key>/<token>/messages/<id>` | Eliminar el mensaje. Devuelve `204`. |

Editar ejemplo:

```bash
curl -X PATCH 'https://disband.dev/webhook/12345678/01234567890123456789012345/messages/4821' \
  -H 'Content-Type: application/json' \
  -d '{ "content": "Deploy finished — rolled back." }'
```

Solo los mensajes escritos por ese webhook se pueden cambiar. Un webhook diferente recibe `404 Unknown Message`.

## Administrar el propio webhook

| Método | Punto final                            | Resultado                                      |
| -------- | ----------------------------------- | ------------------------------------------- |
| `GET` | `/webhook/<key>/<token>` | Objeto Webhook (nombre, avatar, canal, URL). |
| `PATCH` | `/webhook/<key>/<token>` | Renómalo con `{ "name": "New name" }`. |
| `DELETE` | `/webhook/<key>/<token>`            | Elimínalo. Devuelve `204`.                   |

Eliminar a través de URL es permanente y equivalente a eliminarlo en la pantalla de Integraciones.

## Límites de tasa

Cada webhook está limitado a **5 solicitudes por 2 segundos**. El límite está basado en el token, por lo que un webhook ruidoso no puede ralentizar a otro.

Una solicitud limitada devuelve `429`:

```json
{
  "message": "You are being rate limited.",
  "retry_after": 1.34,
  "global": false
}
```

La respuesta también lleva `Retry-After` (segundos completos) y los encabezados habituales `X-RateLimit-*`. Espere el retraso y luego vuelva a intentarlo.

## Errores

Los errores utilizan la forma de Discord:

```json
{ "message": "Unknown Webhook", "code": 10015 }
```

| Estado | Código | Significado                                                    |
| ------ | ------- | ---------------------------------------------------------- |
| `400` | `50006` | Mensaje vacío: no hay contenido ni enlaces incorporados.                   |
| `400` | `50035` | Texto inválido, incorporación incorrecta o contenido de más de 2.000 caracteres. |
| `404` | `10015` | Webhook desconocido: mala tecla de espacio, token incorrecto o eliminado. |
| `404` | `10008` | Mensaje desconocido.                                           |
| `429` | —       | Tarifa limitada. Honra a `Retry-After`.                        |
| `500` | —       | Error del servidor. Inténtelo de nuevo con un retraso.                          |

Un `404 Unknown Webhook` deliberadamente no dice si la tecla de espacio o el token estaba equivocado.

## seguridad

- Cualquier persona con el URL puede publicar. No lo publique en un repositorio público ni lo ponga
  Está en el código del lado del cliente.
- Guarde el URL en la misma tienda secreta que utiliza para las claves API.
- Reinicia el token inmediatamente si se filtró. El viejo URL deja de funcionar de inmediato.
- Un webhook solo escribe en su canal configurado. No puede leer mensajes,
  Lista de miembros, o cambia la configuración del espacio.

## relacionado

- [Embeds](embeds.md) — el objeto de incorporación y sus límites.
- [Bots](../bots/index.md) — integraciones bidireccionales y entrega de eventos.
- [Referencia de la API](../bots/api-reference.md) - el bot HTTP API, incluyendo
  Soporte de incorporación.
