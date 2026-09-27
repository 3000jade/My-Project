# Backend Services Architecture: Google Services & WhatsApp Integration Specification

> **System**: CP_kerby Luxury Architectural Real Estate Platform (Backend Gateway)  
> **Status**: Approved Backend Architectural Specification  
> **Classification**: Server-Side External Integrations, Middleware, & Cloud Dispatchers  
> **Scope**: Strictly Backend (`backend/`, `shared/types/`, `test files/backend/`)  
> **Date**: 2026-09-27  

---

## 1. Architectural Overview & Boundary Isolation

In accordance with system boundaries, **all frontend code remains frozen and untouched**. All integrations for Google Auth, Google Drive, Google Mail (Gmail), WhatsApp ("wattsup"), and Google Maps Platform are architected, isolated, and implemented **strictly within the Express v5 TypeScript Backend Gateway (`backend/src/`)** and typed contracts in `shared/types/`.

This server-side concentration provides major operational advantages:
1. **Total Credential Confidentiality**: Service Account private keys, Google OAuth client secrets, Meta WhatsApp access tokens, and Google Maps server API keys are permanently protected behind the Express gateway and never exposed to the client bundle.
2. **Rate Limiting & Cost Control**: Maps Geocoding, Places Autocomplete, and Distance Matrix queries are cached and metered server-side to prevent unexpected quota depletion.
3. **Decoupled API Contract**: Frontend applications (web, mobile, or third-party CRM) consume uniform, clean `ApiResponse<T>` REST endpoints without vendor lock-in.
4. **Resilient Mock Mode**: If external credentials are not configured in development, services automatically default to high-fidelity mock handlers without throwing unhandled exceptions.

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            CLIENT (Any Consumer)                                 │
│                                                                                  │
│   POST /auth/google       POST /drive/upload       POST /mail/send               │
│   GET  /maps/geocode      GET  /maps/commute       POST /whatsapp/webhook        │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                     EXPRESS V5 BACKEND GATEWAY (backend/src/)                    │
│                                                                                  │
│  ┌─────────────────────────┬─────────────────────────┬────────────────────────┐  │
│  │     Controllers         │        Middleware       │        Schemas         │  │
│  │ AuthController          │ requireAuth             │ googleAuthSchema       │  │
│  │ DriveController         │ authRateLimiter         │ driveUploadSchema      │  │
│  │ MailController          │ validateBody            │ emailDispatchSchema    │  │
│  │ WhatsAppController      │ multerMemoryStorage     │ mapsQuerySchema        │  │
│  │ MapsController          │                         │                        │  │
│  └───────────┬─────────────┴───────────┬─────────────┴──────────┬─────────────┘  │
│              │                         │                        │                │
│              ▼                         ▼                        ▼                │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                               Services                                     │  │
│  │ GoogleAuthService        GoogleDriveService        GmailService            │  │
│  │ WhatsAppService          GoogleMapsService         (Mock Fallback Engine)  │  │
│  └───────────┬─────────────────────────┬────────────────────────┬─────────────┘  │
└──────────────┼─────────────────────────┼────────────────────────┼────────────────┘
               │                         │                        │
       ┌───────┴──────┐          ┌───────┴──────┐         ┌───────┴──────┐
       │ Google Auth  │          │ Meta Cloud   │         │ Google Maps  │
       │ & Supabase   │          │ WhatsApp API │         │ REST APIs    │
       │ Profiles     │          │ & Webhook    │         │ (Geocode/DM) │
       └──────────────┘          └──────────────┘         └──────────────┘
```

---

## 2. Subsystem Specifications (Backend Only)

### 2.1 Google Auth Service & Endpoint (`POST /api/auth/google`)
- **Route**: `POST /api/auth/google`
- **Validation**: `googleAuthSchema` checking `idToken` string (min 10 chars) and optional `role` (`'client' | 'agent' | 'broker'`).
- **Processing Flow**:
  1. Validates ID token signature and audience using `google-auth-library` (`OAuth2Client.verifyIdToken`).
  2. Extracts verified claims: `email`, `name`, `picture`, `sub` (Google Subject ID).
  3. Verifies or provisions user in Supabase/PostgreSQL `profiles` table. If profile exists, retains existing role; if new, sets requested role.
  4. Returns signed platform JWT token in standard envelope:
     ```json
     {
       "success": true,
       "data": {
         "user": { "id": "...", "email": "...", "fullName": "...", "role": "..." },
         "token": "..."
       },
       "message": "Google authentication successful.",
       "timestamp": "2026-09-27T13:45:00.000Z"
     }
     ```

### 2.2 Google Drive Service & Endpoints (`/api/drive/*`)
- **Routes**:
  - `POST /api/drive/upload`: Multer in-memory upload streaming directly to Google Drive v3 REST API. Accepts fields: `propertyId`, `category` (`CAD` | `Inspection` | `Photos` | `Legal`).
  - `GET /api/drive/listing/:propertyId`: Lists all files stored in the property's Google Drive folder.
  - `DELETE /api/drive/files/:fileId`: Deletes the file from Google Drive and removes the associated record from `property_media`.
- **Folder Hierarchy Automation**:
  - Auto-provisions Google Drive folder named `[ListingId]_[SanitizedTitle]` inside the root brokerage folder.
  - Creates subfolders for `Blueprints_CAD`, `Inspection_Reports`, and `HighRes_Photos`.
- **Database Synchronization**:
  - Inserts/updates record in `public.property_media` with `media_url` (Google Drive webViewLink/webContentLink), `media_category`, and `mime_type`.

### 2.3 Gmail Transactional Email Engine (`/api/mail/*` & Event Hooks)
- **Engine**: `GmailService` utilizing `googleapis.gmail('v1')` with Service Account domain-wide delegation or OAuth2.
- **Routes & Triggers**:
  - `POST /api/mail/send`: Protected endpoint for agents/brokers to dispatch property presentations or dossiers.
  - **Automated Event Hooks**:
    - Trigger 1: In `InquiryController.create`: When an inquiry is submitted, dispatches Nordic Bauhaus HTML email to listing agent with lead telemetry, plus confirmation to client.
    - Trigger 2: In `AppointmentController.create`: Dispatches appointment confirmation with calendar timing to client and agent.
    - Trigger 3: In `PropertyController.update`: Alerts broker when `standard_status` changes to `Pending Approval`.
- **Template Design**: Inline CSS strictly adhering to Nordic Bauhaus daylight standards (`#FBFBF9` ground, `#0D4446` Spruce Teal headers, `#E76F51` terracotta CTAs, `#141717` ink).

### 2.4 WhatsApp ("wattsup") Cloud API & Webhook (`/api/whatsapp/*`)
- **Engine**: `WhatsAppService` using Meta WhatsApp Cloud API (`https://graph.facebook.com/v20.0/{PHONE_NUMBER_ID}/messages`).
- **Routes**:
  - `POST /api/whatsapp/send`: Sends outbound template message (lead alert, viewing reminder, status update).
  - `GET /api/whatsapp/link`: Generates verified `wa.me/<number>?text=...` pre-composed inquiry string given property ID and client params.
  - `GET /api/whatsapp/webhook`: Handles Meta Webhook verification handshake (`hub.mode`, `hub.verify_token`, `hub.challenge`).
  - `POST /api/whatsapp/webhook`: Ingests inbound messages, delivery receipts, and client replies; routes alerts to agent notifications.
- **Triggers**: Automated WhatsApp message dispatched to agent's phone when a new tour is scheduled or offer is submitted.

### 2.5 Google Maps Platform Gateway (`/api/maps/*`)
- **Engine**: `GoogleMapsService` utilizing official Google Maps API endpoints.
- **Routes**:
  - `GET /api/maps/geocode?address=...`: Converts address strings to exact `latitude`, `longitude`, postal code, and formatted address string.
  - `GET /api/maps/places/autocomplete?input=...`: Queries Google Places Autocomplete API with country scoping (Philippines / Global luxury hubs) and returns structured predictions.
  - `GET /api/maps/commute?originLat=...&originLng=...`: Distance Matrix query calculating driving distance and duration from property to core CBD destinations (BGC High Street, Makati Ayala, NAIA Terminal 3, International School Manila).
  - `GET /api/maps/streetview/metadata?lat=...&lng=...`: Checks Street View panorama coverage before imagery is requested.

---

## 3. Security, Configuration & Mock Resilience

1. **Strictly Backend Variables (`backend/.env` & `config/index.ts`)**:
   ```env
   # Google Auth
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...

   # Google Drive
   GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL=...
   GOOGLE_DRIVE_PRIVATE_KEY=...
   GOOGLE_DRIVE_ROOT_FOLDER_ID=...

   # Gmail API
   GMAIL_USER_EMAIL=...

   # WhatsApp Cloud API
   WHATSAPP_PHONE_NUMBER_ID=...
   WHATSAPP_ACCESS_TOKEN=...
   WHATSAPP_VERIFY_TOKEN=cp_kerby_whatsapp_verify_token

   # Google Maps Platform
   GOOGLE_MAPS_API_KEY=...
   ```
2. **Mock Mode Guarantee**:
   If credentials are left empty or during unit testing, all services automatically run in mock mode (`config.integrations.isMockMode = true`), returning realistic fixture data so that continuous integration and local development never fail.
