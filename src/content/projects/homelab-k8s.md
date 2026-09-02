---
date: "2025-01-15"
title: "Homelab Kubernetes Cluster"
category: "Homelab Infrastructure"
status: "RETIRED"
statusVariant: "default"
surface: "BARE METAL"
timeLabel: "RETIRED"
period: "Q1 2025"
tags: ["Kubernetes", "k3s", "Ansible", "Flux"]
summary: "Three Lenovo mini PCs running k3s. Retired after the nodes died; workloads consolidated back onto a single Docker host."
sub: "Ansible handled node provisioning and Flux GitOps was partway to landing when the nodes died. Everything it was meant to run lives on the Docker host now."
stats:
  - { label: "Nodes", value: "3 (retired)", variant: "default" }
  - { label: "Runtime", value: "k3s", variant: "default" }
  - { label: "Provisioner", value: "Ansible", variant: "default" }
  - { label: "GitOps", value: "Flux (never finished)", variant: "default" }
---

## The Problem

I started on a single Beelink running Docker Compose. It hit a ceiling when I wanted more services and a rollback path I trusted. Adding a second machine just doubled the coordination work.

## Approach

Three Lenovo mini PCs, each running as both control plane and worker. `k3s` for the cluster runtime; less overhead than upstream Kubernetes and the same APIs. `Ansible` handles initial node provisioning and configuration. `Flux` is being added so every workload change is a Git commit instead of a kubectl apply.

## Current State

The Lenovo nodes died before Flux reconciliation was finished. Rather than replace them, I consolidated everything back onto the Docker host — see [Self-Hosted Services](/projects/self-hosted-services) for where those workloads live now. The cluster is fully decommissioned.

## Stack

`k3s` · `Ansible` · `Flux` · `kubectl`
