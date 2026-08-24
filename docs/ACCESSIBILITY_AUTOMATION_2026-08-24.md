# Browser Accessibility Evidence — 2026-08-24

## Scope and method

The production Next.js bundle was exercised in headless Chromium, Firefox, and WebKit at 360×800, 768×1024, and 1440×900. Public and student routes ran at every viewport; administrator operations ran at tablet and desktop sizes. The runner executes rendered axe WCAG 2 A/AA, 2.1 AA, and 2.2 AA rules, verifies one main landmark and page heading, traverses every visible focusable element, detects document overflow, and records unexpected console failures.

The API is deliberately intercepted with a deterministic HTTP 503 response. This validates honest degraded states without depending on a local backend. Expected intercepted failures are counted separately and never hidden as successful requests. A test-only request bridge serves local HTTP assets when WebKit applies the production `upgrade-insecure-requests` policy; it does not weaken application CSP.

## Result

- 126 route/viewport/engine checks passed with no axe violations, document overflow, missing page headings, incomplete keyboard traversal, invisible first focus indicator, or unexpected console error.
- Reduced motion, the 200% reflow equivalent, and forced-colors focus/overflow checks passed in all three engines.
- WebKit keyboard traversal explicitly emulates Safari with macOS Full Keyboard Access enabled because the headless runner inherits an environment-level preference.
- Defects fixed during automation included 360 px student-header overflow, missing dashboard and progressive-loading headings, and a non-focusable onboarding scroll region.

Raw JSON and screenshots are generated under `.data/` and intentionally excluded from Git. Reproduce with a production server on port 3199 and `npm run test:accessibility`.

## Remaining human gate

Automation does not validate lived usability, screen-reader reading order, announcements, branded Safari behavior, or institutional acceptance. Representative student, administrator, real Safari/macOS keyboard, and qualified screen-reader sessions remain pending; use the browser support matrix, session pack, and sanitized acceptance record before release approval.
