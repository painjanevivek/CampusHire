# Proof-first Editorial Student Experience

## Objective

Create a new visual foundation for the CampusHire landing page and student dashboard. The experience serves students seeking placement readiness. Its primary conversion is profile creation; the immediate post-profile destination is eligible opportunities. The dashboard prioritizes one evidence-backed readiness action, followed by formally eligible roles.

This direction replaces earlier screenshot-led concepts. It must not introduce future-scope features such as mock interviews, recruiter accounts, subscriptions, or labour-market claims.

## Design Direction

The visual language is **Proof-first Editorial**: warm paper surfaces, deep ink-blue type, cobalt structural fields, and coral attention accents. Geist provides display, body, and utility typography. Layouts use fine rules, restrained radii, wide headlines, and deliberate negative space.

The deterministic gpt-taste selection is:

- Hero: artistic asymmetry.
- Typography: Geist.
- Components: horizontal accordion, infinite marquee, and feedback carousel.
- Motion: scroll pinning plus image scale-and-fade.

Motion supports comprehension and never controls access to content. Reduced-motion users receive the complete static experience.

## Landing Page

The page follows AIDA:

1. **Attention:** A minimal split navigation and asymmetric hero state the outcome: build a placement story the student can stand behind. The hero contains two actions only: `Create profile` and `Browse opportunities`.
2. **Interest:** A mathematically complete four-column by four-row bento explains profile evidence, honest resume improvement, eligibility, and role matching. Areas occupy 2 by 2, 2 by 1, 2 by 1, and 4 by 2 cells, filling 16 of 16 cells with dense grid flow.
3. **Desire:** A pinned readiness narrative shows how identity, education, evidence, and target role produce one clear next action. Horizontal accordions reveal detail without creating new routes. A continuous text marquee names the eight curated career paths.
4. **Action:** A high-contrast profile-creation chapter leads to sign-up. Secondary links expose privacy, AI-assistance principles, student sign-in, and TNP access.

The feedback carousel uses approved product explanations or verified student feedback only. It must never invent endorsements, portraits, or numerical outcomes. Until approved feedback exists, it presents review principles such as human confirmation and evidence traceability. It uses manual previous and next controls rather than autoplay.

## Student Dashboard

The dashboard preserves the editorial system while increasing information density:

- The top region contains the student greeting, global navigation, notifications, and profile access.
- The dominant panel presents exactly one next readiness action, its supporting evidence, why it is recommended, and a link to the relevant workflow.
- Readiness is decomposed into named evidence areas. A summary score may exist, but it cannot be the only explanation.
- Formally eligible opportunities appear before general match recommendations.
- Each opportunity displays eligibility and semantic match as separate labelled results. Match language states that it is decision support, not hiring probability.
- The final action leads to the opportunity detail or application flow without performing state changes through a GET request.

After the student confirms the final profile review step, successful completion navigates directly to `/opportunities`. A failure keeps the reviewed data visible, explains what was not saved, and provides a retry action.

The dashboard follows the same narrative sequence as AIDA: next action, supporting proof, opportunity relevance, and a clear application or improvement action.

## Shared Components

- `EditorialNavigation`: student-first navigation with a secondary TNP entry.
- `EditorialHero`: wide two-to-three-line heading, supporting copy, and two actions.
- `EvidenceBento`: gapless capability grid with semantic headings.
- `ReadinessJourney`: pinned title and vertically progressing evidence panels.
- `CareerPathMarquee`: decorative motion excluded from the accessibility tree while retaining a readable static list.
- `FeedbackCarousel`: keyboard-operable, paused on focus or hover, and populated only with approved content.
- `NextReadinessAction`: one actionable recommendation with a plain-language rationale.
- `ReadinessBreakdown`: named components, evidence status, and measurable progress semantics.
- `EligibleOpportunityList`: eligibility-first roles with separate match context.
- `StudentWorkspace`: responsive shell shared by dashboard, opportunities, resume, onboarding, and roadmap routes.

## States and Error Handling

The first implementation includes visible patterns for:

- New student with an incomplete profile.
- Required profile fields complete and opportunities available.
- Resume queued or processing.
- Missing information requiring manual review.
- No eligible opportunities.
- AI assistance temporarily unavailable while deterministic workflows remain usable.
- Data-load failure with a retry action and no internal error disclosure.

Status never depends on colour alone. Green is reserved for verified or eligible states; cobalt represents match information; coral highlights attention; amber represents pending or review states.

## Data, Security, and Analytics

The backend OpenAPI contract remains authoritative. Server Components load protected data where possible and pass serializable view models to narrow interactive Client Components. Authentication material remains in secure HttpOnly cookies and is never copied to local storage. React escaping remains the output-encoding default; the UI does not render untrusted HTML.

Analytics events are typed, contain no sensitive profile values, and cover:

- `profile_start`
- `profile_complete`
- `opportunity_view`
- `application_start`

Instrumentation must not block navigation or core workflows.

## Responsive and Accessibility Requirements

Desktop uses wide editorial compositions. Tablet collapses the bento without changing reading order. Mobile uses a compact top navigation, single-column content, full-width actions, and progressive disclosure for secondary explanations. No essential interaction requires hover.

All controls have visible focus, semantic names, and at least 44 by 44 pixel targets. Carousels and accordions work by keyboard. Horizontal accordions allow one expanded panel at a time and remain vertically readable on mobile. Progress exposes `aria-valuemin`, `aria-valuemax`, and `aria-valuenow`. GSAP effects are disabled under `prefers-reduced-motion: reduce` and content remains visible without JavaScript.

## First Implementation Boundary

This slice redesigns the public landing page, student dashboard, and shared student shell. It may adapt profile-completion navigation only where required for the approved handoff. It does not redesign TNP administration, change backend schemas, add new authentication behavior, or activate future-scope product features.

## Verification and Acceptance Criteria

- Landing primary action reaches profile creation; the opportunity action reaches the existing opportunity route.
- Dashboard exposes one dominant next action and explains why it was chosen.
- Eligibility and match are independently labelled in content and accessibility semantics.
- Every defined empty, pending, unavailable, and failure state has actionable guidance.
- Responsive layouts pass at desktop, tablet, and mobile widths without horizontal scrolling.
- Keyboard navigation, focus order, contrast, reduced motion, and screen-reader labels are verified.
- Focused component tests pass before full typecheck, lint, test, and production build.
- Browser QA compares the implementation with the approved Proof-first Editorial companion direction.
