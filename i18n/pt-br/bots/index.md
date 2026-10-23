# Bots

Os bots do Disband são integrações auto-hospedadas. Você executa o código, o Disband transmite mensagens de e para ele. O Disband nunca hospeda ou executa o código do seu bot.

## Como funciona

1. **Crie um bot** em **Configurações → Bots** e escolha os escopos que ele precisa. Você obtém
   Um token de volta - ele é mostrado **uma vez**.
2. Em **Configurações → Bots**, gere um **link de convite** para o servidor que você deseja
   O bot para se juntar e enviá-lo para o **proprietário** desse servidor.
3. O proprietário abre o link e aprova. O robô se torna um membro do servidor.
4. Você executa uma das bibliotecas de clientes em algum lugar (um servidor, uma função em nuvem,
   Seu laptop) e ele se conecta a Disband com o token.

## Escopos

O alcance de um bot em um servidor é a **intersecção** dos escopos que você solicitou ao criá-lo e dos escopos aprovados pelo proprietário para esse servidor específico:

| Escopo             | Descrição                                                                 |
| ----------------- | -------------------------------------------------------------------- |
| `messages.read` | Receba eventos de mensagens no gateway e leia mensagens/canais. |
| `messages.write` | Envie e responda a mensagens em canais que o bot possa ver. |
| `members.read` | Liste os membros dos servidores aos quais o bot se juntou.                      |
| `channels.manage` | Crie, renomeie e exclua canais — também precisa do papel `manage_channels` no servidor. |

## Autenticação de token

Cada chamada API é autenticada com o token do bot:

```
Authorization: Bot <token>
```

Os tokens de bot são **hashados em repouso** - o token bruto nunca é armazenado ou recuperável. Se ele vazar (ou você não precisar mais do bot), revogue-o em **Configurações → Bots**; a revogação mata o token imediatamente.

## Limites e segurança

- Até **5 bots por conta**. Um bot pode ser revogado a qualquer momento, o que mata seu
  Token.
- Mensagens de até **4.000 caracteres**. Os bots precisam do papel `mention_everyone`
  Permissão para usar `@everyone`.
- Apenas o **proprietário** de um servidor pode aprovar uma solicitação de convite de bot. As solicitações expiram após
  **7 dias**.
- Os tokens de bot são hashados em repouso; o token bruto nunca é armazenado ou recuperável.
- Os bots nunca podem acessar diretamente a base de dados — todas as ações passam por um escopo
  Pontos finais API.

## Escolha um caminho

- **[Primeiros passos](getting-started.md)** — crie um bot e convide-o.
- **[Hospede seu próprio bot](hosting-your-own-bot.md)** — onde executar o cliente.
- **[JavaScript](clients/javascript.md)** / **[Python](clients/python.md)**.
- **[Referência da API](api-reference.md)** se você quiser falar com a API diretamente.
- **[Modelos](templates.md)** — bots de boas-vindas prontos para serem adaptados, gerentes de tickets e muito mais.
