# Référence de l’API des bots

L’API HTTP auquel les bots parlent. Les deux bibliothèques clients sont des enveloppes fines sur exactement ces points d'extrémité, donc cette page est également la recette pour écrire un client dans n'importe quelle autre langue.

## Base URL et authentification

```
https://www.disband.dev
```

Chaque demande envoie :

| En-tête | Valeur                    |
| --------------- | ------------------------ |
| `Authorization` | `Bot <token>`            |
| `Content-Type` | `application/json` |

Un jeton manquant ou invalide renvoie `401 { "error": "Invalid bot token" }`. Un bot révoqué renvoie la même chose, donc un `401` signifie "vérifier le jeton" - pas "reessayer".

Tous les points d'extrémité sont définis par des scopes : un bot ne peut lire ou écrire que ce que ses scopes (et les autorisations par serveur) permettent. Chaque réponse 4xx/5xx est JSON avec un champ `error`.

## Lire avant d'écrire

- Les bots sont **scopés de lecture** à moins que vous n'accordiez `messages.write` / `channels.manage`.
- Les actions `channels.manage` exigent également que le compte bot détienne le
  `manage_channels` **rôle** dans ce serveur.
- Les deux clients détiennent la clé des scopes par événement de message : rien dans l'API.
  renvoie des données que le bot n'a pas été accordé.

## Le portail (long polling de l'événement)

```
GET /api/v1/gateway?timeout=20
```

Le gateway est un long-poll, pas un websocket. La requête bloque le côté serveur jusqu'à ce qu'un événement soit disponible ou que le délai d'attente expire, puis renvoie ce qui est arrivé. Le client y boucle. Le délai d'attente est limité à 1 à 20 secondes.

Réponse :

```json
{
  "events": [
    {
      "bot_id": "…",
      "type": "messageCreate",
      "payload": { "id": "…", "channel_id": "…", "server_id": "…", "content": "…" }
    }
  ]
}
```

`type` est `messageCreate`, `messageUpdate` ou `messageDelete`. La livraison est **au moins une fois** - un bot qui plante entre le téléchargement et le traitement peut voir le même événement à nouveau. Traitez-les de manière idempotente (par `payload.id`).

### Pâtes de charge des événements

| Type             | Champs de charge utile                                        |
| ---------------- | ----------------------------------------------------- |
| `messageCreate` | L'objet de message complet (ci-dessous).                      |
| `messageUpdate` | `id`, `channel_id`, `server_id`, `content`, `edited_at` |
| `messageDelete` | `id`, `channel_id`, `server_id`                       |

Objet de message :

```json
{
  "id": "…",
  "channel_id": "…",
  "server_id": "…",
  "author": { "id": "…", "username": "…", "display_name": "…", "avatar_url": "…", "is_bot": false },
  "content": "Deploy finished",
  "reply_to_id": null,
  "mentions": [],
  "embeds": [],
  "attachment_url": null,
  "attachment_type": null,
  "created_at": "2026-01-01T00:00:00Z",
  "edited_at": null,
  "display_id": 1234
}
```

Seuls les bots avec `messages.read` (tous deux sur le compte du bot **et** accordés sur ce serveur) reçoivent des événements.

## Points d'extrémité

### Messages

**POST `/api/v1/channels/:id/messages`** - envoie un message (`messages.write`).

```json
{
  "content": "Deploy finished",
  "reply_to_id": null,
  "embeds": [
    { "title": "Build 1842", "description": "All 412 tests passed.", "color": 5793266 }
  ]
}
```

`content` peut être omis lorsque `embeds` est présent. Les intégrations utilisent la forme et les limites de Discord ; voir [Embeds](../developers/embeds.md) pour chaque champ et les limites exactes. Un message sans contenu ni intégrations est rejeté avec `400`.

Renvoie `201` avec `{ "message": { … } }`.

**OBTENEZ `/api/v1/channels/:id/messages`** - lit les messages (`messages.read`).

Requête : `limit` (1-100, par défaut 50), `before` (identifiant du message, pour la pagination en arrière).

Renvoie `200` avec `{ "messages": [ … ] }`.

### Chaînes

**OBTENEZ `/api/v1/servers/:id/channels`** - liste les chaînes (`messages.read`).

Renvoie `{ "channels": [ … ] }`.

**POST `/api/v1/servers/:id/channels`** - crée un canal (Rôle `channels.manage` + `manage_channels`).

```json
{ "name": "deploys", "type": "text", "category_id": null }
```

Renvoie `201` avec `{ "channel_id": "…" }`.

**PATCH `/api/v1/channels/:id`** - renomme un canal (`channels.manage`).

```json
{ "name": "deploys-2" }
```

Renvoie `{ "success": true }`.

**SUPPRIMER `/api/v1/channels/:id`** - supprime un canal (`channels.manage`).

Renvoie `{ "success": true }`.

### Membres

**OBTENEZ `/api/v1/servers/:id/members`** - liste les membres (`members.read`).

Renvoie `{ "members": [ … ] }`.

### départ

**POST `/api/v1/servers/:id/leave`** - supprime le bot d'un serveur.

Renvoie `{ "success": true }`.

### Invites

**POST `/api/v1/bots/:botId/invites`** - génère une invitation pour que le bot rejoigne un serveur.

```json
{ "server_id": "…", "scopes": ["messages.read", "messages.write"] }
```

Renvoie l'invitation (y compris un `invite_url`) à envoyer au propriétaire du serveur. Seul le propriétaire peut l'approuver ; les invitations expirent après 7 jours.

### Identité (utilisée lors du démarrage)

**GET `/api/bot/me`** - renvoie le compte bot, utilisé par les clients pour lancer `ready`. Non inclus dans la surface versionnée `v1`.

## Erreurs

| État | Signification                                                        | Exemples de champs `error`                              |
| ------ | -------------------------------------------------------------- | --------------------------------------------------- |
| `401` | Token manquant/invalide/annulé.                                 | `"Invalid bot token"`                               |
| `403` | Manque de permission de portée ou de rôle.                              | `"This bot does not have messages.write in that server"` |
| `404` | Chaîne/serveur non trouvé ou non visible pour le bot. | `"Channel not found"`                               |
| `429` | Tarif limité.                                                  | Inclut un en-tête `Retry-After`.                    |
| `503` | Stockage de soutien indisponible (pollage du gateway). | `"Event delivery unavailable."` |
| `5xx` | Erreur du serveur. Réessayez avec une attente.                              | `"Internal server error"`                           |

## Limites

- Jusqu'à **5 bots par compte** ; le jeton d'un bot expire instantanément lors de la révocation.
- Messages jusqu'à **4 000 caractères** ; `@everyone` a besoin de `mention_everyone`.
  Autorisation de rôle.
- Jusqu'à **10 intégrations par message**, avec les mêmes limites de champ que les webhooks. voir
  [Embeds](../developers/embeds.md).
- Des limites de taux s'appliquent par jeton de bot. Si vous tapez `429`, honorez `Retry-After`.

## Écrire votre propre client

1. `GET /api/bot/me` avec `Authorization: Bot <token>` pour résoudre l'identité.
2. Boucle sur `GET /api/v1/gateway?timeout=20`, gère les événements par `type`.
3. Utilisez les points d'extrémité ci-dessus avec le même en-tête d'authentification ; mappez `401` → "token invalide",
   `403` → "autorisation manquante", `429` → "ralentissez et réessayez après `Retry-After`".

## Webhooks sont une surface différente

Le bot API se connecte avec `Authorization: Bot <token>` et peut lire les événements via le gateway. Un [Webhooks](../developers/webhooks.md) est un URL secret unidirectionnel : pas de compte bot, pas d'en-tête d'authentification et pas de possibilité de lire les messages. Utilisez un webhook pour les notifications et un bot lorsque vous devez réagir au chat.

Les clients officiels sont `@disband/bot` (JavaScript) et `disband-bot` (Python) - voir les pages [JavaScript](clients/javascript.md) et [Python](clients/python.md).
