# Status system

Disband's status page is self-hosted. It does not depend on a third-party
status service, so it can still report accurately when the main web host, API,
or static asset delivery is having trouble.

- Public page: [disband.dev/status](https://www.disband.dev/status)
- RSS feed: [disband.dev/status/feed.xml](https://www.disband.dev/status/feed.xml)
- Owner admin: [disband.dev/status/admin](https://www.disband.dev/status/admin)

## What the public page shows

The page groups monitors by service. For each monitor it shows:

- the current state from the latest check;
- the HTTP status and response time of that check;
- a 90-day uptime bar, one segment per day;
- the last time a check ran.

Below the monitors are incidents, scheduled maintenance, and announcements. Each
opens a detail page with the full update timeline. The feed publishes the latest
25 incidents, maintenance windows, and published announcements as RSS 2.0.

## Checks

A Supabase Edge Function called `status-probe` runs every minute under
`pg_cron`. It probes every enabled monitor in parallel and records one row per
check.

Each monitor has:

| Setting         | Meaning                                                                |
| --------------- | ---------------------------------------------------------------------- |
| Name            | The public label, for example **Website**.                             |
| Group           | The section it appears under, for example **Disband**.                 |
| URL             | The absolute `http` or `https` URL to request.                         |
| Method          | `GET` or `HEAD`. Defaults to `GET`.                                    |
| Expected status | The exact HTTP status that counts as healthy. Defaults to `200`.       |
| Keyword         | Optional text that must appear in the response body.                   |
| Timeout         | 1–30 seconds. Defaults to 10 seconds.                                  |
| Headers         | Optional request headers, stored server-side.                          |
| Enabled         | Whether the probe requests it at all.                                  |
| Public          | Whether it contributes to the public snapshot.                         |

A monitor is healthy only when the status code matches **and** the optional
keyword is present. Redirects are followed. A timeout, network error, wrong
status, or missing keyword is recorded as a failed check with the reason.

The probe runs independently of the web app. A failure at the web host does not
stop checks being recorded.

## History and uptime

Every check is stored in `status_checks`. A database trigger folds each check
into `status_daily`, so the 90-day bar is a cheap read rather than an aggregation
over millions of rows.

- Raw checks are kept for **90 days**.
- Daily roll-ups are kept for **180 days**.
- The public page displays the latest **90 days**.
- Each day's segment is the percentage of successful checks that day.

A gap — a day with no checks — is shown as no data, not as downtime.

## Automatic incidents

The probe opens an incident automatically when a monitor has failed **three
checks in a row**. The incident is a **major** incident, linked to that monitor,
and starts in **Investigating** with an automated update containing the last
error.

When the next check succeeds, the incident moves to **Resolved** and an update
records roughly how long the outage lasted. The incident stays on the page and
in the feed with its full history.

If a service is flapping but not failing three times consecutively, no automatic
incident is opened. The owner can still add a manual update to an automatic
incident while it is open.

## Manual incidents, maintenance, and announcements

The owner can publish three kinds of entry:

| Kind          | Use for                                                         |
| ------------- | --------------------------------------------------------------- |
| `incident`    | An unplanned problem.                                           |
| `maintenance` | Planned work, optionally with a start and end time.             |
| `announcement`| A general service notice that is not an outage.                 |

An incident can affect none, one, or several monitors. Its impact is one of
`none`, `minor`, `major`, or `critical`.

The update statuses are:

- `investigating`
- `identified`
- `monitoring`
- `resolved`
- `scheduled`
- `in_progress`
- `completed`
- `published`

Every update adds a timestamped entry to the incident timeline and sets the
incident's current status. Marking an update `resolved` or `completed` also sets
the resolved time. Posting a later update with another status reopens it.

## Overall status

The banner is decided in this order:

1. An active maintenance window says **Maintenance in progress**, or
   **Scheduled maintenance** before it starts.
2. An active major or critical incident says **Major outage**.
3. An active minor incident says **Partially degraded**.
4. Failed monitors say **Partially degraded**, or **Major outage** when every
   public monitor is failing.
5. With no failures and at least one result, it says **All systems operational**.
6. Before the first checks land, it says **Waiting for the first checks**.

Resolved incidents do not affect the banner.

## Privacy

The public read path is a database function, not direct table access. It returns
monitor names, groups, states, latency, uptime, and incidents. It deliberately
omits:

- monitor URLs;
- request headers;
- probe error text;
- internal check ids;
- the identities behind incident updates.

The base tables have row-level security enabled with no public policies. Only the
service role and the probe function can read them directly.

## Administration

`/status/admin` is restricted to the signed-in **platform owner**. It is not a
space role and cannot be granted to another member. Unauthenticated requests
receive `401`; other signed-in accounts receive `403`.

The admin screen can:

- create, edit, enable, disable, publish, or delete monitors;
- see each monitor's URL, headers, and last result;
- post incidents, maintenance windows, and announcements;
- add timeline updates and change an incident's impact or affected services;
- delete a monitor and its history.

### Admin API

The screen uses these owner-only routes:

| Method                 | Endpoint                                       |
| ---------------------- | ---------------------------------------------- |
| `GET`, `POST`          | `/api/status-admin/monitors`                   |
| `PATCH`, `DELETE`      | `/api/status-admin/monitors/{id}`              |
| `GET`, `POST`          | `/api/status-admin/incidents`                  |
| `PATCH`, `DELETE`      | `/api/status-admin/incidents/{id}`             |
| `POST`                 | `/api/status-admin/incidents/{id}/updates`     |

They accept the owner's Supabase access token as `Authorization: Bearer <token>`.
They are implementation details of the admin screen, not a public API; the
shape can change.

## Operational notes

- The probe authenticates with a secret stored in Supabase Vault under
  `status_probe_key`. The secret is compared inside the database and is not
  returned to the function.
- The `pg_cron` job is named `status-probe`. It reads the secret from Vault on
  every run, so rotating the secret does not require editing the job.
- The Edge Function is deployed with JWT verification off, because it
  authenticates with the Vault secret instead.
- If the probe itself stops running, the page will show stale
  **last checked** times. That is the signal to inspect the cron job and Edge
  Function logs.

## Related

- [Webhooks](webhooks.md) — send outage notifications into a channel.
- [Embeds](embeds.md) — format those notifications.
