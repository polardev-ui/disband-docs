# Bots

Les bots Disband sont des intégrations hébergées par eux-mêmes. Vous exécutez le code, Disband relaye des messages vers et depuis celui-ci. Disband n'héberge jamais ni n'exécute le code de votre bot.

## Comment ça marche

1. **Créez un bot** dans **Paramètres → Bots** et choisissez les domaines qu'il a besoin. Vous obtenez
   Un jeton de retour - il est affiché **une seule fois**.
2. Dans **Paramètres → Bots**, générer un **lien d'invitation** pour le serveur que vous souhaitez.
   Le bot à rejoindre, et l'envoyer au **propriétaire** de ce serveur.
3. Le propriétaire ouvre le lien et approuve. Le bot devient membre du serveur.
4. Vous exécutez l'une des bibliothèques clients quelque part (un serveur, une fonction cloud,
   Votre ordinateur portable) et il se connecte à Disband avec le jeton.

## Cadres

La portée d'un bot dans un serveur est l'**intersection** des domaines que vous avez demandés lors de sa création et des domaines approuvés par le propriétaire pour ce serveur spécifique :

| Portée                | Description                                                          |
| ----------------- | -------------------------------------------------------------------- |
| `messages.read` | Recevoir les événements de messages sur le gateway et lire les messages/canaux. |
| `messages.write` | Envoyer et répondre aux messages dans les canaux que le bot peut voir. |
| `members.read` | Listez les membres des serveurs auxquels le bot a rejoint.                      |
| `channels.manage` | Créez, renommez et supprimez des chaînes - nécessite également le rôle `manage_channels` sur le serveur. |

## Authentification par jeton

Chaque appel API est authentifié avec le jeton bot :

```
Authorization: Bot <token>
```

Les jetons de bot sont **hashés en repos** - le jeton brut n'est jamais stocké ou récupérable. S'il fuite (ou si vous n'avez plus besoin du bot), annulez-le dans **Paramètres → Bots** ; l'annulation tue le jeton immédiatement.

## Limites et sécurité

- Jusqu'à **5 bots par compte**. Un bot peut être révoqué à tout moment, ce qui tue son
  Token.
- Messages jusqu'à **4 000 caractères**. Les bots ont besoin du rôle `mention_everyone`.
  autorisation d'utiliser `@everyone`.
- Seul le **propriétaire** d'un serveur peut approuver une invitation de bot. Les invitations expirent après
  **7 jours**.
- Les jetons de bot sont hachés en repos ; le jeton brut n'est jamais stocké ni récupérable.
- Les bots ne peuvent jamais accéder directement à la base de données - chaque action passe par un cadre de portée.
  Les points d'extrémité API.

## Choisissez un chemin

- **[Premiers pas](getting-started.md)** - créez un bot et invitez-le.
- **[Héberger votre propre bot](hosting-your-own-bot.md)** - où exécuter le client.
- **[JavaScript](clients/javascript.md)** / **[Python](clients/python.md)**.
- **[Référence de l’API](api-reference.md)** si vous voulez parler directement au API.
- **[Modèles](templates.md)** - des bots de bienvenue, des gestionnaires de tickets et plus encore prêts à être adaptés.
