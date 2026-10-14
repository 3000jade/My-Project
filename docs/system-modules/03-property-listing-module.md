# Module 03: Property Listing Management

### Module 03: Property Listing Management

**📌 PURPOSE**
- Enables brokers, agents, and administrators to register, configure, publish, and govern high-value residential and commercial properties using an agency-grade 7-step wizard. Enforces RESO 2.0 real estate standards and segregates public marketing remarks from confidential agency compensation data.

**👥 USERS**
- **Broker** (Managing principal: creates, publishes, reviews, and edits all inventory)
- **Agent** (Licensed associate: submits new listings subject to broker approval)
- **Administrator** (Global superuser: full system inventory access and audit oversight)
- **Client / Public** (End consumer: discovers and browses published active listings)

**⚙️ KEY FEATURES**
- **In-Place Dashboard Workspace**: Operates directly inside the dashboard viewport without slide-over drawer overlays or disruptive full-page route reloads.
- **7-Step Structured Wizard**: Guides users sequentially through:
  1. *Basic Property Information* (Title, transaction type, category, assigned consultant, rich public description)
  2. *Property Location & Cadastral Pin* (Nominatim OpenStreetMap address search & Leaflet draggable cadastral map)
  3. *Dimensions & Specifications* (Subtype-reactive fields: Condominium floor/tower vs. Land lot frontage)
  4. *Pricing, HOA & Carrying Terms* (List price, currency, association dues frequency, annual property tax)
  5. *Curated Features & Amenities* (Interior luxury finishes, exterior architecture, community infrastructure)
  6. *Photography & Confidential Broker Governance* (Media staging, CAD blueprints, lockbox passcodes, RLS-partitioned commission splits)
  7. *Review & Verification Audit* (Live publication readiness checklist and draft/publish controls)
- **RESO Data Dictionary 2.0 Compliance**: Standardized property status taxonomy (`Active`, `Draft`, `Pending Approval`, `Closed`).
- **Row-Level Security (RLS) Confidentiality**: Isolates internal broker intelligence (commission splits, gate access codes, seller direct phone) in `public.property_confidential` inaccessible to clients or unauthorized agents.
- **Live Publication Readiness Audit**: Real-time validation card ensuring title length, price, address, cadastral coordinates, and media assets meet quality standards before publication.

**🔄 SIMPLE PROCESS**
- User Selects "+ New Property" → Enters Step 1–6 Specifications → Reviews Live Publication Checklist in Step 7 → Submits Listing → System Validates Payload via Zod → Persists to Supabase (`properties` & `property_confidential`) → Listing Appears in Inventory Table

> **Realistic Example:**  
> A Broker navigates to **Properties** > **+ New Property** in the dashboard. The in-place 7-step wizard opens. The broker types *"Aurelia Modernist Penthouse at BGC"*, searches the address via OpenStreetMap to drop a pin on the Leaflet map, fills in 4 beds, 5 baths, and sets the list price to ₱150,000,000. Under Confidential Governance, they set a 3.0% commission split. Upon reaching Step 7, all 5 checklist criteria turn green. Clicking **Publish Listing** saves the record and transitions it directly to `Active` in the portfolio ledger.

**🚫 LIMITATIONS**
- **Agent Publishing Gate**: Listings submitted by Agents do not publish to `Active` immediately; they are placed into `Pending Approval` until approved by a Broker or Admin.
- **Geocoding Dependency**: Auto-complete relies on OpenStreetMap Nominatim; if network geocoding is unavailable, coordinates can be pinned manually on the Leaflet canvas.
- **Confidential Field Protection**: Confidential broker data (lockbox codes, commission splits) can never be fetched or exposed on public client-facing property views.

---

> 📖 **Detailed Technical Specification**:  
> For complete field-to-database schemas, Zod validation contracts, and component architecture, see [`docs/implementation/PROPERTY_LISTING_FORM.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/implementation/PROPERTY_LISTING_FORM.md).
