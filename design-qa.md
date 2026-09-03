# CampusHire Frontend — MVP Design QA

**Current result: engineering checks passed; authenticated pilot UAT remains an external gate.**

## Route Consistency

- `/dashboard`, `/opportunities`, `/resume`, `/resume/builder`, `/roadmap`, and `/onboarding` use the shared student workspace structure.
- The hard-coded `/opportunities/demo` and `/admin/drives/demo` fixture routes have been retired. The reserved `demo` opportunity identifier now resolves through the application not-found boundary rather than shadowing the live opportunity route.
- All student tabs use `StudentWorkspace`; the duplicate Opportunities sidebar and its teal/Aptos styles were removed.
- Active-route pills, the CampusHire brand, and profile completion stay identical across routes.

## Visual System

- Rendered routes use `#FAFAFA` canvas, white cards, `#111827` foreground, black primary actions, blue interaction, and labelled emerald verification.
- Instrument Serif drives outcome headlines; Inter handles body copy; Montserrat handles controls; JetBrains Mono handles metrics and technical labels.
- Grid-backed heroes, 24px cards, 40px containers, glass navigation, dark technical panels, subtle borders, and restrained shadows match `design.md`.
- A 1280 × 720 live-browser sweep showed no document-level overflow. Responsive rules were reviewed at the 1120px, 980px, 900px, 850px, 800px, 760px, and 700px breakpoints; the mobile shell becomes a fixed glass header with horizontally scrollable pill tabs.

## Interaction and State Coverage

- Account entry is canonically invitation-based. The browser no longer contains a public-signup mutation path, and the public guidance page explains how to obtain an institutional invitation.
- Opportunity search, filters, clear action, and empty-state recovery are covered.
- Formal eligibility precedes decision-support match guidance in DOM and visible order.
- Resume upload preserves the selected filename on failure and announces immutable-version success.
- Resume suggestions require explicit Edit or Accept actions.
- Roadmap states expose Confirmed, Next best move, and Later with one next action.
- Profile failure preserves fields; completion keeps the CSRF-protected PATCH and redirects to `/opportunities`. Product completion events are emitted by the authoritative backend rather than browser-only custom events.
- Student and administrator protected routes redirect unauthenticated visitors to their respective sign-in routes with a bounded `returnTo` value.
- Sign-out failures are visibly announced while the current session remains active.

## Accessibility and Motion

- Navigation, main, article, status, progressbar, heading, and labelled form semantics were inspected in the rendered DOM.
- Dashboard readiness uses an accessible SVG radial progress indicator.
- Form controls and action buttons use the shared 44 px minimum target where practical; inline text links remain content-sized and visibly focused.
- `prefers-reduced-motion` disables continuous and transition motion while preserving content.
- Browser inspection of the landing page, invitation guidance, student sign-in, administrator sign-in, and protected-route redirects produced no console errors.
- The Phase 8 browser runner distinguishes public degraded routes from real demo-authenticated student and T&P routes and requires the requested protected path to remain loaded.
- The exact-candidate automated run passed 180/180 page checks across Chromium, Firefox, and WebKit with no unexpected console errors; all reduced-motion, forced-colors, 200% reflow, and 400% reflow gates passed.
- Automated viewports include 320 px mobile, 200% and 400% reflow, reduced motion, and forced colors. Real Safari/macOS Full Keyboard Access, mobile real-device checks, screen-reader acceptance, and representative participant acceptance remain external gates.

## Verification

- `npm run test`: 42 files and 146 tests passed for the Phase 8 candidate; rerun after any source change because historical counts are not release evidence.
- `npm run test:accessibility:authenticated`: Chromium, Firefox, and WebKit engineering matrix for the live synthetic candidate.
- `npm run test:performance`: bounded local production-build profile; results are not presented as field Core Web Vitals.
- The checked frontend OpenAPI snapshot matches the current backend export; generated declarations were refreshed from that exact snapshot.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed; the production route table contains no demo fixture routes.

## Known Non-blocking Warning

Vitest reports a future Vite native config-loader migration notice for `vitest.config.ts`. It does not affect test execution or production output.

## Role-specific application packet — 2026-09-03

Status: **internal synthetic design QA passed; external pilot UAT remains unclaimed.**

Recorded: `2026-09-03T17:41:13Z`

## Source and implementation

- Approved review concept: `C:\Users\ASUS\.codex\generated_images\01a06764-0469-7ef2-b5d7-b68de4060d4b\exec-7ed41754-9843-47ef-ad27-a12107ecafaa.png` (`1536 × 1024`).
- Supporting approved concepts:
  - `C:\Users\ASUS\.codex\generated_images\01a06764-0469-7ef2-b5d7-b68de4060d4b\exec-81250884-e60b-4b6b-98ef-4d6919a63100.png`
  - `C:\Users\ASUS\.codex\generated_images\01a06764-0469-7ef2-b5d7-b68de4060d4b\exec-fbb4dd9d-61cc-4ae8-8bfa-c96b82aaf359.png`
- Implementation route: `http://127.0.0.1:3199/opportunities/8e9ef5ee-c73a-4fdc-87e2-8ab722e1b304/apply`
- Browser: Codex in-app browser.
- Captures reviewed in the Codex session: default desktop viewport and explicit `390 × 844` mobile viewport. The approved source and implementation captures were inspected together before and after the mobile correction.

## Comparison history

1. The first implementation capture matched the CampusHire shell, typography, colour tokens, card treatment, progress affordance, exact-packet hierarchy, and fixed final action pattern from the approved concepts. The implementation intentionally uses the requested four steps rather than the exploratory six-step review concept.
2. The first `390 × 844` capture exposed a horizontally scrolling stepper and placed the summary before the active task. The stepper was changed to a 2 × 2 grid and the task now precedes its summary.
3. Reloading a saved draft on Review exposed a missing client-side review fetch. Review recovery now fetches the exact server preview and was rechecked in the browser.
4. The corrected mobile capture showed no stepper overflow, preserved readable headings and controls, and kept the final actions reachable without hiding packet content.

## Interaction and accessibility checks

- Signed in with a synthetic student fixture and opened an eligible institution-published role.
- Created and resumed the server-saved draft.
- Selected a clean completed PDF, confirmed the limited profile snapshot, opened every optional disclosure choice including “Prefer not to answer”, and reached the exact review packet.
- Reloaded on Review and confirmed the resume, profile snapshot, disclosure status, form version, and immutable notice were restored.
- Confirmed the accuracy checkbox controls the enabled state of the submit action.
- Verified ordered step semantics and `aria-current="step"` through the accessibility tree.
- Verified semantic labels, read-only account email, live saved timestamp, and keyboard-selectable disclosure controls.
- Verified mobile navigation and the four-step 2 × 2 reflow at `390 × 844`.
- Inspected the reduced-motion media rule; spinner animation is disabled under `prefers-reduced-motion: reduce`.
- Browser console inspection returned no warnings or errors during the desktop journey.
- Final submission behavior is covered by the automated idempotency test; the visual QA session stopped at the enabled synthetic submit action.

## Final assessment

The implementation preserves the approved visual direction while fitting the existing CampusHire design system and the requested four-step information architecture. No external UAT, legal, institutional-policy, or governance approval is implied by this internal synthetic QA pass.
