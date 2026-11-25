# Project Agent Rules

## Design System
Always read and strictly adhere to @DESIGN.md for all frontend UI components, color tokens, typography scales, spacing, and border radii. Do not invent arbitrary utility values or unapproved styles.
For all frontend UI work, follow the `shadcn` skill (`.agents/skills/shadcn/SKILL.md`) and always reuse or add `shadcn/ui` components in `frontend/src/components/ui/` first before building custom markup.
Do NOT add subtitles or descriptive helper lines under page titles unless the user explicitly asks for one. Render portal page titles inline inside `DashboardHeader` rather than stacked above page content so pages occupy the full workspace space.
Reuse `ACTION_LABELS` / `STATUS_LABELS` / context helpers from `@/constants/uiLabels`, `fadeSlideReveal` / `AppMotionProvider` from `@/lib/motion`, and `PageContainer` / `SectionStack` / `BentoGrid` from `@/components/ui/layout/LayoutPrimitives`.
Run `npm run lint` in `frontend/` and resolve any `design-guardrails/*` warnings on files you create or edit.

## Communication Style
Explain concepts, changes, and results in plain, conversational English. Avoid technical jargon, buzzwords, and complex metaphors. Explain things as if speaking to a complete beginner with zero background in the topic, and use everyday examples where helpful.
