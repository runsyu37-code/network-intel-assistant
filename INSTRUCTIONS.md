# Task: Generate Models and Controllers for BNO_Survei_MonitorAPI

## Your Role
You are helping build a **ASP.NET Core Web API** project.  
Your job is **only**:
1. Read `SSM_schema_v2.sql` → Create **Models**
2. Read existing **Controller files** in `BNO_Survei_MonitorAPI/Controllers/` → Create **new Controllers** following the exact same pattern/style

> ⚠️ Do NOT add extra files, services, middleware, or anything not asked. Only Models and Controllers.

---

## Step 1 — Read the SQL file

- Open `SSM_schema_v2.sql` in the root folder
- For **each table** found in the SQL file, create one Model class file inside:
  ```
  BNO_Survei_MonitorAPI/Models/
  ```
- Rules for Models:
  - Class name = Table name in PascalCase
  - Properties = Columns, with matching C# data types
  - Match nullable/non-nullable from the SQL definition
  - Add `[Key]` attribute on primary key column
  - Add `[ForeignKey]` attribute if foreign key exists
  - Use `using System.ComponentModel.DataAnnotations;`

---

## Step 2 — Read existing Controllers

- Open every existing `.cs` file inside `BNO_Survei_MonitorAPI/Controllers/`
- Study the **exact pattern**: constructor style, response format, method signatures, naming convention, HTTP attributes used
- For **each Model** you created in Step 1, create one matching Controller inside:
  ```
  BNO_Survei_MonitorAPI/Controllers/
  ```
- Rules for Controllers:
  - Follow the **exact same pattern** as existing controllers — do not invent a new style
  - Include only the same CRUD methods that exist in the existing controllers
  - Do NOT add extra methods, services, or logic that are not in the existing controllers

---

## Summary

| What to read | What to create |
|---|---|
| `SSM_schema_v2.sql` | One Model per table → `Models/` folder |
| Existing Controllers | One Controller per Model → `Controllers/` folder |

> Only Models and Controllers. Nothing else.
