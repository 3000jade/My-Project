# Human Shelter Realty — Master Documentation Portal

Welcome to the centralized documentation hub for **Human Shelter Realty**. All technical specifications, verification reports, and update logs are strictly organized by module.

---

## Master System Specifications (Single-Source Documents)

| Master Specification | Description | Direct Link |
| :--- | :--- | :--- |
| **Requirements Specification** | Single living document containing all Functional (FR) and Non-Functional (NFR) requirements across Modules 01–08 in tabular format. | [REQUIREMENTS_SPECIFICATION.md](./REQUIREMENTS_SPECIFICATION.md) |
| **Database & Entity Schema** | Single living document cataloging current tables, columns, relations, and RLS policies across all modules. | [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) |

---

## System Modules Index

| Module ID | Module Name | Scope & Responsibilities | Master Index Link |
| :---: | :--- | :--- | :--- |
| `01` | **User Management Module** | Authentication, authorization, RBAC, session guards, and user profiles. | [01-user-management/INDEX.md](./modules/01-user-management/INDEX.md) |
| `02` | **Property Listing Module** | Property schemas, cadastral maps, photo galleries, specs, and status lifecycles. | [02-property-listing/INDEX.md](./modules/02-property-listing/INDEX.md) |
| `03` | **Agent Management Module** | Broker rosters, PRC/DHSUD verification, onboarding, calendars, and transfers. | [03-agent-management/INDEX.md](./modules/03-agent-management/INDEX.md) |
| `04` | **Sales and Report Module** | Transaction logging, commission tier attribution, revenue analytics, and reports. | [04-sales-and-reports/INDEX.md](./modules/04-sales-and-reports/INDEX.md) |
| `05` | **Database Module** | PostgreSQL migrations, table definitions, foreign keys, and type contracts. | [05-database/INDEX.md](./modules/05-database/INDEX.md) |
| `06` | **Audit Module** | Administrative audit events, immutable agent action trails, and security logs. | [06-audit/INDEX.md](./modules/06-audit/INDEX.md) |
| `07` | **Inquiry Module** | Client inquiry capture, lead routing, broker triage, and viewing requests. | [07-inquiry/INDEX.md](./modules/07-inquiry/INDEX.md) |
| `08` | **AI Inquiry Assisted Module** | AI chat concierge, semantic retrieval, session state, and broker handoff. | [08-ai-inquiry-assisted/INDEX.md](./modules/08-ai-inquiry-assisted/INDEX.md) |

---

## Agent & Contributor Guidelines

1. **Reading Documentation:**
   - Always open and read the target module's `INDEX.md` before modifying features or schema.
2. **Adding Updates:**
   - Name new documents using ISO date prefixes: `YYYY-MM-DD-[action-description].md`.
   - Add YAML frontmatter (`module`, `date`, `status`, `affected_files`).
   - Register the file in the module's `INDEX.md`.
