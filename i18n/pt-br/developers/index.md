# Desenvolvedores

Construa sobre o Disband: bots, integrações e ferramentas que falam com seus espaços do lado de fora. Tudo aqui é hospedado por conta própria - o Disband nunca executa seu código.

## O que você pode construir

- **Bots** — contas hospedadas por conta própria que leem e escrevem mensagens, gerenciam canais,
  E reaja a eventos através de um gateway de votação longa. Veja a [Bots](../bots/index.md).
- **Webhooks** — notificações de um lado postadas através de um URL secreto, sem bot
  Código ou token. Veja [Webhooks](webhooks.md).
- **Cartões incorporados** — notas de lançamento estruturadas, alertas e atualizações de status.
  Veja [Embeds](embeds.md).
- **Clientes personalizados** — fale diretamente com a API HTTP se você precisar de um idioma o
  Clientes enviados não são cobertos. A referência [Referência da API](../bots/api-reference.md) é
  O contrato.
- **Integrações de status** — acompanhe os incidentes Disband via RSS, ou leia como o
  [Sistema de status](status.md) registra verificações e abre incidentes.

## Comece aqui

1. **[Primeiros passos](../bots/getting-started.md)** — crie um bot, pegue seu
   Token, convide-o para um espaço. Cerca de dois minutos.
2. **[Hospede seu próprio bot](../bots/hosting-your-own-bot.md)** — onde executar
   O cliente e como mantê-lo vivo.
3. **[JavaScript](../bots/clients/javascript.md)** ou
   **[Python](../bots/clients/python.md)**.
4. **[Referência da API](../bots/api-reference.md)** para os pontos finais exatos.
5. **[Webhooks](webhooks.md)** ou **[Embeds](embeds.md)** se você só precisar
   Notificações de um lado.
6. **[Sistema de status](status.md)** para a página de status público e o feed RSS.

## Implementando Disband em um jogo ou aplicativo

Disband expõe uma API HTTP simples autenticado com um token de bot. Não há SDK nativo ou tempo de execução RPC para vincular - qualquer pilha que possa fazer solicitações HTTPS funciona. Uma integração típica parece assim:

1. Crie um bot em **Configurações → Bots** e conceda-lhe `messages.write` (e
   `channels.manage` se ele deve criar canais).
2. Convide o bot para o espaço no qual você deseja postar.
3. Armazene o token na loja secreta do seu jogo ou aplicativo - nunca no lado do cliente.
   Código que é enviado para os jogadores.
4. Do seu backend, ligue para os pontos finais com escopo:

   ```bash
   curl -X POST https://www.disband.dev/api/v1/channels/CHANNEL_ID/messages \
     -H "Authorization: Bot $DISBAND_BOT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"content": "Server restarted — 12 players online."}'
   ```

5. Para reagir ao bate-papo dentro do seu jogo, faça um longo ping no gateway e envie
   Eventos `messageCreate` para a lógica do seu jogo.

### Notas de segurança

- Os tokens de bot são hashados em repouso e exibidos apenas uma vez. Revogue imediatamente se um
  Vazamentos.
- Mantenha os tokens em um servidor que você controla. Enviar um token em um cliente de jogo permite
  Alguém se passar por seu bot.
- Limite os bots ao menor privilégio de que eles precisam. Um bot apenas para postagens não precisa
  `members.read` ou `channels.manage`.

## Temas para desenvolvedores

Se você estiver construindo um cliente ou skin de marca, as variáveis CSS no [Temas](../themes/index.md) são a API de estilo estável.

## Perguntas

- Relatórios de bugs: abra um problema ou envie um e-mail para a equipe.
- Para problemas específicos da conta, use o suporte dentro do aplicativo.
