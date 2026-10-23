# Cliente JavaScript — `@disband/bot`

O cliente oficial JavaScript. Zero dependências de tempo de execução - ele usa apenas `fetch` e globais padrão - e funciona a partir de Node.js 18+, Deno, Bun e o navegador.

## instalar

```bash
npm install @disband/bot
```

Ou, deste monorepo:

```bash
npm install /path/to/packages/bot
```

## Início rápido

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

## construtor

### `new Client({ token, baseUrl?, gatewayTimeout? })`

| Opção | Tipo | Padrão                                 | Descrição                                  |
| ---------------- | -------- | ----------------------------------- | -------------------------------------------- |
| `token`          | `string` | *(obrigatório)*                        | O token do bot de **Configurações → Bots**.      |
| `baseUrl`        | `string` | `"https://www.disband.dev"`         | API raiz (mude para um domínio personalizado).       |
| `gatewayTimeout` | `number` | `20`                                | Segundos por pesquisa de gateway (1-20).             |

## Ciclo de vida

| Método | Descrição |
| --------- | ----------- |
| `connect()` | Resolve a identidade do robô (`GET /api/bot/me`), emite `ready` e inicia o loop do gateway. Resolve uma vez conectado. |
| `close()` | Para o loop do gateway. |
| `connected` | Booleano: se o loop está atualmente em execução. |

## Eventos

Registre-se com `client.on(name, handler)`; alguns são `async`. `once` e `off` funcionam da mesma forma que funcionam em `EventEmitter` de Node.

| Evento             | Argumentos | Notas                                                                   |
| ----------------- | -------- | ----------------------------------------------------------------------- |
| `ready`           | `user`   | `user.id`, `user.userId`, `user.name`, `user.username`, `user.avatarUrl`, `user.scopes`. |
| `messageCreate` | `message` | Uma nova mensagem em um servidor que o bot pode ver.                                 |
| `messageUpdate` | `message` | Uma mensagem foi editada (`content`, `editedAt` atualizada).                    |
| `messageDelete` | `message`| Uma mensagem foi excluída (`content` vazio; `id`/`channelId` válido). |
| `error`           | `error`  | Erros do gateway. O loop tenta novamente automaticamente, a menos que o token seja inválido, no qual caso ele para. |
| `debug`           | `*`      | Observabilidade de baixo nível.                                                |

### `Message`

| Campo | Tipo                | Descrição                                    |
| ----------- | ------------------- | ---------------------------------------------- |
| `id`        | `string`            | ID da mensagem.                                    |
| `channelId` | `string`            | ID do canal.                                    |
| `serverId` | `string \| null` | ID do servidor.                                     |
| `author` | `object \| null` | `{ id, username, display_name, avatar_url, is_bot }`. |
| `content` | `string` | Texto da mensagem.                                  |
| `replyToId` | `string \| null` | A mensagem para a qual esta resposta está sendo feita, se houver. |
| `mentions` | `array` | Usuários mencionados.                                |
| `attachment`| `object \| null` | `{ url, type }` quando a mensagem tem um arquivo. |
| `createdAt` | `string \| null` | Timestamp ISO.                                 |
| `editedAt` | `string \| null` | Timestamp ISO da última edição.                |
| `displayId` | `number \| null` | O número de exibição sequencial.                 |

**Métodos** — `message.reply(content)` (respostas no mesmo canal) e o recuperador `message.authorIsBot` (verdadeiro quando o remetente foi um robô).

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

## Erros

Erros lançados carregam o status e o corpo:

| Erro              | Quando                                                |
| ------------------ | --------------------------------------------------- |
| `AuthError` | `401` — token inválido ou revogado. O loop do gateway para com isso. |
| `PermissionError` | `403` — falta permissão de escopo ou função. |
| `RateLimitError` | `429` — inclui segundos `retryAfter`.              |
| `HttpError` | Qualquer outro status não 2xx.                           |

Internamente, o cliente é um invólucro fino sobre o [Referência da API](../api-reference.md): `REST.get/post/patch/delete` com `Authorization: Bot <token>`.
