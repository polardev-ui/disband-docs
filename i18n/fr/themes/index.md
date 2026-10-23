# Thèmes

Les membres Disband **SUPER** peuvent redessiner l'application : choisissez l'une des skins livrées ou écrivez votre propre CSS et téléchargez vos propres icônes. Un thème est enregistré sur votre compte, il est donc déjà activé lorsque vous vous connectez ailleurs.

Les thèmes s'appliquent sur **le web et le bureau**. iOS et Android sont construits de manière native et n'ont pas de feuille de style à laquelle un thème peut s'appliquer, donc votre thème se synchronise mais n'est pas dessiné là-bas.

## Les skins expédiés

Neuf sont intégrés, et ils changent plus que la couleur - les coins, les polices et la façon dont les contrôles sont dessinés :

- **Minecraft** - type de pixel, bords droits, pas de coin arrondi.
- **Call of Duty** - kaki poussiéreux, casquettes pochées, grain de film sur tout.
- **Années 2000** - Tahoma, commandes biseautées, Windows XP bleu.
- **Frutiger Aero** - verre brillant, bleu à vert, la lumière se reflète dans chaque coin.
- **Terminal** - phosphore vert sur noir, monospace, avec les lignes de balayage.
- **Vaporwave** - rose vif et cyan sur violet, chrome sur chaque bouton.
- **Papier** - blanc cassé chaud et une police à traits ; il ressemble à quelque chose d'imprimé.
- **Neon** - presque noir, avec du magenta et du cyan qui coulent sur chaque bord.
- **Brutaliste** - noir sur blanc, bords à deux pixels, des ombres qui sont des blocs solides.

Choisissez un parmi **Paramètres → Thèmes**. Une peau et votre propre CSS personnalisé fonctionnent ensemble : la peau est appliquée en premier, de sorte que votre CSS peut l'ajuster plutôt que de devoir le remplacer.

## Variables de couleur

Ce sont les API stables. Définissez-les sur `:root` et toutes les surfaces de l'application suivent, y compris les écrans ajoutés après avoir écrit le thème.

| Variable                | Affecte                                                                |
| ----------------------- | -------------------------------------------------------------- |
| `--bg-primary`          | La toile de chat - la plus grande surface de l'application.              |
| `--bg-secondary` | Panneaux à côté : liste des chaînes, liste des membres, cartes. |
| `--bg-tertiary` | Le chrome le plus extérieur, y compris le rail du serveur. |
| `--bg-accent`           | Surfaces insérées : le compositeur, les blocs de code, les entrées.             |
| `--interactive-hover` | Hover sur la ligne et le bouton.                                          |
| `--interactive-selected`| La ligne sur laquelle vous vous trouvez actuellement.                                  |
| `--brand`               | Boutons primaires, liens, anneaux de mise au point, vos propres accents.         |
| `--brand-hover`         | La même chose, surélevée.                                             |
| `--text-normal`         | Texte du corps.                                                     |
| `--text-muted`          | Timestamps, étiquettes secondaires, espaces réservés.                    |
| `--text-link`           | Liens à l'intérieur des messages.                                         |
| `--status-online`       | Point en ligne, états de réussite.                                    |
| `--status-idle`         | Point d'arrêt, avertissements.                                            |
| `--status-dnd` | Point de non-distraction, erreurs et actions destructrices. |
| `--status-offline`      | Point hors ligne.                                                   |
| `--divider`             | Chaque bordure de ligne de cheveux dans l'application.                              |
| `--super`               | L'accent Disband SUPER.                                      |

## Forme et type

Disband dessine ses coins avec l'échelle de rayon de Tailwind, et cette échelle lit à partir de ces variables. La définition d'une modifie tous les coins de cette taille dans le produit en même temps - vous n'avez pas besoin de trouver les composants.

| Variable | Affecte                                                 |
| ------------------ | ---------------------------------------------------- |
| `--skin-radius-sm` | `rounded-sm` de Tailwind. Petites puces et étiquettes. |
| `--skin-radius-md` | `rounded-md` - la plupart des boutons et entrées. |
| `--skin-radius-lg` | `rounded-lg` - cartes et panneaux.                    |
| `--skin-radius-xl` | `rounded-xl` - modaux, carreaux d'appel.                  |
| `--skin-radius-2xl` | `rounded-2xl` — grands superpositions.                     |
| `--skin-radius-3xl` | `rounded-3xl` - les plus grandes surfaces. |
| `--skin-font` | La police d'écriture de l'interface utilisateur pour toute l'application. |

Les avatars et les points de statut ne sont délibérément pas inclus dans cette liste : ils sont des cercles car un avatar carré rend la liste des membres difficile à lire. Vous pouvez toujours les carré en les ciblant directement.

**Si vous construisez un thème clair**, définissez `color-scheme: light` sur `:root` afin que les curseurs et les contrôles natifs se retournent avec lui, et rappelez-vous que `--bg-tertiary` contient du texte : c'est le rail du serveur, donc une valeur sombre là-bas avec un `--text-normal` sombre rend ces étiquettes invisibles plutôt que simplement à faible contraste.

## Sélecteurs

Chaque contrôle dans Disband est un vrai `<button>`, `<input>` ou `<textarea>`, donc les sélecteurs d'éléments atteignent l'ensemble de l'application et continuent de fonctionner à mesure qu'elle change :

```css
button { border-radius: 0; }
button:active { transform: translateY(1px); }
input, textarea { border: 1px solid var(--divider); }
```

Les classes de mise en page sont des utilitaires Tailwind, et les sélecteurs de style `[class*="bg-brand"]` fonctionnent - mais ce ne sont pas des API pris en charge. Les classes d'utilitaires changent lorsqu'un écran est redessiné, et un thème construit sur elles se cassera à un moment donné de la version. Les variables ci-dessus ne le feront pas.

## Icons téléchargés

Téléchargez une image dans **Paramètres → Thèmes** et donnez-lui un nom. Elle devient une variable contenant un `url()` prêt à l'emploi :

```css
/* An icon uploaded as "send" */
.some-target {
  background-image: var(--icon-send);
}
```

Les noms utilisent des lettres minuscules, des chiffres et des tirets, jusqu'à 40 caractères. Un thème peut contenir jusqu'à 100 icônes, et chaque téléchargement est limité à 2 Mo.

## Modèle de démarrage

Coller ceci dans l'éditeur et modifier ce que vous voulez :

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

## Ce qui n'est pas autorisé

Votre CSS est vérifié avant d'être appliqué, et tout ce qui est supprimé est listé pour vous au lieu d'être abandonné en silence :

- `@import` - il chargerait un style sheet provenant d'un autre serveur à chaque lancement.
- `<` et `>` - CSS n'a aucun intérêt pour eux, et ils peuvent mettre fin au style sheet plus tôt.
- Les valeurs `expression()` et `url()` qui ne sont pas `https:` ou une image `data:`.
- Les thèmes sont limités à 100 Ko de CSS.

Les polices Web peuvent être chargées avec `@font-face` à partir d'une adresse `https:`, ou à partir d'un icône que vous avez téléchargée.

## Si votre abonnement prend fin

Les thèmes sont une fonctionnalité SUPER, donc si un paiement échoue, votre thème cesse d'être appliqué et Disband reprend son apparence normale - avec un avis indiquant pourquoi, plutôt que de changer silencieusement de forme.

**Rien n'est supprimé.** Votre peau, votre CSS et vos icônes restent sur votre compte ; recommencez à vous abonner et elles reviennent exactement comme vous les avez laissées.
