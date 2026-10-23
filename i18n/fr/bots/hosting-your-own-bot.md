# Héberger votre propre bot

Disband ne héberge ni n'exécute votre bot. Vous exécutez le client où vous voulez, et il communique avec Disband via un gateway de long sondage en utilisant le jeton du bot. Cette page couvre le côté pratique de la maintenance d'un bot en vie.

## Où l'exécuter

Toute machine qui peut effectuer des requêtes HTTPS en sortie fonctionne. Puisque le gateway effectue des sondages longs (votre code maintient une connexion ouverte, et Disband renvoie des événements lorsqu'ils arrivent), vous n'avez pas besoin d'une adresse publique, de ports entrants ou d'un websocket.

Belles options, les moins chères en premier :

| Hôte                       | Notes                                                                 |
| -------------------------- | --------------------------------------------------------------------- |
| Un ordinateur portable / de bureau | Parfait pour un bot personnel qui est en ligne lorsque vous êtes en ligne. |
| Un petit VPS (1 Go de RAM) | ~4 à 6 $/mois ; le client JavaScript n'a presque rien besoin. |
| Une fonction / travailleur en nuage | Serverless fonctionne si la plate-forme permet un processus à long terme ; les clients sont suffisamment statiques pour redémarrer à bas coût. |
| Un conteneur / Pterodactyle | Les clients n'ont aucune dépendance en matière de temps de fonctionnement, donc n'importe quelle image fonctionne. |

## Ce dont vous avez réellement besoin

- **JavaScript** : Node.js 18+, ou Deno, ou Bun. Aucune dépendance de temps d'exécution.
- **Python** : Python 3.9+. Bibliothèque standard uniquement (threading + `urllib`).

Il n'y a pas de base de données, pas de file d'attente et pas de cadre à installer.

## Le garder en vie

Le gateway boucle pour toujours tout seul ; il se reconnecte et réessaie automatiquement. Trois choses ont tendance à tuer les vrais bots :

1. **Boucles de crash.** Enveloppez le client dans un superviseur et redémarrez en cas d'échec :
   ```bash
   # systemd
   [Unit]
   Description=disband-bot
   After=network-online.target

   [Service]
   ExecStart=/usr/local/bin/node /opt/my-bot/index.js
   Restart=always
   RestartSec=3
   Environment=DISBAND_BOT_TOKEN=…

   [Install]
   WantedBy=multi-user.target
   ```

2. **Jeton périmé.** Si le bot est révoqué (ou une invitation expire avant qu'il ne soit
   approuvé), le gateway API renvoie `401`. Traitez-le : enregistrez clairement et arrêtez,
   Plutôt que de réessayer pour toujours. Les deux clients présentent cela comme un événement `error` -
   JavaScript de `AuthError` / Python de `AuthError` - et la boucle s'arrête à la place.
   De martelage.

3. **Dérive de configuration silencieuse.** Gardez le jeton dans une variable d'environnement ou un secret.
   Stocker, pas dans la source. Si vous faites tourner le jeton, redémarrez le processus avec
   La nouvelle valeur.

## Lecture et écriture de données

Les bots ne parlent qu'à l’API HTTP de portée limitée. Pour poller ou persister l'état, utilisez tout stockage que vous utilisez déjà - un fichier, une base de données, Redis - le client s'en fiche.

## Bots multi-serveurs

Un bot peut être invité sur de nombreux serveurs. Les domaines autorisés sont par serveur, donc un bot qui peut lire des messages partout n'écrit que là où le propriétaire a accordé `messages.write`. Votre code peut se ramifier sur `message.server_id` si le comportement doit différer par serveur.

## Aller plus loin

- Consultez la **[Référence de l’API](api-reference.md)** pour les points d'extrémité exacts les
  Utilisés par les clients - utiles si vous voulez écrire votre propre client dans une autre langue.
- Le **[JavaScript](clients/javascript.md)** et **[Python](clients/python.md)**
  Les pages de référence incluent tous les méthodes et événements.
