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
