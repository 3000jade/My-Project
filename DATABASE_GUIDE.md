# How to Handle Database Changes in Supabase & Node.js

This guide explains the workflow for modifying your database safely and correctly.

---

## 🚨 The Golden Rule
**The Database is the Source of Truth.** 
If you modify your TypeScript code to send a new field, but the PostgreSQL database doesn't have a column for it, **the app will crash** (Error 500: Column does not exist). 

**Always follow this order:**
1. Update the actual Database (PostgreSQL)
2. Update the Backend Schema (TypeScript/Zod)
3. Update the Backend Controller (Node.js API)
4. Update the Frontend UI (React)

---

## 🛠️ 3 Ways to Modify the Database

Depending on your workflow, you can change your database model in three different ways:

### 1. The Migration Way (Best Practice / Professional)
Use this when working in production or on a team, so changes are tracked in Git.
1. Create a migration file: `npx supabase migration new add_feature`
2. Open the newly created `.sql` file in `supabase/migrations/` and write your SQL:
   ```sql
   ALTER TABLE public.properties ADD COLUMN virtual_tour_url TEXT;
   ```
3. Push to the database: `npx supabase db push`
4. *Remember to manually update your `backend/src/models/supabase_schema.sql` so your documentation stays accurate.*

### 2. The Visual Way (Supabase Studio UI)
Use this if you prefer clicking buttons instead of writing SQL.
1. Ensure your local Supabase is running (`npx supabase start`).
2. Open `http://localhost:54323` in your browser.
3. Go to the **Table Editor**, click your table, and click **Add Column**.
4. Sync the UI changes back to your code so they aren't lost:
   ```bash
   npx supabase db diff -f my_ui_changes
   ```
   *(This automatically writes the migration file for you!)*

### 3. The "Nuke and Pave" Way (Early Development Only)
Use this **only** in early stages when you don't care about losing dummy data.
1. Open your master file: `backend/src/models/supabase_schema.sql`.
2. Directly type your new column into the `CREATE TABLE` block.
3. Run the reset command:
   ```bash
   npx supabase db reset
   ```
   *(Warning: This drops all tables, rebuilds them from your schema file, and re-runs your seed data. All user-created data will be destroyed).*

---

## 🌉 The Full Implementation Pipeline

If you want to add a field called "Balcony Size", here is exactly what you must touch:

1. **Storage (Postgres):** Use one of the 3 methods above to add `balcony_size NUMERIC` to the database.
2. **Validation (TypeScript Schema):** Open `backend/src/schemas/property.schema.ts` and add `balconySize: z.number().optional()` to your Zod schema.
3. **Routing (Backend Controller):** Open `backend/src/controllers/property.controller.ts`, make sure `balconySize` is destructured from `req.body`, and mapped to the SQL `balcony_size` column in your INSERT/UPDATE queries.
4. **Interface (React UI):** Open `AgentPropertyCreate.jsx` and add an `<input type="number" />` that updates `formData.balconySize`.
