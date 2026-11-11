# Status system

Disband's status page is self-hosted. It does not depend on a third-party
status service, so it can still report accurately when the main web host, API,
or static asset delivery is having trouble.

- Public page: [disband.dev/status](https://www.disband.dev/status)
- RSS feed: [disband.dev/status/feed.xml](https://www.disband.dev/status/feed.xml)

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

Automated checks run every minute and record one result per monitor. A monitor
is healthy only when its expected HTTP status matches and any configured keyword
is present. Timeouts, network errors, wrong statuses, and missing keywords are
recorded as failures.

Checks run independently of the web app, so a failure at the web host does not
stop checks being recorded.

## History and uptime

Each check is stored and rolled up into daily history, so the 90-day uptime bar
is read from precomputed data rather than aggregated on demand.

- Raw checks are retained for 90 days.
- Daily roll-ups are retained for 180 days.
- The public page displays the latest 90 days.
- Each day's segment is the percentage of successful checks that day.

A gap — a day with no checks — is shown as no data, not as downtime.

## Automatic incidents

When a monitor fails three checks in a row, a major incident is opened
automatically and linked to that monitor. When the next check succeeds, the
incident is resolved with an update describing the outage duration. The incident
remains visible with its full history.

If a service is flapping but not failing three times consecutively, no automatic
incident is opened.

## Incidents, maintenance, and announcements

The status page can publish three kinds of entry:

| Kind | Use for |
| --- | --- |
| `incident` | An unplanned problem. |
| `maintenance` | Planned work, optionally with a start and end time. |
| `announcement` | A general service notice that is not an outage. |

An incident can affect one or more monitors and carry an impact level of
`none`, `minor`, `major`, or `critical`. Each update adds a timestamped entry to
the timeline. Marking an update `resolved` or `completed` sets the resolved
time; a later update can reopen it.

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

The public status page and feed expose service state, uptime, and incident
history. Internal monitoring configuration, probe details, and administrative
controls are not part of the public interface.

## Related

- [Webhooks](webhooks.md) — send outage notifications into a channel.
- [Embeds](embeds.md) — format those notifications.
