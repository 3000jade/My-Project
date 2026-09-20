import config from '../config';

interface StepResult {
  step: string;
  success: boolean;
  status?: number;
  role?: string;
  details?: string;
}

async function runAuthDiagnostics() {
  const baseUrl = `http://localhost:${config.port}/api`;
  const results: StepResult[] = [];

  console.log('\n================================================================');
  console.log('   CP_kerby - End-to-End Authentication & RBAC Test Suite       ');
  console.log(`   Target Server: ${baseUrl}`);
  console.log('================================================================\n');

  // Test accounts
  const testAccounts = [
    { label: 'Agent Account (Full Email)', email: 'agent@pt.com', password: 'agentPassword123!', expectedRole: 'agent' },
    { label: 'Broker Account (Full Email)', email: 'broker@pt.com', password: 'brokerPassword123!', expectedRole: 'broker' },
    { label: 'Admin Account (Full Email)', email: 'admin@pt.com', password: 'adminPassword123!', expectedRole: 'admin' },
    { label: 'Agent Shorthand ("agent")', email: 'agent', password: 'agentPassword123!', expectedRole: 'agent' },
    { label: 'Broker Shorthand ("broker")', email: 'broker', password: 'brokerPassword123!', expectedRole: 'broker' },
  ];

  let agentToken = '';
  let brokerToken = '';

  // 1. Validate Login for all accounts
  for (const acc of testAccounts) {
    try {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: acc.email, password: acc.password }),
      });

      const body = (await res.json()) as any;
      const success = res.status === 200 && body.success && body.data?.token && body.data?.user?.role === acc.expectedRole;

      if (acc.email === 'agent@pt.com' && body.data?.token) agentToken = body.data.token;
      if (acc.email === 'broker@pt.com' && body.data?.token) brokerToken = body.data.token;

      results.push({
        step: `Login: ${acc.label}`,
        success,
        status: res.status,
        role: body.data?.user?.role,
        details: success ? `User: ${body.data.user.email} (ID: ${body.data.user.id})` : (body.error || 'Failed'),
      });
    } catch (err: any) {
      results.push({
        step: `Login: ${acc.label}`,
        success: false,
        details: `Connection error: ${err.message}`,
      });
    }
  }

  // 2. Test GET /api/auth/me
  if (agentToken) {
    try {
      const res = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${agentToken}` },
      });
      const body = (await res.json()) as any;
      const success = res.status === 200 && body.success && body.data?.user?.role === 'agent';
      results.push({
        step: 'Profile: GET /api/auth/me (Agent Bearer Token)',
        success,
        status: res.status,
        role: body.data?.user?.role,
        details: success ? 'Session verified & active' : (body.error || 'Failed'),
      });
    } catch (err: any) {
      results.push({
        step: 'Profile: GET /api/auth/me (Agent Bearer Token)',
        success: false,
        details: err.message,
      });
    }
  }

  // 3. Test RBAC Enforcement: Agent attempting DELETE /api/properties/:id (Should be 403 Forbidden)
  if (agentToken) {
    try {
      const res = await fetch(`${baseUrl}/properties/test-listing-id`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${agentToken}` },
      });
      const body = (await res.json()) as any;
      const success = res.status === 403;
      results.push({
        step: 'RBAC: Agent blocked from DELETE /properties/:id (Requires broker/admin)',
        success,
        status: res.status,
        details: success ? `Correctly rejected with 403: ${body.error}` : `Expected 403, got ${res.status}`,
      });
    } catch (err: any) {
      results.push({
        step: 'RBAC: Agent blocked from DELETE',
        success: false,
        details: err.message,
      });
    }
  }

  // 4. Test RBAC Clearance: Broker attempting DELETE /api/properties/:id (Should pass RBAC, then 404 on non-existent ID)
  if (brokerToken) {
    try {
      const res = await fetch(`${baseUrl}/properties/test-listing-id`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${brokerToken}` },
      });
      const body = (await res.json()) as any;
      // Should NOT be 401 or 403
      const success = res.status === 404;
      results.push({
        step: 'RBAC: Broker permitted to call DELETE /properties/:id',
        success,
        status: res.status,
        details: success ? 'Passed role gate (404 expected for non-existent listing)' : `Unexpected status: ${res.status}`,
      });
    } catch (err: any) {
      results.push({
        step: 'RBAC: Broker permitted to call DELETE',
        success: false,
        details: err.message,
      });
    }
  }

  // Summary Table
  console.log('RESULTS SUMMARY:');
  console.log('----------------------------------------------------------------');
  for (const r of results) {
    const icon = r.success ? '✓ PASS' : '✗ FAIL';
    console.log(`[${icon}] ${r.step}`);
    if (r.status !== undefined) console.log(`       Status: ${r.status}${r.role ? ` | Role: ${r.role}` : ''}`);
    if (r.details) console.log(`       Info  : ${r.details}`);
    console.log('');
  }
  console.log('================================================================\n');
}

runAuthDiagnostics().catch(console.error);
