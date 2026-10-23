# Embeds

Un embed est une carte structurée attachée à un message : une bande colorée, un titre, du texte riche, des champs, des images et un pied de page. Disband utilise la forme et les limites d'embed de Discord, donc un embed construit pour un webhook ou un bot Discord fonctionne normalement sans changement.

Les intégrations peuvent être envoyées par :

- [Webhooks](webhooks.md), avec `embeds` dans le corps d'exécution ;
- [Référence de l’API](../bots/api-reference.md), avec `embeds` dans le corps du message envoyé.

Les messages du côté client ne peuvent pas définir directement des intégrations. Cela empêche un membre de falsifier un webhook ou une carte d'intégration.

## Un exemple complet

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

`5793266` est `0x5865F2`, la couleur bleue de la marque de Disband.

## L'objet d'intégration

| Champ | Type | Notes                                                       |
| ------------- | ------ | ----------------------------------------------------------- |
| `title`       | chaîne de caractères | Jusqu'à 256 caractères. Rendu en lien lorsque `url` est défini. |
| `description` | chaîne | Jusqu'à 4 096 caractères. Prend en charge Markdown.                  |
| `url`         | chaîne | Rend le titre cliquable. `http` ou `https` URL absolus. |
| `color` | numéro | `0xRRGGBB` sous forme d'entier. Une chaîne `"#5865F2"` fonctionne également. |
| `timestamp` | chaîne de caractères | ISO 8601 date et heure. Affiche dans le pied de page.                |
| `footer` | objet | `{ "text": "…", "icon_url": "…" }`. Texte jusqu'à 2 048 caractères. |
| `author` | objet | `{ "name": "…", "url": "…", "icon_url": "…" }`. Nom jusqu'à 256 caractères. |
| `fields` | tableau | Jusqu'à 25 objets de champ. Voir ci-dessous.                          |
| `image` | objet | `{ "url": "…" }`. Affiché ci-dessous la description. |
| `thumbnail` | objet | `{ "url": "…" }`. Affiché à droite.                   |
| `video`       | objet | Accepté pour la compatibilité ; pas encore rendu.              |
| `provider` | objet | Accepté pour la compatibilité ; pas encore rendu. |

Tous les champs URL doivent être des `http` ou `https` URLs absolus. Les URLs contenant un nom d'utilisateur ou un mot de passe sont rejetés. Les images URLs non sécurisées sont rejetées par le client ainsi que par le serveur.

### Campagnes

```json
{
  "name": "Uptime",
  "value": "99.98% over 90 days",
  "inline": true
}
```

| Propriété | Type | Notes                                            |
| -------- | ------- | ------------------------------------------------ |
| `name` | chaîne | Obligatoire. Jusqu'à 256 caractères. |
| `value` | chaîne de caractères | Obligatoire. Jusqu'à 1 024 caractères. Markdown fonctionne. |
| `inline` | booléen | `true` met les champs côte à côte là où l'espace le permet. |

Un champ contenant un `name` ou `value` manquant ou vide est une erreur grave. Si vous avez des données vides, omettez le champ ou remplacez-le par un tiret.

## Markdown

Les descriptions et les valeurs de champ prennent en charge le Markdown de Disband : gras, italique, traits, code en ligne, blocs de code, liens et emoji personnalisés. Les titres, les noms d'auteur et le texte de la page de pied sont du texte brut.

Les mentions à l'intérieur du texte intégré sont affichées, mais ne créent pas de ping. Utilisez `content` si vous avez besoin d'une notification de mention réelle.

## Limites

| Limite                              | Valeur |
| ---------------------------------- | ----- |
| Embeds par message                 | 10    |
| Titre                              | 256   |
| Description                        | 4 096 |
| Champs par intégration                   | 25    |
| Nom du champ                     | 256 |
| Valeur du champ                    | 1 024 |
| Texte de la barre de pied                        | 2 048 |
| Nom de l'auteur                    | 256 |
| Nombre total de caractères dans tous les encodages | 6 000 |

Le total comprend les titres, les descriptions, le texte de la barre de pied, les noms des auteurs, les noms des champs et les valeurs des champs. URLs et les métadonnées de l'image ne sont pas pris en compte.

## Comment l'entrée est normalisée

Le API valide chaque intégration avant qu'elle n'atteigne la base de données :

- Les propriétés inconnues sont abandonnées.
- Le texte est raccourci. Le texte trop long est tronqué au maximum plutôt que rejeté.
- Les couleurs invalides sont rejetées.
- Les URLs invalides sont rejetés. Les champs URL valides sont conservés.
- Les tampons de temps invalides sont supprimés.
- Un embed vide est rejeté avec `Embed is empty`.
- Un champ sans nom ou valeur est rejeté.
- Plus de 10 intégrations, ou plus de 6 000 caractères au total, sont rejetés.

Les crochets carrés dans le nom d'une erreur identifient l'élément exact, par exemple :

```text
embeds.0.fields.2: name and value are required
```

## Envoi d'embeds

### À partir d'un webhook

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

### De la part d'un bot

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

Lors de l'envoi uniquement d'embeds, `content` peut être omis. Un message ne contenant ni de contenu ni d'embeds est rejeté.

## lié

- [Webhooks](webhooks.md) - exécuter et gérer les messages webhook.
- [Référence de l’API](../bots/api-reference.md) - les points d'extrémité des messages du bot.
