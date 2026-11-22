---
module: 07-inquiry
date: 2026-11-21
status: verified
affected_files:
  - backend/src/services/inquiry.service.ts
  - frontend/src/services/inquiryService.js
  - frontend/src/components/inquiries/InquiryAiSummaryCard.jsx
  - frontend/src/components/inquiries/InquiryFollowUpTasksCard.jsx
  - frontend/src/components/inquiries/InquiryInternalNotesCard.jsx
  - frontend/src/pages/portals/agent/AgentInquiries.jsx
  - frontend/src/pages/portals/agent/AgentInquiryDetail.jsx
  - frontend/src/pages/portals/broker/BrokerInquiries.jsx
  - frontend/src/pages/portals/broker/BrokerInquiryDetail.jsx
---

# Broker & Agent Inquiry Management Polish & Wiring Fixes

## Summary

- **Backend & Service Wiring:** Fixed `reconnectInquiry` (`GET`), `updateFollowUpTask` (`PATCH`), and `changeBusinessStatus` (`POST /inquiries/:id/status`) in `inquiryService.js` to match `inquiry.routes.ts`. Removed fake default agent assignments on unassigned leads in `normalizeInquiry` and `InquiryService`, and fixed `getInquiries` so empty backend results return `[]` rather than `mockInquiries`.
- **Shared Inquiry Components:** Created `InquiryAiSummaryCard.jsx` (aligned with canonical `shared/types/inquiry.ts` `InquiryAiSummarySections`), `InquiryFollowUpTasksCard.jsx`, and `InquiryInternalNotesCard.jsx` using `shadcn/ui` primitives and `DESIGN.md` tokens.
- **Agent & Broker Portal Unification:** Upgraded `AgentInquiries.jsx` and `AgentInquiryDetail.jsx` to the `DESIGN.md` Bento layout with `KpiCard`, `TableSkeleton`, `InquiryDetailSkeleton`, `Dialog`, `Select`, `Alert`, and `useToast`. Added the `Overdue SLA` tab, fixed `avgFirstHumanResponseMinutes` display, and integrated all three shared cards into `BrokerInquiryDetail.jsx`.
