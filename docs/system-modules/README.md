# System Modules Reference & Technical Notes

> **Directory**: `docs/system-modules/`  
> **Purpose**: Centralized storage for domain documentation, module architecture notes, state flows, and API integration specifications across the CP_kerby platform.

---

## 1. System Module Index

The CP_kerby platform is composed of decoupled functional modules spanning frontend and backend layers:

| Module Identifier | Core Responsibility | Key Code Locations | Document |
| :--- | :--- | :--- | :--- |
| **`auth-rbac`** | User registration, authentication, JWT tokens, session lifecycle, and role-based access control (`client`, `agent`, `broker`, `admin`). | `backend/src/controllers/auth.controller.ts`<br>`backend/src/middleware/auth.middleware.ts`<br>`frontend/src/context/AuthContext.jsx` | [`01-authentication-and-authorization.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/system-modules/01-authentication-and-authorization.md) |
| **`ai-concierge`** | Real-time AI chat assistant with luxury persona guardrails, dynamic Groq/xAI routing, and broker triage. | `backend/src/controllers/chat.controller.ts`<br>`backend/src/services/chat.service.ts`<br>`frontend/src/components/chat/` | [`02-ai-chat-concierge.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/system-modules/02-ai-chat-concierge.md) |
| **`properties-catalog`** | Real estate listing inventory, 7-step in-place creation wizard, search/filter engine, pricing, specs, and media galleries. | `backend/src/services/property.service.ts`<br>`frontend/src/services/propertyService.js`<br>`shared/types/property.ts` | [`03-property-listing-module.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/system-modules/03-property-listing-module.md)<br>([Technical Spec](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/implementation/PROPERTY_LISTING_FORM.md)) |
| **`inquiries-leads`** | Client inquiries, property lead generation, status triage, and agent assignments. | `backend/src/controllers/inquiry.controller.ts`<br>`frontend/src/services/inquiryService.js` | — |
| **`appointments-tours`** | Private physical & virtual tour scheduling, calendar bookings, and confirmations. | `backend/src/controllers/appointment.controller.ts`<br>`frontend/src/services/appointmentService.js` | — |
| **`integrations-google`** | Google Drive blueprint/asset storage CDN and Gmail automated notification alerts. | `backend/src/services/googleDrive.service.ts`<br>`backend/src/services/gmail.service.ts` | — |
| **`maps-geocoding`** | OpenStreetMap Nominatim predictive search, address geocoding, and map viewports. | `backend/src/services/nominatim.service.ts`<br>`frontend/src/services/mapsService.js` | — |
| **`portals-dashboards`** | Multi-role management portals: Broker executive ledger, Agent console, and Client portal. | `frontend/src/pages/portals/broker/`<br>`frontend/src/pages/portals/agent/`<br>`frontend/src/pages/portals/client/` | — |
| **`visualizer-3d`** | Interactive Three.js architectural canvas, camera flight paths, and lighting rigs. | `frontend/src/components/3d/` | — |

---

## 2. Standard Note Format (Template)

When authoring module notes in this directory, name files following kebab-case (e.g., `auth-rbac.md`, `property-catalog.md`) and adhere to the following outline:

```markdown
# [Module Name] Module Specification & Notes

**Module ID**: `module-id`  
**Status**: Active / Planned / In-Review  
**Last Updated**: YYYY-MM-DD  

## 1. Overview & Business Context
- Purpose of the module and business goals.
- Target user roles and actors.

## 2. Architecture & Data Flow
- Request/response lifecycle.
- State management strategy (React Context, local state, Supabase triggers).

## 3. Interfaces & Contracts
- RESTful endpoints and payload shapes.
- Shared TypeScript interfaces in `shared/types/`.

## 4. Security & Permissions
- Authentication requirements and RBAC gates.
- Data isolation rules.

## 5. Known Quirks, Gotchas & Roadmap
- Edge cases, mock behaviors, and future enhancements.
```
