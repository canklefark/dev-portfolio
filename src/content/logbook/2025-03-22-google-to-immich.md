---
title: "Migrating photos off Google to Immich"
date: "2025-03-22T14:55:00"
tags: ["IMMICH", "SELF-HOSTED"]
preview: "Google Takeout exports cleanly. The problem is metadata: Takeout separates JSON sidecar files from images, and Immich's importer doesn't always reconcile the timestamps correctly. exiftool fixes it in bulk."
---

Google Takeout exports cleanly. The problem is metadata: Takeout separates JSON sidecar files from images, and Immich's importer doesn't always reconcile the timestamps correctly. exiftool fixes it in bulk.
