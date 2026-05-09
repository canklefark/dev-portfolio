---
title: "Slack alerts for datacenter maintenance windows"
date: "2025-03-10T11:22:00"
tags: ["AUTOMATION", "SLACK"]
preview: "GridPane sends emails for maintenance and outages. I don't check email fast enough. Simple webhook from a scheduled script polling the status page; now it pings Slack immediately. Took an afternoon."
---

GridPane sends emails for maintenance and outages. I don't check email fast enough. Simple webhook from a scheduled script polling the status page; now it pings Slack immediately. Took an afternoon.

The script is a cron job on the Beelink: polls the GridPane status API every five minutes, compares against the last-seen state in a local JSON file, and fires an incoming webhook to Slack on any change. The only interesting part was handling crashes mid-check. If the state file was missing on the next run, it treated every active incident as new and sent duplicate alerts on every poll cycle. Fixed by writing the state file at the start of the check, not the end.

GridPane's status API is undocumented. I found the endpoint from the browser network tab on their status page. It returns active incidents as JSON. It's been stable, but it's fragile in the obvious way: undocumented means it can change without warning.
