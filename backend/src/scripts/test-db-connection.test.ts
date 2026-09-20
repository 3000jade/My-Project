import { describe, it, expect } from 'vitest';
import { checkDatabaseHealth } from './test-db-connection';

describe('Database Connection Diagnostics', () => {
  it('returns a structured report with all 4 domain tables', async () => {
    const report = await checkDatabaseHealth();

    expect(report).toBeDefined();
    expect(report.tables).toHaveProperty('properties');
    expect(report.tables).toHaveProperty('profiles');
    expect(report.tables).toHaveProperty('inquiries');
    expect(report.tables).toHaveProperty('appointments');
    expect(['CONNECTED', 'FALLBACK_DEV', 'ERROR']).toContain(report.status);
    expect(typeof report.message).toBe('string');
  }, 15000);
});
