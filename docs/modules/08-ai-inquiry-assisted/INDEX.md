---
module: 08-ai-inquiry-assisted
title: AI Inquiry Assisted Module
last_updated: 2026-10-27
total_documents: 2
---

# AI Inquiry Assisted Module — Master Index

> **Directory:** `docs/modules/08-ai-inquiry-assisted/`  
> **Scope:** AI chat concierge, semantic property retrieval, automated qualification, session state preservation, and human broker handoff.  
> **Core Ownership:** AiChatController, ConciergeService, and Lead Handoff Pipeline.

---

## 1. Document Registry & Change History

All updates and technical reports for this module are ordered chronologically by ISO date (`YYYY-MM-DD`):

| Date | Document File | Description |
| :--- | :--- | :--- |
| `2026-09-14` | [2026-09-14-ai-chat-concierge-spec.md](./2026-09-14-ai-chat-concierge-spec.md) | Ai Chat Concierge Spec |
| `2026-10-18` | [2026-10-18-session-database-integration-ai-workflow.md](./2026-10-18-session-database-integration-ai-workflow.md) | Session Database Integration Ai Workflow |

---

## 2. Instructions for AI Agents & Developers

When making modifications or adding new features to **AI Inquiry Assisted Module**:

1. **Before Action (Read Phase):**
   - Review this `INDEX.md` and the latest dated document listed above.
   - Strictly follow the `INSPECT -> ANALYZE -> PROPOSE -> APPROVAL GATE -> IMPLEMENT -> VERIFY` workflow defined in `AGENTS.md`.

2. **After Action (Document Phase):**
   - Record the changes by creating a new document in this folder named:
     `YYYY-MM-DD-[concise-action-description].md`
   - Include standard YAML frontmatter (`module`, `date`, `status`, `affected_files`).
   - Add a new row to the Document Registry table in this `INDEX.md`.
