# Changelog

What changed in the bot API and the client libraries, newest first. Nothing
here breaks a bot written for an earlier version.

## November 2026

The biggest update to the bot API so far. `@disband/bot` and `disband-bot`
**0.3.0** cover everything below.

### New endpoints

| Endpoint | What it does |
| --- | --- |
| `GET /api/v1/channels/:id/messages/:messageId` | One message, with a summary of its reactions. |
| `GET /api/v1/channels/:id/messages?after=` / `?around=` | Page forwards, or around a message, as well as backwards with `before`. |
| `POST /api/v1/channels/:id/typing` | Show "is typing…" while your bot works on an answer. |
| `GET /api/v1/channels/:id/messages/:messageId/reactions` | Every emoji on a message, with counts. |
| `GET /api/v1/channels/:id/messages/:messageId/reactions/:emoji` | Who reacted with an emoji. |
| `DELETE /api/v1/channels/:id/messages/:messageId/reactions` | Clear every reaction, or one emoji's with `?emoji=`. |
| `DELETE /api/v1/channels/:id/messages/:messageId/reactions/:emoji/:userId` | Remove one person's reaction. |
| `GET /api/v1/channels/:forumId/posts` | A forum's posts. |
| `POST /api/v1/channels/:forumId/posts` | Start a forum post. |
| `GET /api/v1/users/@me` | The bot's own profile, status and scopes. |
| `PATCH /api/v1/users/@me` | Set the bot's custom status. |
| `GET /api/v1/users/@me/servers` | Every space the bot is in. |
| `GET /api/v1/users/:id` | A member's public profile. |

`GET /api/v1/servers/:id/members` also takes `query`, `role` and `limit`, to
find members without fetching everyone.

See the [API reference](api-reference.md) for the details of each.

### New gateway events

- `reactionAdd`, `reactionRemove`
- `channelCreate`, `channelUpdate`, `channelDelete` (forum posts included)
- `roleCreate`, `roleUpdate`, `roleDelete`
- `serverUpdate`
- `serverJoin`, `serverLeave` and `scopesUpdate`, about the bot itself

### Fixes

- **Rate limits now match the docs.** A pre-filter held every bot to 20
  requests a minute on each server instance, well under the documented 120
  reads and 60 writes. It now allows the full limit.
- **Missing things return `404`.** "Channel not found", "Message not found"
  and the like came back as `400` from some endpoints. They're `404` everywhere
  now, as the error table always said.
- **The event queue is tidied.** Delivered events are kept for a day and
  undelivered ones for a week, so a bot that's been offline for a long time
  starts from recent events instead of a backlog.

### Client libraries 0.3.0

- Methods for everything above: `getMessage`, `sendTyping`, `listReactions`,
  `listReactionUsers`, `removeUserReaction`, `clearReactions`,
  `listForumPosts`, `createForumPost`, `fetchMe`, `setStatus`, `listServers`
  and `getUser` (snake_case in Python).
- `listMessages` takes `after` and `around`; `listMembers` takes `query`,
  `role` and `limit`.
- **429s are retried for you.** The libraries wait out `Retry-After` and try
  again, up to three times, before raising a rate limit error. Turn it off
  with `retryRateLimits: false` (`retry_rate_limits=False`).
- The JavaScript package no longer depends on an old copy of itself.
