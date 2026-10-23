# Plantillas de bots

Puntos de partida listos para adaptarse para bots comunes. Cada uno es un pequeño script independiente que puedes pegar en un archivo y ejecutar con el cliente JavaScript o Python.

## Bienvenido

Publica un mensaje de bienvenida cada vez que alguien se une a un espacio. Necesita `messages.write` y `members.read`.

```javascript
import { Client } from "@disband/bot";

const client = new Client({ token: process.env.DISBAND_BOT_TOKEN });
const WELCOME_CHANNEL = process.env.WELCOME_CHANNEL_ID;

client.on("memberJoin", async (member) => {
  await client.channels.send(WELCOME_CHANNEL, `Welcome to the space, ${member.display_name ?? member.username}!`);
});

await client.connect();
```

> El gateway emite `messageCreate`, `messageUpdate` y `messageDelete` hoy;
> Los eventos de los miembros llegan a través del mismo flujo de eventos que permiten los escenarios de tu bot.

## Gerente de entradas

Crea un canal privado por solicitud de soporte y envía un ping a un rol de personal. Necesita `channels.manage` (además del rol `manage_channels`) y `messages.write`.

```javascript
import { Client } from "@disband/bot";

const client = new Client({ token: process.env.DISBAND_BOT_TOKEN });
const SUPPORT_CATEGORY = process.env.SUPPORT_CATEGORY_ID;
const STAFF_ROLE = process.env.STAFF_ROLE_ID;

client.on("messageCreate", async (message) => {
  if (message.author?.is_bot) return;
  if (!message.content.startsWith("!ticket")) return;

  const subject = message.content.slice("!ticket".length).trim() || "support";
  const channel = await client.channels.create({
    name: `ticket-${subject}`.slice(0, 32),
    parent_id: SUPPORT_CATEGORY,
  });
  await client.channels.send(channel.id, `<@&${STAFF_ROLE}> new ticket: ${subject}`);
  await message.reply(`Created ${channel.name}.`);
});

await client.connect();
```

## Responder automático

Responde a un pequeño conjunto de preguntas frecuentes. Necesita `messages.read` y `messages.write`.

```python
from disband_bot import Client

client = Client(token=DISBAND_BOT_TOKEN)
FAQS = {
    "hours": "We're open Monday to Friday, 9 to 5.",
    "invite": "Ask an admin for an invite link.",
}

@client.on("messageCreate")
def handle(message):
    if message.author_is_bot:
        return
    key = message.content.strip().lower().lstrip("!")
    if key in FAQS:
        message.reply(FAQS[key])

client.run()
```

## Ayudante de moderación

Elimina los mensajes que contengan una palabra prohibida y los registra. Necesita `messages.read`, `messages.write` y el rol `manage_messages`.

```javascript
const BANNED = ["spamword"];

client.on("messageCreate", async (message) => {
  if (message.author?.is_bot) return;
  if (BANNED.some((w) => message.content.toLowerCase().includes(w))) {
    await client.messages.delete(message.channel_id, message.id);
    await client.channels.send(message.channel_id, "A message was removed by the bot.");
  }
});
```

## Consejos

- Comienza con el conjunto de escopos más pequeño y agrega más bots en lugar de un solo bot con
  Todo.
- Almacene los tokens en variables ambientales, nunca en el código fuente.
- Manejar `AuthError` (401) deteniéndose en lugar de volver a intentarlo para siempre.
- Consulte la referencia [Referencia de la API](api-reference.md) para cada punto final que estos ayudantes utilizan.
