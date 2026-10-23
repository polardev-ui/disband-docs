# Primeiros passos: seu primeiro bot

Esta página explica como criar um bot, obter seu token e convidá-lo para um servidor. Leva cerca de dois minutos.

## 1. Crie o bot

Abra **Configurações → Bots** em Disband e clique em **Novo bot**.

- Dê-lhe um nome. O nome é o que aparece na lista de membros e nas mensagens.
- Escolha os **espaços** que ele precisa. Comece pequeno — você sempre pode criar outro bot
  Com mais escopos. A lista completa está no [Bots](index.md).
- Clique em **Criar**.

Disband retorna um **token**, mostrado uma vez. Copie-o em algum lugar seguro agora: ele nunca é mostrado novamente e não pode ser recuperado posteriormente. Se você o perder, revogue o bot e crie um novo.

O token é o que seu código usa para autenticar:

```
Authorization: Bot <token>
```

## 2. Convide o bot para um servidor

Em **Configurações → Bots**, abra o bot que você acabou de criar:

1. Clique em **Gerar convite**.
2. Escolha o servidor de destino e o escopo definido para conceder.
3. Envie o link resultante para o **proprietário** desse servidor.

Somente o proprietário pode aprovar uma solicitação de convite para um bot. Os convites expiram após 7 dias.

## 3. O proprietário aprova

O proprietário abre o link e clica em **Aprovar**. O bot se torna um membro do servidor, limitado aos escopos aprovados. (Os escopos aprovados são a interseção dos escopos da conta do bot e o que o proprietário concedeu - você não pode aprovar mais do que o bot foi criado com.)

## 4. Conecte-se com um cliente

Salve o token em uma variável de ambiente e execute um dos clientes:

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

O cliente se conecta ao gateway, dispara `ready` e, em seguida, transmite eventos de mensagens. Consulte [JavaScript](clients/javascript.md) e [Python](clients/python.md) para a API completo.

## O que vem a seguir?

- Se o bot precisar continuar funcionando permanentemente, veja
  **[Hospede seu próprio bot](hosting-your-own-bot.md)**.
- Se você quiser conversar com a API diretamente (curl, outra linguagem, um webhook),
  Veja a **referência **[Referência da API](api-reference.md)**.
