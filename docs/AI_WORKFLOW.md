# Antigravity AI Workflow: `design.md` & `shadcn-ui` System Guide

See the canonical workflow document located at:
- **[`docs/ai-workflow/DESIGN_MD_FLOW.md`](./ai-workflow/DESIGN_MD_FLOW.md)**

---

## Quick Summary

1. **Design System Authority:** [`design.md`](../design.md) specifies all color tokens (Teal `#0F766E`, Coral `#FF6B6B`, Slate `#1E293B`, Canvas `#F8FAFC`), 8px radii, and accessibility standards.
2. **Component Playbook:** [`.agents/skills/shadcn-ui/SKILL.md`](../.agents/skills/shadcn-ui/SKILL.md) provides the CLI recipes and CVA patterns for all 50+ shadcn/ui components.
3. **Primitives Directory:** All base primitives are owned in `frontend/src/components/ui/`.
4. **Mandatory 6-Step Workflow:**
   $$\text{INSPECT} \longrightarrow \text{ANALYZE} \longrightarrow \text{PROPOSE} \longrightarrow \text{APPROVAL GATE (Hard Stop)} \longrightarrow \text{IMPLEMENT} \longrightarrow \text{VERIFY}$$
5. **Pilot Implementation:** The Broker Dashboard (`frontend/src/pages/portals/broker/BrokerDashboard.jsx`) is refactored using these primitives and verified via `vitest` and `vite build`.
