#!/usr/bin/env bash

log() {
  local repo_root="$HOME/workspace/github.com/canklefark/portfolio"
  local logbook_dir="$repo_root/src/content/logbook"
  local note=""
  local tags=""
  local title=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --tags) tags="$2"; shift 2 ;;
      --title) title="$2"; shift 2 ;;
      *) note="${note:+$note }$1"; shift ;;
    esac
  done

  if [[ -z "$note" ]]; then
    echo 'usage: log [--tags "TAG1,TAG2"] [--title "Custom title"] "Your note"' >&2
    return 1
  fi

  if [[ ! -d "$logbook_dir" ]]; then
    echo "error: logbook dir not found: $logbook_dir" >&2
    return 1
  fi

  # Title: full note, truncated at ~60 chars on a word boundary
  if [[ -z "$title" ]]; then
    if [[ ${#note} -le 60 ]]; then
      title="$note"
    else
      title="${note:0:60}"
      title="${title% *}"
    fi
  fi

  # Slug: lowercase, strip punctuation, collapse hyphens, cap at 7 segments
  local slug
  slug=$(printf '%s' "$title" \
    | tr '[:upper:]' '[:lower:]' \
    | sed 's/[^a-z0-9 ]//g' \
    | tr -s ' ' '-' \
    | cut -d'-' -f1-7 \
    | sed 's/-$//')

  if [[ -z "$slug" ]]; then
    echo "error: could not derive a slug from the note" >&2
    return 1
  fi

  # Timestamp
  local now
  now=$(date +"%Y-%m-%dT%H:%M:%S")
  local date_stamp="$now"
  local date_prefix="${now:0:10}"

  # Filename
  local base="${date_prefix}-${slug}"
  local filepath="$logbook_dir/${base}.md"
  local counter=2
  while [[ -f "$filepath" ]]; do
    filepath="$logbook_dir/${base}-${counter}.md"
    ((counter++))
  done
  local filename
  filename=$(basename "$filepath")

  # Preview: append period if note doesn't end with sentence punctuation
  local preview="$note"
  [[ ! "$preview" =~ [.!?]$ ]] && preview="${preview}."

  # YAML safety: escape backslashes first, then double quotes
  local safe_title="${title//\\/\\\\}"
  safe_title="${safe_title//\"/\\\"}"
  local safe_preview="${preview//\\/\\\\}"
  safe_preview="${safe_preview//\"/\\\"}"

  # Tags: comma-separated → YAML array, auto-uppercased
  local tags_yaml="[]"
  if [[ -n "$tags" ]]; then
    local formatted=""
    local tags_str="$tags,"
    while [[ -n "$tags_str" ]]; do
      local tag="${tags_str%%,*}"
      tags_str="${tags_str#*,}"
      tag=$(printf '%s' "$tag" | tr -d ' "\\' | tr '[:lower:]' '[:upper:]')
      if [[ -n "$tag" ]]; then
        [[ -n "$formatted" ]] && formatted+=", "
        formatted+="\"$tag\""
      fi
    done
    tags_yaml="[$formatted]"
  fi

  # Write entry
  cat > "$filepath" << EOF
---
title: "$safe_title"
date: "$date_stamp"
tags: $tags_yaml
preview: "$safe_preview"
draft: false
---

$preview
EOF

  echo "→ src/content/logbook/$filename"
}
