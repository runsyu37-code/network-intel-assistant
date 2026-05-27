# Task — CRUD (Create / Edit / Delete)

## Goal
Add create, edit, and delete actions to existing list pages.

## Entity Order
1. Sites
2. Cameras
3. NVRs
4. Switches

## UI Pattern
- **Create / Edit** → Ant Design `<Modal>` + `<Form>`
- **Delete** → `Modal.confirm()` from antd
- **After save** → update in-file mock array (no real API yet)

## Files to Edit
| File | Action |
|---|---|
| `src/pages/SitesPage.tsx` | Add CRUD |
| `src/pages/CamerasPage.tsx` | Add CRUD |
| `src/pages/NVRsPage.tsx` | Add CRUD |
| `src/pages/SwitchesPage.tsx` | Add CRUD |

## Notes
- Form fields must match the existing mock data shape in each page
- Do not add new fields not already in the mock array
