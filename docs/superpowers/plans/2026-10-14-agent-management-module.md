# Agent Management Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a secure, invitation-based Agent Management Module allowing administrators to invite licensed real estate agents, validate single-use tokens, onboard consultants with PRC & DHSUD credentials and Google Drive document attachments, and enable manual broker verification.

**Architecture:** Express backend with PostgreSQL/Supabase schema (`agent_invitations` table + `profiles` verification fields), transactional invitation emails via `GmailService`, document storage via `GoogleDriveService`, and dedicated React frontend views (`/register/agent` registration page and Broker management consoles).

**Tech Stack:** Node.js, Express, TypeScript, PostgreSQL (Supabase), Zod, Vitest, React, Tailwind CSS v4, Lucide/Tabler Icons.

**Spec:** [docs/superpowers/specs/2026-10-14-agent-management-module-design.md](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/superpowers/specs/2026-10-14-agent-management-module-design.md)

## Global Constraints
- Do not delete existing user data or break existing accounts (`admin@pt.com`, `broker@pt.com`, `agent@pt.com`, `mshisuke@gmail.com`).
- Public self-registration must NEVER assign the `agent` role.
- Invitation tokens must be single-use, 256-bit cryptographic hex strings with a 72-hour expiration window.
- All public UI follows the Nordic Modern Architectural & Bauhaus Precision system (Daylight Light Theme: `#FBFBF9`, `#FFFFFF`, `#183D3B`, `#C4683C`).
- Maintain 100% test pass rate across backend and frontend suites.

---

### Task 1: Database Migration & Schema Extension

**Files:**
- Modify: `backend/src/models/supabase_schema.sql:22-55`
- Create: `backend/src/scripts/migrate-agent-invitations.ts`
- Test: `test files/backend/models/agent-invitations.schema.test.ts`

**Interfaces:**
- Produces: `public.agent_invitations` table and extended columns on `public.profiles` (`prc_license_no`, `prc_validity`, `dhsud_accreditation_no`, `dhsud_validity`, `verification_status`, `supporting_documents`, `rejection_remarks`).

- [ ] **Step 1: Write the failing test for schema and migration verification**

```typescript
import { describe, it, expect } from 'vitest';
import { supabaseAdmin, isSupabaseConfigured } from '../../../backend/src/config/supabase';

describe('Agent Invitations & Profiles Schema Verification', () => {
  it('has agent_invitations table accessible via admin client', async () => {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabaseAdmin
      .from('agent_invitations')
      .select('id')
      .limit(1);
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it('has verification_status and licensing fields on profiles table', async () => {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, verification_status, prc_license_no, dhsud_accreditation_no')
      .limit(1);
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run "test files/backend/models/agent-invitations.schema.test.ts"`  
Expected: FAIL with missing table or columns.

- [ ] **Step 3: Update schema DDL and execute migration**

Update `backend/src/models/supabase_schema.sql` to include `agent_invitations` and profile credential columns. Create migration runner `backend/src/scripts/migrate-agent-invitations.ts` using `supabaseAdmin` or SQL execution.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run "test files/backend/models/agent-invitations.schema.test.ts"`  
Expected: PASS

---

### Task 2: Invitation Service & Email Dispatch

**Files:**
- Create: `backend/src/services/invitation.service.ts`
- Create: `backend/src/controllers/invitation.controller.ts`
- Create: `backend/src/routes/invitation.routes.ts`
- Modify: `backend/src/routes/index.ts`
- Modify: `backend/src/templates/emailTemplates.ts`
- Modify: `backend/src/services/gmail.service.ts`
- Test: `test files/backend/services/invitation.service.test.ts`

**Interfaces:**
- Produces:
  - `InvitationService.createInvitation(email: string, invitedBy?: string)`
  - `InvitationService.listInvitations()`
  - `InvitationService.validateToken(token: string)`
  - `InvitationService.resendInvitation(id: string)`
  - `InvitationService.revokeInvitation(id: string)`
  - `GmailService.sendAgentInvitationEmail({ to: string, inviteUrl: string })`

- [ ] **Step 1: Write failing tests for InvitationService**

```typescript
import { describe, it, expect } from 'vitest';
import { InvitationService } from '../../../backend/src/services/invitation.service';

describe('InvitationService', () => {
  it('creates an invitation with cryptographic token and 72-hour expiry', async () => {
    const inv = await InvitationService.createInvitation('newagent@luxuryrealty.test', 'admin-id');
    expect(inv.token).toBeDefined();
    expect(inv.token.length).toBeGreaterThanOrEqual(32);
    expect(inv.status).toBe('pending');
    expect(new Date(inv.expires_at).getTime()).toBeGreaterThan(Date.now());
  });

  it('validates active token successfully', async () => {
    const inv = await InvitationService.createInvitation('validagent@luxuryrealty.test');
    const result = await InvitationService.validateToken(inv.token);
    expect(result.valid).toBe(true);
    expect(result.email).toBe('validagent@luxuryrealty.test');
  });

  it('rejects revoked or invalid tokens', async () => {
    const inv = await InvitationService.createInvitation('revokedagent@luxuryrealty.test');
    await InvitationService.revokeInvitation(inv.id);
    const result = await InvitationService.validateToken(inv.token);
    expect(result.valid).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run "test files/backend/services/invitation.service.test.ts"`  
Expected: FAIL ("InvitationService is not defined")

- [ ] **Step 3: Implement InvitationService, Email Template, Controller, and Routes**

Implement `invitation.service.ts` with local state + Supabase storage fallback, `invitation.controller.ts`, and wire `/api/invitations` in `backend/src/routes/index.ts`. Add `sendAgentInvitationEmail` in `gmail.service.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run "test files/backend/services/invitation.service.test.ts"`  
Expected: PASS

---

### Task 3: Agent Registration Service with Document Attachment

**Files:**
- Create: `backend/src/services/agentRegistration.service.ts`
- Modify: `backend/src/controllers/auth.controller.ts`
- Modify: `backend/src/routes/auth.routes.ts`
- Modify: `backend/src/schemas/auth.schema.ts`
- Test: `test files/backend/services/agentRegistration.service.test.ts`

**Interfaces:**
- Produces:
  - `AgentRegistrationService.registerInvitedAgent(payload)`
  - `POST /api/auth/register-agent` endpoint

- [ ] **Step 1: Write failing test for Agent Registration**

```typescript
import { describe, it, expect } from 'vitest';
import { InvitationService } from '../../../backend/src/services/invitation.service';
import { AgentRegistrationService } from '../../../backend/src/services/agentRegistration.service';

describe('AgentRegistrationService', () => {
  it('registers invited agent, marks token used, and sets PENDING status', async () => {
    const inv = await InvitationService.createInvitation('licensed.agent@luxuryrealty.test');
    const result = await AgentRegistrationService.registerInvitedAgent({
      token: inv.token,
      password: 'StrongPass123!@#',
      fullName: 'Julian Vance',
      phone: '+63 917 555 4321',
      prcLicenseNo: 'PRC-REB-0089123',
      prcValidity: '2028-12-31',
      dhsudAccreditationNo: 'DHSUD-NCR-AA-2024-9988',
      dhsudValidity: '2027-12-31',
      documents: [{ name: 'prc_card.pdf', fileId: 'mock-file-123', webViewLink: 'https://drive.google.com/test' }],
    });

    expect(result.success).toBe(true);
    expect(result.user.role).toBe('agent');
    expect(result.profile.verification_status).toBe('PENDING');

    // Token cannot be reused
    const tokenCheck = await InvitationService.validateToken(inv.token);
    expect(tokenCheck.valid).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run "test files/backend/services/agentRegistration.service.test.ts"`  
Expected: FAIL

- [ ] **Step 3: Implement AgentRegistrationService and Controller Endpoint**

Create `agentRegistration.service.ts`, integrate with `GoogleDriveService` for document storage, add `registerAgentSchema` in `auth.schema.ts`, and mount `POST /api/auth/register-agent` in `auth.routes.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run "test files/backend/services/agentRegistration.service.test.ts"`  
Expected: PASS

---

### Task 4: Credential Review Dossier & RBAC Gate Enforcement

**Files:**
- Modify: `backend/src/services/agent.service.ts`
- Modify: `backend/src/controllers/agent.controller.ts`
- Modify: `backend/src/controllers/property.controller.ts`
- Test: `test files/backend/services/agent-verification-rbac.test.ts`

**Interfaces:**
- Produces:
  - `AgentService.updateAgentStatus(id, status, rejectionRemarks)`
  - Unverified agent listing gate on `POST /api/properties`

- [ ] **Step 1: Write failing test for verification status update and RBAC gate**

```typescript
import { describe, it, expect } from 'vitest';
import { AgentService } from '../../../backend/src/services/agent.service';

describe('Agent Verification Status & Remarks', () => {
  it('updates agent verification status with rejection remarks', async () => {
    const agent = await AgentService.updateAgentStatus('agent-3', 'REJECTED', 'PRC License card expired');
    expect(agent).toBeDefined();
    expect(agent?.verification_status).toBe('REJECTED');
    expect(agent?.rejection_remarks).toBe('PRC License card expired');
  });

  it('approves agent and clears rejection remarks', async () => {
    const agent = await AgentService.updateAgentStatus('agent-3', 'VERIFIED');
    expect(agent?.verification_status).toBe('VERIFIED');
    expect(agent?.rejection_remarks).toBeFalsy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run "test files/backend/services/agent-verification-rbac.test.ts"`  
Expected: FAIL

- [ ] **Step 3: Implement rejection remarks handling & listing creation verification check**

Update `AgentService` and `AgentController` to support `rejection_remarks`. Add verification status check in `PropertyController.createProperty` so only `VERIFIED` agents can list properties.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run "test files/backend/services/agent-verification-rbac.test.ts"`  
Expected: PASS

---

### Task 5: Frontend Dedicated Agent Registration Page (`/register/agent`)

**Files:**
- Create: `frontend/src/pages/auth/AgentRegisterPage.jsx`
- Modify: `frontend/src/App.jsx`
- Create: `frontend/src/services/invitationService.js`
- Test: `test files/frontend/pages/auth/AgentRegisterPage.test.jsx`

**Interfaces:**
- Produces:
  - Route `/register/agent` in React Router
  - Token validator on mount
  - Stepped credential entry (PRC, DHSUD, document upload)
  - Pending review confirmation card

- [ ] **Step 1: Write failing frontend unit tests for AgentRegisterPage**

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AgentRegisterPage from '../../../../frontend/src/pages/auth/AgentRegisterPage';

describe('AgentRegisterPage', () => {
  it('renders invalid invitation alert if token is missing or expired', async () => {
    render(
      <MemoryRouter initialEntries={['/register/agent?token=invalid-token']}>
        <AgentRegisterPage />
      </MemoryRouter>
    );
    expect(await screen.findByText(/Invalid or Expired Invitation/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run "test files/frontend/pages/auth/AgentRegisterPage.test.jsx"`  
Expected: FAIL

- [ ] **Step 3: Implement AgentRegisterPage component and route in App.jsx**

Create `AgentRegisterPage.jsx` following Daylight Light Theme, with token validation, pre-filled locked email, PRC/DHSUD accreditation inputs, drag-and-drop document upload, and pending review state.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run "test files/frontend/pages/auth/AgentRegisterPage.test.jsx"`  
Expected: PASS

---

### Task 6: Frontend Broker Portal — Invite Modal, Pending Invitations Tab & Credential Dossier

**Files:**
- Modify: `frontend/src/pages/portals/broker/BrokerAgents.jsx`
- Modify: `frontend/src/pages/portals/broker/BrokerAgentDetail.jsx`
- Modify: `frontend/src/services/agentService.js`
- Test: `test files/frontend/portals/broker/BrokerAgentsInvitations.test.jsx`

**Interfaces:**
- Produces:
  - "Invite Agent" modal with email input
  - "Pending Invitations" tab with resend/revoke controls
  - Document attachments viewer in `BrokerAgentDetail.jsx`
  - Rejection remarks modal in `BrokerAgentDetail.jsx`

- [ ] **Step 1: Write failing test for BrokerAgents invite modal and invitations tab**

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BrokerAgents from '../../../../frontend/src/pages/portals/broker/BrokerAgents';

describe('BrokerAgents Invitation Controls', () => {
  it('renders Invite Agent button and opens invitation modal', async () => {
    render(
      <MemoryRouter>
        <BrokerAgents />
      </MemoryRouter>
    );
    const inviteBtn = screen.getByRole('button', { name: /Invite Agent/i });
    expect(inviteBtn).toBeInTheDocument();
    fireEvent.click(inviteBtn);
    expect(screen.getByText(/Invite Real Estate Consultant/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run "test files/frontend/portals/broker/BrokerAgentsInvitations.test.jsx"`  
Expected: FAIL

- [ ] **Step 3: Implement Invite Modal, Invitations Tab, and Review Controls**

Enhance `BrokerAgents.jsx` with the Invite modal and Invitations tab. Enhance `BrokerAgentDetail.jsx` with document link viewing and a Reject with Remarks modal dialog.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run "test files/frontend/portals/broker/BrokerAgentsInvitations.test.jsx"`  
Expected: PASS

---

### Task 7: End-to-End System Verification & Audit

**Files:**
- Test: `backend/src/scripts/test-agent-invitation-flow.ts`
- Documentation: Update `docs/implementation/Agent_validation.md`

- [ ] **Step 1: Execute complete end-to-end test script**
Run all tests verifying admin invitation dispatch, token single-use enforcement, registration, document saving, approval/rejection with remarks, and RBAC restriction.

- [ ] **Step 2: Run full backend and frontend test suites**
Run: `npm test` in `backend` and `npx vitest run` in `frontend` to confirm 100% green tests with zero regressions.

- [ ] **Step 3: Document completed features and checklist items**
Generate final audit report answering all checklist items in [Agent_validation.md](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/implementation/Agent_validation.md).
