# Sistema de status

A página de status do Disband é hospedada por conta própria. Não depende de um serviço de status de terceiros, então ainda pode relatar com precisão quando o host da web principal, API, ou a entrega de ativos estáticos estiver com problemas.

- Página pública: [disband.dev/status](https://www.disband.dev/status)
- Fluxo RSS: [disband.dev/status/feed.xml](https://www.disband.dev/status/feed.xml)
- Administrador do proprietário: [disband.dev/status/admin](https://www.disband.dev/status/admin)

## O que a página pública mostra

A página organiza os monitores por serviço. Para cada monitor, ela mostra:

- o estado atual do último cheque;
- o status HTTP e o tempo de resposta desse cheque;
- uma barra de tempo de atividade de 90 dias, um segmento por dia;
- a última vez que um cheque foi emitido.

Abaixo dos monitores estão incidentes, manutenção agendada e anúncios. Cada um abre uma página de detalhes com a linha do tempo completa da atualização. O feed publica os últimos 25 incidentes, janelas de manutenção e anúncios publicados como RSS 2.0.

## Cheques

Uma função Supabase Edge chamada `status-probe` é executada a cada minuto sob `pg_cron`. Ela inspeita todos os monitores habilitados em paralelo e registra uma linha por verificação.

Cada monitor tem:

| Cenário | Significado                                                                |
| --------------- | ---------------------------------------------------------------------- |
| Nome            | A etiqueta pública, por exemplo **Site**.                             |
| Grupo | A seção em que ele aparece, por exemplo **Disband**. |
| URL             | O `http` ou `https` URL absoluto para solicitar.                         |
| Método | `GET` ou `HEAD`. Padrão é `GET`.                                    |
| Status esperado | O status exato do HTTP que conta como saudável. Padrão é `200`. |
| Palavra-chave | Texto opcional que deve aparecer no corpo da resposta.                   |
| Tempo limite | 1 a 30 segundos. Padrão é 10 segundos.                                  |
| Cabeçalhos | Cabeçalhos de solicitação opcionais, armazenados no lado do servidor.                          |
| Ativado | Quer a sonda solicite isso ou não.                                  |
| Público | Quer contribua para a instantânea pública.                         |

Um monitor é saudável apenas quando o código de status corresponde **e** a palavra-chave opcional está presente. Os redirecionamentos são seguidos. Um tempo de espera excedido, erro de rede, status incorreto ou palavra-chave ausente são registrados como uma verificação falhada com a razão.

A sonda funciona de forma independente do aplicativo da web. Um falha no host da web não impede que as verificações sejam registradas.

## Histórico e tempo de atividade

Cada cheque é armazenado em `status_checks`. Um gatilho de banco de dados enrola cada cheque em `status_daily`, então a barra de 90 dias é uma leitura barata em vez de uma agregação sobre milhões de linhas.

- Os cheques brutos são mantidos por **90 dias**.
- Os resumos diários são mantidos por **180 dias**.
- A página pública exibe os últimos **90 dias**.
- O segmento de cada dia é a porcentagem de cheques bem-sucedidos naquele dia.

Uma lacuna — um dia sem verificações — é exibida como sem dados, não como tempo de inatividade.

## Incidentes automáticos

A sonda abre um incidente automaticamente quando um monitor falha **três verificações seguidas**. O incidente é um incidente **importante**, vinculado a esse monitor, e começa em **Investigando** com uma atualização automatizada contendo o último erro.

Quando o próximo controle for bem-sucedido, o incidente é movido para **Resolvido** e uma atualização registra aproximadamente quanto tempo durou a interrupção. O incidente permanece na página e no feed com seu histórico completo.

Se um serviço estiver funcionando, mas não falhando três vezes consecutivas, nenhum incidente automático é aberto. O proprietário ainda pode adicionar uma atualização manual a um incidente automático enquanto ele estiver aberto.

## Incidentes manuais, manutenção e anúncios

O proprietário pode publicar três tipos de entrada:

| Tipo | Uso para                                                         |
| ------------- | --------------------------------------------------------------- |
| `incident` | Um problema imprevisto.                                           |
| `maintenance` | Trabalho planejado, opcionalmente com um horário de início e término. |
| `announcement`| Um aviso geral de serviço que não é uma interrupção.                 |

Um incidente pode afetar nenhum, um ou vários monitores. Seu impacto é de `none`, `minor`, `major` ou `critical`.

Os status de atualização são:

- `investigating`
- `identified`
- `monitoring`
- `resolved`
- `scheduled`
- `in_progress`
- `completed`
- `published`

Cada atualização adiciona uma entrada com data e hora ao histórico do incidente e define o status atual do incidente. Marcando uma atualização como `resolved` ou `completed` também define o tempo resolvido. Publicar uma atualização posterior com outro status a reabre.

## Status geral

O banner é decidido nesta ordem:

1. Uma janela de manutenção ativa diz **Manutenção em andamento**, ou
   **Manutenção agendada** antes de começar.
2. Um incidente crítico ou principal ativo diz **Interrupção principal**.
3. Um incidente menor ativo diz **Parcialmente degradado**.
4. Monitores falhados dizem **Parcialmente degradado** ou **Falta grave** quando todos
   O monitor público está falhando.
5. Sem falhas e pelo menos um resultado, diz **Todos os sistemas operacionais**.
6. Antes que os primeiros cheques cheguem, diz **Aguardando os primeiros cheques**.

Incidentes resolvidos não afetam o banner.

## privacidade

O caminho de leitura pública é uma função de banco de dados, não acesso direto à tabela. Ele retorna nomes de monitor, grupos, estados, latência, tempo de atividade e incidentes. Ele deliberadamente omite:

- monitorar URLs;
- cabeçalhos de solicitação;
- texto de erro de sondagem;
- IDs de verificação interna;
- as identidades por trás das atualizações de incidentes.

As tabelas básicas têm a segurança em nível de linha ativada sem políticas públicas. Apenas o papel de serviço e a função de sondagem podem lê-las diretamente.

## administração

`/status/admin` está restrito ao **proprietário da plataforma** iniciado. Não é um papel de espaço e não pode ser concedido a outro membro. Solicitações não autenticadas recebem `401`; outras contas iniciadas recebem `403`.

A tela de administração pode:

- criar, editar, ativar, desativar, publicar ou excluir monitores;
- ver o URL, cabeçalhos e último resultado de cada monitor;
- publicar incidentes, janelas de manutenção e anúncios;
- adicionar atualizações da linha do tempo e alterar o impacto ou os serviços afetados por um incidente;
- excluir um monitor e seu histórico.

### Administrador API

A tela usa essas rotas apenas para proprietários:

| Método                 | Ponto de destino                                       |
| ---------------------- | ---------------------------------------------- |
| `GET`, `POST`          | `/api/status-admin/monitors`                   |
| `PATCH`, `DELETE`      | `/api/status-admin/monitors/{id}`              |
| `GET`, `POST`          | `/api/status-admin/incidents`                  |
| `PATCH`, `DELETE`      | `/api/status-admin/incidents/{id}`             |
| `POST`                 | `/api/status-admin/incidents/{id}/updates`     |

Eles aceitam o token de acesso Supabase do proprietário como `Authorization: Bearer <token>`. Eles são detalhes de implementação da tela de administrador, não uma API público; a forma pode mudar.

## Observações operacionais

- A sonda autentica-se com um segredo armazenado no Supabase Vault em
  `status_probe_key`. O segredo é comparado dentro do banco de dados e não é
  Retornado à função.
- O trabalho `pg_cron` é chamado de `status-probe`. Ele lê o segredo do Vault em
  Toda execução, então rotacionar o segredo não requer edição do trabalho.
- A Função Edge é implantada com a verificação JWT desativada, porque ela
  Autentica com o segredo do Vault em vez disso.
- Se a própria sonda parar de funcionar, a página exibirá como desatualizada.
  **últimas verificações**. Esse é o sinal para inspecionar o trabalho cron e o Edge
  Registros de funções.

## relacionado

- [Webhooks](webhooks.md) — envie notificações de interrupção para um canal.
- [Embeds](embeds.md) — formate essas notificações.
