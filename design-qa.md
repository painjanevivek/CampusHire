# Next.js SSR Architecture System — Design QA

**Final result: passed**

## Route Consistency

- `/dashboard`, `/opportunities`, `/opportunities/demo`, `/resume`, `/resume/builder`, `/roadmap`, and `/onboarding` each render exactly one `Workspace` navigation landmark and one `main#main-content`.
- All student tabs use `StudentWorkspace`; the duplicate Opportunities sidebar and its teal/Aptos styles were removed.
- Active-route pills, the CampusHire brand, and profile completion stay identical across routes.

## Visual System

- Rendered routes use `#FAFAFA` canvas, white cards, `#111827` foreground, black primary actions, blue interaction, and labelled emerald verification.
- Instrument Serif drives outcome headlines; Inter handles body copy; Montserrat handles controls; JetBrains Mono handles metrics and technical labels.
- Grid-backed heroes, 24px cards, 40px containers, glass navigation, dark technical panels, subtle borders, and restrained shadows match `design.md`.
- A 1280 × 720 live-browser sweep showed no document-level overflow. Responsive rules were reviewed at the 1120px, 980px, 900px, 850px, 800px, 760px, and 700px breakpoints; the mobile shell becomes a fixed glass header with horizontally scrollable pill tabs.

## Interaction and State Coverage

- Opportunity search, filters, clear action, and empty-state recovery are covered.
- Formal eligibility precedes decision-support match guidance in DOM and visible order.
- Resume upload preserves the selected filename on failure and announces immutable-version success.
- Resume suggestions require explicit Edit or Accept actions.
- Roadmap states expose Confirmed, Next best move, and Later with one next action.
- Profile failure preserves fields; completion keeps the CSRF-protected PATCH, emits `profile_complete`, and redirects to `/opportunities`.

## Accessibility and Motion

- Navigation, main, article, status, progressbar, heading, and labelled form semantics were inspected in the rendered DOM.
- Dashboard readiness uses an accessible SVG radial progress indicator.
- Interactive targets have visible focus and a minimum 44px target.
- `prefers-reduced-motion` disables continuous and transition motion while preserving content.
- Browser logs contained development information only; no warnings or errors were recorded.

## Verification

- `npm run test`: 11 files, 31 tests passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed; all routes compiled as server-rendered-on-demand pages.

## Known Non-blocking Warning

Vitest reports a future Vite native config-loader migration notice for `vitest.config.ts`. It does not affect test execution or production output.
