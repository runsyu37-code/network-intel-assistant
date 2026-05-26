# Phase 9 Adversarial Debate — 2026-05-26

**Subject:** Rate Limiting Design in `authController.cs`
**Builder:** Claude | **Reviewer:** Ran

---

## Final Scorecard

| Attack | Result | Winner |
|--------|--------|--------|
| Attack 1 — app pool recycle clears state | Theoretical only — math kills it at this scale | Builder |
| Attack 2 — BCrypt inside critical section | Reviewer factual error — retracted | Builder |
| Attack 3 — X-Forwarded-For spoofable → DoS | Builder concedes, fix shipped | Reviewer |
| SQL race condition fix cost | Reviewer underpriced it | Builder |
| IIS Express 127.0.0.1 behavior | Both identified, comment required | Draw |

**Builder 3, Reviewer 1, Draw 1**

---

## Attack Details and Outcomes

### Attack 1 — App Pool Recycle Clears State

**Reviewer's claim:** IIS app pool recycles on deploy, memory limit, or admin action. Attacker sends 9 attempts before recycle, resets counter, repeats indefinitely with deploy-cycle knowledge.

**Builder's defense:** Insider with deploy-cycle knowledge would need:
- ~218 trillion combinations for an 8-char password space
- 9 attempts per deploy, once per week
- 218,000,000,000,000 / 9 / 52 ≈ **465 million years**

**Outcome:** Reviewer conceded — theoretical concern only. Math eliminates it at this threat model and scale. No code change.

**Why:** OWASP ASVS 11.1.7 (state must survive restart) applies to internet-facing systems under real brute-force threat. For a 30-user intranet with BCrypt slowing attempts to ~10/second, in-memory is proportionate.

---

### Attack 2 — BCrypt Inside Critical Section

**Reviewer's claim:** `static readonly object _lock` holds during BCrypt (~100ms), serializing all concurrent logins.

**Retracted:** Reviewer misread the lock scope. Code reality:
- Lines 46–57: lock acquired only to check `LockedUntil`, then **released**
- Line 73: `BCrypt.Verify` runs **outside any lock**
- `HandleFailedAttempt` acquires a separate lock at line 100 for dictionary write only

Lock holds only during dictionary read/write (microseconds). Design is correct.

---

### Attack 3 — X-Forwarded-For Spoofable

**Reviewer's claim:** Original `GetClientIp()` trusted `X-Forwarded-For` header without validation. Attacker sends `X-Forwarded-For: <victim_IP>` → victim's IP gets locked after 10 failed attempts → trivial DoS.

**Builder concession:** Correct and unambiguous. No proxy sits between client and IIS on this intranet. The header should never have been trusted.

**Fix shipped:**

```csharp
private string GetClientIp()
{
    // X-Forwarded-For intentionally not used: no reverse proxy sits in front of IIS
    // on this intranet deployment. Trusting that header would allow any client to
    // spoof a victim IP and trigger their lockout (trivial DoS).
    // NOTE: In IIS Express (dev), UserHostAddress always returns 127.0.0.1 —
    // rate limiting during local testing is a shared counter for all localhost requests.
    // NOTE: Rate limiting state is in-memory and does not survive app pool recycles
    // or deployments. Acceptable for v1 on a 30-user intranet. Migrate to SQL-backed
    // storage if deploy frequency increases or external access is ever enabled.
    var ctx = HttpContext.Current;
    if (ctx == null) return "unknown";
    return ctx.Request.UserHostAddress ?? "unknown";
}
```

**Verification:** `grep -rn "X-Forwarded-For" --include="*.cs"` → one hit, comment only. No live code branch.

---

### SQL Alternative Debate

**Reviewer proposed:** SQL-backed `login_attempts` table with `COUNT(*)` check per username per window.

**Builder's objections evaluated:**

| Objection | Verdict |
|-----------|---------|
| SQL round-trip adds latency | Rejected — 1ms vs BCrypt's 100ms is noise |
| Table grows without cleanup job | Valid but trivial fix (DELETE WHERE attempted_at < 30 days) |
| COUNT(*) race condition | **Accepted as real** — two concurrent threads both read count=9, both proceed past check |

**Race condition fix cost:** Serializable isolation on a hot table under SQL Server escalates to table-level lock — worse than the race itself. `lock (_lock)` gives true atomic read-modify-write at zero contention cost. In-memory wins this dimension cleanly.

**Conclusion:** SQL alternative is better engineering for multi-server or high-volume deployments. In-memory with `lock` is proportionate and superior on the race condition dimension for this deployment.

---

## IIS Express Dev Behavior — Documented

In IIS Express, all requests from the same machine use loopback → `UserHostAddress` returns `127.0.0.1` for all local test requests. Rate limiting during dev is a shared counter for all localhost requests — running 10 failed test logins locks out the entire dev machine.

This is expected behavior, not a bug. Documented in code comment.

---

## What Shipped

- `GetClientIp()` rewritten — X-Forwarded-For removed entirely
- Three comments added explaining: (1) why header is ignored, (2) IIS Express 127.0.0.1 behavior, (3) in-memory v1 limitation and migration trigger conditions

---

*Generated 2026-05-26. Builder: Claude Sonnet 4.6. Reviewer: Ran.*
