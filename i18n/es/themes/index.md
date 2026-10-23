# Temas

Los miembros de Disband **SUPER** pueden recargar el diseño de la aplicación: eligen una de las skins enviadas o escriben su propio CSS y cargan sus propios iconos. Un tema se guarda en su cuenta, por lo que ya está activado cuando inician sesión en otro lugar.

Los temas se aplican en **web y escritorio**. iOS y Android se construyen nativamente y no tienen una plantilla de estilos a la que un tema pueda aplicarse, por lo que su tema se sincroniza pero no se dibuja allí.

## Las pieles enviadas

Nueve están integrados y cambian más que el color: los ángulos, las fuentes y la forma en que se dibujan los controles:

- **Minecraft** — tipo de píxel, biseles duros, sin un solo rincón redondeado.
- **Call of Duty** — caqui polvoriento, gorras estampadas, textura de película sobre todo.
- **Década de 2000** — Tahoma, controles biselados, Windows XP azul.
- **Frutiger Aero** - vidrio brillante, azul a verde, luz capturada en cada rincón.
- **Terminal** — fosforescencia verde sobre negro, fuente monospace, con las líneas de escaneo.
- **Vaporwave** — rosa intenso y cian sobre morado, cromo en cada botón.
- **Papel** — blanco pálido cálido y con guiones; se lee como si fuera algo impreso.
- **Neón** — casi negro, con magenta y cian saliendo por todos los bordes.
- **Brutalista** — negro sobre blanco, bordes de dos píxeles, sombras que son bloques sólidos.

Elige uno en **Configuración → Temas**. Una piel y tu propio CSS personalizado trabajan juntos: la piel se aplica primero, por lo que tu CSS puede ajustarlo en lugar de tener que reemplazarlo.

## Variables de color

Estos son los API estables. Configúralos en `:root` y todas las superficies de la aplicación lo seguirán, incluidas las pantallas añadidas después de que hayas escrito el tema.

| Variable                | Afecta                                                                |
| ----------------------- | -------------------------------------------------------------- |
| `--bg-primary`          | La pantalla de chat, la superficie más grande de la aplicación.              |
| `--bg-secondary` | Paneles a su lado: lista de canales, lista de miembros, tarjetas. |
| `--bg-tertiary`         | El cromo más externo, incluyendo el riel del servidor.               |
| `--bg-accent`           | Superficies incrustadas: el compositor, bloques de código, entradas.             |
| `--interactive-hover` | Hover sobre la fila y el botón.                                          |
| `--interactive-selected`| La fila en la que te encuentras actualmente.                                  |
| `--brand`               | Botones primarios, enlaces, anillos de enfoque, tus propios acentos.         |
| `--brand-hover`         | Lo mismo, con el cursor sobre él.                                             |
| `--text-normal`         | Texto del cuerpo.                                                     |
| `--text-muted`          | Timestamps, etiquetas secundarias, espacios en blanco.                    |
| `--text-link`           | Enlaces dentro de los mensajes.                                         |
| `--status-online`       | Punto en línea, estados de éxito.                                    |
| `--status-idle`         | Punto de inactividad, advertencias.                                            |
| `--status-dnd`          | Punto de no molestar, errores y acciones destructivas.            |
| `--status-offline`      | Punto sin conexión.                                                   |
| `--divider`             | Cada borde de línea de pelo en la aplicación.                              |
| `--super`               | El acento Disband SUPER.                                      |

## Forma y tipo

Disband dibuja sus esquinas con la escala de radio de Tailwind, y esa escala se lee a partir de estas variables. Configurar una cambia cada esquina de ese tamaño en el producto de una vez por todas, no tienes que encontrar los componentes.

| Variable | Afecta                                              |
| ------------------ | ---------------------------------------------------- |
| `--skin-radius-sm` | `rounded-sm` de Tailwind. Pequeños chips y etiquetas. |
| `--skin-radius-md` | `rounded-md` - la mayoría de los botones e entradas. |
| `--skin-radius-lg` | `rounded-lg` - tarjetas y paneles.                    |
| `--skin-radius-xl` | `rounded-xl` — modales, baldosas de llamada.                  |
| `--skin-radius-2xl` | `rounded-2xl` — grandes superposiciones.                     |
| `--skin-radius-3xl` | `rounded-3xl` — las superficies más grandes.               |
| `--skin-font`       | La fuente de la interfaz de usuario para toda la aplicación.                  |

Los avatares y los puntos de estado no están deliberadamente en esta lista: son círculos porque un avatar cuadrado hace que la lista de miembros sea difícil de leer. Todavía puedes cuadrarlos apuntándolos directamente.

**Si estás construyendo un tema ligero**, establece `color-scheme: light` en `:root` para que las barras de desplazamiento y los controles nativos se inviertan con él, y recuerda que `--bg-tertiary` contiene texto: es el riel del servidor, por lo que un valor oscuro allí con `--text-normal` oscuro hace que esas etiquetas sean invisibles en lugar de simplemente de bajo contraste.

## Selectores

Cada control en Disband es un verdadero `<button>`, `<input>` o `<textarea>`, por lo que los selectores de elementos llegan a toda la aplicación y siguen funcionando a medida que cambia:

```css
button { border-radius: 0; }
button:active { transform: translateY(1px); }
input, textarea { border: 1px solid var(--divider); }
```

Las clases de diseño son utilidades de Tailwind, y los selectores de estilo `[class*="bg-brand"]` funcionan, pero no son una API compatible. Las clases de utilidades cambian cuando una pantalla se rediseña, y un tema construido sobre ellas se romperá en alguna versión. Las variables anteriores no lo harán.

## Iconos cargados

Suba una imagen en **Configuración → Temas** y déjela un nombre. Se convierte en una variable que contiene un `url()` listo para usar:

```css
/* An icon uploaded as "send" */
.some-target {
  background-image: var(--icon-send);
}
```

Los nombres utilizan letras minúsculas, números y guiones, hasta 40 caracteres. Un tema puede contener hasta 100 iconos, y cada carga se limita a 2 MB.

## Plantilla inicial

Pegue esto en el editor y cambie lo que le guste:

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

## Qué no está permitido

Su CSS se comprueba antes de ser aplicado, y cualquier cosa que se elimine se enumera para usted en lugar de ser eliminada en silencio:

- `@import` — cargaría una hoja de estilos desde otro servidor cada vez que se iniciara.
- `<` y `>` — CSS no tiene ningún uso para ellos, y pueden terminar la hoja de estilos temprano.
- Valores `expression()` y `url()` que no son `https:` o una imagen `data:`.
- Los temas están limitados a 100 KB de CSS.

Las fuentes web se pueden cargar con `@font-face` desde una dirección `https:`, o desde un icono que has subido.

## Si tu suscripción termina

Los temas son una función de SUPER, por lo que si un pago falla, su tema deja de aplicarse y Disband vuelve a su apariencia normal, con un aviso que dice por qué, en lugar de cambiar de forma silenciosamente.

**Nada se elimina.** Tu piel, tu CSS y tus iconos permanecen en tu cuenta; vuelve a suscribirte y vuelven exactamente como los dejaste.
