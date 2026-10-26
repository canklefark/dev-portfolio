---
phase: "03"
slug: "read-path-rewire-and-parity"
status: verified
threats_open: 0
asvs_level: 1
created: "2026-10-26"
---

# Phase 3 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary                                  | Description                                                                                     | Data Crossing                    |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------- |
| anonymous request to server-rendered page | the slug route parameter is untrusted input that reaches an EmDash query                        | URL path, Host header            |
| EmDash content to public HTML             | rich text and fields written in the admin (and by an agent in Phase 4) are rendered to visitors | portable text, links, SEO fields |
| guard script to local machine             | the check starts a server and runs CLIs with paths derived from the repo                        | local paths, temp database       |
| CI workflow to GitHub runner              | push and pull_request triggers run repo scripts                                                 | repo source, no secrets          |

---

## Threat Register

| Threat ID | Category               | Component                                | Severity | Disposition | Mitigation                                                                                                               | Status |
| --------- | ---------------------- | ---------------------------------------- | -------- | ----------- | ------------------------------------------------------------------------------------------------------------------------ | ------ |
| T-03-01   | Information disclosure | getProject / getSortedProjects (drafts)  | high     | mitigate    | Reads via EmDash published-only anonymous queries; null-body 404 (`src/lib/projects.ts:58,68`, `[...slug].astro:16`)     | closed |
| T-03-02   | Spoofing               | detail route resolving a database id     | medium   | mitigate    | `entry.id === slug` check (`projects.ts:62`); guard requests id form and requires 404                                    | closed |
| T-03-03   | Tampering              | admin or toolbar JS on public routes     | high     | mitigate    | `toolbar: false` (`astro.config.mjs:17`); guard allowlist check on every route                                           | closed |
| T-03-04   | Tampering              | stored XSS via project body              | high     | mitigate    | No `set:html` under `src`; body renders through `emdash/ui` PortableText. See advisory WR-02                             | closed |
| T-03-05   | Tampering              | guard run against developer database     | medium   | mitigate    | mkdtemp cwd (`check-public-js.mjs:296-326`); repo `data/` never opened                                                   | closed |
| T-03-06   | Elevation of privilege | guard child server on fresh DB           | medium   | mitigate    | 127.0.0.1, ephemeral port, not detached, stopped in finally and on SIGINT/SIGTERM                                        | closed |
| T-03-07   | Elevation of privilege | command injection in guard               | medium   | mitigate    | Argument-array spawns only, no shell option                                                                              | closed |
| T-03-08   | Tampering              | ProseLink hrefs                          | high     | mitigate    | `sanitizeHref`, `rel="noopener noreferrer"` (`ProseLink.astro:9-13`)                                                     | closed |
| T-03-09   | Spoofing               | og:url from Host header                  | medium   | mitigate    | Built from `Astro.site` (`site.ts:54-60`); tests at `site.test.mjs:91-110`. See advisory IN-01                           | closed |
| T-03-10   | Denial of service      | retext on span text per request          | low      | accept      | See Accepted Risks Log (AR-03-01)                                                                                        | closed |
| T-03-11   | Tampering              | script allowlist wildcard                | high     | mitigate    | One added entry `/projects/*`; five-rule comparator with failing-case tests (`parity.test.mjs`)                          | closed |
| T-03-12   | Tampering              | CI workflow                              | medium   | mitigate    | `push`/`pull_request` only, `contents: read`, `actions/*` only, no secrets. See advisory IN-08                           | closed |
| T-03-13   | Repudiation            | guard passing on wrong status            | medium   | mitigate    | Route statuses asserted before allowlist check (`check-public-js.mjs:346-402`)                                           | closed |
| T-03-14   | Information disclosure | draft fixture                            | low      | mitigate    | Fixture applied only to mkdtemp database; non-sensitive content                                                          | closed |
| T-03-15   | Information disclosure | admin references in public HTML          | high     | mitigate    | ADMIN-REF check fails on `/_emdash/` references (`:373-376,403-405`)                                                     | closed |
| T-03-16   | Information disclosure | dev bypass helpers or tokens             | medium   | mitigate    | None tracked; `data/` gitignored                                                                                         | closed |
| T-03-17   | Information disclosure | seed contents                            | medium   | mitigate    | All 16 seed entries published; no dev identities                                                                         | closed |
| T-03-18   | Tampering              | seed round-trip drift                    | medium   | mitigate    | Taxonomies, menus, settings and project fields identical to baseline; `ROUND-TRIP: equal`                                | closed |
| T-03-19   | Denial of service      | loss of pre-delta database               | low      | mitigate    | Backup exists and `PRAGMA integrity_check` returns `ok`                                                                  | closed |
| T-03-20   | Tampering              | nav hrefs                                | high     | mitigate    | `sanitizeHref(link.url)`, escaped label (`Nav.astro:22,27`)                                                              | closed |
| T-03-21   | Tampering              | head and SEO values                      | medium   | mitigate    | Astro expression attributes, fixed tag set, static inline scripts (`Layout.astro:26-82`)                                 | closed |
| T-03-22   | Denial of service      | missing singleton or settings            | low      | mitigate    | Named errors; guard fails on non-200                                                                                     | closed |
| T-03-23   | Tampering              | About contact hrefs                      | high     | mitigate    | `sanitizeHref(contact.href)` (`about.astro:55-57`)                                                                       | closed |
| T-03-24   | Tampering              | About body rendering                     | high     | mitigate    | PortableText with ProseBlock and ProseLink. See advisory WR-02                                                           | closed |
| T-03-25   | Information disclosure | Server-Timing, health, robots, sitemap   | low      | accept      | See Accepted Risks Log (AR-03-02)                                                                                        | closed |
| T-03-26   | Information disclosure | local production server for visual check | low      | accept      | See Accepted Risks Log (AR-03-03)                                                                                        | closed |
| T-03-27   | Information disclosure | draft project visibility                 | high     | mitigate    | Draft fixture asserted absent from index and 404 on detail. See advisory WR-01                                           | closed |
| T-03-28   | Spoofing               | id-form URL                              | medium   | mitigate    | `negativePaths` includes the id form                                                                                     | closed |
| T-03-29   | Tampering              | guard SQL                                | medium   | mitigate    | `WHERE slug = ?` bound parameter, constant table name (`:156-158`)                                                       | closed |
| T-03-30   | Tampering              | prose punctuation transform              | high     | mitigate    | `prose.ts:28-45` rewrites span text only; no raw HTML injection                                                          | closed |
| T-03-31   | Spoofing               | og:url construction                      | medium   | mitigate    | Same code as T-03-09; `npm test` 42/42                                                                                   | closed |
| T-03-SC   | Tampering              | supply chain                             | high     | mitigate    | Only `retext`, `retext-smartypants`, `github-slugger` added, pinned and locked with integrity hashes, no install scripts | closed |

_Status: open · closed · open — below high threshold (non-blocking)_
_Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open_
_Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)_

---

## Accepted Risks Log

| Risk ID  | Threat Ref | Rationale                                                                                                                                                                      | Accepted By | Date       |
| -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ---------- |
| AR-03-01 | T-03-10    | `prepareBody` runs retext on plain span text only, once per request per body. No HTML parsing; renders in milliseconds.                                                        | user        | 2026-10-26 |
| AR-03-02 | T-03-25    | Server-Timing, `/_emdash/api/health`, `/robots.txt` and `/sitemap.xml` carry no JS and no draft content. Phase 5 strips Server-Timing at the proxy and sets `EMDASH_SITE_URL`. | user        | 2026-10-26 |
| AR-03-03 | T-03-26    | The production server used for the visual check binds localhost and reads only the local developer database.                                                                   | user        | 2026-10-26 |

_Accepted risks do not resurface in future audit runs._

---

## Unregistered Advisories (non-blocking, not in the register)

Reported by the auditor, untriaged in `03-REVIEW-DISPOSITION.md`:

- **WR-02:** pages override only `block` and `mark.link` on PortableText, so EmDash default `types` (`htmlBlock`, `iframe`, `embed`, `gallery`, `image`, `code`) stay live. First-party XSS is contained (sanitize-html allowlist, sandboxed HTML blocks, https-only iframes), but an editor or Phase 4 agent could add public JS the CI guard cannot see. Fix: add `types` overrides that render nothing for unused block types before Phase 4 agent writes.
- **WR-01:** the draft-404 guard does not assert the draft row exists, so it can pass vacuously after an upstream change.
- **IN-01:** `ogUrl("//evil.com", site)` returns `https://evil.com/`. Host-header mitigation holds; reachability via a 200 route is unverified.
- **WR-04:** `noIndex` set in the SEO panel is ignored, so the page stays indexable (privacy gap).
- **IN-08:** CI actions pinned by mutable `@v7` tags; no `timeout-minutes`.

Not run by the auditor: `npm run check:public-js` (verified by source reading; CI ran it green) and the manual `data/emdash.db` before/after checksum for T-03-05.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By                                                       |
| ---------- | ------------- | ------ | ---- | ------------------------------------------------------------ |
| 2026-10-26 | 32            | 32     | 0    | gsd-security-auditor (3 low-severity accepts logged by user) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-26
