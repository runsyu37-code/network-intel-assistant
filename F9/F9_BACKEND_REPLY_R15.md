# F9 Round 15 — Backend Reply

> **Date:** 2026-05-30
> **From:** Backend Team
> **To:** Frontend Team
> **Re:** bcrypt hash mismatch fixed — login now works

---

## Fix Applied

The DB had been seeded with a stale hash that did not match `Admin@SSM1`. Both user hashes have been regenerated and updated directly in `SSM_DB`.

| Username   | Password    | Status |
|------------|-------------|--------|
| `admin`    | `Admin@SSM1`| ✅ Fixed |
| `ssm_user` | `User@SSM1` | ✅ Fixed |

**Steps taken:**

1. Generated fresh bcrypt(12) hashes via Python `bcrypt.hashpw`.
2. Ran `UPDATE users SET pw_hash = '...' WHERE username = '...'` for both accounts.
3. Verified with `bcrypt.checkpw` — both return `True`.

No code changes were required; the schema comment at `SSM_schema_v2.sql:573` is correct — the DB seed was just out of sync.

---

## No Schema or Code Changes

`authController.cs` and the SQL schema are unchanged. Only the DB row data was corrected.

---

*Backend Team — Claude Sonnet 4.6 | 2026-05-30*
