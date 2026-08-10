# Proof-first Editorial Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved Proof-first Editorial landing page, shared student shell, and evidence-first dashboard, then connect successful profile completion to eligible opportunities.

**Architecture:** Keep route files as Server Components that compose focused feature components. Isolate GSAP and browser-only analytics inside narrow Client Components, use CSS Modules for the new visual system, and retain the existing backend contract and secure CSRF client. Represent dashboard content through a serializable `StudentDashboardData` view model so real API data can replace the initial sample without changing presentation components.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 6, CSS Modules, Geist through `next/font`, Lucide React, GSAP with `@gsap/react` and `ScrollTrigger`, Vitest, Testing Library.

## Global Constraints

- Primary audience: students seeking placement readiness.
- Primary conversion: create a student profile, then navigate to `/opportunities` after confirmed completion.
- Dashboard order: one readiness action, supporting evidence, formally eligible opportunities, separate semantic match context.
- Eligibility is deterministic; match is decision support and never a hiring probability.
- Do not add mock interviews, recruiter accounts, subscriptions, or unverified outcome claims.
- Use warm paper, ink blue, cobalt structure, coral attention, amber review, and green only for verified or eligible states.
- Use Geist; headings remain two to three lines at desktop widths.
- Use real GSAP motion, disable it for reduced-motion users, and keep all content visible without animation.
- Preserve secure HttpOnly session handling and CSRF-protected state changes; never store authentication material in browser storage.
- Preserve unrelated dirty-worktree changes. Commit only new planning documentation unless the user later asks for implementation commits.

---

### Task 1: Editorial Foundation and Privacy-safe Analytics

**Files:**
- Create: `src/lib/product-analytics.ts`
- Test: `src/lib/product-analytics.test.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: `type ProductEventName = "profile_start" | "profile_complete" | "opportunity_view" | "application_start"`.
- Produces: `trackProductEvent(name: ProductEventName): void`, which dispatches `campushire:product-event` without profile values.
- Produces: global semantic tokens `--editorial-paper`, `--editorial-ink`, `--editorial-cobalt`, `--editorial-coral`, `--editorial-review`, and `--editorial-verified`.

- [ ] **Step 1: Write the failing analytics test**

```tsx
it("dispatches only the approved event name", () => {
  const listener = vi.fn();
  window.addEventListener("campushire:product-event", listener);
  trackProductEvent("profile_start");
  expect(listener).toHaveBeenCalledOnce();
  expect((listener.mock.calls[0][0] as CustomEvent).detail).toEqual({ name: "profile_start" });
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `npm run test -- src/lib/product-analytics.test.ts`

Expected: FAIL because `product-analytics.ts` does not exist.

- [ ] **Step 3: Implement the typed event boundary**

```ts
export type ProductEventName =
  | "profile_start"
  | "profile_complete"
  | "opportunity_view"
  | "application_start";

export function trackProductEvent(name: ProductEventName) {
  window.dispatchEvent(
    new CustomEvent("campushire:product-event", { detail: { name } }),
  );
}
```

- [ ] **Step 4: Apply the font and semantic tokens**

Use `Geist` from `next/font/google` in `src/app/layout.tsx`, expose its CSS variable on `<body>`, and make the global body stack use that variable. Add the six editorial tokens without deleting tokens still used by untouched routes. Keep the existing skip link, focus ring, and reduced-motion rules.

- [ ] **Step 5: Run focused verification**

Run: `npm run test -- src/lib/product-analytics.test.ts && npm run typecheck`

Expected: PASS and zero TypeScript errors.

### Task 2: Proof-first Editorial Landing Page

**Files:**
- Create: `src/features/marketing/editorial-landing.tsx`
- Create: `src/features/marketing/editorial-landing.module.css`
- Create: `src/features/marketing/editorial-landing.test.tsx`
- Create: `src/features/marketing/landing-motion.tsx`
- Create: `public/images/student-proof-editorial.png`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Produces: `EditorialLanding(): JSX.Element`.
- Consumes: `trackProductEvent("profile_start")` on the primary profile action.
- Consumes: `trackProductEvent("opportunity_view")` on the secondary opportunity action.
- Produces: landing anchors `#readiness`, `#opportunities`, and `#principles`.

- [ ] **Step 1: Generate and inspect the hero asset**

Use ImageGen to create a 1600 by 1200 editorial collage showing a student desk, reviewed resume annotations, code evidence, and an institutional placement document. Art direction: warm paper, cobalt crop blocks, deep ink shadows, restrained coral marks, no readable personal data, no logos, no fabricated UI text. Save it as `public/images/student-proof-editorial.png` and inspect it before use.

- [ ] **Step 2: Write failing landing behavior tests**

```tsx
it("leads students from profile creation to opportunities", () => {
  render(<EditorialLanding />);
  expect(screen.getByRole("heading", {
    name: "Build a placement story you can stand behind.",
  })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Create profile" }))
    .toHaveAttribute("href", "/sign-up");
  expect(screen.getByRole("link", { name: "Browse opportunities" }))
    .toHaveAttribute("href", "/opportunities");
});

it("explains eligibility separately from role match", () => {
  render(<EditorialLanding />);
  expect(screen.getByRole("heading", { name: "Formal eligibility" }))
    .toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Role match" }))
    .toBeInTheDocument();
});
```

- [ ] **Step 3: Run the landing test and confirm RED**

Run: `npm run test -- src/features/marketing/editorial-landing.test.tsx`

Expected: FAIL because `EditorialLanding` does not exist.

- [ ] **Step 4: Implement the semantic landing structure**

Build a Client Component containing:

```tsx
<main id="main-content" className={styles.page} ref={root}>
  <EditorialNavigation />
  <section className={styles.hero} aria-labelledby="landing-title">...</section>
  <section className={styles.evidenceBento} id="readiness">...</section>
  <section className={styles.readinessJourney}>...</section>
  <CareerPathMarquee />
  <PrincipleCarousel />
  <section className={styles.finalAction}>...</section>
  <footer>...</footer>
</main>
```

Use the approved copy, exactly two hero actions, a four-by-four dense bento occupying all 16 cells, a one-open-panel horizontal accordion, a readable static career-path list paired with an aria-hidden marquee, manual carousel controls, privacy and TNP links, and no unsupported claims.

- [ ] **Step 5: Add GSAP with reduced-motion protection**

In `landing-motion.tsx`, register `useGSAP` and `ScrollTrigger`. If `window.matchMedia("(prefers-reduced-motion: reduce)").matches`, return before creating animations. Otherwise pin the readiness title while evidence panels progress and animate the hero image from scale `0.8` and opacity `0.55` to scale `1` and opacity `1`. Use `gsap.context()` cleanup through `useGSAP({ scope })`.

- [ ] **Step 6: Compose the route and verify GREEN**

Replace `src/app/page.tsx` with a thin Server Component returning `<EditorialLanding />`.

Run: `npm run test -- src/features/marketing/editorial-landing.test.tsx`

Expected: PASS.

### Task 3: Shared Editorial Student Workspace

**Files:**
- Modify: `src/components/layout/student-workspace.tsx`
- Create: `src/components/layout/student-workspace.module.css`
- Modify: `src/components/layout/student-workspace.test.tsx`

**Interfaces:**
- Preserves: `StudentWorkspace({ active, children, aside? })` for existing routes.
- Produces: accessible navigation named `Workspace`.
- Produces: profile progress with `role="progressbar"`, `aria-valuemin="0"`, `aria-valuemax="100"`, and `aria-valuenow="70"`.

- [ ] **Step 1: Keep the existing shell test RED and add the mobile-navigation contract**

```tsx
expect(screen.getByRole("navigation", { name: "Workspace" }))
  .toContainElement(screen.getByRole("link", { name: "Dashboard" }));
expect(screen.getByRole("progressbar", { name: "Profile completion" }))
  .toHaveAttribute("aria-valuenow", "70");
```

- [ ] **Step 2: Run the shell test and confirm RED**

Run: `npm run test -- src/components/layout/student-workspace.test.tsx`

Expected: FAIL because the current `<nav>` is unnamed and progress is decorative.

- [ ] **Step 3: Implement the shell without changing route contracts**

Keep Dashboard, Opportunities, My Resume, Career Roadmap, and Profile routes. Replace corrupted text glyphs with Lucide `Check` icons. Apply module classes to the shell, navigation, current link, compact header, and profile panel. Desktop uses an ink-blue rail and paper content; mobile uses a horizontally scrollable navigation with 44-pixel targets and no hidden essential link.

- [ ] **Step 4: Run the shell test and confirm GREEN**

Run: `npm run test -- src/components/layout/student-workspace.test.tsx`

Expected: PASS.

### Task 4: Evidence-first Student Dashboard and States

**Files:**
- Create: `src/features/dashboard/student-dashboard.tsx`
- Create: `src/features/dashboard/student-dashboard.module.css`
- Create: `src/features/dashboard/dashboard-motion.tsx`
- Modify: `src/features/dashboard/student-dashboard.test.tsx`
- Modify: `src/app/dashboard/page.tsx`

**Interfaces:**
- Produces: `type DashboardState = "ready" | "incomplete" | "processing" | "manual-review" | "ai-unavailable" | "error"`.
- Produces: `type StudentDashboardData` with `studentName`, `readiness`, `nextAction`, `evidence`, `opportunities`, and `state`.
- Produces: `StudentDashboard({ data }: { data: StudentDashboardData })`.

- [ ] **Step 1: Rewrite the discarded-direction test around approved behavior**

```tsx
it("prioritizes one explained readiness action", () => {
  render(<StudentDashboard data={readyDashboard} />);
  expect(screen.getByRole("heading", { name: "Add deployment evidence" }))
    .toBeInTheDocument();
  expect(screen.getByText("Why this next?")).toBeInTheDocument();
  expect(screen.getByRole("progressbar", { name: "Profile readiness" }))
    .toHaveAttribute("aria-valuenow", "83");
});

it("keeps eligibility separate from match context", () => {
  render(<StudentDashboard data={readyDashboard} />);
  const role = screen.getByRole("article", { name: "AI Platform Intern" });
  expect(within(role).getByText("Formally eligible")).toBeInTheDocument();
  expect(within(role).getByText("92% match")).toBeInTheDocument();
  expect(screen.getByText("Match is decision support, not hiring probability."))
    .toBeInTheDocument();
});
```

Add table-driven assertions for incomplete, processing, manual-review, AI-unavailable, no-opportunity, and error guidance using literal expected messages.

- [ ] **Step 2: Run the dashboard test and confirm RED**

Run: `npm run test -- src/features/dashboard/student-dashboard.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the view model and states**

Build the dashboard in this order: editorial header, one `NextReadinessAction`, named `ReadinessBreakdown`, state guidance, and `EligibleOpportunityList`. Use `<progress>` semantics and labelled status text. When `opportunities` is empty, show `No eligible opportunities yet` and link to profile evidence; when AI is unavailable, keep eligibility visible and explain that match explanations are temporarily unavailable.

- [ ] **Step 4: Add restrained dashboard motion**

Use GSAP only to reveal the next-action copy and scale opportunity rows from `0.96` to `1` on entry. Guard with reduced-motion media query and avoid pinning the operational dashboard.

- [ ] **Step 5: Compose the dashboard route**

`src/app/dashboard/page.tsx` creates one serializable sample `StudentDashboardData` object, labels it as demo data, and renders:

```tsx
<StudentWorkspace active="Dashboard">
  <StudentDashboard data={dashboardData} />
</StudentWorkspace>
```

- [ ] **Step 6: Run the dashboard tests and confirm GREEN**

Run: `npm run test -- src/features/dashboard/student-dashboard.test.tsx`

Expected: PASS for the primary state and every defined guidance state.

### Task 5: Profile Completion Handoff

**Files:**
- Create: `src/features/onboarding/onboarding-wizard.test.tsx`
- Modify: `src/features/onboarding/onboarding-wizard.tsx`

**Interfaces:**
- Consumes: existing `csrfRequest("/profile", { method: "PATCH", ... })`.
- Produces: successful final-step navigation to `/opportunities`.
- Produces: `trackProductEvent("profile_complete")` only after the final PATCH resolves.

- [ ] **Step 1: Write the failing completion test**

Mock only the external CSRF request and Next router. Submit each step with a resolved request, then assert the final submit calls `router.push("/opportunities")` and dispatches `profile_complete`. Add a rejection case asserting the form stays visible and the message reads `We could not save this step. Your fields remain here; try again.`

- [ ] **Step 2: Run the onboarding test and confirm RED**

Run: `npm run test -- src/features/onboarding/onboarding-wizard.test.tsx`

Expected: FAIL because the current final step increments state instead of navigating.

- [ ] **Step 3: Implement successful navigation and actionable failure copy**

Use `useRouter()` from `next/navigation`. After the final PATCH resolves, dispatch `profile_complete` and call `router.push("/opportunities")`; on earlier steps, preserve the existing increment behavior. Keep the POST/PATCH request CSRF-protected and do not place form values in analytics.

- [ ] **Step 4: Run the onboarding test and confirm GREEN**

Run: `npm run test -- src/features/onboarding/onboarding-wizard.test.tsx`

Expected: PASS.

### Task 6: Integrated Verification and Visual QA

**Files:**
- Create: `design-qa.md`
- Remove: `public/images/opportunity-circuit-flow.png` if it remains from the discarded direction.
- Remove: `docs/superpowers/specs/2026-08-09-energetic-student-workspace-design.md` if it remains untracked.
- Remove: `docs/superpowers/plans/2026-08-09-student-workspace-foundation.md` if it remains untracked.

**Interfaces:**
- Verifies all earlier task outputs without adding product behavior.

- [ ] **Step 1: Run the complete automated gate**

Run, in order:

```text
npm run test
npm run typecheck
npm run lint
npm run build
```

Expected: every command exits 0. Record any pre-existing warning separately; do not hide it.

- [ ] **Step 2: Start the local app**

Run: `npm run dev -- --hostname 127.0.0.1 --port 3000`

Open `/` and `/dashboard` in the Codex in-app browser.

- [ ] **Step 3: Test primary interactions**

Verify profile and opportunity links, accordion keyboard behavior, carousel controls, desktop student navigation, mobile navigation, and reduced-motion rendering. Check browser console errors after both routes.

- [ ] **Step 4: Capture and compare the approved direction**

Capture desktop screenshots at 1440 by 1000 and mobile screenshots at 390 by 844. Compare the landing and dashboard against the selected Proof-first Editorial companion: paper canvas, ink hierarchy, cobalt structure, coral attention, editorial spacing, one dominant next action, and eligibility-before-match ordering.

- [ ] **Step 5: Write the QA result**

Create `design-qa.md` with viewport, interaction, accessibility, console, fidelity, and remaining-polish sections. Set `final result: passed` only after P0, P1, and P2 issues are fixed and the automated gate remains green.
