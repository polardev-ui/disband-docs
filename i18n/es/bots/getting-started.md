# Primeros pasos: tu primer bot

Esta página explica cómo crear un bot, obtener su token e invitárselo a un servidor. Tarda unos dos minutos.

## 1. Crear el bot

Abra **Configuración → Bots** en Disband y haga clic en **Nuevo bot**.

- Dale un nombre. El nombre es lo que aparece en la lista de miembros y en los mensajes.
- Elija los **espectros** que necesita. Comience con lo pequeño: siempre puede crear otro bot
  Con más escenarios. La lista completa está en la [Bots](index.md).
- Haz clic en **Crear**.

Disband devuelve un **token**, que se muestra una vez. Copíalo en algún lugar seguro ahora: nunca se muestra de nuevo y no se puede recuperar más tarde. Si lo pierdes, revoca el bot y crea uno nuevo.

El token es lo que tu código utiliza para autenticar:

```
Authorization: Bot <token>
```

## 2. Invita al bot a un servidor

En **Configuración → Bots**, abra el bot que acaba de crear:

1. Haz clic en **Generar invitación**.
2. Elija el servidor objetivo y el alcance configurado para conceder.
3. Envíe el enlace resultante al **propietario** de ese servidor.

Solo el propietario puede aprobar una invitación de bot. Las invitaciones caducan después de 7 días.

## 3. El propietario aprueba

El propietario abre el enlace y hace clic en **Aprobar**. El bot se convierte en miembro del servidor, limitado a los ámbitos que fueron aprobados. (Los ámbitos aprobados son la intersección de los ámbitos de la cuenta del bot y lo que el propietario concedió, no puede aprobar más de lo que el bot fue creado con).

## 4. Conéctese con un cliente

Guarda el token en una variable de entorno y ejecuta uno de los clientes:

```javascript
// JavaScript — install with: npm install /path/to/packages/bot
import { Client } from "@disband/bot";

const client = new Client({ token: process.env.DISBAND_BOT_TOKEN });

client.on("messageCreate", async (message) => {
  if (message.author?.is_bot) return;
  if (message.content !== "!ping") return;
  await message.reply("pong");
});

await client.connect();
```

```python
# Python — install with: pip install ./packages/disband-bot-python
from disband_bot import Client

client = Client(token=DISBAND_BOT_TOKEN)

@client.on("messageCreate")
def handle(message):
    if message.author_is_bot:
        return
    if message.content == "!ping":
        message.reply("pong")

client.run()
```

El cliente se conecta al gateway, dispara `ready` y luego transmite eventos de mensajes. Consulte [JavaScript](clients/javascript.md) y [Python](clients/python.md) para obtener la API completo.

## ¿Qué es lo siguiente?

- Si el bot necesita seguir funcionando permanentemente, consulte
  **[Aloja tu propio bot](hosting-your-own-bot.md)**.
- Si quieres hablar con la API directamente (curl, otro lenguaje, un webhook),
  Consulte la **[Referencia de la API](api-reference.md)**.
