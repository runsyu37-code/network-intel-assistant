# API Contract Template — SSM (Frontend ↔ Backend)

> **What this is:** the standard you fill out **before either team writes code** for a new or
> changed endpoint. One file per endpoint. Lives in `F9/contracts/`.
> **Why it exists:** every recurring pain in this project (`position_x/y` missing, `lat/lng`
> null, the unrun migration) traces to the same root — *nobody wrote down the full response
> shape with nullability and got both sides to agree before building.* This template is the fix.
> **Last reviewed:** 2026-05-31 (ICT)

---

## Tag legend (applies to every section/field below)

| Tag | Meaning |
|---|---|
| **[CRITICAL]** | Skip this or get it wrong and you *will* get rework or a production bug. Non-negotiable. |
| **[STRONG]** | Solid, low-risk, worth keeping. |
| **[WEAK]** | Fragile, optional, or a process step that decays in practice — keep it but don't trust it to save you. |

---

## ⚠️ Read this before you trust the template — [CRITICAL]

**My honest take: a hand-written markdown contract that "both teams sign" is a stopgap, not the
real fix.** Process documents decay. Six weeks from now someone will ship an endpoint without a
contract because they were in a hurry, and you'll be back to guessing field shapes.

The durable fix is **server-generated OpenAPI/Swagger + a typed frontend client** (e.g. generate
TS types from the .NET Swagger doc). When the backend's DTO *is* the contract and the frontend
*compiles against it*, a dropped field becomes a build error instead of a silent runtime bug.
ASP.NET Core gives you Swagger almost for free; wiring `openapi-typescript` or NSwag on the
frontend is a few hours of one-time work.

**If you do only one thing for coordination, do that — not this template.** This template is the
bridge you use *until* the generated-contract pipeline exists, and the discipline you keep for the
handful of things OpenAPI can't express (null *semantics*, FE fallback behavior, which fields FE
actually reads). See `docs/FIXES_AND_ADDITIONS.md` → "Platform hardening".

---

## How to use this file — [STRONG]

1. Copy the template block below into `F9/contracts/<METHOD>_<path-slug>.md`
   (e.g. `F9/contracts/POST_api-cameras.md`). **One endpoint per file** — [STRONG].
   Don't bundle a whole feature's endpoints into one doc; it makes the sign-off ambiguous.
2. Fill every field. **"Unknown" is a valid answer and must be written as `UNKNOWN — BE to confirm`** — [CRITICAL].
   A blank field is how `position_x/y` got lost. An explicit `UNKNOWN` is a blocker you can track.
3. Set `Status: DRAFT`. Both owners review. Only when **both** check the sign-off box does it
   become `Status: AGREED` — and *only then does either team write code* — [CRITICAL].
4. If the shape changes later, bump `Status` back to `DRAFT` and re-sign. A silently edited
   "agreed" contract is worse than no contract — [CRITICAL].

---

## The template (copy everything in the block)

```markdown
# API Contract — <Feature> — <METHOD> <path>
Status: DRAFT            # DRAFT | AGREED
Date: YYYY-MM-DD (ICT)
FE owner: ____           BE owner: ____
Supersedes: <link to prior contract, or "none">

## 1. Endpoint                                              # [CRITICAL]
Method + URL:   POST /api/<resource>
Auth:           JWT required? (yes/no)
Roles allowed:  admin | user | viewer   # must match server-side enforcement, NOT just UI guards

## 2. Request                                              # [CRITICAL]
Headers:        Authorization: Bearer <token>
                Content-Type: application/json
Path params:    <name>: <type>   | none
Query params:   <name>: <type> (required? default?)   | none
Body shape:     # ⚠️ STATE array-vs-object EXPLICITLY — our endpoints are inconsistent
                # add = array body, edit = single object, delete = path param only.
                # Do NOT assume. Write the literal JSON.
  [
    { "<field>": "<type> (required|optional)",
      "<field>": "<type>|null" }
  ]

## 3. Response 200 — EVERY field FE may rely on            # [CRITICAL]  ← the whole point
  # For EACH field: name : type (NON-NULL | nullable) — one-line note on what FE does with it.
  # "nullable" without a documented FE fallback (section 5) is a bug waiting to happen.
  {
    "id":         "int    (NON-NULL)",
    "name":       "string (NON-NULL)",
    "status":     "\"online\"|\"offline\" (NON-NULL) — drives the audit dot/row",
    "last_seen":  "ISO-8601 string (NON-NULL) — FE shows freshness; stale-but-green = audit lie",
    "position_x": "float  (NON-NULL) — FE renders floor plan from this; MUST be in the SELECT",
    "position_y": "float  (NON-NULL)",
    "rack_id":    "int|null",
    "u_position": "int|null",
    "u_height":   "int    (NON-NULL, >=1) — rack diagram cannot render multi-U gear without this"
  }

## 4. Errors                                               # [STRONG]
401 unauthenticated · 403 wrong role · 404 not found
400 validation: { "errors": [ { "field": "...", "message": "..." } ] }
409 conflict (e.g. overlapping rack U range) — define if relevant

## 5. FE reads / FE ignores / null fallback                # [CRITICAL] for reads+fallback, [WEAK] for ignores
Reads:     <fields the FE actually consumes>
Ignores:   <fields BE returns that FE doesn't use>          # [WEAK] — nice to know, not load-bearing
Null fallback (per nullable field):
  - <field>: if null, FE does ____   # if the answer is "breaks" or "grid fallback hack",
                                      # the field should be NON-NULL by contract instead.

## 6. Pagination & filtering (list endpoints only)          # [CRITICAL] for any list that grows
Paginated?   yes/no   params: page, page_size, default size
Server-side filters: status, floor_id, site_id, ...
  # Unpaginated full-table reads + client-side filtering WILL choke at thousands of devices.

## 7. Persistence note                                      # [CRITICAL]
Does this write to a column/table that EXISTS in the live DB right now? (yes / no — migration: <file>)
  # This box exists specifically because PATCH .../position writes topology_x/y that were
  # never migrated. Never again ship a contract whose write target doesn't exist.

## 8. Sign-off
[ ] FE agrees      [ ] BE agrees      → flip Status to AGREED, then code.
```

---

## Worked example (fill it in like this) — [STRONG]

This is the contract that **would have prevented the `position_x/y` bug.** Note how the two
fields the bug dropped are marked `NON-NULL` and tied to FE behavior — there's no way to "forget"
them in the SELECT without breaking an agreed contract.

```markdown
# API Contract — Camera read — GET /api/cameras
Status: AGREED
Date: 2026-05-31 (ICT)
FE owner: Ran        BE owner: Ran
Supersedes: none

## 1. Endpoint
Method + URL: GET /api/cameras
Auth: JWT required (yes)
Roles allowed: admin, user, viewer

## 2. Request
Headers: Authorization: Bearer <token>
Path params: none
Query params: Floor_ID: int (optional), status: "online"|"offline" (optional),
              page: int (default 1), page_size: int (default 50)
Body: none

## 3. Response 200
{
  "id":         int    (NON-NULL),
  "name":       string (NON-NULL),
  "ip":         string (NON-NULL),
  "status":     "online"|"offline" (NON-NULL),       # audit dot + table row
  "last_seen":  ISO-8601 string (NON-NULL),          # freshness; render "stale" if old
  "floor_id":   int    (NON-NULL),
  "position_x": float  (NON-NULL),                   # ← the field that was missing. Floor plan.
  "position_y": float  (NON-NULL),                   # ←
  "rack_id":    int|null,
  "u_position": int|null,
  "u_height":   int    (NON-NULL, >=1)
}

## 4. Errors
401 / 403 / 400 validation

## 5. FE reads / ignores / fallback
Reads:   id, name, ip, status, last_seen, position_x/y, floor_id
Ignores: (none currently)
Null fallback: position_x/y are NON-NULL by contract — there is NO fallback and there must not be.
               The localStorage grid hack is being deleted once this contract is honored.

## 6. Pagination & filtering
Paginated? yes (page/page_size). Server-side filters: Floor_ID, status.

## 7. Persistence note
Reads existing columns. position_x/y already exist in DB (written by PATCH /api/cameras/{id}/position).
The bug was the SELECT, not the schema. No migration needed — just add the columns to the SELECT.

## 8. Sign-off
[x] FE agrees   [x] BE agrees
```

---

## The one rule that actually matters — [CRITICAL]

> **Section 3 lists every field the frontend depends on, with nullability, and both teams sign
> Section 8 before anyone codes.**

Everything else in this template is supporting structure. If your team is too rushed to fill the
whole thing, fill **Section 3 + Section 7 + Section 8** and ship. Those three are the difference
between "frontend waits on backend for a week" and "it just works."
