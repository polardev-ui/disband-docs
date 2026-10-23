# Embeds

Um incorporação é um cartão estruturado anexado a uma mensagem: uma faixa colorida, um título, texto rico, campos, imagens e um rodapé. O Disband usa a forma e os limites de incorporação do Discord, então uma incorporação construída para um webhook ou bot Discord normalmente funciona inalterada.

Incorporações podem ser enviadas por:

- [Webhooks](webhooks.md), com `embeds` no corpo de execução;
- [Referência da API](../bots/api-reference.md), com `embeds` no corpo da mensagem enviada.

As mensagens do lado do cliente não podem definir incorporações diretamente. Isso impede que um membro forje um webhook ou um cartão de incorporação.

## Um exemplo completo

```json
{
  "content": "A new release is ready.",
  "embeds": [
    {
      "title": "Disband 2.4.1",
      "description": "Fixes the **role picker** and improves uploads.",
      "url": "https://disband.dev/changelog",
      "color": 5793266,
      "timestamp": "2026-10-19T20:15:00.000Z",
      "author": {
        "name": "Release bot",
        "url": "https://disband.dev",
        "icon_url": "https://disband.dev/logo.png"
      },
      "thumbnail": {
        "url": "https://disband.dev/logo.png"
      },
      "fields": [
        { "name": "Channel", "value": "stable", "inline": true },
        { "name": "Build", "value": "1842", "inline": true },
        { "name": "Rollout", "value": "100% of spaces", "inline": false }
      ],
      "footer": {
        "text": "Disband releases",
        "icon_url": "https://disband.dev/logo.png"
      }
    }
  ]
}
```

`5793266` é `0x5865F2`, a cor azul da marca de Disband.

## O objeto incorporado

| Campo | Tipo | Notas                                                       |
| ------------- | ------ | ----------------------------------------------------------- |
| `title`       | string | Até 256 caracteres. Renderizado como um link quando `url` é definido. |
| `description` | string | Até 4.096 caracteres. Suporta Markdown.                  |
| `url`         | string | Faz com que o título seja clicável. `http` ou `https` URL absoluto. |
| `color` | número | `0xRRGGBB` como um inteiro. Uma string `"#5865F2"` também funciona. |
| `timestamp` | string | ISO 8601 data e hora. Mostrado no rodapé.                |
| `footer` | objeto | `{ "text": "…", "icon_url": "…" }`. Texto até 2.048 caracteres. |
| `author` | objeto | `{ "name": "…", "url": "…", "icon_url": "…" }`. Nome até 256 caracteres. |
| `fields` | array | Até 25 objetos de campo. Veja abaixo.                          |
| `image` | objeto | `{ "url": "…" }`. Exibido abaixo da descrição. |
| `thumbnail` | objeto | `{ "url": "…" }`. Exibido à direita.                   |
| `video`       | objeto | Aceito para compatibilidade; ainda não renderizado.              |
| `provider` | objeto | Aceito para compatibilidade; ainda não renderizado. |

Todos os campos URL devem ser `http` ou `https` URLs absolutos. URLs contendo um nome de usuário ou senha são descartados. Imagens URLs inseguras são descartadas pelo cliente, bem como pelo servidor.

### Campos

```json
{
  "name": "Uptime",
  "value": "99.98% over 90 days",
  "inline": true
}
```

| Propriedade | Tipo | Notas                                            |
| -------- | ------- | ------------------------------------------------ |
| `name` | string | Obrigatório. Até 256 caracteres. |
| `value` | string | Obrigatório. Até 1.024 caracteres. Markdown funciona. |
| `inline` | booleano | `true` coloca os campos lado a lado onde o espaço permitir. |

Um campo com um `name` ou `value` ausente ou vazio é um erro de hardware. Se você tiver dados vazios, omita o campo ou substitua por um hífen.

## Markdown

As descrições e os valores do campo suportam o Disband do Markdown: negrito, itálico, riscado, código em linha, blocos de código, links e emoji personalizados. Os títulos, nomes dos autores e o texto do rodapé são texto simples.

As menções dentro do texto incorporado são exibidas, mas não criam um ping. Use `content` se você precisar de uma notificação de menção real.

## Limites

| Limite                              | Valor |
| ---------------------------------- | ----- |
| Incorporações por mensagem                 | 10 |
| Título                              | 256 |
| Descrição                        | 4.096 |
| Campos por incorporação                   | 25    |
| Nome do campo                     | 256 |
| Valor do campo                        | 1.024 |
| Texto do rodapé                        | 2.048 |
| Nome do autor                        | 256 |
| Total de caracteres em todos os incorporações | 6.000 |

O total inclui títulos, descrições, texto do rodapé, nomes de autores, nomes de campos e valores de campo. URLs e metadados de imagem não contam.

## Como a entrada é normalizada

A API valida cada incorporação antes de ela chegar ao banco de dados:

- Propriedades desconhecidas são descartadas.
- O texto é cortado. Texto muito longo é truncado até o limite em vez de rejeitado.
- Cores inválidas são descartadas.
- URLs inválidos são descartados. Os campos URL válidos são mantidos.
- Timestamps inválidos são descartados.
- Um embed vazio é rejeitado com `Embed is empty`.
- Um campo sem nome ou valor é rejeitado.
- Mais de 10 incorporações, ou mais de 6.000 caracteres totais, são rejeitados.

Parênteses quadrados em um nome de erro identificam o item exato, por exemplo:

```text
embeds.0.fields.2: name and value are required
```

## Enviando incorporações

### De um webhook

```bash
curl -X POST 'https://disband.dev/webhook/12345678/01234567890123456789012345' \
  -H 'Content-Type: application/json' \
  -d '{
    "content": "A new release is ready.",
    "embeds": [{
      "title": "Disband 2.4.1",
      "description": "Fixes the **role picker** and improves uploads.",
      "color": 5793266
    }]
  }'
```

### De um bot

```bash
curl -X POST 'https://www.disband.dev/api/v1/channels/CHANNEL_ID/messages' \
  -H "Authorization: Bot $DISBAND_BOT_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "embeds": [{
      "title": "Nightly build",
      "description": "All 412 tests passed.",
      "color": 5793266
    }]
  }'
```

Ao enviar apenas incorporações, `content` pode ser omitido. Uma mensagem sem conteúdo nem incorporações é rejeitada.

## relacionado

- [Webhooks](webhooks.md) — execute e gerencie mensagens webhooks.
- [Referência da API](../bots/api-reference.md) — os pontos finais de mensagens do bot.
