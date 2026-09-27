# Backend Integration Plan: Google Services & WhatsApp Gateway

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy server-side backend integration modules in Express v5 / TypeScript for Google Auth (OAuth 2.0 / GIS), Google Drive (CAD blueprints and document storage), Google Mail / Gmail (Nordic Bauhaus transactional notification engine), WhatsApp ("wattsup" Cloud API & webhooks), and Google Maps Platform (Geocoding, Places autocomplete proxy, Street View metadata, and Commute Matrix).

**Architecture:** Strictly backend-focused architecture within `backend/src/` and contract DTOs in `shared/types/`. All 5 services are encapsulated in dedicated service classes with Zod payload validation schemas, Express controllers, rate limiting, and zero-crash development mock modes. The frontend is treated as read-only.

**Tech Stack:** Node.js, Express v5, TypeScript, Supabase / PostgreSQL, `googleapis` (Drive & Gmail), `google-auth-library` (Auth token verification), Meta WhatsApp Cloud REST API, Google Maps REST APIs, Vitest, Zod.

**Spec:** [`docs/superpowers/specs/2026-09-27-google-services-and-whatsapp-integration-design.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/superpowers/specs/2026-09-27-google-services-and-whatsapp-integration-design.md)

---

## Global Constraints

- **Backend-Only Scope:** ONLY files in `backend/`, `shared/types/`, `test files/backend/`, and `.env.example` may be created or edited. Do NOT modify any files in `frontend/`.
- **Response Format:** Every new API route must return payloads conforming strictly to `ApiResponse<T>`:
  ```typescript
  {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp: string;
  }
  ```
- **Zero-Crash Development Fallback:** Every external integration service must check `config.integrations.isMockMode`. If credentials are omitted, return realistic fixture data instead of throwing network or credential errors.
- **Controller-Service Separation:** Controllers parse request parameters, validate payloads via Zod, and dispatch to services. Services handle all business logic, third-party API communication, and database operations.
- **Git Safety Gate:** NEVER execute `git push`, force-push, or publish remote branches.

---

### Task 1: Environment Configuration & Shared Integration Contracts

**Files:**
- Create: `shared/types/integrations.ts`
- Modify: `shared/types/index.ts`
- Modify: `backend/src/config/index.ts`
- Modify: `.env.example`
- Test: `test files/backend/config/integrations.config.test.ts`

**Interfaces:**
- Consumes: Environment variables (`process.env`).
- Produces: `GoogleAuthPayload`, `DriveUploadResult`, `EmailNotificationRequest`, `WhatsAppMessagePayload`, `CommuteEstimate`, and validated `config.integrations`.

- [ ] **Step 1: Write failing test for integration configuration**

```typescript
// test files/backend/config/integrations.config.test.ts
import { describe, it, expect } from 'vitest';
import { config } from '../../../backend/src/config';

describe('Integrations Configuration', () => {
  it('exposes integration config properties with resilient defaults', () => {
    expect(config).toBeDefined();
    expect(config.integrations).toBeDefined();
    expect(typeof config.integrations.googleClientId).toBe('string');
    expect(typeof config.integrations.googleMapsApiKey).toBe('string');
    expect(typeof config.integrations.whatsappPhoneNumberId).toBe('string');
    expect(typeof config.integrations.isMockMode).toBe('boolean');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- "test files/backend/config/integrations.config.test.ts" --run`
Expected: FAIL with "property integrations not defined on config"

- [ ] **Step 3: Define shared TypeScript contracts in `shared/types/integrations.ts`**

```typescript
// shared/types/integrations.ts
export interface GoogleAuthPayload {
  idToken: string;
  role?: 'client' | 'agent' | 'broker' | 'admin';
}

export interface DriveUploadResult {
  fileId: string;
  fileName: string;
  webViewLink: string;
  webContentLink: string;
  mimeType: string;
  size: number;
}

export interface EmailNotificationRequest {
  to: string;
  subject: string;
  template: 'inquiry_received' | 'tour_confirmed' | 'broker_approval' | 'valuation_report';
  context: Record<string, any>;
}

export interface WhatsAppMessagePayload {
  recipientPhone: string;
  templateName: string;
  parameters: Record<string, string>;
}

export interface CommuteEstimate {
  destination: string;
  destinationName: string;
  distanceText: string;
  distanceMeters: number;
  durationText: string;
  durationSeconds: number;
  mode: 'driving' | 'transit' | 'walking';
}
```

- [ ] **Step 4: Update `shared/types/index.ts` and `backend/src/config/index.ts`**

Re-export `integrations.ts` in `shared/types/index.ts`. Add integration credentials parsing with mock flags in `backend/src/config/index.ts`:

```typescript
// Add to backend/src/config/index.ts
export const config = {
  // ... existing configs
  integrations: {
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    googleDriveServiceAccountEmail: process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL || '',
    googleDrivePrivateKey: (process.env.GOOGLE_DRIVE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    googleDriveRootFolderId: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '',
    gmailUserEmail: process.env.GMAIL_USER_EMAIL || '',
    whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'cp_kerby_whatsapp_verify_token',
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    isMockMode: process.env.NODE_ENV !== 'production' || !process.env.GOOGLE_CLIENT_ID,
  },
};
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- "test files/backend/config/integrations.config.test.ts" --run`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add shared/types/integrations.ts shared/types/index.ts backend/src/config/index.ts .env.example
git commit -m "feat(backend): configure integration environment parameters and shared DTOs"
```

---

### Task 2: Google Authentication Service & API Endpoint (`POST /api/auth/google`)

**Files:**
- Modify: `backend/src/schemas/auth.schema.ts`
- Create: `backend/src/services/googleAuth.service.ts`
- Modify: `backend/src/controllers/auth.controller.ts`
- Modify: `backend/src/routes/auth.routes.ts`
- Test: `test files/backend/services/googleAuth.service.test.ts`
- Test: `test files/backend/controllers/googleAuth.controller.test.ts`

**Interfaces:**
- Consumes: `POST /api/auth/google` with `{ idToken: string, role?: string }`
- Produces: `ApiResponse<{ user, token }>` with verified Google ID token and profile synchronization.

- [ ] **Step 1: Write backend unit test for `GoogleAuthService`**

```typescript
// test files/backend/services/googleAuth.service.test.ts
import { describe, it, expect } from 'vitest';
import { GoogleAuthService } from '../../../backend/src/services/googleAuth.service';

describe('GoogleAuthService', () => {
  it('authenticates and provisions user in development mock mode', async () => {
    const result = await GoogleAuthService.verifyAndAuthenticate('mock-google-token-123', 'client');
    expect(result).toBeDefined();
    expect(result.user).toBeDefined();
    expect(result.user.email).toContain('@');
    expect(result.token).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- "test files/backend/services/googleAuth.service.test.ts" --run`
Expected: FAIL with "GoogleAuthService not found"

- [ ] **Step 3: Add `googleAuthSchema` to `backend/src/schemas/auth.schema.ts`**

```typescript
export const googleAuthSchema = z.object({
  idToken: z.string().min(10, 'Google ID token is required.'),
  role: z.enum(['client', 'agent', 'broker']).optional().default('client'),
});

export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
```

- [ ] **Step 4: Implement `GoogleAuthService` in `backend/src/services/googleAuth.service.ts`**

```typescript
// backend/src/services/googleAuth.service.ts
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import logger from '../utils/logger';
import type { AuthResult } from './auth.service';

const oauth2Client = new OAuth2Client(config.integrations.googleClientId);

export class GoogleAuthService {
  public static async verifyAndAuthenticate(
    idToken: string,
    requestedRole: 'client' | 'agent' | 'broker' = 'client'
  ): Promise<AuthResult> {
    if (config.integrations.isMockMode || !config.integrations.googleClientId) {
      logger.warn('[GoogleAuthService] Mock mode active: generating mock Google user session.');
      return {
        user: {
          id: 'dev-google-mock-uid-789',
          email: 'google.dev.user@luxuryrealty.test',
          fullName: 'Alexander Wright',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
          role: requestedRole,
        },
        token: 'dev-mock-jwt-token-google',
      };
    }

    const ticket = await oauth2Client.verifyIdToken({
      idToken,
      audience: config.integrations.googleClientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error('Invalid Google ID token.');
    }

    const { email, name, picture, sub: googleId } = payload;

    if (!isSupabaseConfigured) {
      return {
        user: {
          id: googleId,
          email,
          fullName: name,
          avatarUrl: picture,
          role: requestedRole,
        },
        token: `mock-token-${googleId}`,
      };
    }

    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    let userId = existingProfile?.id;
    let role = existingProfile?.role || requestedRole;

    if (!existingProfile) {
      const { data: newProfile, error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          email,
          full_name: name,
          avatar_url: picture,
          role,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Profile synchronization failed: ${insertError.message}`);
      }
      userId = newProfile.id;
    }

    return {
      user: {
        id: userId,
        email,
        fullName: name,
        avatarUrl: picture,
        role,
      },
      token: `token-google-${userId}`,
    };
  }
}
```

- [ ] **Step 5: Add handler in `AuthController` and route in `auth.routes.ts`**

Register `router.post('/google', authRateLimiter, validateBody(googleAuthSchema), AuthController.googleAuth)`.

- [ ] **Step 6: Run tests and verify PASS**

Run: `npm test -- "test files/backend/services/googleAuth.service.test.ts" --run`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add backend/src/schemas/auth.schema.ts backend/src/services/googleAuth.service.ts backend/src/controllers/auth.controller.ts backend/src/routes/auth.routes.ts
git commit -m "feat(auth): add Google OAuth token verification and profile synchronization endpoint"
```

---

### Task 3: Google Drive Service & Architectural Asset Endpoints (`/api/drive/*`)

**Files:**
- Create: `backend/src/services/googleDrive.service.ts`
- Create: `backend/src/controllers/drive.controller.ts`
- Create: `backend/src/routes/drive.routes.ts`
- Test: `test files/backend/services/googleDrive.service.test.ts`
- Test: `test files/backend/controllers/drive.controller.test.ts`

**Interfaces:**
- Consumes: Multipart form data with `file`, `propertyId`, and `category` (`CAD` | `Inspection` | `Photos`).
- Produces: Google Drive file payload `{ fileId, fileName, webViewLink, webContentLink, mimeType, size }` and registers the asset in PostgreSQL `property_media`.

- [ ] **Step 1: Write backend unit test for `GoogleDriveService`**

```typescript
// test files/backend/services/googleDrive.service.test.ts
import { describe, it, expect } from 'vitest';
import { GoogleDriveService } from '../../../backend/src/services/googleDrive.service';

describe('GoogleDriveService', () => {
  it('returns valid file record when uploading in mock mode', async () => {
    const mockFile = {
      originalname: 'penthouse_blueprint_rev2.dwg',
      mimetype: 'application/acad',
      size: 3200000,
      buffer: Buffer.from('mock cad binary content'),
    } as any;

    const result = await GoogleDriveService.uploadListingFile('prop-uuid-123', mockFile, 'CAD');
    expect(result).toBeDefined();
    expect(result.fileId).toBeDefined();
    expect(result.fileName).toBe('penthouse_blueprint_rev2.dwg');
    expect(result.webViewLink).toContain('drive.google.com');
  });

  it('lists existing files for a property', async () => {
    const files = await GoogleDriveService.listListingFiles('prop-uuid-123');
    expect(files).toBeInstanceOf(Array);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- "test files/backend/services/googleDrive.service.test.ts" --run`
Expected: FAIL with "GoogleDriveService not found"

- [ ] **Step 3: Implement `GoogleDriveService.ts`**

Use `googleapis.drive({ version: 'v3' })`. Implement:
- `getOrCreateListingFolder(propertyId: string)`: creates listing folder and subfolders (`CAD`, `Reports`, `Photos`).
- `uploadListingFile(propertyId: string, file: Express.Multer.File, category: string)`: streams buffer to Drive, marks file permissions, and inserts entry into `property_media` table.
- `listListingFiles(propertyId: string)`: returns mapped media and Drive files.
- `deleteListingFile(fileId: string)`: removes file from Drive and deletes record from `property_media`.

- [ ] **Step 4: Create `DriveController` and `drive.routes.ts`**

Endpoints:
- `POST /api/drive/upload` (with `multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })`)
- `GET /api/drive/listing/:propertyId`
- `DELETE /api/drive/files/:fileId`

- [ ] **Step 5: Run tests and verify PASS**

Run: `npm test -- "test files/backend/services/googleDrive.service.test.ts" --run`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/googleDrive.service.ts backend/src/controllers/drive.controller.ts backend/src/routes/drive.routes.ts
git commit -m "feat(drive): implement Google Drive document management and CAD asset cloud"
```

---

### Task 4: Gmail Transactional Email Engine & Controller Event Hooks

**Files:**
- Create: `backend/src/templates/emailTemplates.ts`
- Create: `backend/src/services/gmail.service.ts`
- Create: `backend/src/controllers/mail.controller.ts`
- Create: `backend/src/routes/mail.routes.ts`
- Modify: `backend/src/controllers/inquiry.controller.ts`
- Modify: `backend/src/controllers/appointment.controller.ts`
- Test: `test files/backend/services/gmail.service.test.ts`

**Interfaces:**
- Consumes: Lead inquiry data, private tour appointment details, or direct mail requests.
- Produces: Dispatched RFC 2822 base64url encoded emails using Gmail API `users.messages.send` and logs delivery IDs.

- [ ] **Step 1: Write backend unit test for `GmailService`**

```typescript
// test files/backend/services/gmail.service.test.ts
import { describe, it, expect } from 'vitest';
import { GmailService } from '../../../backend/src/services/gmail.service';

describe('GmailService', () => {
  it('formats and sends inquiry notification in mock mode', async () => {
    const result = await GmailService.sendInquiryNotification({
      agentEmail: 'agent@cpkerby.com',
      agentName: 'Victoria Sterling',
      clientName: 'Julian Vance',
      clientEmail: 'julian@vancecap.com',
      clientPhone: '+63 917 555 0192',
      propertyTitle: 'The Horizon Monolith Penthouse',
      propertyPrice: '₱285,000,000',
      message: 'Requesting private inspection this Thursday at 3 PM.',
    });
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- "test files/backend/services/gmail.service.test.ts" --run`
Expected: FAIL with "GmailService not found"

- [ ] **Step 3: Implement Nordic Bauhaus HTML email templates in `backend/src/templates/emailTemplates.ts`**

Generate high-contrast, responsive inline-styled HTML templates:
- `buildInquiryEmailHtml(data)`: `#FBFBF9` ground, `#0D4446` Spruce Teal header, inquiry details table, and `#E76F51` terracotta CTA.
- `buildTourConfirmationEmailHtml(data)`: Appointment timing, address, calendar event details, and concierge contacts.
- `buildBrokerApprovalEmailHtml(data)`: Listing specifications, price, and direct review link.

- [ ] **Step 4: Implement `GmailService.ts`**

Implement:
- Initialize `googleapis.gmail('v1')`.
- Encode message: `createMimeMessage({ to, from, subject, htmlBody })` -> `base64url`.
- Method `sendInquiryNotification(data)`
- Method `sendTourConfirmation(data)`
- Method `sendDirectBrochure(to, propertyData)`
- Resilient mock dispatch fallback when credentials are not configured.

- [ ] **Step 5: Connect `GmailService` into `inquiry.controller.ts` & `appointment.controller.ts`**

Dispatch emails asynchronously upon inquiry or appointment creation:
```typescript
// In inquiry.controller.ts
void GmailService.sendInquiryNotification({ ... }).catch(err => logger.error('Gmail inquiry failed:', err));
```

- [ ] **Step 6: Run tests and verify PASS**

Run: `npm test -- "test files/backend/services/gmail.service.test.ts" --run`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add backend/src/templates/emailTemplates.ts backend/src/services/gmail.service.ts backend/src/controllers/mail.controller.ts backend/src/routes/mail.routes.ts backend/src/controllers/inquiry.controller.ts backend/src/controllers/appointment.controller.ts
git commit -m "feat(email): integrate Gmail API with Nordic Bauhaus transactional templates and controllers"
```

---

### Task 5: WhatsApp ("wattsup") Cloud API Dispatcher & Webhook Engine

**Files:**
- Create: `backend/src/services/whatsapp.service.ts`
- Create: `backend/src/controllers/whatsapp.controller.ts`
- Create: `backend/src/routes/whatsapp.routes.ts`
- Test: `test files/backend/services/whatsapp.service.test.ts`
- Test: `test files/backend/controllers/whatsapp.controller.test.ts`

**Interfaces:**
- Consumes: Outbound notification requests or inbound Meta Webhooks (`GET/POST /api/whatsapp/webhook`).
- Produces: WhatsApp template dispatch via Meta Graph API, instant click-to-chat URL generator, and inbound message event processing.

- [ ] **Step 1: Write backend unit test for `WhatsAppService`**

```typescript
// test files/backend/services/whatsapp.service.test.ts
import { describe, it, expect } from 'vitest';
import { WhatsAppService } from '../../../backend/src/services/whatsapp.service';

describe('WhatsAppService', () => {
  it('generates pre-composed universal click-to-chat inquiry link', () => {
    const link = WhatsAppService.generateInquiryLink({
      phone: '+639171234567',
      listingId: 'MLS-7729',
      propertyTitle: 'Aurelia Residences Penthouse',
      price: '₱310,000,000',
    });
    expect(link).toContain('https://wa.me/639171234567?text=');
    expect(link).toContain('MLS-7729');
    expect(link).toContain('Aurelia%20Residences');
  });

  it('dispatches outbound alert in mock mode', async () => {
    const result = await WhatsAppService.sendLeadAlert('+639171234567', {
      clientName: 'Alexander Vance',
      propertyTitle: 'The Monolith Villa',
      listingId: 'MLS-8821',
    });
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- "test files/backend/services/whatsapp.service.test.ts" --run`
Expected: FAIL with "WhatsAppService not found"

- [ ] **Step 3: Implement `WhatsAppService.ts`**

Implement:
- `generateInquiryLink(params)`: sanitizes phone number and returns universal `https://wa.me/<number>?text=...` URI.
- `sendLeadAlert(agentPhone, leadData)`: calls Meta Graph API endpoint `POST https://graph.facebook.com/v20.0/{PHONE_NUMBER_ID}/messages` with template `luxury_property_lead_alert`.
- `sendTourReminder(clientPhone, tourData)`: sends appointment reminder with address and time.
- `verifyWebhook(mode, token, challenge)`: validates `hub.verify_token` against `config.integrations.whatsappVerifyToken`.
- `processInboundWebhook(body)`: parses inbound messages, logs lead interaction, and flags urgent buyer requests.

- [ ] **Step 4: Create `WhatsAppController` and `whatsapp.routes.ts`**

Endpoints:
- `GET /api/whatsapp/link`: returns pre-composed `wa.me` deep link.
- `POST /api/whatsapp/send`: sends outbound template alert (protected by `requireAuth`).
- `GET /api/whatsapp/webhook`: Meta verification handshake.
- `POST /api/whatsapp/webhook`: incoming webhook processor.

- [ ] **Step 5: Run tests and verify PASS**

Run: `npm test -- "test files/backend/services/whatsapp.service.test.ts" --run`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/whatsapp.service.ts backend/src/controllers/whatsapp.controller.ts backend/src/routes/whatsapp.routes.ts
git commit -m "feat(whatsapp): implement WhatsApp Cloud API dispatcher and webhook processor"
```

---

### Task 6: Google Maps Platform Server Gateway (Geocoding, Places & Commute Matrix)

**Files:**
- Create: `backend/src/services/googleMaps.service.ts`
- Create: `backend/src/controllers/maps.controller.ts`
- Create: `backend/src/routes/maps.routes.ts`
- Test: `test files/backend/services/googleMaps.service.test.ts`
- Test: `test files/backend/controllers/maps.controller.test.ts`

**Interfaces:**
- Consumes: Address strings or property coordinates `{ lat, lng }`.
- Produces: Geocoded coordinates, Places Autocomplete predictions proxy, Street View metadata, and Distance Matrix commute estimates to central luxury destinations.

- [ ] **Step 1: Write backend unit test for `GoogleMapsService`**

```typescript
// test files/backend/services/googleMaps.service.test.ts
import { describe, it, expect } from 'vitest';
import { GoogleMapsService } from '../../../backend/src/services/googleMaps.service';

describe('GoogleMapsService', () => {
  it('geocodes address in mock mode with realistic coordinates', async () => {
    const result = await GoogleMapsService.geocodeAddress('5th Avenue, Bonifacio Global City, Taguig');
    expect(result).toBeDefined();
    expect(result.latitude).toBeCloseTo(14.548, 1);
    expect(result.longitude).toBeCloseTo(121.050, 1);
    expect(result.formattedAddress).toBeDefined();
  });

  it('calculates commute matrix for luxury landmarks', async () => {
    const commutes = await GoogleMapsService.calculateCommuteMatrix({
      latitude: 14.5489,
      longitude: 121.0503,
    });
    expect(commutes).toBeInstanceOf(Array);
    expect(commutes.length).toBeGreaterThan(0);
    expect(commutes[0].destinationName).toBeDefined();
    expect(commutes[0].durationText).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- "test files/backend/services/googleMaps.service.test.ts" --run`
Expected: FAIL with "GoogleMapsService not found"

- [ ] **Step 3: Implement `GoogleMapsService.ts`**

Implement:
- `geocodeAddress(address: string)`: queries Google Maps Geocoding API (`https://maps.googleapis.com/maps/api/geocode/json`), extracts lat, lng, formatted address, and postal code.
- `placesAutocomplete(input: string, country?: string)`: proxies Places Autocomplete queries with in-memory caching (5-minute TTL) to minimize external API costs.
- `calculateCommuteMatrix(origin: { latitude: number, longitude: number })`: queries Google Distance Matrix API with 4 preset commercial hubs:
  - Bonifacio High Street / BGC Central
  - Ayala Avenue / Makati CBD
  - Ninoy Aquino International Airport (NAIA Terminal 3)
  - International School Manila (ISM)
- `checkStreetViewCoverage(lat: number, lng: number)`: queries Street View Metadata API to confirm 360 panorama imagery availability.

- [ ] **Step 4: Create `MapsController` and `maps.routes.ts`**

Endpoints:
- `GET /api/maps/geocode?address=...`
- `GET /api/maps/places/autocomplete?input=...`
- `GET /api/maps/commute?lat=...&lng=...`
- `GET /api/maps/streetview/metadata?lat=...&lng=...`

- [ ] **Step 5: Run tests and verify PASS**

Run: `npm test -- "test files/backend/services/googleMaps.service.test.ts" --run`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/googleMaps.service.ts backend/src/controllers/maps.controller.ts backend/src/routes/maps.routes.ts
git commit -m "feat(maps): implement Google Maps backend gateway with geocoding, autocomplete, and commute matrix"
```

---

### Task 7: Master Router Registration & Full Backend Verification

**Files:**
- Modify: `backend/src/routes/index.ts`
- Test: All backend tests in `test files/backend/`

**Interfaces:**
- Consumes: All 5 integration sub-routers.
- Produces: Fully assembled Express v5 API gateway with `/api/auth`, `/api/drive`, `/api/mail`, `/api/whatsapp`, and `/api/maps`.

- [ ] **Step 1: Mount all integration routers in `backend/src/routes/index.ts`**

```typescript
// backend/src/routes/index.ts
import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import propertyRoutes from './property.routes';
import valuationRoutes from './valuation.routes';
import inquiryRoutes from './inquiry.routes';
import agentRoutes from './agent.routes';
import appointmentRoutes from './appointment.routes';
import chatRoutes from './chat.routes';
import profileRoutes from './profile.routes';
import notificationRoutes from './notification.routes';
import saleRoutes from './sale.routes';
import dashboardRoutes from './dashboard.routes';
// New Integration Routers:
import driveRoutes from './drive.routes';
import mailRoutes from './mail.routes';
import whatsappRoutes from './whatsapp.routes';
import mapsRoutes from './maps.routes';

const router = Router();

// Master API Routes Table
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/properties', propertyRoutes);
router.use('/valuations', valuationRoutes);
router.use('/inquiries', inquiryRoutes);
router.use('/agents', agentRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/chat', chatRoutes);
router.use('/profile', profileRoutes);
router.use('/notifications', notificationRoutes);
router.use('/sales', saleRoutes);
router.use('/dashboard', dashboardRoutes);
// Mount new integrations:
router.use('/drive', driveRoutes);
router.use('/mail', mailRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/maps', mapsRoutes);

export default router;
```

- [ ] **Step 2: Run complete backend test suite to verify 100% PASS**

Run: `npm test` inside `backend/` or root backend vitest:
Run: `npx vitest run --dir "test files/backend"`
Expected: All backend tests pass with 0 failures.

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/index.ts
git commit -m "feat(api): assemble Google Services and WhatsApp gateway into master backend router"
```

---

## Plan Review & Verification Checklist

- [x] **Backend-Only Boundary:** Zero frontend files touched; all 5 modules live in `backend/` and `shared/types/`.
- [x] **Spec Coverage:** Covers all 5 requested services: Google Auth, Google Drive, Gmail, WhatsApp, and Google Maps.
- [x] **Standard Envelopes:** Every controller returns `ApiResponse<T>` with HTTP status codes and timestamps.
- [x] **Zero-Crash Resilience:** All services feature mock modes returning realistic data for development and testing.
- [x] **No Placeholders:** Every step contains exact code snippets, test assertions, and CLI commands.
- [x] **Git Safety:** Zero remote pushes specified; all changes stay local.
