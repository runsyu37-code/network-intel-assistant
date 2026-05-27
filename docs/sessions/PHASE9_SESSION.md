# Phase 9 Session Log — 2026-05-26

**Branch:** `backend`  
**Commits:** `359ecee` → `8cc0638`  
**Engineer:** Ran (Reviewer) + Claude (Builder)

---

## What Was Done

### 1. Rate Limiting on `/api/auth/login` (Phase 9 spec)

**Implementation:** In-memory `Dictionary<string, AttemptRecord>` with a `static readonly object _lock`.

- 10 failed attempts within a 5-minute window per IP → 429 + `Retry-After` header
- 15-minute lockout after threshold is reached
- Successful login clears the failure record for that IP
- Lockout event logged to `audit_logs` (best-effort, wrapped in try/catch)
- IP extracted from `X-Forwarded-For` first, fallback to `UserHostAddress`

**Why in-memory, not DB:**  
Login rate limiting is per-process state. A DB row per IP per attempt would add a round-trip to every login call. For a single-server intranet deployment (which this is), in-memory is correct. If this ever goes multi-server, migrate to Redis or a shared cache — but that is not the current architecture.

**Why `lock` not `ConcurrentDictionary`:**  
`ConcurrentDictionary.AddOrUpdate` factory delegates can be called multiple times on contention, making "set lockout flag" logic unsafe in the factory. A plain `lock` around a `Dictionary` is simpler and correct. Login is not a hot path.

**Why 10 attempts / 5 min window / 15 min lockout:**  
Agreed in Phase 8 debate. Balances security (brute force protection) vs. usability (a legitimate user who misremembers password gets several retries before lockout).

---

### 2. Role Required on Save + Update (usersController)

**Problem found:** `ValidRoles` check in Save used `!string.IsNullOrWhiteSpace(x.role) && !ValidRoles.Contains(x.role)` — meaning null/empty role passed the check and was stored as NULL in `pw_hash` column, breaking RBAC for that user at login.

**Fix:**
- Added explicit `role is required` check before `ValidRoles` check in both `Saveusers` and `Updateusers`
- Simplified `ValidRoles` check: once null/empty is caught, just `!ValidRoles.Contains(x.role)` is sufficient

**Why role is required on Update (not optional):**  
The Update SQL replaces all fields including `role`. Allowing null role on Update would silently wipe the user's role to NULL. Unlike `password` (which has `CASE WHEN @newPwHash IS NULL THEN pw_hash ELSE @newPwHash END`), `role` has no keep-existing logic. The simpler fix was require role. Partial update pattern is a future concern.

---

### 3. RBAC Gap — Missing Role Checks on 11 Controllers

**Problem found:** Only `camerasController`, `usersController`, and `floorPlansController` had `IsInRole` checks on mutating endpoints. The other 11 controllers (sites, buildings, floors, rooms, racks, nvrs, poe_switches, alert_logs, audit_logs, ping_logs, sync_logs) had `[Authorize]` (requires valid token) but no role check — meaning a `viewer` could POST/DELETE to any of them.

**Fix:**
| Controllers | Save | Update | Delete |
|------------|------|--------|--------|
| sites, buildings, floors, rooms, racks, nvrs, poe_switches | admin + user | admin + user | admin + user |
| alert_logs, audit_logs, ping_logs, sync_logs | admin only | admin only | admin only |

**Why logs are admin-only (not admin+user):**  
Log tables are system-generated. Manual write/delete of log records should be restricted to admin. A `user` role represents a technician editing device data — they should not be able to manually insert or delete audit/ping/alert/sync records.

**Why infrastructure is admin+user (not admin-only):**  
Consistent with Role Matrix agreed in Phase 7: `user` can add/edit cameras, NVRs, switches, buildings, etc. Only user management and floor plan upload are admin-only.

---

### 4. Bulk Find: How the RBAC Gap Was Discovered

`grep -r "IsInRole" Controllers/` returned only 9 hits across 3 files. Since there are 15 controllers with POST routes, the gap was immediately visible. Lesson: after adding RBAC to any controller, always run the grep to verify coverage.

---

### 5. Template v4 + Import Script

- `template_v3_original.xlsx` — backup of original
- `template_v4.xlsx` — cleaned: removed image/timestamp/system columns, renamed CCTV FK columns to `SW_ID`/`NVR_ID`, added `install_location`
- `import_to_api.py` — reads Excel, POSTs to API in FK order (Sites → ... → Cameras → Users). Users must go through API (BCrypt hashing).

**Direct SQL copy-paste:** safe for all tables except Users (passwords would be plain text). Fill NVR/Switch sheets first to get their string IDs before CCTV sheet.

---

### 6. Test Accounts Created

| username | role | password |
|----------|------|----------|
| admin | admin | Admin@1234 |
| ssm_user | user | (unknown) |
| viewer | viewer | (unknown) |
| admin_test | admin | Test@1234 |
| user_test | user | Test@1234 |
| viewer_test | viewer | Test@1234 |

Lesson: create all 3 test-role accounts at the start of every test phase, not on demand.

---

## Problems Hit

| Problem | Root cause | Fix |
|---------|-----------|-----|
| `ValidRoles` check skipped null role | `IsNullOrWhiteSpace` guard on wrong side | Separate required check + simplified contains check |
| PowerShell bulk regex mangled indentation | Regex captured trailing spaces, replacement doubled them | Rewrote with clean regex that strips broken output then re-inserts correctly |
| Delete methods not patched in first pass | Delete pattern uses `if (IsNullOrWhiteSpace(id))` not `if (model == null)` | Added separate regex branch for Delete pattern |
| `viewer_test` login 401 | Password set at creation was different from `Test@1234` | Reset via `POST /api/users/{id}` with admin token |

---

## Phase 9 Test Results

| Test | Endpoint | Expected | Result |
|------|----------|----------|--------|
| TEST1 Rate limit 429 | POST /api/auth/login ×10 | 429 on 10th | ✅ PASS |
| TEST2 Retry-After header | POST /api/auth/login (locked) | header present | ✅ PASS |
| TEST3 Save without role | POST /api/users | 400 role required | ✅ PASS |
| TEST4 Save without password | POST /api/users | 400 password required | ✅ PASS |
| TEST5 Update without role | POST /api/users/6 | 400 role required | ✅ PASS |

---

## Phase 10 Backlog

| Item | Priority | Notes |
|------|----------|-------|
| Debate / adversarial review of Phase 9 | High | Reviewer wants to challenge rate limiting design |
| Rebuild + smoke test full RBAC with all 3 roles | High | Verify viewer gets 403 on sites/buildings/etc. |
| Refresh token endpoint | Low | Not needed unless frontend reports UX issue with 8h expiry |
| Pagination | Low | Only needed if device count exceeds 500 |
| Webhook delivery for alert_logs.webhook_sent | Low | Column exists, no delivery logic yet |

---

*Generated 2026-05-26. Backend: Ran. Builder: Claude Sonnet 4.6.*
