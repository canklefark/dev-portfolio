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
summary: "Prometheus and Grafana monitoring the homelab's Docker host. Basic alerting configured; Loki is next."
sub: "Prometheus and Grafana watching the Docker host that now runs every self-hosted service. Originally covered a k3s cluster too, before those nodes died."
stats:
  - { label: "Metrics", value: "Prometheus", variant: "default" }
  - { label: "Dashboards", value: "Grafana", variant: "default" }
  - { label: "Coverage", value: "Docker host", variant: "green" }
  - { label: "Next", value: "Loki", variant: "accent" }
---

## Setup

`Prometheus` scraping `node_exporter`. It originally covered three Lenovo k3s nodes plus the Beelink; the Lenovos are gone now (see [Homelab Kubernetes Cluster](/projects/homelab-k8s)), so it's just the Docker host. `Grafana` for visualization. Basic alerting for uptime and disk.

## What's Missing

Log aggregation. `Loki` is the obvious next step, but log retention at homelab scale needs a real storage plan first. Alertmanager is also on the list. Right now alerts exist in Grafana but nothing acts on them.

## Stack

`Prometheus` · `Grafana` · `node_exporter`
