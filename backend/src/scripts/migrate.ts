import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function runMigrations() {
  const connectionString = process.env.SUPABASE_DB_URL || 'postgresql://postgres:postgres@localhost:54322/postgres';
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected to Supabase DB.');

    const files = [
      'supabase_schema.sql',
      'agent_invitations_migration.sql',
      'property_edit_approval_migration.sql',
      'invitation_atomic_claim_migration.sql',
      'agent_audit_events_migration.sql',
      'agent_credential_documents_migration.sql',
      'inquiries_module_migration.sql',
      'agent_management_v2_migration.sql',
    ];

    for (const file of files) {
      const filePath = path.join(__dirname, '../models', file);
      console.log(`Executing ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      await client.query(sql);
      console.log(`✅ Successfully executed ${file}`);
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

runMigrations();
