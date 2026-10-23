# Temas

Os membros Disband **SUPER** podem reformular o aplicativo: escolha uma das skins enviadas ou escreva seu próprio CSS e faça o upload de seus próprios ícones. Um tema é salvo em sua conta, então ele já está ativado quando você fizer login em outro lugar.

Os temas se aplicam em **web e desktop**. iOS e Android são construídos nativamente e não têm uma estrutura de estilo para um tema aplicar, então seu tema sincroniza, mas não é desenhado lá.

## As peles enviadas

Nove são incorporados e eles mudam mais do que a cor — cantos, fontes e a forma como os controles são desenhados:

- **Minecraft** — tipo de pixel, cantos retos, sem cantos arredondados.
- **Call of Duty** — cinza arejado, bonés estampados, textura de filme em tudo.
- **2000s** — Tahoma, controles chanfrados, Windows XP azul.
- **Frutiger Aero** — vidro brilhante, azul para verde, luz capturada em cada canto.
- **Terminal** — fosforescente verde sobre preto, espaçado único, com as linhas de varredura.
- **Vaporwave** — rosa quente e ciano sobre roxo, cromo em todos os botões.
- **Papel** — branco-claro quente e com serifas; parece algo impresso.
- **Neon** — quase preto, com magenta e ciano escorrendo em cada borda.
- **Brutalista** — preto sobre branco, bordas de dois pixels, sombras que são blocos sólidos.

Escolha um em **Configurações → Temas**. Uma pele e seu próprio CSS personalizado funcionam juntos: a pele é aplicada primeiro, então seu CSS pode ajustá-la em vez de ter que substituí-la.

## Variáveis de cor

Estes são os API estáveis. Configure-os em `:root` e todas as superfícies no aplicativo seguem, incluindo telas adicionadas depois que você escreveu o tema.

| Variável                | Afeta                                                                |
| ----------------------- | -------------------------------------------------------------- |
| `--bg-primary` | A tela de bate-papo - a maior superfície do aplicativo. |
| `--bg-secondary` | Painéis ao lado dele: lista de canais, lista de membros, cartões. |
| `--bg-tertiary` | O cromo mais externo, incluindo a trilha do servidor. |
| `--bg-accent`           | Superfícies embutidas: o compositor, blocos de código, entradas.             |
| `--interactive-hover` | Passar o mouse sobre a linha e o botão.                                          |
| `--interactive-selected`| A linha em que você está atualmente.                                  |
| `--brand`               | Botões primários, links, anéis de foco, seus próprios acentos.         |
| `--brand-hover` | O mesmo, com o mouse sobreposto.                                             |
| `--text-normal`         | Texto do corpo.                                                     |
| `--text-muted`          | Timestamps, rótulos secundários, espaços reservados.                    |
| `--text-link`           | Links dentro das mensagens.                                         |
| `--status-online`       | Ponto on-line, estados de sucesso.                                    |
| `--status-idle`         | Ponto em branco, avisos.                                            |
| `--status-dnd` | Ponto de não-distúrbio, erros e ações destrutivas. |
| `--status-offline`      | Ponto offline.                                                   |
| `--divider`             | Cada borda da linha de cabelo no aplicativo.                              |
| `--super`               | O sotaque Disband SUPER.                                      |

## Forma e tipo

Disband desenha seus cantos com a escala de raio do Tailwind, e essa escala lê dessas variáveis. Definir uma muda todos os cantos desse tamanho no produto de uma vez - você não precisa encontrar os componentes.

| Variável | Afeta                                              |
| ------------------ | ---------------------------------------------------- |
| `--skin-radius-sm` | `rounded-sm` da Tailwind. Pequenos chips e etiquetas. |
| `--skin-radius-md` | `rounded-md` — a maioria dos botões e entradas. |
| `--skin-radius-lg` | `rounded-lg` — cartões e painéis.                    |
| `--skin-radius-xl` | `rounded-xl` — modais, quadros de chamada.                  |
| `--skin-radius-2xl` | `rounded-2xl` — grandes sobreposições.                     |
| `--skin-radius-3xl` | `rounded-3xl` — as maiores superfícies.               |
| `--skin-font` | A fonte de interface do usuário para todo o aplicativo. |

Avatares e pontos de status não estão deliberadamente nesta lista: eles são círculos porque um avatar quadrado torna a lista de membros difícil de ler. Você ainda pode quadrá-los direcionando-os diretamente.

**Se você estiver construindo um tema leve**, defina `color-scheme: light` em `:root` para que as barras de rolagem e os controles nativos se invertam com ele, e lembre-se que `--bg-tertiary` carrega texto: é a trilha do servidor, então um valor escuro lá com `--text-normal` escuro torna essas etiquetas invisíveis em vez de apenas de baixo contraste.

## Seletores

Cada controle em Disband é um `<button>`, `<input>` ou `<textarea>` real, então os seletores de elementos alcançam todo o aplicativo e continuam funcionando conforme ele muda:

```css
button { border-radius: 0; }
button:active { transform: translateY(1px); }
input, textarea { border: 1px solid var(--divider); }
```

As classes de layout são utilitários Tailwind, e os seletores de estilo `[class*="bg-brand"]` funcionam — mas não são uma API suportado. As classes de utilitário mudam quando uma tela é redesenhada, e um tema construído sobre elas quebrará em algum lançamento. As variáveis acima não o farão.

## Ícones carregados

Carregue uma imagem em **Configurações → Temas** e dê-lhe um nome. Ela se torna uma variável que contém um `url()` pronto para uso:

```css
/* An icon uploaded as "send" */
.some-target {
  background-image: var(--icon-send);
}
```

Os nomes usam letras minúsculas, números e hífenes, até 40 caracteres. Um tema pode conter até 100 ícones e cada upload é limitado a 2 MB.

## Modelo inicial

Cole isso no editor e mude o que você quiser:

```css
/* ---------------------------------------------------------------
   A Disband theme. Everything here is optional — delete what you
   do not want to change.
   --------------------------------------------------------------- */

:root {
  /* Colours. These reach every surface in the app. */
  --bg-primary: #1b1b1f;
  --bg-secondary: #16161a;
  --bg-tertiary: #101013;
  --bg-accent: #131316;
  --interactive-hover: #26262c;
  --interactive-selected: #2f2f37;
  --brand: #7c5cff;
  --brand-hover: #6647e0;
  --text-normal: #ececf0;
  --text-muted: #9a9aa5;
  --divider: #2a2a31;

  /* Shape. One value here squares (or rounds) every matching
     corner in the product at once. */
  --skin-radius-md: 4px;
  --skin-radius-lg: 6px;

  /* Type. Any font already on the system, or one you name below. */
  --skin-font: "Inter", system-ui, sans-serif;
}

/* Buttons are ordinary <button> elements, so this reaches all of
   them — the composer, the toolbar, dialogs, everything. */
button {
  transition: transform 80ms ease;
}

button:active {
  transform: translateY(1px);
}

/* An icon you uploaded, referenced by the name you gave it. */
.my-custom-send::before {
  content: "";
  display: inline-block;
  width: 20px;
  height: 20px;
  background-image: var(--icon-send);
  background-size: contain;
}
```

## O que não é permitido

Seu CSS é verificado antes de ser aplicado, e qualquer coisa removida é listada para você em vez de ser descartada silenciosamente:

- `@import` — ele carregaria uma folha de estilos de outro servidor em cada lançamento.
- `<` e `>` — CSS não tem nenhum uso para eles, e eles podem terminar a planilha de estilos mais cedo.
- Valores `expression()` e `url()` que não são `https:` ou uma imagem `data:`.
- Os temas são limitados a 100 KB de CSS.

Fontes da web podem ser carregadas com `@font-face` a partir de um endereço `https:`, ou de um ícone que você carregou.

## Se sua assinatura terminar

Os temas são um recurso do SUPER, então se um pagamento falhar, seu tema deixa de ser aplicado e o Disband retorna à sua aparência normal - com um aviso dizendo por que, em vez de mudar silenciosamente de forma.

**Nada é excluído.** Sua pele, seu CSS e seus ícones permanecem em sua conta; reInscreva-se e eles retornam exatamente como você os deixou.
