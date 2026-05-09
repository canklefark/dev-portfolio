---
title: "Toggl + Asana sync: building a script with Claude"
date: "2025-04-03T19:30:00"
tags: ["AUTOMATION", "API"]
preview: "Both have APIs. The sync logic was straightforward; the OAuth refresh for Toggl took most of the time. Claude wrote 90% of it. I spent my time on the refresh handling and the rate-limit edge cases."
---

Both have APIs. The sync logic was straightforward; the OAuth refresh for Toggl took most of the time. Claude wrote 90% of it. I spent my time on the refresh handling and the rate-limit edge cases.

The script reads time entries from Toggl for a given date range, matches them to Asana tasks by project name, and writes the total duration into a custom field on the Asana task. When multiple Toggl entries map to the same task, it sums them. Runs on a schedule from the Beelink.

The Toggl OAuth problem: their refresh endpoint returns a new access token and a new refresh token at the same time. If the script crashes between writing one and writing the other, the next run has a stale credential and the auth chain breaks silently. Fixed by writing both tokens atomically to a local credential file using a temp file and rename.

Asana's rate limit is 1,500 requests per 15 minutes. With around 400 tasks per sync window and no backoff, the script would occasionally saturate, get a 429, and exit without logging which task failed. Added exponential backoff with a three-attempt limit and a structured log entry for every failed write so retries are recoverable.
