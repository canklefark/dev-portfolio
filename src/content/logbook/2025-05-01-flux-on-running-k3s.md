---
title: "Adding Flux to an already-running k3s cluster"
date: "2025-05-01T22:48:00"
tags: ["KUBERNETES", "FLUX"]
preview: "Bootstrapping Flux onto a live cluster is different from starting fresh. Reconciliation will fight workloads you deployed manually unless you annotate them first."
---

Bootstrapping onto a live cluster is different from starting clean. The first reconciliation loop fought with workloads I'd deployed manually. Getting drift detection stable required annotating those resources properly before handing control to Flux.

After `flux bootstrap`, Flux ran its first reconciliation against the Git repository — which at that point only contained the Flux system components. Everything else I'd deployed via `kubectl apply` was invisible to Flux but still running. Flux left those workloads alone. The problem was any resource that happened to share a name with something Flux now owned: it got silently overwritten on the next sync cycle.

The right sequence: before bootstrapping, annotate every resource you want to keep with `kustomize.toolkit.fluxcd.io/reconcile: disabled`. This tells Flux to skip that resource even if its YAML ends up in the repository. Then migrate services into the GitOps repo one at a time, remove the annotation, and let Flux take ownership incrementally.

Drift detection works correctly now. Any `kubectl apply` that deviates from the repository state gets reverted on the next reconciliation cycle. The rollback path for any workload change is a git revert.
