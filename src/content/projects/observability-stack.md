---
date: "2024-10-01"
title: "Observability Stack"
category: "Observability"
status: "COMPLETE"
statusVariant: "green"
surface: "BARE METAL"
timeLabel: "19:22"
period: "Q4 2024"
tags: ["Prometheus", "Grafana", "node_exporter"]
summary: "Prometheus and Grafana across the homelab. Metrics from all cluster nodes and the Docker host in one place. Basic alerting configured; Loki is next."
sub: "Prometheus and Grafana across all homelab nodes. Metrics from the K8s cluster and Docker host in one place."
stats:
  - { label: "Metrics", value: "Prometheus", variant: "default" }
  - { label: "Dashboards", value: "Grafana", variant: "default" }
  - { label: "Coverage", value: "All nodes", variant: "green" }
  - { label: "Next", value: "Loki", variant: "accent" }
paceNote: "NOTE: GET ALERTMANAGER WIRED BEFORE ADDING SERVICES / LOKI FOR LOGS IS THE LOGICAL NEXT STEP"
---

## Setup

`Prometheus` scraping `node_exporter` on all three Lenovo nodes and the Beelink. `Grafana` for visualization. Basic alerting for uptime and disk.

## What's Missing

Log aggregation. `Loki` is the obvious next step, but log retention at homelab scale needs a real storage plan first. Alertmanager is also on the list. Right now alerts exist in Grafana but nothing acts on them.

## Stack

`Prometheus` · `Grafana` · `node_exporter`
