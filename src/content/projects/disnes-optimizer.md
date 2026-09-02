---
date: "2026-03-01"
title: "Disney Optimizer"
category: "Personal Projects"
status: "LIVE"
statusVariant: "green"
surface: "CLOUDFLARE WORKERS"
timeLabel: "SEASONAL"
period: "Q1–Q2 2026"
tags:
  [
    "SvelteKit",
    "Svelte 5",
    "TypeScript",
    "Tailwind CSS",
    "PWA",
    "Cloudflare Workers",
  ]
summary: "A PWA that builds and re-optimizes a Walt Disney World ride itinerary in real time, blending live wait times with hourly forecasts."
sub: "Built for one-handed, sunlit, phone-only use inside the parks — a greedy scoring optimizer reorders your day as wait times shift, weighted toward live data as a ride gets close."
stats:
  - { label: "Rides tracked", value: "111", variant: "default" }
  - { label: "Parks", value: "4", variant: "default" }
  - { label: "Commits", value: "55", variant: "default" }
draft: false
---

## The Problem

Planning a Disney World day around wait times is a full-time job, and by 11am the plan is already wrong — a ride you skipped opens up short, a must-do spikes past an hour, and you're standing in a walkway trying to do the math yourself in the Florida heat. I wanted a plan that adjusted itself.

## Approach

It's a SvelteKit 5 PWA using Svelte 5 runes, installed to the home screen and built for one-handed use — the product spec is explicit about it: a 2-second glance, not a reading session. A greedy scoring algorithm ranks each remaining ride by priority over walk time, predicted wait, and ride duration, blending live wait times with ThemeParks.wiki's hourly forecast — the blend shifts toward live data as a ride gets closer, from 80% live inside 15 minutes down to pure forecast past an hour out. Ride and park data — 111 rides across four parks, with coordinates for Haversine walk-time calculations — is static JSON checked into the repo. Wait times poll every 5 minutes, forecasts every 30, and polling pauses when the tab isn't visible.

## Current State

Deployed to Cloudflare Workers as an installable PWA. Plan building, the live-reroute dashboard, Lightning Lane return-window tracking, and the showtimes browser all work end to end. Lightning Lane availability state is fetched from the API but not yet wired into scheduling — booked windows still have to be recorded manually.

## What's Next

Wiring Lightning Lane availability into the optimizer directly instead of relying on manually recorded return windows, and expanding past the four core parks if I need it for a different trip.

## Stack

`SvelteKit 5` · `Svelte 5` · `TypeScript` · `Tailwind CSS v4` · `Cloudflare Workers` · `Vite PWA`
