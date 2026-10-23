# Webhooks

Um webhook publica mensagens em um canal através de um URL secreto. Não precisa de código de bot, nenhum loop de gateway e nenhum cabeçalho `Authorization` — se você puder fazer uma solicitação HTTP, poderá publicar em Disband.

Webhooks são separados de bots. Use um webhook para notificações de um lado da CI, monitoramento, servidores de jogos, formulários ou qualquer outra coisa que possa chamar um URL. Use um [Bots](../bots/index.md) quando precisar ler eventos ou agir sobre mensagens.

## Crie um webhook

Você precisa da permissão **Gerenciar Webhooks** no espaço.

1. Abra **Configurações de Espaço → Integrações → Webhooks**.
2. Escolha um canal e selecione **Nova webhook**.
3. Dê-lhe um nome e, se quiser, um avatar.
4. Copie o webhook URL.

O URL parece assim:

```text
https://disband.dev/webhook/12345678/01234567890123456789012345
```

| Parte | Significado                                                                |
| ----------- | -------------------------------------------------------------- |
| Tecla de espaço | Oito dígitos identificando o espaço. Não é secreto.                |
| Token | Vinte e seis dígitos. Este é o segredo. Trate-o como uma senha. |

O mesmo endpoint também é servido em `https://disband.dev/api/webhooks/<space key>/<token>`.

A partir dessa tela, você pode renomear o webhook, reiniciar seu token ou excluí-lo. Reiniciar o token invalida imediatamente o antigo URL. Excluir o webhook interrompe sua postagem, mas deixa mensagens que ele já enviou no canal.

## Executar um webhook

Envie um `POST` para o webhook URL com um corpo JSON.

```bash
curl -X POST 'https://disband.dev/webhook/12345678/01234567890123456789012345' \
  -H 'Content-Type: application/json' \
  -d '{
    "content": "Deploy finished — **v2.4.1** is live.",
    "username": "Deploy bot",
    "avatar_url": "https://example.com/deploy.png"
  }'
```

Uma solicitação bem-sucedida retorna `204 No Content`. Adicione `?wait=true` para receber o objeto de mensagem criado em vez disso:

```bash
curl -X POST 'https://disband.dev/webhook/12345678/01234567890123456789012345?wait=true' \
  -H 'Content-Type: application/json' \
  -d '{ "content": "Hello from the other side." }'
```

### Campos corporais

| Campo             | Tipo    | Notas                                                                    |
| ----------------- | ------- | ------------------------------------------------------------------------ |
| `content` | string | Até 2.000 caracteres. Pode ser omitido quando pelo menos um incorporação estiver presente. |
| `username` | string | Substitui o nome do webhook para esta mensagem. Até 80 caracteres. |
| `avatar_url` | string | Substitui o avatar para esta mensagem. `http` ou `https` URL absoluto. |
| `embeds`          | array   | Até 10 [Embeds](embeds.md).                                             |
| `embed`           | objeto | Forma singular legada. Tratado como `embeds: [embed]`.                      |
| `allowed_mentions`| objeto | Controla pings. Veja abaixo.                                                |
| `tts`             | booleano | Aceito para compatibilidade; atualmente ignorado.                            |
| `flags`           | número | Aceito para compatibilidade; atualmente ignorado.                            |

`username` não pode conter `disband` ou `clyde`, em qualquer formato. Isso impede que um webhook se faça passar por funcionários da plataforma.

Anexos de arquivos ainda não são suportados. Uma solicitação multipart pode ser analisada, mas os arquivos não são armazenados; use um bot se você precisar fazer o upload de arquivos.

### Mencionar controle

Por padrão, um webhook analisa tanto as menções de usuários quanto `@everyone` / `@here`, o mesmo que Discord.

Para pingar ninguém:

```json
{ "content": "Build 184 finished.", "allowed_mentions": { "parse": [] } }
```

Para permitir menções de usuários, mas não para todos:

```json
{
  "content": "Thanks @polar.",
  "allowed_mentions": { "parse": ["users"] }
}
```

A base de dados ainda armazena `@everyone` quando é suprimida, mas nenhuma notificação é enviada. Quando o campo está completamente ausente, tudo é analisado.

## Objetos de mensagem

Com `?wait=true`, a resposta é uma mensagem em forma de Discord. Disband usa seu ID de mensagem numérico em `id`.

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

## Gerenciar mensagens

Um webhook pode recuperar, editar e excluir mensagens que ele postou. Use o ID numérico da mensagem da resposta de execução.

| Método | Endereço de destino                                      | Resultado                         |
| -------- | --------------------------------------------- | ------------------------------ |
| `GET` | `/webhook/<key>/<token>/messages/<id>` | Retire a mensagem. |
| `PATCH` | `/webhook/<key>/<token>/messages/<id>` | Editar `content` e/ou `embeds`. |
| `DELETE` | `/webhook/<key>/<token>/messages/<id>`        | Exclua a mensagem. Retorna `204`. |

Editar exemplo:

```bash
curl -X PATCH 'https://disband.dev/webhook/12345678/01234567890123456789012345/messages/4821' \
  -H 'Content-Type: application/json' \
  -d '{ "content": "Deploy finished — rolled back." }'
```

Somente as mensagens autorizadas por esse webhook podem ser alteradas. Um webhook diferente recebe `404 Unknown Message`.

## Gerenciar o próprio webhook

| Método | Endereço de destino | Resultado                                      |
| -------- | ----------------------------------- | ------------------------------------------- |
| `GET` | `/webhook/<key>/<token>` | objeto Webhook (nome, avatar, canal, URL). |
| `PATCH` | `/webhook/<key>/<token>` | Renomeie-o para `{ "name": "New name" }`. |
| `DELETE` | `/webhook/<key>/<token>`            | Exclua-o. Retorna `204`.                   |

Excluir através do URL é permanente e equivalente a excluí-lo na tela de Integrações.

## Limites de taxa

Cada webhook é limitado a **5 solicitações por 2 segundos**. O limite é baseado no token, então um webhook ruidoso não pode atrasar outro.

Uma solicitação limitada retorna `429`:

```json
{
  "message": "You are being rate limited.",
  "retry_after": 1.34,
  "global": false
}
```

A resposta também carrega `Retry-After` (segundos inteiros) e os cabeçalhos habituais `X-RateLimit-*`. Aguarde o atraso e tente novamente.

## Erros

Os erros usam a forma de Discord:

```json
{ "message": "Unknown Webhook", "code": 10015 }
```

| Status | Código | Significado                                                    |
| ------ | ------- | ---------------------------------------------------------- |
| `400` | `50006` | Mensagem vazia: sem conteúdo e sem incorporações.                   |
| `400` | `50035` | Corpo inválido, incorporação ruim ou conteúdo com mais de 2.000 caracteres. |
| `404` | `10015` | Webhook desconhecido: má chave de espaço, token inválido ou excluído. |
| `404` | `10008` | Mensagem desconhecida.                                           |
| `429` | —       | Taxa limitada. Honre `Retry-After`.                        |
| `500` | —       | Erro do servidor. Tente novamente com um atraso.                          |

Um `404 Unknown Webhook` deliberadamente não diz se a tecla de espaço ou o token estava errado.

## segurança

- Qualquer pessoa com o URL pode postar. Não o crie em um repositório público ou coloque
  Isso no código do lado do cliente.
- Armazene o URL na mesma loja secreta que você usa para as chaves API.
- Reinicie o token imediatamente se ele vazar. O antigo URL para de funcionar imediatamente.
- Um webhook só escreve para o canal configurado. Ele não pode ler mensagens,
  Membros da lista, ou altere as configurações de espaço.

## relacionado

- [Embeds](embeds.md) — o objeto de incorporação e seus limites.
- [Bots](../bots/index.md) — integrações de dois sentidos e entrega de eventos.
- [Referência da API](../bots/api-reference.md) — o bot API HTTP, incluindo
  Suporte de incorporação.
