# Next.js SSR UI Unification Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Follow strict RED-GREEN-REFACTOR and use the user-selected `design.md` as the visual source of truth.

**Goal:** Replace the duplicated student-route interfaces with one accessible, responsive CampusHire workspace using the Next.js SSR Architecture System across every student tab.

**Architecture:** Keep route files thin and centralize navigation in `StudentWorkspace`. Move interactive route content into typed feature components with scoped CSS modules. Put only design tokens, resets, font variables, and shared UI primitives in `globals.css`; preserve backend, CSRF, upload, and analytics contracts.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 6, CSS Modules, Lucide React, GSAP, Vitest, Testing Library.

---

## Task 1: Establish the authoritative visual foundation

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Verify: `design.md`

1. Add Instrument Serif, Inter, Montserrat, and JetBrains Mono through `next/font/google`, exposing stable CSS variables on `<body>`.
2. Replace editorial and legacy student color literals with semantic tokens from `design.md`, including background, foreground, card, border, primary, emerald, blue, code, typography, spacing, radii, shadow, and motion values.
3. Keep the skip link, focus visibility, base form controls, shared Button, Badge, Alert, and reduced-motion rules accessible.
4. Run `npm run typecheck` and expect success.

## Task 2: Make `StudentWorkspace` the single navigation shell

**Files:**
- Modify: `src/components/layout/student-workspace.test.tsx`
- Modify: `src/components/layout/student-workspace.tsx`
- Modify: `src/components/layout/student-workspace.module.css`

1. Add a failing test that renders each active section and proves there is exactly one `Workspace` navigation, the selected link alone has `aria-current="page"`, and profile progress has a readable value.
2. Run `npm run test -- src/components/layout/student-workspace.test.tsx`; confirm RED if the active-section coverage or navigation contract is missing.
3. Implement the glass navigation rail, CampusHire mark, pill tabs, progress panel, and mobile horizontal navigation without changing route labels.
4. Re-run the focused test and confirm GREEN.

## Task 3: Migrate Opportunities into a scoped feature

**Files:**
- Create: `src/features/opportunities/opportunities-workspace.test.tsx`
- Create: `src/features/opportunities/opportunities-workspace.tsx`
- Create: `src/features/opportunities/opportunities-workspace.module.css`
- Modify: `src/app/opportunities/page.tsx`
- Modify: `src/app/globals.css`

1. Write failing tests proving the page uses one shared Workspace navigation, filters results by role/company/skill, clears filters, exposes a useful empty state, and presents formal eligibility before match guidance.
2. Run `npm run test -- src/features/opportunities/opportunities-workspace.test.tsx`; confirm RED because the feature does not yet exist.
3. Extract the data, filter controls, opportunity list, and match explanation into `OpportunitiesWorkspace`; wrap it once with `StudentWorkspace active="Opportunities"` in the route.
4. Style the route with neutral cards, black primary actions, blue interaction states, emerald verified states, monospaced tags, and responsive list/panel stacking.
5. Remove the legacy Opportunities shell selectors from `globals.css` after verifying no remaining consumers.
6. Re-run the focused test and confirm GREEN.

## Task 4: Unify Resume upload and Resume Builder

**Files:**
- Create: `src/features/resume/resume-workspace.test.tsx`
- Modify: `src/features/resume/resume-workspace.tsx`
- Create: `src/features/resume/resume-workspace.module.css`
- Create: `src/features/resume/resume-builder.test.tsx`
- Create: `src/features/resume/resume-builder.tsx`
- Create: `src/features/resume/resume-builder.module.css`
- Modify: `src/app/resume/builder/page.tsx`

1. Add failing behavior tests for preserved filename/error state, upload success, suggestion disclosure, and explicit student-controlled Edit/Accept actions.
2. Run the two focused test files and confirm RED for the missing builder feature and any missing accessible states.
3. Convert upload and builder chrome to the shared header, card, field, badge, button, and white document patterns. Keep the exported resume preview white and the surrounding workspace `#FAFAFA`.
4. Preserve the existing CSRF upload endpoint and immutable-version message.
5. Re-run focused tests and confirm GREEN.

## Task 5: Unify Roadmap, opportunity detail, and Profile

**Files:**
- Create: `src/features/roadmap/student-roadmap.test.tsx`
- Create: `src/features/roadmap/student-roadmap.tsx`
- Create: `src/features/roadmap/student-roadmap.module.css`
- Modify: `src/app/roadmap/page.tsx`
- Create: `src/features/opportunities/opportunity-detail.tsx`
- Create: `src/features/opportunities/opportunity-detail.module.css`
- Modify: `src/app/opportunities/demo/page.tsx`
- Modify: `src/features/onboarding/onboarding-wizard.test.tsx`
- Modify: `src/features/onboarding/onboarding-wizard.tsx`
- Create: `src/features/onboarding/onboarding-wizard.module.css`

1. Add failing tests for milestone state labels, a single next action, eligibility-before-match ordering, onboarding progress, save-error preservation, and completion redirect.
2. Run the focused tests and confirm RED for the missing feature components or semantic guarantees.
3. Implement the ordered roadmap, shared role-detail layout, and glass-step profile wizard using scoped modules and the approved tokens.
4. Keep onboarding request bodies, CSRF handling, analytics, and redirect behavior unchanged.
5. Re-run focused tests and confirm GREEN.

## Task 6: Restyle Dashboard around the single next action

**Files:**
- Modify: `src/features/dashboard/student-dashboard.test.tsx`
- Modify: `src/features/dashboard/student-dashboard.tsx`
- Modify: `src/features/dashboard/student-dashboard.module.css`

1. Extend the test to verify the dominant next action, accessible radial readiness progress, verified evidence labels, opportunity ordering, and decision-support disclaimer.
2. Run the focused test and confirm RED for the radial metric contract.
3. Implement a grid-backed hero, SVG readiness ring with text equivalent, 24px cards, black primary action, blue interaction, emerald verification, and monospaced metrics.
4. Retain existing analytics calls and dashboard loading/error states.
5. Re-run the focused test and confirm GREEN.

## Task 7: Remove remaining student-route visual drift

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/resume/page.tsx`
- Modify: `src/app/onboarding/page.tsx`
- Update: `design-qa.md`

1. Confirm each student route contains exactly one `StudentWorkspace` wrapper and no local navigation arrays.
2. Remove now-unused global selectors for `.workspacePage`, `.builderPage`, `.roadmapPage`, `.onboardingPage`, and the legacy Opportunities shell.
3. Check the route files stay thin and imports resolve through feature components.
4. Run `npm run test`, `npm run typecheck`, and `npm run lint`; fix every regression.

## Task 8: Responsive and production verification

**Files:**
- Update: `design-qa.md`

1. Start or reuse the local frontend and inspect `/dashboard`, `/opportunities`, `/opportunities/demo`, `/resume`, `/resume/builder`, `/roadmap`, and `/onboarding` at 1440 x 1000.
2. Repeat at 390 x 844. Confirm no document overflow, no clipped controls, readable hierarchy, visible focus, and one consistent navigation system.
3. Verify `prefers-reduced-motion`, keyboard navigation, empty states, filter reset, upload feedback, suggestion controls, and onboarding error behavior.
4. Confirm no browser console errors and record the route-by-route results in `design-qa.md`.
5. Run `npm run test`, `npm run typecheck`, `npm run lint`, and `npm run build`; all must exit zero.

## Task 9: Commit and push the reviewed scope

**Files:**
- Review all staged frontend files.

1. Inspect `git status --short` and `git diff --check`; exclude `.codebase-memory`, local skill caches, and unrelated user files from staging.
2. Prepare one copy-pasteable Conventional Commit message in `feat/fix(<scope>): <summary>` format with a bullet-point body.
3. Stage only the UI implementation, tests, design system, spec, plan, and QA report.
4. Commit using the exact message shown to the user.
5. Push the current branch and report the branch, commit hash, verification results, and remote outcome.
