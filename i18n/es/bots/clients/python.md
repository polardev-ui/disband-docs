# Cliente Python — `disband-bot`

El cliente oficial Python. Solo utiliza la biblioteca estándar (`threading` + `urllib`), por lo que no hay nada que instalar excepto el propio cliente. Funciona en Python 3.9+.

## instalar

```bash
pip install disband-bot
```

O, desde este monorepo:

```bash
pip install ./packages/disband-bot-python
```

## Inicio rápido

```python
from disband_bot import Client

client = Client(token=DISBAND_BOT_TOKEN)

@client.on("ready")
def on_ready(me):
    print(f"Logged in as {me['name']} ({', '.join(me['scopes'])})")

@client.on("messageCreate")
def on_message(message):
    if message.author_is_bot:
        return
    if message.content == "!ping":
        message.reply("pong")

client.run()  # connects and blocks forever
```

Los manejadores pueden ser simples o `async def`; ambos son compatibles.

## Constructor

### `Client(token, base_url="https://www.disband.dev", gateway_timeout=20)`

| Argumento | Valor predeterminado                      | Descripción                                  |
| ---------------- | ---------------------------- | -------------------------------------------- |
| `token`          | *(obligatorio)*                 | El token del bot de **Configuración → Bots**.      |
| `base_url`       | `"https://www.disband.dev"`  | API raíz (cambia para un dominio personalizado).       |
| `gateway_timeout`| `20`                         | Segundos por encuesta de puerta de enlace (1-20).             |

## Ciclo de vida

| Método | Descripción                                                        |
| -------- | ------------------------------------------------------------------ |
| `run()` | Conecta, emite `ready`, inicia el bucle del gateway en un hilo en segundo plano y bloquea para siempre. |
| `close()`| Detiene el bucle.                                                    |

## Eventos

Regístrese con `client.on("name", handler)`, como decorador o una llamada simple, además de `once` para manejadores de disparos únicos.

| Evento | Argumentos | Notas                                                              |
| --------------- | -------- | -------------------------------------------------------------------|
| `ready`         | `user`   | `user["id"]`, `user["name"]`, `user["scopes"]`, etc.               |
| `messageCreate` | `message`| Un nuevo mensaje en un servidor que el bot puede ver.                          |
| `messageUpdate` | `message`| Se ha editado un mensaje (`content`, `edited_at` actualizado).             |
| `messageDelete` | `message`| Se ha eliminado un mensaje (`content` vacío; `id`/`channel_id` válido). |
| `error`         | `error`  | Errores del gateway. El bucle intenta de nuevo automáticamente a menos que el token sea inválido, en cuyo caso se detiene. |

### `Message`

| Campo | Tipo | Descripción                                        |
| ------------- | ---------------- | -------------------------------------------------- |
| `id`          | `str`            | ID del mensaje.                                        |
| `channel_id` | `str` | ID del canal.                                        |
| `server_id` | `str \| None` | ID del servidor.                                         |
| `author`      | `dict \| None`   | `{ "id", "username", "display_name", "avatar_url", "is_bot" }`. |
| `content` | `str` | Texto del mensaje.                                      |
| `reply_to_id` | `str \| None` | El mensaje a al que responde, si corresponde. |
| `mentions` | `list` | Usuarios mencionados.                                   |
| `attachment` | `dict \| None` | `{ "url", "type" }` cuando el mensaje tiene un archivo. |
| `created_at` | `str \| None` | Fecha y hora ISO.                                     |
| `edited_at` | `str \| None` | Fecha y hora ISO de la última edición.                    |
| `display_id` | `int \| None` | El número de visualización secuencial.                     |
| `author_is_bot` | `bool`          | Verdadero cuando el remitente era un bot (propiedad).         |

**Métodos** — `message.reply(content)` responde en el mismo canal.

## Métodos

```python
client.send_message(channel_id, "Deploy finished")            # send
message.reply("pong")                                          # reply to a received message

messages = client.list_messages(channel_id, limit=25, before="…")
channels = client.list_channels(server_id)
members  = client.list_members(server_id)

channel_id = client.create_channel(server_id, "deploys")
client.rename_channel(channel_id, "deploys-2")
client.delete_channel(channel_id)

client.leave_server(server_id)

invite = client.create_invite(server_id, ["messages.read", "messages.write"])
# invite["invite_url"] -> send to the server owner
```

## Errores

El cliente crea subclases de `DisbandError` con un `.status` y `.body`:

| Error            | Cuando                                          |
| ---------------- | --------------------------------------------- |
| `AuthError` | `401` - token inválido o revocado. El bucle del gateway se detiene en este punto. |
| `PermissionError`| `403` — falta de permiso de alcance o rol. |
| `RateLimitError` | `429` — incluye segundos `retry_after`.       |
| `HttpError` | Cualquier otro estado no 2xx.                     |

Internamente, el cliente es un envoltorio delgado sobre el [Referencia de la API](../api-reference.md): `REST.get/post/patch/delete` con `Authorization: Bot <token>`.
