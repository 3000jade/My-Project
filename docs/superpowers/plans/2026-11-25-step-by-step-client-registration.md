# Step-by-Step Client Registration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the all-at-once client registration screen on `/register` with a calm, single-field step-by-step registration flow (`Email -> Email OTP -> Phone -> Full Name -> Profile & Password (optional photo) -> Account Created Card -> Dashboard`) backed by email-first OTP verification.

**Architecture:** The backend verifies the 6-digit email OTP first and issues a 15-minute single-use `verificationToken` so no incomplete accounts are created if a user drops off mid-flow. On the final step, the frontend submits the `verificationToken`, phone, full name, password, and optional profile photo in one `POST /api/auth/register-otp/complete` call, then renders a celebratory confirmation card until the user clicks **Go to Dashboard**.

**Tech Stack:** React 19, Tailwind CSS v4, shadcn/ui, Framer Motion, Express 5, TypeScript, Zod, Supabase Admin SDK, Vitest, Testing Library, Playwright MCP.

**Spec:** `docs/superpowers/specs/2026-11-25-step-by-step-client-registration-design.md`

## Global Constraints

- Follow `DESIGN.md` tokens strictly: `#F8FAFC` (`bg-background`), `#FFFFFF` (`bg-surface`), `1px` `#E2E8F0` (`border-outline`), `#0F766E` (`bg-primary`), `rounded-xl` cards, `rounded-lg` inputs/buttons, `h-11` (`44px`) minimum touch targets, strict 8px spacing grid (`gap-2`, `gap-4`, `p-6`).
- Reuse `shadcn/ui` components from `frontend/src/components/ui/` (`Card`, `Button`, `Input`, `InputGroup`, `Field`, `Checkbox`, `Alert`, `Progress`, `Avatar`, `Spinner`) and `lucide-react` icons.
- Wrap animated transitions in `<MotionConfig reducedMotion="user">`.
- Keep existing `/register` Login (`existing`) and Broker Invite (`invited_agent`) flows working untouched, and keep `POST /api/auth/register-otp/verify` backwards-compatible.
- Profile photo upload on Step 5 is strictly optional/skippable (initials fallback shown by default).
- Account Created card stays on screen until the user explicitly clicks **Go to Dashboard**.
- After modifying code files, run `graphify update .` to keep the knowledge graph current.

---

## File Structure Map

### Backend
- Modify: `backend/src/services/otp.service.ts` — Add 15-minute single-use verified-email ticket methods (`verifyEmailAndIssueTicket`, `consumeVerificationTicket`).
- Create: `backend/src/services/otp.service.test.ts` — Unit tests for email-first OTP verification and single-use ticket consumption/expiry.
- Modify: `backend/src/schemas/auth.schema.ts` — Make `password` and `fullName` optional on `registerInitiateSchema`; add `registerVerifyEmailSchema` and `registerCompleteSchema`.
- Modify: `backend/src/controllers/auth.controller.ts` — Update `initiateRegistrationOtp` for email-only initiation; add `verifyRegistrationEmail` and `completeRegistration`.
- Modify: `backend/src/routes/auth.routes.ts` — Mount `POST /register-otp/verify-email` and `POST /register-otp/complete`.

### Frontend
- Modify: `frontend/src/services/authService.js` — Add `verifyRegistrationEmail(email, otp)` and `completeRegistration(payload)`.
- Modify: `frontend/src/context/AuthContext.jsx` — Expose `completeRegistration(payload)` in auth context.
- Modify: `frontend/src/components/auth/smart-auth/AuthStepProgress.jsx` — Add progress labels for `otp`, `phone`, `name`, `profile`, and `success`.
- Create: `frontend/src/components/auth/smart-auth/RegisterPhoneStep.jsx` — Single-input mobile number step with live validation.
- Create: `frontend/src/components/auth/smart-auth/RegisterFullNameStep.jsx` — Single-input full name step with live validation.
- Create: `frontend/src/components/auth/smart-auth/RegisterProfileStep.jsx` — Optional/skippable profile photo picker (initials fallback) + password strength meter + 4-item checklist + Terms checkbox.
- Create: `frontend/src/components/auth/smart-auth/RegisterSuccessCard.jsx` — "Account Created!" confirmation card + summary + "Go to Dashboard" button.
- Modify: `frontend/src/components/auth/SmartAuthFlow.jsx` — Wire `email -> otp -> phone -> name -> profile -> success` while keeping `login` and `invite` intact.
- Create: `frontend/src/components/auth/SmartAuthFlow.stepByStep.test.jsx` — Unit/integration tests for all 6 steps, validation warnings, skipping photo, and Account Created card.

---

### Task 1: Backend `OtpService` Email Verification Ticket

**Files:**
- Modify: `backend/src/services/otp.service.ts:1-169`
- Create: `backend/src/services/otp.service.test.ts`

**Interfaces:**
- Consumes: Existing `OtpService.generateRegistrationOtp(email, payload?)` and `OtpService.verifyRegistrationOtp(email, enteredOtp)`
- Produces:
  - `OtpService.verifyEmailAndIssueTicket(email: string, enteredOtp: string): Promise<{ valid: boolean; reason?: string; verificationToken?: string; expiresInSeconds?: number }>`
  - `OtpService.consumeVerificationTicket(email: string, token: string): { valid: boolean; expired?: boolean; reason?: string }`
  - `OtpService.clearVerificationTicket(email: string): void`

- [ ] **Step 1: Write the failing test in `backend/src/services/otp.service.test.ts`**

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OtpService } from './otp.service';

describe('OtpService email-first verification tickets', () => {
  const email = 'newclient@example.com';

  beforeEach(() => {
    OtpService.clearChallenge(email);
    OtpService.clearVerificationTicket(email);
    vi.useRealTimers();
  });

  it('issues a single-use verification token after valid email OTP and consumes it once', async () => {
    const generated = await OtpService.generateRegistrationOtp(email, { channel: 'email', role: 'client' });
    expect(generated.devOtp).toBeDefined();

    const verified = await OtpService.verifyEmailAndIssueTicket(email, generated.devOtp!);
    expect(verified.valid).toBe(true);
    expect(verified.verificationToken).toBeTruthy();
    expect(verified.expiresInSeconds).toBe(900);

    const firstConsume = OtpService.consumeVerificationTicket(email, verified.verificationToken!);
    expect(firstConsume.valid).toBe(true);

    const replayConsume = OtpService.consumeVerificationTicket(email, verified.verificationToken!);
    expect(replayConsume.valid).toBe(false);
  });

  it('rejects a verification token used with a different email', async () => {
    const generated = await OtpService.generateRegistrationOtp(email, { channel: 'email', role: 'client' });
    const verified = await OtpService.verifyEmailAndIssueTicket(email, generated.devOtp!);

    const wrongEmail = OtpService.consumeVerificationTicket('other@example.com', verified.verificationToken!);
    expect(wrongEmail.valid).toBe(false);
  });

  it('rejects an expired verification token after 15 minutes', async () => {
    vi.useFakeTimers();
    const generated = await OtpService.generateRegistrationOtp(email, { channel: 'email', role: 'client' });
    const verified = await OtpService.verifyEmailAndIssueTicket(email, generated.devOtp!);

    vi.advanceTimersByTime(15 * 60 * 1000 + 1000);

    const expired = OtpService.consumeVerificationTicket(email, verified.verificationToken!);
    expect(expired.valid).toBe(false);
    expect(expired.expired).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix backend run test -- src/services/otp.service.test.ts`
Expected: FAIL because `verifyEmailAndIssueTicket`, `consumeVerificationTicket`, and `clearVerificationTicket` do not exist yet.

- [ ] **Step 3: Implement verification tickets in `backend/src/services/otp.service.ts`**

Add interface `VerifiedEmailTicket`, static `verifiedTickets: Map<string, VerifiedEmailTicket>`, `TICKET_TTL_MS = 15 * 60 * 1000`, and methods:

```ts
export interface VerifiedEmailTicket {
  email: string;
  token: string;
  expiresAt: number;
}
```

Inside `OtpService`:

```ts
  private static verifiedTickets: Map<string, VerifiedEmailTicket> = new Map();
  private static readonly TICKET_TTL_MS = 15 * 60 * 1000; // 15 minutes

  public static async verifyEmailAndIssueTicket(
    email: string,
    enteredOtp: string
  ): Promise<{ valid: boolean; reason?: string; verificationToken?: string; expiresInSeconds?: number }> {
    const normalizedEmail = email.trim().toLowerCase();
    const result = await this.verifyRegistrationOtp(normalizedEmail, enteredOtp);

    if (!result.valid) {
      return { valid: false, reason: result.reason };
    }

    const token = crypto.randomBytes(32).toString('hex');
    this.verifiedTickets.set(normalizedEmail, {
      email: normalizedEmail,
      token,
      expiresAt: Date.now() + this.TICKET_TTL_MS,
    });

    return {
      valid: true,
      verificationToken: token,
      expiresInSeconds: Math.floor(this.TICKET_TTL_MS / 1000),
    };
  }

  public static consumeVerificationTicket(
    email: string,
    token: string
  ): { valid: boolean; expired?: boolean; reason?: string } {
    const normalizedEmail = email.trim().toLowerCase();
    const ticket = this.verifiedTickets.get(normalizedEmail);

    if (!ticket) {
      return {
        valid: false,
        expired: true,
        reason: 'Your email verification expired. Please request a fresh 6-digit code.',
      };
    }

    if (Date.now() > ticket.expiresAt) {
      this.verifiedTickets.delete(normalizedEmail);
      return {
        valid: false,
        expired: true,
        reason: 'Your email verification expired. Please request a fresh 6-digit code.',
      };
    }

    if (ticket.token !== token) {
      return {
        valid: false,
        expired: false,
        reason: 'Invalid email verification token. Please verify your email again.',
      };
    }

    this.verifiedTickets.delete(normalizedEmail);
    return { valid: true };
  }

  public static clearVerificationTicket(email: string): void {
    this.verifiedTickets.delete(email.trim().toLowerCase());
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix backend run test -- src/services/otp.service.test.ts`
Expected: PASS (3 tests passing).

- [ ] **Step 5: Commit**

```powershell
git add backend/src/services/otp.service.ts backend/src/services/otp.service.test.ts; if ($LASTEXITCODE -eq 0) { git commit -m "feat(auth): add email verification tickets to OtpService" }
```

---

### Task 2: Backend Schemas, Controller & Routes for Email-First Step Registration

**Files:**
- Modify: `backend/src/schemas/auth.schema.ts:99-163`
- Modify: `backend/src/controllers/auth.controller.ts:221-415`
- Modify: `backend/src/routes/auth.routes.ts:1-40`
- Create: `backend/src/schemas/auth.schema.test.ts`

**Interfaces:**
- Consumes: `OtpService.verifyEmailAndIssueTicket`, `OtpService.consumeVerificationTicket`
- Produces:
  - `POST /api/auth/register-otp/initiate` accepting `{ email, channel?, role?, password?, fullName?, phone? }`
  - `POST /api/auth/register-otp/verify-email` accepting `{ email, otp }` -> `200 { email, verificationToken, expiresInSeconds }`
  - `POST /api/auth/register-otp/complete` accepting `{ email, verificationToken, phone, fullName, password, avatarDataUrl? }` -> `201 { user, token, refreshToken }`

- [ ] **Step 1: Write the failing schema test in `backend/src/schemas/auth.schema.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import {
  registerInitiateSchema,
  registerVerifyEmailSchema,
  registerCompleteSchema,
} from './auth.schema';

describe('Step-by-step client registration schemas', () => {
  it('allows email-only payload on registerInitiateSchema', () => {
    const parsed = registerInitiateSchema.safeParse({ email: 'NewClient@Example.com' });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.email).toBe('newclient@example.com');
      expect(parsed.data.channel).toBe('email');
    }
  });

  it('validates 6-digit OTP on registerVerifyEmailSchema', () => {
    expect(registerVerifyEmailSchema.safeParse({ email: 'a@b.com', otp: '123456' }).success).toBe(true);
    expect(registerVerifyEmailSchema.safeParse({ email: 'a@b.com', otp: '12345' }).success).toBe(false);
  });

  it('validates registerCompleteSchema with optional avatarDataUrl', () => {
    const withoutPhoto = registerCompleteSchema.safeParse({
      email: 'a@b.com',
      verificationToken: 'a'.repeat(32),
      phone: '+63 917 123 4567',
      fullName: 'Juan Dela Cruz',
      password: 'StrongPassword1!',
    });
    expect(withoutPhoto.success).toBe(true);

    const withShortPhone = registerCompleteSchema.safeParse({
      email: 'a@b.com',
      verificationToken: 'a'.repeat(32),
      phone: '123',
      fullName: 'Juan Dela Cruz',
      password: 'StrongPassword1!',
    });
    expect(withShortPhone.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix backend run test -- src/schemas/auth.schema.test.ts`
Expected: FAIL because `registerVerifyEmailSchema` and `registerCompleteSchema` are not exported and `registerInitiateSchema` requires `password` and `fullName`.

- [ ] **Step 3: Update `backend/src/schemas/auth.schema.ts`**

Make `password` and `fullName` optional in `registerInitiateSchema`, and append:

```ts
export const registerVerifyEmailSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required.')
    .email('Invalid email address format.')
    .trim()
    .toLowerCase(),
  otp: z
    .string()
    .length(6, 'Verification code must be exactly 6 digits.')
    .regex(/^\d{6}$/, 'Verification code must contain digits only.'),
});

export type RegisterVerifyEmailInput = z.infer<typeof registerVerifyEmailSchema>;

export const registerCompleteSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required.')
    .email('Invalid email address format.')
    .trim()
    .toLowerCase(),
  verificationToken: z.string().min(16, 'Valid email verification token is required.'),
  phone: z.string().trim().min(7, 'Please enter a valid mobile number.').max(30),
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters.')
    .max(120, 'Full name cannot exceed 120 characters.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character.'),
  avatarDataUrl: z
    .string()
    .max(7_000_000, 'Profile photo is too large.')
    .regex(/^data:image\/(jpeg|jpg|png|webp);base64,/, 'Please upload a JPG, PNG, or WebP image.')
    .optional(),
});

export type RegisterCompleteInput = z.infer<typeof registerCompleteSchema>;
```

- [ ] **Step 4: Update `backend/src/controllers/auth.controller.ts` and `backend/src/routes/auth.routes.ts`**

In `AuthController.initiateRegistrationOtp`:
- Change `if (!email || !password)` to `if (!email)` with error `'Email address is required.'`.

Add `AuthController.verifyRegistrationEmail`:
```ts
  public static async verifyRegistrationEmail(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { email, otp } = req.body;
      const result = await OtpService.verifyEmailAndIssueTicket(email, otp);

      if (!result.valid || !result.verificationToken) {
        res.status(400).json({
          success: false,
          error: result.reason || 'Invalid verification code.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          email: email.trim().toLowerCase(),
          verificationToken: result.verificationToken,
          expiresInSeconds: result.expiresInSeconds || 900,
        },
        message: 'Email verified successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Email verification failed.',
        timestamp: new Date().toISOString(),
      });
    }
  }
```

Add `AuthController.completeRegistration`:
- Consumes ticket via `OtpService.consumeVerificationTicket(email, verificationToken)` (returns `401` with `{ code: 'VERIFICATION_EXPIRED' }` if expired).
- Creates user in Supabase (same logic as `verifyRegistrationOtp`), upserts `profiles` with `full_name`, `phone`, `verification_status: 'VERIFIED'`, and optional `avatar_url: avatarDataUrl` when provided.
- Authenticates, creates session in `SessionService`, and returns `201` with `{ user, token, refreshToken }`.

Mount both routes in `backend/src/routes/auth.routes.ts`:
```ts
router.post('/register-otp/verify-email', authRateLimiter, validateBody(registerVerifyEmailSchema), AuthController.verifyRegistrationEmail);
router.post('/register-otp/complete', authRateLimiter, validateBody(registerCompleteSchema), AuthController.completeRegistration);
```

- [ ] **Step 5: Run backend tests and TypeScript build**

Run: `npm --prefix backend run test -- src/schemas/auth.schema.test.ts src/services/otp.service.test.ts; npm --prefix backend run build`
Expected: PASS and zero TypeScript errors.

- [ ] **Step 6: Commit**

```powershell
git add backend/src/schemas/auth.schema.ts backend/src/schemas/auth.schema.test.ts backend/src/controllers/auth.controller.ts backend/src/routes/auth.routes.ts; if ($LASTEXITCODE -eq 0) { git commit -m "feat(auth): add email-first verify-email and complete registration endpoints" }
```

---

### Task 3: Frontend `authService`, `AuthContext`, and `AuthStepProgress`

**Files:**
- Modify: `frontend/src/services/authService.js:99-133`
- Modify: `frontend/src/context/AuthContext.jsx:101-137`
- Modify: `frontend/src/components/auth/smart-auth/AuthStepProgress.jsx:1-23`

**Interfaces:**
- Produces:
  - `authService.verifyRegistrationEmail(email, otp)` -> `{ email, verificationToken, expiresInSeconds }`
  - `authService.completeRegistration(payload)` -> `{ user, token, refreshToken }` (stores tokens)
  - `useAuth().completeRegistration(payload)` -> updates `user` state and returns `authData`
  - `AuthStepProgress({ step })` supporting `'email' | 'otp' | 'phone' | 'name' | 'profile' | 'success' | 'login' | 'invite'`

- [ ] **Step 1: Add `verifyRegistrationEmail` and `completeRegistration` to `frontend/src/services/authService.js`**

```js
  async verifyRegistrationEmail(email, otp) {
    const response = await apiClient.post('/auth/register-otp/verify-email', { email, otp });
    return response.data;
  },

  async completeRegistration(payload) {
    const response = await apiClient.post('/auth/register-otp/complete', payload);
    if (response?.data?.token) {
      apiClient.setToken(response.data.token);
    }
    if (response?.data?.refreshToken && typeof window !== 'undefined') {
      try {
        localStorage.setItem('cp_refresh_token', response.data.refreshToken);
      } catch (err) {
        console.warn('[authService] Failed storing refresh token:', err);
      }
    }
    return response.data;
  },
```

- [ ] **Step 2: Expose `completeRegistration` in `frontend/src/context/AuthContext.jsx`**

```jsx
  const completeRegistration = async (payload) => {
    setError(null);
    const authData = await authService.completeRegistration(payload);
    setUser(authData.user);
    setIdleWarning(false);
    return authData;
  };
```

Include `completeRegistration` in the `value` object.

- [ ] **Step 3: Update `frontend/src/components/auth/smart-auth/AuthStepProgress.jsx`**

```jsx
const STEP_META = {
  email: { label: 'Step 1 of 5', caption: 'Email address', value: 20 },
  otp: { label: 'Step 2 of 5', caption: 'Verify email', value: 40 },
  phone: { label: 'Step 3 of 5', caption: 'Phone number', value: 60 },
  name: { label: 'Step 4 of 5', caption: 'Full name', value: 80 },
  profile: { label: 'Step 5 of 5', caption: 'Profile & password', value: 95 },
  success: { label: 'Complete', caption: 'Account ready', value: 100 },
  login: { label: 'Step 2 of 2', caption: 'Sign in', value: 100 },
  invite: { label: 'Step 2 of 2', caption: 'Broker invitation', value: 100 },
};
```

- [ ] **Step 4: Verify frontend builds cleanly**

Run: `npm --prefix frontend run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/services/authService.js frontend/src/context/AuthContext.jsx frontend/src/components/auth/smart-auth/AuthStepProgress.jsx; if ($LASTEXITCODE -eq 0) { git commit -m "feat(auth): add email-first registration client service and 5-step progress" }
```

---

### Task 4: Create Modular Single-Field Step Components (`Phone`, `FullName`, `Profile`, `SuccessCard`)

**Files:**
- Create: `frontend/src/components/auth/smart-auth/RegisterPhoneStep.jsx`
- Create: `frontend/src/components/auth/smart-auth/RegisterFullNameStep.jsx`
- Create: `frontend/src/components/auth/smart-auth/RegisterProfileStep.jsx`
- Create: `frontend/src/components/auth/smart-auth/RegisterSuccessCard.jsx`

**Interfaces:**
- Produces:
  - `RegisterPhoneStep({ email, phone, onChangePhone, onSubmit, onChangeEmail })`
  - `RegisterFullNameStep({ fullName, onChangeFullName, onSubmit })`
  - `RegisterProfileStep({ fullName, avatarPreview, onSelectAvatar, onRemoveAvatar, password, onChangePassword, showPassword, onToggleShowPassword, passwordStrength, capsLockOn, onCapsLockCheck, agreeTerms, onChangeAgreeTerms, isSubmitting, onSubmit })`
  - `RegisterSuccessCard({ fullName, email, phone, avatarPreview, onContinue })`

- [ ] **Step 1: Create `RegisterPhoneStep.jsx`**
  - Verified email chip with green check badge (`BadgeCheck`) + `Change` button.
  - Single `Field` (`Mobile number`, `id="reg-phone"`, `type="tel"`, `placeholder="+63 917 000 0000"`, `autoFocus`, `h-11 rounded-lg`).
  - Single primary Teal CTA `Continue` (`ArrowRight`).

- [ ] **Step 2: Create `RegisterFullNameStep.jsx`**
  - Single `Field` (`Full name`, `id="reg-fullname"`, `type="text"`, `placeholder="Juan Dela Cruz"`, `autoFocus`, `h-11 rounded-lg`).
  - Single primary Teal CTA `Continue` (`ArrowRight`).

- [ ] **Step 3: Create `RegisterProfileStep.jsx`**
  - Optional/skippable profile photo row using `Avatar`, `AvatarImage`, `AvatarFallback` (initials derived from `fullName`):
    - Label: `Profile photo` + muted badge/text `(optional — you can skip this)`
    - Hidden `<input type="file" accept="image/jpeg,image/png,image/webp" />` triggered by an outline `Upload photo` button (`h-11`), plus a ghost `Remove` button when a photo is chosen.
  - `Create a password` (`id="reg-password"`) inside `InputGroup` with Show/Hide toggle, live strength label (`data-testid="password-strength-label"`), `Progress`, and 4-rule checklist.
  - Optional Caps Lock amber alert when `capsLockOn` is true.
  - `Terms of Service and Privacy Policy` `Checkbox` (`id="agree-terms"`).
  - Single primary Teal CTA `Create Account` (spinner + `Creating account...` while `isSubmitting`).

- [ ] **Step 4: Create `RegisterSuccessCard.jsx`**
  - Celebratory header with emerald circle checkmark (`CheckCircle2` in `bg-emerald-50 text-emerald-700`), heading `Account Created!`, and short plain-English confirmation.
  - Summary card (`bg-surface-variant border border-outline rounded-lg p-4`) with `Avatar` (uploaded photo or initials), `fullName`, `email` (with verified badge), and `phone`.
  - Single primary Teal CTA `Go to Dashboard` (`ArrowRight`), calling `onContinue`.

- [ ] **Step 5: Verify build**

Run: `npm --prefix frontend run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add frontend/src/components/auth/smart-auth/RegisterPhoneStep.jsx frontend/src/components/auth/smart-auth/RegisterFullNameStep.jsx frontend/src/components/auth/smart-auth/RegisterProfileStep.jsx frontend/src/components/auth/smart-auth/RegisterSuccessCard.jsx; if ($LASTEXITCODE -eq 0) { git commit -m "feat(auth): add step-by-step phone, full name, profile, and success card components" }
```

---

### Task 5: Wire `SmartAuthFlow.jsx` & Write Full Step-by-Step Unit Tests

**Files:**
- Modify: `frontend/src/components/auth/SmartAuthFlow.jsx`
- Create: `frontend/src/components/auth/SmartAuthFlow.stepByStep.test.jsx`

**Interfaces:**
- Consumes: `RegisterPhoneStep`, `RegisterFullNameStep`, `RegisterProfileStep`, `RegisterSuccessCard`, `authService.verifyRegistrationEmail`, `useAuth().completeRegistration`
- Produces: Complete `/register` flow `email -> otp -> phone -> name -> profile -> success` (with `login` and `invite` preserved)

- [ ] **Step 1: Write the failing test in `frontend/src/components/auth/SmartAuthFlow.stepByStep.test.jsx`**

Test covers:
1. Entering a brand-new email triggers `identifyEmail` -> `initiateRegistrationOtp({ email, channel: 'email', role: 'client' })` and moves straight to Step 2 (`Check your email`).
2. Entering valid 6-digit OTP calls `verifyRegistrationEmail` and moves to Step 3 (`Add your phone number`).
3. Submitting short phone (`123`) shows warning and clears as soon as user edits phone; valid phone (`+63 917 123 4567`) moves to Step 4 (`What's your full name?`).
4. Submitting blank/short name shows warning and clears as user types; valid name (`Juan Dela Cruz`) moves to Step 5 (`Finish your profile`).
5. Skipping profile photo works cleanly; weak password shows warning and clears automatically when typing `StrongPass1!`; clicking `Create Account` calls `completeRegistration` without `avatarDataUrl` and renders `Account Created!` card with `Juan Dela Cruz`, email, phone, and `Go to Dashboard` button.
6. Dashboard navigation does NOT happen automatically — only when `Go to Dashboard` is clicked.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix frontend run test -- src/components/auth/SmartAuthFlow.stepByStep.test.jsx`
Expected: FAIL because `SmartAuthFlow.jsx` still uses the old `email -> register -> otp` order.

- [ ] **Step 3: Update `frontend/src/components/auth/SmartAuthFlow.jsx`**

- Step state values: `'email' | 'login' | 'otp' | 'phone' | 'name' | 'profile' | 'success' | 'invite'`.
- State additions: `verificationToken`, `avatarDataUrl`, `createdAccount`.
- `identifyAndRoute`: when `result?.status === 'new'`, immediately call `authService.initiateRegistrationOtp({ email: nextEmail, channel: 'email', role: 'client' })`, set `cooldown`, set `successMsg`, and `setStep('otp')`.
- `handleVerifyEmailOtp`: calls `authService.verifyRegistrationEmail(targetEmail, code)`, saves `verificationToken`, clears `successMsg` & `authError`, and `setStep('phone')`.
- `handlePhoneContinue`: trims & checks `phone.replace(/\D/g, '').length >= 7`, else sets clear warning; advances to `setStep('name')`.
- `handleNameContinue`: trims & checks `fullName.trim().length >= 2`, else sets clear warning; advances to `setStep('profile')`.
- `handleAvatarSelect`: validates `image/jpeg | image/png | image/webp` and `<= 5 MB`, reads via `FileReader.readAsDataURL`, sets `avatarDataUrl`.
- `handleCompleteRegistration`: checks `agreeTerms`, checks `passwordStrength.allMet`, calls `completeRegistration({ email, verificationToken, phone, fullName, password, ...(avatarDataUrl ? { avatarDataUrl } : {}) })`, saves `rememberedEmail`, sets `createdAccount`, and `setStep('success')`. If server returns expired verification token, re-initiates OTP and returns to `'otp'` preserving `phone`, `fullName`, and `avatarDataUrl`.
- Top-left back button navigation:
  - `'otp'` -> `resetToEmailStep()` (`Use another email`)
  - `'phone'` -> `resetToEmailStep()` (`Use another email`)
  - `'name'` -> `setStep('phone')` (`Back to phone`)
  - `'profile'` -> `setStep('name')` (`Back to full name`)
  - `'success'` -> hidden (user clicks `Go to Dashboard`)
- Clear `authError` automatically when editing `phone`, `fullName`, `password`, or `agreeTerms`.

- [ ] **Step 4: Run frontend unit tests & full test suite**

Run: `npm --prefix frontend run test -- src/components/auth/SmartAuthFlow.stepByStep.test.jsx; npm --prefix frontend run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/components/auth/SmartAuthFlow.jsx frontend/src/components/auth/SmartAuthFlow.stepByStep.test.jsx; if ($LASTEXITCODE -eq 0) { git commit -m "feat(auth): wire single-field step-by-step client registration with success card" }
```

---

### Task 6: Live Verification with Playwright MCP & Graphify Update

**Files:**
- None modified (verification & knowledge graph refresh only)

- [ ] **Step 1: Run full backend + frontend unit test suite**

Run: `npm --prefix backend run test; npm --prefix frontend run test -- src/components/auth/SmartAuthFlow.stepByStep.test.jsx`
Expected: All PASS.

- [ ] **Step 2: Run Playwright MCP step-by-step verification on `http://localhost:5173/register`**

Capture screenshots verifying:
1. Step 1: Enter brand-new email -> advances straight to Email OTP
2. Step 2: Wrong OTP warning -> Valid OTP (`devOtp`) -> advances to Phone Number
3. Step 3: Short phone warning -> Valid phone (`+63 917 123 4567`) -> advances to Full Name
4. Step 4: Blank/short name warning -> Valid name (`Juan Dela Cruz`) -> advances to Profile & Password
5. Step 5: Skip profile photo, weak password warning -> Strong password (`StrongPass1!`) auto-clears warning -> Click `Create Account`
6. Step 6: Verify **Account Created!** card displays initials `JD`, `Juan Dela Cruz`, email, phone, and stays on screen until clicking `Go to Dashboard`
7. Click `Go to Dashboard` -> lands on `/client/dashboard`

- [ ] **Step 3: Update knowledge graph**

Run: `graphify update .`
Expected: Graph updated cleanly.
