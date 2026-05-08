---
date: "2025-01-15"
title: "Homelab Kubernetes Cluster"
category: "Homelab Infrastructure"
status: "IN PROGRESS"
statusVariant: "accent"
surface: "BARE METAL"
timeLabel: "ACTIVE"
period: "Q1 2025"
tags: ["Kubernetes", "k3s", "Ansible", "Flux"]
summary: "Three Lenovo mini PCs running k3s. Ansible handles provisioning; Flux GitOps is being layered in now."
sub: "Three Lenovo mini PCs running k3s. Ansible handles node provisioning; Flux GitOps is being layered in now to bring every deployment under version control."
stats:
  - { label: "Nodes", value: "3", variant: "default" }
  - { label: "Runtime", value: "k3s", variant: "default" }
  - { label: "Provisioner", value: "Ansible", variant: "green" }
  - { label: "GitOps", value: "Flux (WIP)", variant: "accent" }
paceNote: "NOTE: BOOTSTRAPPING FLUX ON LIVE CLUSTER → ANNOTATE EXISTING RESOURCES FIRST → DON'T LET DRIFT DETECTION FIGHT YOU"
---

## The Problem

I started on a single Beelink running Docker Compose. It hit a ceiling when I wanted more services and a rollback path I trusted. Adding a second machine just doubled the coordination work.

## Approach

Three Lenovo mini PCs, each running as both control plane and worker. `k3s` for the cluster runtime; less overhead than upstream Kubernetes and the same APIs. `Ansible` handles initial node provisioning and configuration. `Flux` is being added so every workload change is a Git commit instead of a kubectl apply.

## Current State

Cluster is stable and running. Flux reconciliation is being wired up against a private Git repository. Once Flux is solid, the Docker Compose workloads on the Beelink migrate into the cluster progressively, with the Beelink as a Docker fallback.

## Stack

`k3s` · `Ansible` · `Flux` · `kubectl`
