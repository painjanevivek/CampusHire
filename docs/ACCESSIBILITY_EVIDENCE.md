# Accessibility Evidence

## Current automated release profile

Phase 8 separates two kinds of evidence instead of treating a redirect as protected-route coverage:

- public routes run with a deterministic API `503` to validate truthful degraded states;
- protected routes establish real synthetic student and T&P demo sessions through the supported sign-in controls, then require the requested URL to remain loaded;
- Chromium, Firefox, and WebKit run at 320×800, 360×800, 768×1024, and 1440×900;
- public, student, and administrator routes are checked at every viewport;
- axe runs WCAG 2.0–2.2 A/AA rules on the rendered page;
- the runner requires one `main#main-content`, one `h1`, visible focus, complete keyboard traversal of currently exposed controls, no undersized form/action controls, no document overflow, and no unexpected console error;
- reduced motion, forced colors, 200% reflow, and 400% reflow are separate gates.

Closed progressive-disclosure content is excluded from the keyboard expectation until its `details` element is opened. This matches the browser focus model; exposed summaries remain tested.

Run `npm run test:accessibility` for the public degraded profile. Run `npm run test:accessibility:authenticated` against the production bundle and live synthetic backend for the full local release profile.

The authenticated command intentionally fails when demo authentication, the backend, or a requested protected route is unavailable. Cookies, tokens, and personal data are not written to the evidence output.

The retained exact-candidate run recorded at `2026-09-02T15:21:03Z` passed 180 page checks across Chromium, Firefox, and WebKit with zero unexpected console errors. Each engine covered 60 combinations: six public degraded routes, six authenticated student routes, and three authenticated T&P routes at four viewports. All engine-level reduced-motion, forced-colors, 200% reflow, and 400% reflow gates also passed.

## Phase 8 defects closed

- A protected-route redirect can no longer count as coverage of the requested route.
- The minimum viewport is 320 CSS pixels, and administrator mobile routes are included.
- The reflow gate includes both 200% and 400% equivalents.
- Student opportunity filters, resume actions, T&P application actions, drive controls, and operations filters use at least the shared 44 px control target where practical.
- Student and T&P navigation use the same semantic control, glass, border, and foreground tokens.
- A production CSP regression that blocked a same-origin Turbopack client chunk is covered by the browser console gate and proxy policy test. Inline script remains nonce-only.
- Route-group loading states retain stable workspace geometry and an accessible loading heading.
- Long immutable resume filenames wrap without widening the saved-version card at 320 CSS pixels in Firefox.
- The loopback runner uses one real in-memory session per role and engine. Its secure test-only HTTP bridge preserves CSRF cookies across browser interception without disabling origin or CSRF validation, persisting credentials, or changing production transport code.

## Evidence boundary

Playwright WebKit is not branded Safari. Headless engines cannot prove real macOS Full Keyboard Access, VoiceOver, NVDA, TalkBack, iOS/Android behavior, low-bandwidth usability, or representative participant comprehension. Those remain external release gates and must record the exact frontend/backend candidate, device, browser/assistive-technology version, result, issue, and retest evidence.
