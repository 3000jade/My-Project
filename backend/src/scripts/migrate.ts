import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function runMigrations() {
  // Use a default or the env var
  const connectionString = process.env.SUPABASE_DB_URL || 'postgresql://postgres:postgres@localhost:54322/postgres';
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected to Supabase DB.');

    const files = [
      'supabase_schema.sql',
      'reso_schema_migration.sql'
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
  } finally {
    await client.end();
  }
}

runMigrations();
