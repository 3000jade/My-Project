# Agent Management Module Design Specification

**Feature:** Invitation-Based Agent Management, Registration, and Credential Verification  
**Target File:** `docs/implementation/Agent_validation.md`  
**Date:** 2026-10-14  
**Author:** Google DeepMind Advanced Agentic Coding Pair  
**Status:** Approved for Implementation Planning  

---

## 1. Executive Summary & Purpose

The **Agent Management Module** establishes a closed, administrator-controlled onboarding and governance pipeline for luxury real estate consultants. In compliance with Philippine real estate regulation and platform governance, public registration is strictly barred from self-assigning the `agent` role. 

Licensed consultants may only join via a cryptographic single-use email invitation dispatched by an administrator or managing broker. Onboarding requires full disclosure of PRC (Professional Regulation Commission) licenses, DHSUD (Department of Human Settlements and Urban Development) accreditations, and verifiable document attachments stored via Google Drive. Managing brokers retain manual review, approval, rejection with remarks, and deactivation capabilities. Unverified or suspended agents are mathematically barred by backend RBAC from managing listings or receiving client inquiries.

---

## 2. Architecture & Data Flow

```
┌─────────────────┐       POST /api/invitations       ┌────────────────────────┐
│ Broker / Admin  │ ────────────────────────────────> │   InvitationService    │
│ Portal Console  │                                   └───────────┬────────────┘
└─────────────────┘                                               │ Creates token
                                                                  ▼
                                                      ┌────────────────────────┐
                                                      │ public.agent_invitations│
                                                      └───────────┬────────────┘
                                                                  │ Dispatches link
                                                                  ▼
┌─────────────────┐    GET /register/agent?token=...  ┌────────────────────────┐
│ Licensed Agent  │ <──────────────────────────────── │      GmailService      │
│ Invitation Link │                                   └────────────────────────┘
└────────┬────────┘
         │
         │ POST /api/auth/register-agent (PRC, DHSUD, Documents, Credentials)
         ▼
┌────────────────────────┐      Uploads Files      ┌────────────────────────┐
│ AgentRegistrationSvc   │ ──────────────────────> │   GoogleDriveService   │
└────────┬───────────────┘                         └────────────────────────┘
         │
         │ Provisions auth.users & updates public.profiles (status: PENDING)
         ▼
┌────────────────────────┐
│ public.profiles        │ ◄─── Locked from listing creation until approved
└────────┬───────────────┘
         │
         │ PUT /api/agents/:id/status (Approve / Reject Remarks)
         ▼
┌────────────────────────┐
│ Broker Decision & RBAC │ ───> VERIFIED: Full access unlocked
└────────────────────────┘ ───> REJECTED / SUSPENDED: Restricted access
```

---

## 3. Database Schema & Migration Specification

### 3.1 New Table: `public.agent_invitations`

```sql
CREATE TABLE IF NOT EXISTS public.agent_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token VARCHAR(64) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'used', 'revoked', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '72 hours'),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_agent_invitations_token ON public.agent_invitations(token);
CREATE INDEX IF NOT EXISTS idx_agent_invitations_email ON public.agent_invitations(email);

ALTER TABLE public.agent_invitations ENABLE ROW LEVEL SECURITY;

-- Admins and Brokers can view and manage all invitations
CREATE POLICY "Admins and brokers can manage invitations"
  ON public.agent_invitations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'broker')
    )
  );

-- Unauthenticated users can read unexpired, pending invitations by token for validation
CREATE POLICY "Public token validation for active invitations"
  ON public.agent_invitations FOR SELECT
  TO anon
  USING (status = 'pending' AND expires_at > now());
```

### 3.2 Non-Destructive Extension to `public.profiles`

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS prc_license_no TEXT,
  ADD COLUMN IF NOT EXISTS prc_validity DATE,
  ADD COLUMN IF NOT EXISTS dhsud_accreditation_no TEXT,
  ADD COLUMN IF NOT EXISTS dhsud_validity DATE,
  ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) NOT NULL DEFAULT 'VERIFIED'
    CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED')),
  ADD COLUMN IF NOT EXISTS supporting_documents JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS rejection_remarks TEXT;

-- Existing seeded agents remain VERIFIED by default to preserve functioning mocks/tests
UPDATE public.profiles
SET verification_status = 'VERIFIED'
WHERE role = 'agent' AND verification_status IS NULL;
```

---

## 4. Backend Service Contracts & Endpoints

### 4.1 Invitation Endpoints (`/api/invitations`)

1. **`POST /api/invitations`**
   - **Access:** Protected (`requireAuth`, roles: `['broker', 'admin']`).
   - **Body:** `{ email: string }`.
   - **Rules:**
     - Validate email format via Zod.
     - Reject if email already belongs to an existing user with role `agent`.
     - Reject if an active, unexpired invitation already exists for this email.
   - **Action:** Generates cryptographic token, inserts record into `agent_invitations`, dispatches email via `GmailService.sendAgentInvitationEmail`.
   - **Response:** `201 Created` with invitation record.

2. **`GET /api/invitations`**
   - **Access:** Protected (`requireAuth`, roles: `['broker', 'admin']`).
   - **Response:** `200 OK` with list of invitations sorted by `created_at DESC`.

3. **`POST /api/invitations/:id/resend`**
   - **Access:** Protected (`requireAuth`, roles: `['broker', 'admin']`).
   - **Action:** Extends `expires_at` by 72 hours, resets status to `'pending'` if expired, re-sends invitation email.
   - **Response:** `200 OK`.

4. **`POST /api/invitations/:id/revoke`**
   - **Access:** Protected (`requireAuth`, roles: `['broker', 'admin']`).
   - **Action:** Sets `status = 'revoked'`.
   - **Response:** `200 OK`.

5. **`GET /api/invitations/validate/:token`**
   - **Access:** Public.
   - **Action:** Checks token validity. Returns `valid: true, email: ...` if status is `pending` and `expires_at > now()`. Otherwise returns `valid: false, reason: 'EXPIRED' | 'USED' | 'REVOKED' | 'NOT_FOUND'`.

### 4.2 Agent Registration Endpoint (`POST /api/auth/register-agent`)

- **Access:** Public.
- **Multipart Form Payload:**
  - `token` (string, required)
  - `password` (string, required, min 8 chars, uppercase, number, symbol)
  - `fullName` (string, required)
  - `phone` (string, required)
  - `prcLicenseNo` (string, required)
  - `prcValidity` (string / ISO date, required)
  - `dhsudAccreditationNo` (string, required)
  - `dhsudValidity` (string / ISO date, required)
  - `documentFiles` (1-3 file uploads: PRC ID photo, DHSUD Certificate)
- **Execution Workflow:**
  1. Validate token existence and active status.
  2. Upload document files to Google Drive using `GoogleDriveService` under an `Agent Credentials` folder (fallback to mock URLs in offline mode).
  3. Create Supabase Auth user via `supabaseAdmin.auth.admin.createUser` with role `agent`.
  4. Upsert `public.profiles` with:
     - `full_name`, `phone`, `prc_license_no`, `prc_validity`, `dhsud_accreditation_no`, `dhsud_validity`
     - `verification_status = 'PENDING'`
     - `supporting_documents = [{ name, fileId, webViewLink, mimeType }]`
  5. Mark invitation token as `'used'` in `agent_invitations`.
  6. Return `201 Created` with `{ message: 'Registration submitted. Account pending broker review.', status: 'PENDING' }`.

### 4.3 Agent Verification Status (`PUT /api/agents/:id/status`)

- **Access:** Protected (`requireAuth`, roles: `['broker', 'admin']`).
- **Body:** `{ verification_status: 'VERIFIED' | 'REJECTED' | 'SUSPENDED', rejection_remarks?: string }`.
- **Action:** Updates `verification_status` and `rejection_remarks` in `public.profiles`.
- **Response:** `200 OK` with updated agent profile.

### 4.4 RBAC Enforcement Guard

- Update property routes and middleware:
  - If `req.user.role === 'agent'`, inspect their `verification_status`.
  - If `verification_status !== 'VERIFIED'`, block `POST /api/properties` and `PUT /api/properties/:id` with:
    `403 Forbidden: Agent credentials are under review or unverified.`

---

## 5. Frontend User Experience & Layout Specification

### 5.1 Public Agent Invitation Registration Page (`/register/agent?token=...`)
- **Route:** `/register/agent` in [frontend/src/App.jsx](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/frontend/src/App.jsx).
- **Design System:** Daylight Light Theme (`#FBFBF9` ground, `#183D3B` deep spruce, `#C4683C` terracotta coral).
- **Validation State:**
  - Token verified on mount via `GET /api/invitations/validate/:token`.
  - Shows spinner while validating.
  - If invalid, shows clean warning banner: *"This invitation link is expired, revoked, or already utilized. Please contact your brokerage administrator for a new invitation."*
- **Form Controls:**
  - Email (pre-filled from invitation record, read-only).
  - Full Name & Phone Number.
  - Passphrase & Confirm Passphrase.
  - PRC Real Estate License Number & Validity Date.
  - DHSUD Accreditation Number & Expiration Date.
  - File upload drag-and-drop zone for PRC ID and DHSUD Certificate.
- **Success State:**
  - On submission, switches to a confirmation screen: *"Application Submitted. Your PRC and DHSUD credentials have been forwarded to the principal broker for verification."*

### 5.2 Broker Portal: Agent Directory & Invitations ([BrokerAgents.jsx](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/frontend/src/pages/portals/broker/BrokerAgents.jsx))
- **Header Action:** `Invite Agent` button opening `InviteAgentModal`.
- **Modal:**
  - Form field: Agent Email Address.
  - Dispatches invitation and provides instant feedback / copyable invitation link.
- **Tabbed Interface:**
  - **Tab 1: Active Directory** (Existing agent directory table with KPI metrics and status badges).
  - **Tab 2: Pending Invitations** (Table displaying: Email, Status [Pending, Expired, Revoked, Used], Expiration countdown, Actions [Resend, Revoke]).

### 5.3 Broker Portal: Credential Review Dossier ([BrokerAgentDetail.jsx](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/frontend/src/pages/portals/broker/BrokerAgentDetail.jsx))
- **Credential Inspection Card:**
  - Displays PRC License No. & Validity.
  - Displays DHSUD Accreditation No. & Validity.
  - Lists attached supporting documents with viewable links.
- **Broker Decision Actions:**
  - **Approve (Green):** Updates status to `VERIFIED`.
  - **Reject (Rose):** Opens dialog to provide `rejection_remarks` and sets status to `REJECTED`.
  - **Suspend (Gray):** Toggles `SUSPENDED` status.

---

## 6. Security & Integrity Guarantees

1. **Anti-Tampering:** Tokens are 256-bit cryptographic hex strings generated via `encode(gen_random_bytes(32), 'hex')` or Node.js `crypto.randomBytes(32)`.
2. **Single-Use Enforcement:** Tokens are atomically flipped to `status = 'used'` within the registration transaction.
3. **No Self-Assigned Agent Privilege:** Client registration on `/register` cannot select the `agent` role. Agent roles can only originate from an administrator-issued invitation.
4. **Data Isolation:** Supporting documents are stored securely in Google Drive or Supabase Storage, and never exposed directly in open directories.
5. **Preservation Guarantee:** Existing accounts (`Elena Rossi`, `Helena Vance`, `Alexander Sterling`) remain `VERIFIED` and untouched.

---

## 7. Verification Checklist

- [ ] Admin/Broker can send invitations via email.
- [ ] Invitation contains a valid tokenized link (`/register/agent?token=...`).
- [ ] Expired, revoked, or used tokens are rejected.
- [ ] Duplicate active invitations to the same email are blocked.
- [ ] Invited agent completes registration with PRC & DHSUD credentials and documents.
- [ ] Registration creates a `PENDING` user in `public.profiles`.
- [ ] Broker can inspect credentials, view documents, approve or reject with remarks.
- [ ] Unverified agents are restricted from creating properties or managing leads.
- [ ] Existing platform features, mock data, and test suites remain 100% green.
