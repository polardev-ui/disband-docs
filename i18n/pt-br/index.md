# Documentação do Disband

Tudo o que você precisa para construir em Disband.

## Bots

Os bots do Disband são **integrações auto-hospedadas**: você executa o código, o Disband transmite mensagens de e para ele. O Disband nunca hospeda ou executa seu bot.

- **[Primeiros passos](bots/getting-started.md)** — crie um bot, pegue seu token,
  e convide-o para um servidor. Leva cerca de dois minutos.
- **[Bots](bots/index.md)** — escopos, convites, limites e segurança.
- **[Hospede seu próprio bot](bots/hosting-your-own-bot.md)** — onde executar o cliente e como mantê-lo vivo.
- **[JavaScript](bots/clients/javascript.md)** — `@disband/bot`.
  Zero dependências; funciona no Node.js 18+, Deno, Bun e no navegador.
- **[Python](bots/clients/python.md)** — `disband-bot`.
  Somente biblioteca padrão; funciona no Python 3.9+.
- **[Referência da API](bots/api-reference.md)** — a API HTTP com a qual ambos os clientes conversam.

## Desenvolvedores

Construa bots e integre Disband em seus jogos e aplicativos usando a API HTTP.

- **[Desenvolvedores](developers/index.md)** — visão geral, comece aqui e segurança
  Notas para integrações de jogos/aplicativos.
- **[Bots](bots/index.md)** — escopos, convites, limites e segurança.
- **[Referência da API](bots/api-reference.md)** — a API HTTP com a qual ambos os clientes conversam.
- **[Modelos](bots/templates.md)** — bots de boas-vindas prontos para serem adaptados, gerentes de tickets e muito mais.
- **[Webhooks](developers/webhooks.md)** — publicação de CI, monitoramento ou um servidor de jogo por uma URL secreta. Sem necessidade de bot.
- **[Embeds](developers/embeds.md)** — Cartões no estilo Discord para lançamentos,
  alertas e atualizações de status.
- **[Sistema de status](developers/status.md)** — como a página pública de status verifica os serviços, registra o tempo de atividade e trata incidentes.

## Temas

Os membros SUPER podem reformular todo o aplicativo com CSS personalizado, temas incluídos e ícones enviados.

- **[Temas](themes/index.md)** — as variáveis CSS que são uma API estável, os seletores que são seguros para direcionar e um modelo inicial.

## Baixar os clientes

- **[@disband/bot](https://raw.githubusercontent.com/polardev-ui/disband-docs/main/zips/disband-bot-0.1.0.tgz)** — o cliente JavaScript
  (`npm install ./disband-bot-0.1.0.tgz`).
- **[disband-bot](https://raw.githubusercontent.com/polardev-ui/disband-docs/main/zips/disband-bot-python-0.1.0.tar.gz)** — o cliente Python
  (`pip install ./disband-bot-python-0.1.0.tar.gz`).
