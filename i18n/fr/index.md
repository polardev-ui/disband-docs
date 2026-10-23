# Documentation de Disband

Tout ce dont vous avez besoin pour construire sur Disband.

## Bots

Les bots Disband sont des **intégrations hébergées par soi-même** : vous exécutez le code, Disband relaye des messages vers et depuis celui-ci. Disband n'héberge jamais ni n'exécute votre bot.

- **[Premiers pas](bots/getting-started.md)** - créez un bot, obtenez son jeton,
  Et invitez-le à un serveur. Cela prend environ deux minutes.
- **[Bots](bots/index.md)** - domaines, invitations, limites et sécurité.
- **[Héberger votre propre bot](bots/hosting-your-own-bot.md)** - où exécuter le client et comment le maintenir en vie.
- **[JavaScript](bots/clients/javascript.md)** — `@disband/bot`.
  Zéro dépendance ; fonctionne sur Node.js 18+, Deno, Bun et le navigateur.
- **[Python](bots/clients/python.md)** — `disband-bot`.
  Bibliothèque standard uniquement ; fonctionne sur Python 3.9+.
- **[Référence de l’API](bots/api-reference.md)** - l’API HTTP à laquelle les deux clients communiquent.

## Développeurs

Créez des bots et intégrez Disband dans vos jeux et applications en utilisant l’API HTTP.

- **[Développeurs](developers/index.md)** - aperçu, commencez ici et sécurité.
  Notes pour les intégrations de jeux/applications.
- **[Bots](bots/index.md)** - domaines d'application, invitations, limites et sécurité.
- **[Référence de l’API](bots/api-reference.md)** - l’API HTTP à laquelle les deux clients communiquent.
- **[Modèles](bots/templates.md)** - des bots de bienvenue, des gestionnaires de tickets et plus encore prêts à être adaptés.
- **[Webhooks](developers/webhooks.md)** - publication depuis CI, la supervision ou un serveur de jeu via une URL secrète. Pas besoin de bot.
- **[Embeds](developers/embeds.md)** - Cartes au style de Discord pour les versions,
  alertes et mises à jour de statut.
- **[État du système](developers/status.md)** - comment la page publique de statut vérifie les services, enregistre le temps d'activité et gère les incidents.

## Thèmes

Les membres de SUPER peuvent redessiner l'ensemble de l'application avec du CSS personnalisé, des thèmes inclus et des icônes téléversées.

- **[Thèmes](themes/index.md)** - les variables CSS qui sont une API stable, les sélecteurs qui sont sûrs à cibler, et un modèle de démarrage.

## Télécharger les clients

- **[@disband/bot](https://raw.githubusercontent.com/polardev-ui/disband-docs/main/zips/disband-bot-0.1.0.tgz)** - le client JavaScript
  (`npm install ./disband-bot-0.1.0.tgz`).
- **[disband-bot](https://raw.githubusercontent.com/polardev-ui/disband-docs/main/zips/disband-bot-python-0.1.0.tar.gz)** - le client Python
  (`pip install ./disband-bot-python-0.1.0.tar.gz`).
