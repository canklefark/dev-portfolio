---
title: "Migrating photos off Google to Immich"
date: "2025-03-22T14:55:00"
tags: ["IMMICH", "SELF-HOSTED"]
preview: "Google Takeout exports cleanly. The problem is metadata: Takeout separates JSON sidecar files from images, and Immich's importer doesn't always reconcile the timestamps correctly. exiftool fixes it in bulk."
---

Google Takeout exports cleanly. The problem is metadata: Takeout separates JSON sidecar files from images, and Immich's importer doesn't always reconcile the timestamps correctly. exiftool fixes it in bulk.

The root cause: Takeout puts the real timestamp in a `.json` sidecar next to each image rather than in the EXIF data itself. When Immich imports and the EXIF timestamp is wrong or absent, it falls back to the file's filesystem mtime (the time you downloaded the zip, not when the photo was taken). Everything ends up dated the same day.

The fix: run exiftool on the unpacked Takeout directory before importing. The command pulls the timestamp out of the sidecar JSON and writes it into the image EXIF:

```
exiftool -r -d %s -tagsfromfile "%d%f.%e.json" \
  "-DateTimeOriginal<PhotoTakenTimeTimestamp" \
  -overwrite_original -progress .
```

After that, Immich's deduplication handles duplicates correctly on import. Around 3% of photos had no sidecar or a missing `photoTakenTime` field. Those stayed in a separate folder; I spot-checked the dates for anything that mattered.
