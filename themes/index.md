# Themes

Disband **SUPER** members can restyle the app: pick one of the shipped skins, or
write your own CSS and upload your own icons. A theme is saved to your account,
so it is already on when you sign in somewhere else.

Themes apply on **web and desktop**. iOS and Android are built natively and have
no stylesheet for a theme to apply to, so your theme syncs but is not drawn
there.

## The shipped skins

Nine are built in, and they change more than colour — corners, typefaces and the
way controls are drawn:

- **Minecraft** — pixel type, hard bevels, not one rounded corner.
- **Call of Duty** — dusty khaki, stencilled caps, film grain over everything.
- **2000s** — Tahoma, beveled controls, Windows XP blue.
- **Frutiger Aero** — glossy glass, blue into green, light caught on every corner.
- **Terminal** — green phosphor on black, monospaced, with the scanlines.
- **Vaporwave** — hot pink and cyan over purple, chrome on every button.
- **Paper** — warm off-white and a serif; reads like something printed.
- **Neon** — near-black, with magenta and cyan bleeding off every edge.
- **Brutalist** — black on white, two-pixel borders, shadows that are solid blocks.

Pick one in **Settings → Themes**. A skin and your own custom CSS work together:
the skin is applied first, so your CSS can adjust it rather than having to
replace it.

## Colour variables

These are the stable API. Set them on `:root` and every surface in the app
follows, including screens added after you wrote the theme.

| Variable                | Affects                                                        |
| ----------------------- | -------------------------------------------------------------- |
| `--bg-primary`          | The chat canvas — the largest surface in the app.              |
| `--bg-secondary`        | Panels beside it: channel list, member list, cards.            |
| `--bg-tertiary`         | The outermost chrome, including the server rail.               |
| `--bg-accent`           | Inset surfaces: the composer, code blocks, inputs.             |
| `--interactive-hover`   | Row and button hover.                                          |
| `--interactive-selected`| The row you are currently on.                                  |
| `--brand`               | Primary buttons, links, focus rings, your own accents.         |
| `--brand-hover`         | The same, hovered.                                             |
| `--text-normal`         | Body text.                                                     |
| `--text-muted`          | Timestamps, secondary labels, placeholders.                    |
| `--text-link`           | Links inside messages.                                         |
| `--status-online`       | Online dot, success states.                                    |
| `--status-idle`         | Idle dot, warnings.                                            |
| `--status-dnd`          | Do-not-disturb dot, errors and destructive actions.            |
| `--status-offline`      | Offline dot.                                                   |
| `--divider`             | Every hairline border in the app.                              |
| `--super`               | The Disband SUPER accent.                                      |

## Shape and type

Disband draws its corners with Tailwind's radius scale, and that scale reads from
these variables. Setting one changes every corner of that size in the product at
once — you do not have to find the components.

| Variable           | Affects                                              |
| ------------------ | ---------------------------------------------------- |
| `--skin-radius-sm`  | Tailwind's `rounded-sm`. Small chips and tags.      |
| `--skin-radius-md`  | `rounded-md` — most buttons and inputs.             |
| `--skin-radius-lg`  | `rounded-lg` — cards and panels.                    |
| `--skin-radius-xl`  | `rounded-xl` — modals, call tiles.                  |
| `--skin-radius-2xl` | `rounded-2xl` — large overlays.                     |
| `--skin-radius-3xl` | `rounded-3xl` — the largest surfaces.               |
| `--skin-font`       | The UI typeface for the whole app.                  |

Avatars and status dots are deliberately not on this list: they are circles
because a square avatar makes the member list hard to read. You can still square
them by targeting them directly.

**If you are building a light theme**, set `color-scheme: light` on `:root` so
scrollbars and native controls flip with it, and remember that `--bg-tertiary`
carries text: it is the server rail, so a dark value there with dark
`--text-normal` makes those labels invisible rather than merely low-contrast.

## Selectors

Every control in Disband is a real `<button>`, `<input>` or `<textarea>`, so
element selectors reach the whole app and keep working as it changes:

```css
button { border-radius: 0; }
button:active { transform: translateY(1px); }
input, textarea { border: 1px solid var(--divider); }
```

Layout classes are Tailwind utilities, and `[class*="bg-brand"]`-style selectors
do work — but they are not a supported API. Utility classes change when a screen
is redesigned, and a theme built on them will break at some release. The
variables above will not.

## Uploaded icons

Upload an image in **Settings → Themes** and give it a name. It becomes a
variable holding a ready-made `url()`:

```css
/* An icon uploaded as "send" */
.some-target {
  background-image: var(--icon-send);
}
```

Names use lowercase letters, numbers and dashes, up to 40 characters. A theme can
hold up to 100 icons, and each upload is limited to 2 MB.

## Starter template

Paste this into the editor and change what you like:

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

## What is not allowed

Your CSS is checked before it is applied, and anything removed is listed for you
rather than dropped silently:

- `@import` — it would load a stylesheet from another server on every launch.
- `<` and `>` — CSS has no use for them, and they can end the stylesheet early.
- `expression()`, and `url()` values that are not `https:` or a `data:` image.
- Themes are capped at 100 KB of CSS.

Web fonts can be loaded with `@font-face` from an `https:` address, or from an
icon you uploaded.

## If your subscription ends

Themes are a SUPER feature, so if a payment fails your theme stops being applied
and Disband returns to its normal appearance — with a notice saying why, rather
than silently changing shape.

**Nothing is deleted.** Your skin, your CSS and your icons stay on your account;
resubscribe and they come back exactly as you left them.