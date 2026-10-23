# État du système

La page de statut de Disband est hébergée de manière autonome. Elle ne dépend pas d'un service de statut tiers, ce qui lui permet de signaler avec précision quand l'hôte Web principal, API, ou la livraison d'actifs statiques rencontrent des problèmes.

- Page publique : [disband.dev/status](https://www.disband.dev/status)
- Flux RSS : [disband.dev/status/feed.xml](https://www.disband.dev/status/feed.xml)
- Administrateur du propriétaire : [disband.dev/status/admin](https://www.disband.dev/status/admin)

## Ce que montre la page publique

La page des groupes de moniteurs par service. Pour chaque moniteur, elle affiche :

- l'état actuel du dernier contrôle ;
- le statut HTTP et le temps de réponse de ce contrôle ;
- une barre de temps d'activité de 90 jours, un segment par jour ;
- la dernière fois qu'un contrôle a été effectué.

Sous les moniteurs, vous trouverez des incidents, des travaux d'entretien programmés et des annonces. Chacun d'eux ouvre une page de détails avec la chronologie complète de la mise à jour. Le flux publie les 25 derniers incidents, les fenêtres d'entretien et les annonces publiées sous forme RSS 2.0.

## Chèques

Une fonction Supabase Edge appelée `status-probe` s'exécute toutes les minutes sous `pg_cron`. Elle interroge chaque moniteur activé en parallèle et enregistre une ligne par vérification.

Chaque moniteur a :

| Contexte | Signification                                                                |
| --------------- | ---------------------------------------------------------------------- |
| Nom            | L'étiquette publique, par exemple **Site Web**.                             |
| Groupe | La section sous laquelle il apparaît, par exemple **Disband**. |
| URL             | Le `http` ou `https` URL absolu à demander.                         |
| Méthode | `GET` ou `HEAD`. Par défaut, `GET`.                                    |
| Statut attendu | Le statut exact de HTTP qui compte comme sain. Par défaut, c'est `200`. |
| Mot-clé | Texte facultatif qui doit apparaître dans le corps de la réponse. |
| Timeout | 1 à 30 secondes. Par défaut, 10 secondes.                                  |
| En-têtes | En-têtes de requête facultatifs, stockés côté serveur.                          |
| Activé | Que la sonde le demande ou non.                                  |
| Public | Qu'il contribue au instantané public.                         |

Un moniteur est sain uniquement lorsque le code de statut correspond **et** le mot-clé facultatif est présent. Les redirections sont suivies. Une attente de temps écoulé, une erreur réseau, un statut incorrect ou un mot-clé manquant sont enregistrés comme un contrôle échoué avec la raison.

La sonde fonctionne indépendamment de l'application web. Une panne du serveur web ne stoppe pas l'enregistrement des vérifications.

## Histoire et temps d'activité

Chaque chèque est stocké dans `status_checks`. Un déclencheur de base de données plie chaque chèque en `status_daily`, de sorte que la barre de 90 jours est une lecture bon marché plutôt qu'une agrégation sur des millions de lignes.

- Les chèques bruts sont conservés pendant **90 jours**.
- Les relevés quotidiens sont conservés pendant **180 jours**.
- La page publique affiche les **derniers 90 jours**.
- Le segment de chaque jour est le pourcentage de chèques réussis ce jour-là.

Une lacune - une journée sans vérifications - est affichée comme aucune donnée, et non comme temps d'arrêt.

## Incidents automatiques

La sonde ouvre automatiquement un incident lorsqu'un moniteur a échoué **trois vérifications consécutives**. L'incident est un incident **important**, lié à ce moniteur, et commence par **l'enquête** avec une mise à jour automatisée contenant l'erreur la plus récente.

Lorsque le prochain contrôle réussit, l'incident passe à **Résolu** et une mise à jour enregistre approximativement la durée de la panne. L'incident reste sur la page et dans le flux avec son historique complet.

Si un service fonctionne mais ne tombe pas en panne trois fois de suite, aucun incident automatique n'est ouvert. Le propriétaire peut toujours ajouter une mise à jour manuelle à un incident automatique pendant qu'il est ouvert.

## Incidents manuels, maintenance et annonces

Le propriétaire peut publier trois types d'entrées :

| Type | Utilisation pour                                                         |
| ------------- | --------------------------------------------------------------- |
| `incident` | Un problème imprévu.                                           |
| `maintenance` | Travail planifié, optionnellement avec une heure de début et de fin. |
| `announcement`| Une notification de service général qui n'est pas une panne.                 |

Un incident peut affecter aucun, un ou plusieurs moniteurs. Son impact est celui de `none`, `minor`, `major` ou `critical`.

Les statuts de mise à jour sont les suivants :

- `investigating`
- `identified`
- `monitoring`
- `resolved`
- `scheduled`
- `in_progress`
- `completed`
- `published`

Chaque mise à jour ajoute une entrée avec une date et une heure au calendrier des incidents et définit l'état actuel de l'incident. La marquage d'une mise à jour `resolved` ou `completed` définit également le temps de résolution. La publication d'une mise à jour ultérieure avec un autre statut la rouvre.

## Statut global

Le bannière est décidé dans cet ordre :

1. Une fenêtre de maintenance active indique **Maintenance en cours**, ou
   **Entretien programmé** avant qu'il ne commence.
2. Un incident majeur actif ou critique indique **Panne majeure**.
3. Un incident mineur actif indique **Partiellement dégradé**.
4. Les moniteurs défectueux indiquent **Partiellement dégradé** ou **Panne majeure** lorsque chaque
   Le moniteur public échoue.
5. Sans échec et au moins un résultat, il indique **Tous les systèmes opérationnels**.
6. Avant que les premiers chèques ne soient déposés, il est indiqué **En attente des premiers chèques**.

Les incidents résolus n'affectent pas le bannière.

## vie privée

Le chemin de lecture public est une fonction de base de données, et non un accès direct à la table. Il renvoie les noms des moniteurs, des groupes, des états, de la latence, du temps d'activité et des incidents. Il omet délibérément :

- surveiller URLs ;
- en-têtes de requête ;
- texte d'erreur de sondage ;
- identifiants de contrôle internes ;
- les identités derrière les mises à jour des incidents.

Les tables de base ont la sécurité au niveau de la ligne activée sans aucune politique publique. Seuls le rôle de service et la fonction de sondage peuvent les lire directement.

## administration

`/status/admin` est réservé au **propriétaire de la plate-forme** connecté. Il ne s'agit pas d'un rôle de espace et ne peut pas être accordé à un autre membre. Les demandes non authentifiées reçoivent `401` ; d'autres comptes connectés reçoivent `403`.

L'écran d'administration peut :

- créer, modifier, activer, désactiver, publier ou supprimer des moniteurs ;
- voir le URL, les en-têtes et le dernier résultat de chaque moniteur ;
- publier des rapports sur les incidents, des fenêtres de maintenance et des annonces ;
- ajouter des mises à jour de la chronologie et modifier l'impact d'un incident ou les services affectés ;
- supprimer un moniteur et son historique.

### Admin API

L'écran utilise ces itinéraires réservés aux propriétaires uniquement :

| Méthode                 | Point d'extrémité                                       |
| ---------------------- | ---------------------------------------------- |
| `GET`, `POST`          | `/api/status-admin/monitors`                   |
| `PATCH`, `DELETE`      | `/api/status-admin/monitors/{id}`              |
| `GET`, `POST`          | `/api/status-admin/incidents`                  |
| `PATCH`, `DELETE`      | `/api/status-admin/incidents/{id}`             |
| `POST`                 | `/api/status-admin/incidents/{id}/updates`     |

Ils acceptent le jeton d'accès Supabase du propriétaire sous la forme de `Authorization: Bearer <token>`. Ce sont des détails d'implémentation de l'écran d'administration, et non une API public ; la forme peut changer.

## Notes opérationnelles

- La sonde authentifie avec un secret stocké dans Supabase Vault sous
  `status_probe_key`. Le secret est comparé à l'intérieur de la base de données et n'est pas
  Retourné à la fonction.
- Le travail `pg_cron` est nommé `status-probe`. Il lit le secret de Vault sur
  Chaque exécution, donc le rotation du secret ne nécessite pas d'édition du travail.
- La fonction Edge est déployée avec la vérification JWT désactivée, car elle
  authentifie plutôt avec le secret du coffre-fort.
- Si la sonde elle-même cesse de fonctionner, la page s'affichera comme obsolète.
  **dernières fois vérifiées**. C'est le signal pour inspecter le travail cron et Edge.
  Bases de données de fonctions.

## lié

- [Webhooks](webhooks.md) - envoyer des notifications d'interruption dans un canal.
- [Embeds](embeds.md) - formattez ces notifications.
