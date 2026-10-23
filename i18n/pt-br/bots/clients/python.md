# Cliente Python — `disband-bot`

O cliente oficial Python. Usa apenas a biblioteca padrão (`threading` + `urllib`), então não há nada para instalar além do próprio cliente. Funciona no Python 3.9+.

## instalar

```bash
pip install disband-bot
```

Ou, deste monorepo:

```bash
pip install ./packages/disband-bot-python
```

## Início rápido

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

Os manipuladores podem ser simples ou `async def`; ambos são suportados.

## construtor

### `Client(token, base_url="https://www.disband.dev", gateway_timeout=20)`

| Argumento | Padrão                      | Descrição                                  |
| ---------------- | ---------------------------- | -------------------------------------------- |
| `token`          | *(obrigatório)*                 | O token do bot de **Configurações → Bots**.      |
| `base_url` | `"https://www.disband.dev"` | API raiz (mude para um domínio personalizado). |
| `gateway_timeout`| `20`                         | Segundos por pesquisa de gateway (1-20).             |

## Ciclo de vida

| Método | Descrição                                                                |
| -------- | ------------------------------------------------------------------ |
| `run()` | Conecta, emite `ready`, inicia o loop do gateway em uma thread de fundo e bloqueia para sempre. |
| `close()`| Para o loop.                                                    |

## Eventos

Registre-se com `client.on("name", handler)` — como um decorador ou uma chamada simples — além de `once` para manipuladores de disparo único.

| Evento | Argumentos | Notas                                                                 |
| --------------- | -------- | -------------------------------------------------------------------|
| `ready`         | `user`   | `user["id"]`, `user["name"]`, `user["scopes"]`, etc.               |
| `messageCreate` | `message`| Uma nova mensagem em um servidor que o bot pode ver.                          |
| `messageUpdate` | `message`| Uma mensagem foi editada (`content`, `edited_at` atualizada).             |
| `messageDelete` | `message`| Uma mensagem foi excluída (`content` vazio; `id`/`channel_id` válido). |
| `error`         | `error`  | Erros do gateway. O loop tenta novamente automaticamente, a menos que o token seja inválido, no qual caso ele para. |

### `Message`

| Campo | Tipo | Descrição                                        |
| ------------- | ---------------- | -------------------------------------------------- |
| `id`          | `str`            | ID da mensagem.                                        |
| `channel_id` | `str` | ID do canal.                                        |
| `server_id` | `str \| None` | ID do servidor.                                         |
| `author` | `dict \| None` | `{ "id", "username", "display_name", "avatar_url", "is_bot" }`. |
| `content` | `str` | Texto da mensagem.                                      |
| `reply_to_id` | `str \| None` | A mensagem para a qual esta resposta está sendo feita, se houver. |
| `mentions` | `list` | Usuários mencionados.                                   |
| `attachment` | `dict \| None` | `{ "url", "type" }` quando a mensagem tem um arquivo. |
| `created_at` | `str \| None` | Timestamp ISO.                                     |
| `edited_at` | `str \| None` | Timestamp ISO da última edição.                    |
| `display_id` | `int \| None` | O número de exibição sequencial.                     |
| `author_is_bot` | `bool`          | Verdadeiro quando o remetente foi um robô (propriedade).         |

**Métodos** — `message.reply(content)` responde no mesmo canal.

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

## Erros

O cliente cria subclasses de `DisbandError` com um `.status` e `.body`:

| Erro            | Quando                                          |
| ---------------- | --------------------------------------------- |
| `AuthError` | `401` — token inválido ou revogado. O loop do gateway para com isso. |
| `PermissionError`| `403` — falta permissão de escopo ou função. |
| `RateLimitError` | `429` — inclui segundos `retry_after`. |
| `HttpError` | Qualquer outro status não 2xx.                     |

Internamente, o cliente é um invólucro fino sobre o [Referência da API](../api-reference.md): `REST.get/post/patch/delete` com `Authorization: Bot <token>`.
