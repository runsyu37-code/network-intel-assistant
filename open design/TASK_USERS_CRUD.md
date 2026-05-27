# Task: Users Page — Full CRUD

## Mockup target
`output/screens_users-crud.html`

## Route
`/dashboard/users` (admin only)

## React files
- Update `src/pages/UsersPage.tsx`

## Current state
- Add User modal already exists
- Edit + Delete are NOT implemented yet

## What to add

### Edit User modal (480px)
Fields:
- Display Name (text input)
- Email (text input)
- Role (select: Admin / User / Viewer)
- Status (select: Active / Inactive)

Note: username and password NOT editable here (separate flow)

### Delete / Deactivate
- ไม่ลบจริง — เปลี่ยน status เป็น Inactive แทน (soft delete)
- Confirm modal: warning icon + "ระงับบัญชี [username]?" + ยืนยัน / ยกเลิก
- Delete ลบถาวร: confirm modal สีแดง "ลบบัญชี [username] ออกจากระบบ?"

### Table changes
- Action column: 3 buttons — Edit (pencil) | Deactivate (pause) | Delete (trash, red)
- Inactive users: row slightly dimmed (opacity 0.6)
- Role badge colors:
  - Admin: alert-soft / alert color
  - User: accent-soft / accent color
  - Viewer: surface-2 / ink-3 color

## Mock data (same as before, 5 users)
- admin_test (Admin, Active)
- ran_user (User, Active)
- viewer01 (Viewer, Active)
- old_staff (User, Inactive) — dimmed row
- temp_access (Viewer, Active)

## Constraints
- No sidebar/topbar
- Dark mode primary
- CSS tokens only
- Show Edit modal open for ran_user as the default visible state
- No emoji
