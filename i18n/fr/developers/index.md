# Développeurs

Construisez sur Disband : des bots, des intégrations et des outils qui communiquent avec vos espaces de l'extérieur. Tout ici est hébergé de manière autonome - Disband ne lance jamais votre code.

## Ce que vous pouvez construire

- **Bots** - comptes hébergés par eux-mêmes qui lisent et écrivent des messages, gèrent des chaînes,
  et réagir aux événements via un portail de sondage à long terme. Consultez l'[Bots](../bots/index.md).
- **Webhooks** - notifications unidirectionnelles publiées via un URL secret, sans bot.
  Code ou jeton. Voir [Webhooks](webhooks.md).
- **Cartes intégrées** - notes de version structurées, alertes et mises à jour de statut.
  Voir [Embeds](embeds.md).
- **Clients personnalisés** - parlez directement à HTTP API si vous avez besoin d'une langue.
  Les clients expédiés ne sont pas couverts. La référence [Référence de l’API](../bots/api-reference.md) est
  Le contrat.
- **Intégrations de statut** - suivez les incidents Disband via RSS, ou lisez comment le
  [État du système](status.md) enregistre les vérifications et ouvre les incidents.

## Commencez ici

1. **[Premiers pas](../bots/getting-started.md)** - créez un bot, obtenez son
   Token, invitez-le dans un espace. Environ deux minutes.
2. **[Héberger votre propre bot](../bots/hosting-your-own-bot.md)** - où exécuter
   Le client et comment le maintenir en vie.
3. **[JavaScript](../bots/clients/javascript.md)** ou
   **[Python](../bots/clients/python.md)**.
4. **[Référence de l’API](../bots/api-reference.md)** pour les points d'extrémité exacts.
5. **[Webhooks](webhooks.md)** ou **[Embeds](embeds.md)** si vous n'avez besoin que de
   Notification unidirectionnelle.
6. **[État du système](status.md)** pour la page de statut publique et le flux RSS.

## Implémenter Disband dans un jeu ou une application.

Disband expose une API HTTP simple authentifié avec un jeton bot. Il n'y a pas de SDK natif ou de runtime RPC à lier - n'importe quelle pile qui peut effectuer des requêtes HTTPS fonctionne. Une intégration typique ressemble à ceci :

1. Créez un bot dans **Paramètres → Bots** et accordez-lui `messages.write` (et
   `channels.manage` si cela devrait créer des chaînes).
2. Invitez le bot dans l'espace dans lequel vous souhaitez poster.
3. Stocker le jeton dans le magasin secret de votre jeu ou de votre application - jamais sur le côté client.
   Code qui est envoyé aux joueurs.
4. À partir de votre backend, appelez les points d'extrémité scopés :

   ```bash
   curl -X POST https://www.disband.dev/api/v1/channels/CHANNEL_ID/messages \
     -H "Authorization: Bot $DISBAND_BOT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"content": "Server restarted — 12 players online."}'
   ```

5. Pour réagir au chat depuis l'intérieur de votre jeu, polluez le gateway en permanence et envoyez.
   Les événements `messageCreate` sont intégrés à la logique de votre jeu.

### Notes de sécurité

- Les jetons de bot sont hachés en repos et ne sont affichés qu'une seule fois. Annulez immédiatement s'il y en a un.
  Fuites.
- Gardez les jetons sur un serveur que vous contrôlez. L'expédition d'un jeton dans un client de jeu permet de
  Quelqu'un qui se fait passer pour votre bot.
- Limiter les rôles des bots à ceux dont ils ont le moins besoin. Un bot qui ne fait que publier n'a pas besoin de
  `members.read` ou `channels.manage`.

## Thèmes pour les développeurs

Si vous construisez un client ou une peau de marque, les variables CSS dans le [Thèmes](../themes/index.md) sont le style stabl'API.

## Questions

- Rapports de bugs : ouvrez un problème ou envoyez un e-mail à l'équipe.
- Pour les problèmes spécifiques au compte, utilisez le support intégré à l'application.
