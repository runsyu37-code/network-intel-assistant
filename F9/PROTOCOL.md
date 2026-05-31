# F9 — Communication Protocol (Frontend ↔ Backend)

> **What this folder is:** The single place both teams use to send requests, replies,
> and API contracts. If you need something from the other team — write it here.
> If you don't write it here, it doesn't exist.

---

## Folder structure

```
F9/
├── PROTOCOL.md              ← this file (rules)
├── contracts/               ← one file per API endpoint, agreed before coding
│   └── (e.g. GET_api-cameras.md, POST_api-cameras.md)
├── F9_FRONTEND_REPLY_R*.md  ← requests FROM frontend TO backend
└── F9_BACKEND_REPLY_R*.md   ← replies / requests FROM backend TO frontend
```

---

## How to write a request

1. Create a new file: `F9_FRONTEND_REPLY_R<N>.md` or `F9_BACKEND_REPLY_R<N>.md`
   where `<N>` is the next round number.
2. Use this header:

```
# F9 Round <N> — <one-line subject>
Date: YYYY-MM-DD
From: Frontend Team / Backend Team
To:   Backend Team / Frontend Team
Status: OPEN
```

3. State clearly:
   - What you need
   - Why you need it
   - What you'll do once you have it
   - What's blocked until you get it

4. Commit the file and tell the other person it's there.

---

## How to reply

1. Open the request file and change `Status: OPEN` → `Status: DONE` (or `BLOCKED`).
2. Write your reply below the original request in the same file,
   OR create a new `F9_BACKEND_REPLY_R<N>.md` for a longer response.
3. Commit and tell the other person.

---

## SLA — 2-day rule

| Situation | What to do |
|---|---|
| Request sent, no reply after **2 working days** | Change `Status: OPEN` → `Status: BLOCKED`, update `DEV.md` Blocked section, follow up directly |
| You receive a request | Acknowledge within 1 day even if you can't deliver yet — write "noted, ETA X" |

**Why:** R17 and R18 sat unanswered for days and silently blocked the floor plan and building map. The 2-day rule makes a blockage visible before it wastes a week.

---

## API Contracts — required before coding

Before either team writes code for a new endpoint:

1. Copy `F9/API_CONTRACT_TEMPLATE.md` → save as `F9/contracts/<METHOD>_<endpoint>.md`
   (e.g. `GET_api-cameras.md`, `POST_api-sites.md`)
2. Fill in every field — especially **response shape with nullability**.
3. Both teams write their names under Sign-off.
4. Only then does either team write code.

**Why:** Every "field missing from response" bug (P5 position_x/y, R17 lat/lng, R18)
happened because there was no agreed contract. The contract makes a dropped field a
planning failure, not a surprise.

---

## Status tags

| Tag | Meaning |
|---|---|
| `OPEN` | Waiting for a response |
| `IN PROGRESS` | Being worked on |
| `DONE` | Delivered and confirmed |
| `BLOCKED` | No response after 2 days — escalate |
| `DEFERRED` | Agreed to defer to a later phase |
