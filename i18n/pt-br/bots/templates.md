# Modelos de bots

Pontos de partida prontos para adaptação para bots comuns. Cada um é um pequeno script autônomo que você pode colar em um arquivo e executar com o cliente JavaScript ou Python.

## Bem-vindo

Publica uma mensagem de boas-vindas sempre que alguém se junta a um espaço. Precisa de `messages.write` e `members.read`.

```javascript
import { Client } from "@disband/bot";

const client = new Client({ token: process.env.DISBAND_BOT_TOKEN });
const WELCOME_CHANNEL = process.env.WELCOME_CHANNEL_ID;

client.on("memberJoin", async (member) => {
  await client.channels.send(WELCOME_CHANNEL, `Welcome to the space, ${member.display_name ?? member.username}!`);
});

await client.connect();
```

> O gateway emite `messageCreate`, `messageUpdate` e `messageDelete` hoje;
> Os eventos de membros chegam através do mesmo fluxo de eventos que os escopos do seu bot permitem.

## Gerente de ingressos

Cria um canal privado para cada solicitação de suporte e envia um ping para um papel de equipe. Precisa de `channels.manage` (mais o papel `manage_channels`) e `messages.write`.

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

## Respondente automático

Responde a um pequeno conjunto de perguntas frequentes. Precisa de `messages.read` e `messages.write`.

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

## Auxiliar de moderação

Exclui mensagens contendo uma palavra proibida e as registra. Precisa do `messages.read`, `messages.write` e do papel `manage_messages`.

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

## Dicas

- Comece com o menor conjunto de escopo e adicione mais bots em vez de um bot com
  Tudo.
- Armazene tokens em variáveis de ambiente, nunca na fonte.
- Gerencie `AuthError` (401) parando em vez de tentar novamente para sempre.
- Veja a referência [Referência da API](api-reference.md) para cada endpoint que esses auxiliares usam.
