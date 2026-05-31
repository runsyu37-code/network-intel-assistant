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

## When to mark BLOCKED

While waiting for the other team, ask: **"Is there anything I can do right now that moves the main work forward?"**

1. If yes → do that work first, then check back.
2. If no — there is nothing left that moves the main work forward → mark `BLOCKED` immediately. Do not fill the time with unrelated tasks. Notify the other team directly and wait for a response before continuing.

**Why:** R17 and R18 sat unanswered for days while work quietly stalled. Marking BLOCKED early makes the blockage visible and prompts the other team to act — instead of both sides assuming the other is handling it.

| Situation | What to do |
|---|---|
| You send a request | Check back after finishing any work that still moves the main track forward |
| Nothing moves the main track forward | Mark `Status: BLOCKED` immediately, update `DEV.md`, notify the other team directly |
| You receive a request | Acknowledge the same day even if you can't deliver yet — write "noted, ETA X" |

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
| `BLOCKED` | Nothing left to do that moves the main work forward — escalate now |
| `DEFERRED` | Agreed to defer to a later phase |
