---
title: "Adding Flux to an already-running k3s cluster"
date: "2025-05-01T22:48:00"
tags: ["KUBERNETES", "FLUX"]
preview: "Bootstrapping Flux onto a live cluster is different from starting fresh. Reconciliation will fight workloads you deployed manually unless you annotate them first."
---

Bootstrapping onto a live cluster is different from starting clean. The first reconciliation loop fought with workloads I'd deployed manually. Getting drift detection stable required annotating those resources properly before handing control to Flux.
