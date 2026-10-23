# Webhooks

Un webhook publie des messages dans un seul canal via un URL secret. Il n'a pas besoin de code de bot, de boucle de gateway ou de ligne d'en-tête `Authorization` - si vous pouvez faire une demande HTTP, vous pouvez publier sur Disband.

Webhooks sont distincts des bots. Utilisez un webhook pour des notifications unidirectionnelles provenant de CI, de la surveillance, des serveurs de jeux, des formulaires ou tout autre élément pouvant appeler un URL. Utilisez un [Bots](../bots/index.md) lorsque vous devez lire des événements ou agir sur des messages.

## Créez un webhook

Vous avez besoin de l'autorisation **Gérer Webhooks** dans l'espace.

1. Ouvrez **Paramètres de l'espace → Intégrations → Webhooks**.
2. Choisissez un canal et sélectionnez **Nouveau webhook**.
3. Donnez-lui un nom et, si vous le souhaitez, un avatar.
4. Copiez le webhook URL.

Le URL ressemble à ceci :

```text
https://disband.dev/webhook/12345678/01234567890123456789012345
```

| Partie | Signification                                                        |
| ----------- | -------------------------------------------------------------- |
| Clé de l'espace | Huit chiffres identifiant l'espace. Pas secret.                |
| Token | Vingt-six chiffres. C'est le secret. Traitez-le comme un mot de passe. |

Le même point d'arrivée est également servi à `https://disband.dev/api/webhooks/<space key>/<token>`.

À partir de cet écran, vous pouvez renommer le webhook, réinitialiser son jeton ou le supprimer. La réinitialisation du jeton invalide immédiatement l'ancien URL. La suppression du webhook l'arrête de publier, mais laisse les messages qu'il a déjà envoyés dans le canal.

## Exécuter un webhook

Envoyez un `POST` à l'accroche web URL avec un corps JSON.

```bash
curl -X POST 'https://disband.dev/webhook/12345678/01234567890123456789012345' \
  -H 'Content-Type: application/json' \
  -d '{
    "content": "Deploy finished — **v2.4.1** is live.",
    "username": "Deploy bot",
    "avatar_url": "https://example.com/deploy.png"
  }'
```

Une demande réussie renvoie `204 No Content`. Ajoutez `?wait=true` pour recevoir l'objet de message créé à la place :

```bash
curl -X POST 'https://disband.dev/webhook/12345678/01234567890123456789012345?wait=true' \
  -H 'Content-Type: application/json' \
  -d '{ "content": "Hello from the other side." }'
```

### Champ de corps

| Champ             | Type    | Notes                                                                    |
| ----------------- | ------- | ------------------------------------------------------------------------ |
| `content`         | chaîne de caractères | Jusqu'à 2 000 caractères. Peut être omis lorsque l'un des encodages est présent. |
| `username` | chaîne | Ouvre le nom de la webhook pour ce message. Jusqu'à 80 caractères. |
| `avatar_url` | chaîne | Ouvre les yeux sur l'avatar pour ce message. `http` ou `https` URL absolu. |
| `embeds`          | tableau | Jusqu'à 10 [Embeds](embeds.md).                                             |
| `embed`           | objet  | Forme singulière héritée. Traité comme `embeds: [embed]`.                      |
| `allowed_mentions`| objet | Contrôle les ping. Voir ci-dessous.                                                |
| `tts`             | booléen | Accepté pour la compatibilité ; actuellement ignoré.                            |
| `flags`           | numéro | Accepté pour la compatibilité ; actuellement ignoré.                            |

`username` ne peut contenir `disband` ou `clyde`, sous aucune forme. Cela empêche une webhook d'imiter le personnel de la plate-forme.

Les pièces jointes de fichiers ne sont pas encore prises en charge. Une requête multipartie peut être analysée, mais les fichiers ne sont pas stockés ; utilisez un bot si vous devez télécharger des fichiers.

### Mention du contrôle

Par défaut, un webhook analyse à la fois les mentions d'utilisateurs et `@everyone` / `@here`, tout comme Discord.

Pour envoyer un ping à personne :

```json
{ "content": "Build 184 finished.", "allowed_mentions": { "parse": [] } }
```

Pour autoriser les mentions d'utilisateurs mais pas tout le monde :

```json
{
  "content": "Thanks @polar.",
  "allowed_mentions": { "parse": ["users"] }
}
```

La base de données stocke toujours `@everyone` lorsqu'elle est supprimée, mais aucune notification n'est envoyée. Lorsque le champ est complètement manquant, tout est analysé.

## Objets de message

Avec `?wait=true`, la réponse est un message en forme de Discord. Disband utilise son identifiant de message numérique dans `id`.

```json
{
  "id": "4821",
  "type": 0,
  "content": "Deploy finished.",
  "channel_id": "…",
  "guild_id": "…",
  "author": {
    "id": "…",
    "username": "Deploy bot",
    "avatar": "https://example.com/deploy.png",
    "discriminator": "0000",
    "bot": true
  },
  "attachments": [],
  "embeds": [],
  "mentions": [],
  "mention_roles": [],
  "mention_everyone": false,
  "pinned": false,
  "tts": false,
  "timestamp": "2026-10-19T20:15:00.000Z",
  "edited_timestamp": null,
  "flags": 0,
  "components": [],
  "webhook_id": "…"
}
```

## Gérer les messages

Une webhook peut récupérer, modifier et supprimer les messages qu'elle a publiés. Utilisez l'identifiant numérique du message provenant de la réponse d'exécution.

| Méthode | Point d'extrémité                                      | Résultat                         |
| -------- | --------------------------------------------- | ------------------------------ |
| `GET` | `/webhook/<key>/<token>/messages/<id>` | Récupérer le message. |
| `PATCH` | `/webhook/<key>/<token>/messages/<id>` | Modifier `content` et/ou `embeds`. |
| `DELETE` | `/webhook/<key>/<token>/messages/<id>` | Supprimer le message. Retourne `204`. |

Modifier l'exemple :

```bash
curl -X PATCH 'https://disband.dev/webhook/12345678/01234567890123456789012345/messages/4821' \
  -H 'Content-Type: application/json' \
  -d '{ "content": "Deploy finished — rolled back." }'
```

Seuls les messages écrits par ce webhook peuvent être modifiés. Un webhook différent reçoit `404 Unknown Message`.

## Gérer le webhook lui-même

| Méthode | Point d'extrémité                            | Résultat                                      |
| -------- | ----------------------------------- | ------------------------------------------- |
| `GET` | `/webhook/<key>/<token>` | objet Webhook (nom, avatar, chaîne, URL). |
| `PATCH` | `/webhook/<key>/<token>` | Renommez-le avec `{ "name": "New name" }`. |
| `DELETE` | `/webhook/<key>/<token>`            | Supprimez-le. Retourne `204`.                   |

La suppression via URL est permanente et équivalente à la suppression dans l'écran des intégrations.

## Limites de vitesse

Chaque webhook est limité à **5 demandes par 2 secondes**. La limite est basée sur le jeton, donc un webhook bruyant ne peut pas ralentir un autre.

Une demande limitée renvoie `429` :

```json
{
  "message": "You are being rate limited.",
  "retry_after": 1.34,
  "global": false
}
```

La réponse contient également `Retry-After` (tous les secondes) et les en-têtes habituels `X-RateLimit-*`. Attendez le délai, puis réessayez.

## Erreurs

Les erreurs utilisent la forme de Discord :

```json
{ "message": "Unknown Webhook", "code": 10015 }
```

| Statut | Code | Signification                                                    |
| ------ | ------- | ---------------------------------------------------------- |
| `400` | `50006` | Message vide : pas de contenu ni d'embeds.                   |
| `400` | `50035` | Corps invalide, mauvaise intégration ou contenu de plus de 2 000 caractères. |
| `404` | `10015` | Hook web inconnu : mauvaise clé d'espace, mauvais jeton ou supprimé. |
| `404` | `10008` | Message inconnu.                                           |
| `429` | —       | Tarif limité. Honorez `Retry-After`.                        |
| `500` | —       | Erreur du serveur. Réessayez avec une attente.                          |

Un `404 Unknown Webhook` ne dit pas délibérément si la touche d'espace ou le jeton était incorrect.

## sécurité

- Tout le monde ayant le URL peut poster. Ne le collez pas dans un référentiel public ou ne le mettez pas
  C'est dans le code côté client.
- Stocker le URL dans le même magasin secret que vous utilisez pour les clés API.
- Réinitialisez le jeton immédiatement s'il fuite. L'ancien URL cesse de fonctionner immédiatement.
- Un webhook ne écrit qu'à son canal configuré. Il ne peut pas lire les messages,
  Liste des membres, ou modifier les paramètres de l'espace.

## lié

- [Embeds](embeds.md) - l'objet d'intégration et ses limites.
- [Bots](../bots/index.md) - intégrations bidirectionnelles et livraison d'événements.
- [Référence de l’API](../bots/api-reference.md) - le bot HTTP API, y compris
  Soutien d'intégration.
