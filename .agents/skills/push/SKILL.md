---
name: push
description: Slash command /push to deploy database migrations to Supabase.
---

# Supabase Migration Push

**Trigger:** When the user enters the `/push -s` command.

## Instructions
1. This is a slash command wrapper for pushing local SQL definitions to Supabase.
2. The user has opted for the Node.js migration strategy ("Option 2").
3. When invoked via `/push -s`, you MUST automatically execute the following command in the terminal to deploy the schema changes:
   ```bash
   cd backend && npm run db:push
   ```
4. Wait for the command to finish. If successful, confirm to the user that the schema migration was successfully executed on Supabase.
5. If it fails, help the user troubleshoot the error output.
