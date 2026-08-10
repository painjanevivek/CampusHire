# Unified Student Workspace Design

## Objective

CampusHire must present one coherent product across Dashboard, Opportunities, Resume, Resume Builder, Career Roadmap, and Profile. The user-selected `design.md` is the visual source of truth: a soft neutral canvas, high-contrast structure, serif-led editorial headlines, precise interface typography, and restrained emerald and blue accents. Students should recognize every route as part of one workspace without relearning navigation, controls, or status meanings.

## Root Cause

`/opportunities` currently owns a second application shell and a legacy Aptos/teal system in `globals.css`. Other student routes use `StudentWorkspace` but still mix older page-specific styles. The duplicate navigation, typography, palette, spacing, card geometry, and responsive behavior created the visible mismatch between Opportunities and Resume.

## Scope

The full student workspace migration covers:

- `/dashboard`
- `/opportunities` and its demo detail
- `/resume` and `/resume/builder`
- `/roadmap`
- `/onboarding`

Landing, authentication, and administrative routes inherit the shared color, typography, focus, and reset tokens but retain their role-specific information architecture. This work does not alter backend contracts, authentication, CSRF behavior, upload validation, eligibility rules, or AI decision boundaries.

## Design System Contract

### Foundation

- Background `#FAFAFA`, foreground `#111827`, card `#FFFFFF`, border `#E5E7EB`, and primary `#000000`.
- Emerald `#10B981` communicates verified or successful state; blue `#2563EB` communicates interactive emphasis. Neither color replaces a text label or icon.
- Instrument Serif is the display face; Inter is body text; Montserrat is navigation, buttons, and UI labels; JetBrains Mono is reserved for metrics and technical tags.
- Spacing follows the 4px scale in `design.md`; major sections use up to 96px of breathing room.
- Cards use 24px radii, major containers use 40px, and interactive chips or buttons use pill geometry.
- Depth comes from borders, glass blur, and subtle `0 8px 30px rgb(0 0 0 / 4%)` shadows rather than harsh elevation.
- All interactive targets are at least 44px, with visible focus and WCAG-readable contrast.

### Shared Workspace

`StudentWorkspace` is the only authenticated student shell. It owns the CampusHire brand, five-route navigation, active-route semantics, profile completion, desktop navigation, and mobile navigation. Pages provide route content only; no student route may recreate sidebar markup or navigation arrays.

Desktop uses a floating glass rail with 16px backdrop blur, a translucent border, internal dividers, and pill-shaped active tabs. Mobile converts this into a compact glass header plus horizontally scrollable pill navigation. The shell uses the neutral canvas and must never create document-level horizontal overflow.

### Route Header

Every student route begins with a consistent header:

1. An optional monospaced status or route label.
2. An outcome-led Instrument Serif H1, limited to two or three lines.
3. A concise Inter supporting sentence.
4. At most one primary and one secondary action, labelled in Montserrat.

The header may use the radial grid pattern from `design.md`, but decoration cannot reduce legibility or compete with the primary action.

## Route Designs

### Dashboard

The student’s single next readiness action remains dominant. A large grid-backed hero presents the action, evidence needed, and one black primary control. Eligible opportunities follow it. Readiness is summarized with an SVG radial score ring, monospaced metrics, and emerald only for verified progress.

### Opportunities

Replace the duplicated shell with `StudentWorkspace active="Opportunities"`. The content order is:

1. Shared route header and saved-role action.
2. Search and pill filters with persistent labels and clear reset.
3. Formally eligible opportunity cards.
4. Contextual match explanation.
5. Preference or evidence action.

Formal eligibility appears before semantic match in both visible and DOM order. Match is labelled as decision support, never hiring probability. The selected role controls the explanation panel without hiding other results. On narrower layouts the explanation moves below the list; mobile cards stack without overflow.

### Resume and Resume Builder

Upload and builder screens share the route header, button hierarchy, white document canvas, form controls, suggestion cards, and state treatments. Suggestions stay student-controlled: original and proposed language are distinct, and Accept or Edit uses the same black-primary and bordered-secondary actions as every route. Readiness guidance uses blue structure; verified status uses emerald only when justified.

### Career Roadmap

The roadmap is an ordered technical sequence. Confirmed, next, and later milestones share one structure with monospaced metadata. The single next milestone receives blue interaction emphasis, completed milestones use labelled emerald verification, and locked items remain readable without implying failure.

### Profile

The onboarding wizard retains step autosave and CSRF-protected requests. It uses the shared header, glass step navigation, white panels, and unified fields. Required and recommended fields remain distinct. Save failure preserves entered values and gives an actionable message; successful completion still routes directly to Opportunities.

## Components and Motion

- Glass navigation: fixed or sticky, translucent, 16px blur, subtle border, pill active state.
- Status badge: monospaced label plus optional emerald pulse, with a static reduced-motion fallback.
- Score ring: accessible SVG progress with a text equivalent.
- Technical panel: near-black surface for structured evidence, never decorative filler.
- Opportunity and content cards: horizontal on wide screens, stacked on mobile, 300ms ease transition.
- Entry motion: fade-up using `cubic-bezier(0.16, 1, 0.3, 1)` over 0.8s.

Every animation is isolated from core interaction logic, stops under `prefers-reduced-motion`, and leaves all content available in the static state.

## Architecture

Route files stay thin. Shared student primitives live in `src/components/layout/` and focused UI modules. Feature behavior stays in `src/features/<domain>/`; scoped CSS modules replace student-specific global selectors. `globals.css` retains tokens, resets, font variables, motion primitives, and only the legacy styles still required by out-of-scope routes.

Opportunities filtering remains client-side demo behavior. Components receive typed serializable view models. Analytics emit allowlisted event names only; search strings, profile values, filenames, and resume content never enter analytics events.

## Error and Empty States

- No opportunities: explain that no eligible roles match current filters and offer Clear filters or Improve evidence.
- Match unavailable: preserve formal eligibility and explain that guidance is temporarily unavailable.
- Resume upload failure: preserve the selected filename and offer Retry.
- Profile save failure: preserve field values and the current step.
- Data load failure: name what failed and provide a local retry action.

Errors use plain language and never claim that unsaved data was persisted.

## Testing and Acceptance

Implementation follows test-driven development. Tests first fail for the duplicated shell or missing route semantics, then pass after migration.

Acceptance requires:

- every student route renders one `Workspace` navigation landmark;
- Opportunities no longer owns sidebar markup or a local navigation array;
- active-route semantics and profile progress stay accessible;
- eligibility precedes match in visible and DOM order;
- search, filters, empty states, upload, suggestion review, roadmap, and onboarding behavior remain functional;
- shared palette, typography, radii, and focus tokens come from `design.md`;
- reduced-motion rendering preserves all content and controls;
- desktop 1440 x 1000 and mobile 390 x 844 have no document overflow;
- browser console is clean on every student route;
- tests, typecheck, lint, and production build all pass.

## Delivery

After implementation and verification, create one Conventional Commit in `feat/fix(<scope>): <summary>` format with a copyable bullet-point body. Push only after the commit succeeds and the staged scope is reviewed.
