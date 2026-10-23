# Hospede seu próprio bot

Disband não hospeda ou executa seu bot. Você executa o cliente onde quiser, e ele conversa com o Disband através de um gateway de polling longo usando o token do bot. Esta página cobre o lado prático de manter um bot vivo.

## Onde executá-lo

Qualquer máquina que possa fazer solicitações HTTPS de saída funciona. Como o gateway é de polling contínuo (seu código mantém uma conexão aberta e o Disband retorna eventos quando eles chegam), você não precisa de um endereço público, portas de entrada ou um websocket.

Boas opções, mais baratas primeiro:

| Anfitrião                       | Notas                                                                 |
| -------------------------- | --------------------------------------------------------------------- |
| Um laptop / desktop | Bom para um bot pessoal que esteja online quando você estiver.                  |
| Um pequeno VPS (1 GB de RAM) | ~US$4–6/mês; o cliente JavaScript precisa de quase nada. |
| Uma função / trabalhador em nuvem | Serverless funciona se a plataforma permitir um processo de longa duração; os clientes são suficientemente sem estado para reiniciar de forma barata. |
| Um contêiner / Pterodáctilo | Os clientes têm zero dependências de tempo de execução, então qualquer imagem funciona. |

## O que você realmente precisa

- **JavaScript**: Node.js 18+, ou Deno, ou Bun. Zero dependências de tempo de execução.
- **Python**: Python 3.9+. Somente biblioteca padrão (threading + `urllib`).

Não há banco de dados, fila ou estrutura para instalar.

## Mantendo-o vivo

O gateway gira para sempre sozinho; ele se reconecta e tenta novamente automaticamente. Três coisas tendem a matar bots reais:

1. **Lolos de falha.** Envolva o cliente em um supervisor e reinicie em caso de falha:
   ```bash
   # systemd
   [Unit]
   Description=disband-bot
   After=network-online.target

   [Service]
   ExecStart=/usr/local/bin/node /opt/my-bot/index.js
   Restart=always
   RestartSec=3
   Environment=DISBAND_BOT_TOKEN=…

   [Install]
   WantedBy=multi-user.target
   ```

2. **Tokens vencidos.** Se o bot for revogado (ou um convite expirar antes de ser
   aprovado), o gateway API retorna `401`. Trate-o: registre claramente e pare,
   Em vez de tentar novamente para sempre. Ambos os clientes fazem isso aparecer como um evento `error` —
   JavaScript's `AuthError` / Python's `AuthError` — e o loop para em vez disso
   De martelar.

3. **Desvio de configuração silencioso.** Mantenha o token em uma variável de ambiente ou em segredo.
   Armazenar, não na fonte. Se você rolar o token, reinicie o processo com
   O novo valor.

## Leitura e escrita de dados

Os bots só falam com a API HTTP com escopo definido. Para consultar ou persistir o estado, use qualquer armazenamento que você já opere - um arquivo, um banco de dados, Redis - o cliente não se importa.

## Bots de vários servidores

Um bot pode ser convidado para muitos servidores. Os escopos aprovados são por servidor, então um bot que pode ler mensagens em todos os lugares também só pode escrever onde o proprietário concedeu `messages.write`. Seu código pode se ramificar em `message.server_id` se o comportamento precisar diferir por servidor.

## Vai mais longe

- Veja a **[Referência da API](api-reference.md)** para os pontos finais exatos que
  Clientes usam — útil se você quiser escrever seu próprio cliente em outra linguagem.
- O **[JavaScript](clients/javascript.md)** e **[Python](clients/python.md)**
  As páginas de referência incluem todos os métodos e eventos.
