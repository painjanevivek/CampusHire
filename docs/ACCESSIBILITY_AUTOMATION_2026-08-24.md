# Browser Accessibility Evidence — 2026-08-24

## Scope and method

The production Next.js bundle was exercised in headless Chromium at 360×800, 768×1024, and 1440×900. Public and student routes ran at every viewport; administrator operations ran at tablet and desktop sizes. The runner executes rendered axe WCAG 2 A/AA, 2.1 AA, and 2.2 AA rules, verifies one main landmark and page heading, captures the first keyboard focus indicator, detects document overflow, and records unexpected console failures.

The API is deliberately intercepted with a deterministic HTTP 503 response. This validates honest degraded states without depending on a local backend. Expected intercepted failures are counted separately and never hidden as successful requests.

## Result

- 42 route/viewport checks passed with no axe violations, document overflow, missing page headings, invisible first focus indicator, or unexpected console error.
- Reduced-motion duration was bounded to `0.00001s`.
- The landing page, all student routes, and administrator operations reflowed at the 720 CSS-pixel equivalent of a 1440×900 display at 200% zoom.
- Landing, dashboard, and administrator operations retained visible focus and avoided overflow under forced colors.
- Initial defects fixed: 360 px student-header overflow, missing dashboard fallback heading, and a non-focusable onboarding scroll region.

Raw JSON and screenshots are generated under `.data/` and intentionally excluded from Git. Reproduce with a production server on port 3199 and `npm run test:accessibility`.

## Remaining human gate

Automation does not validate lived usability, screen-reader reading order, announcements, or institutional acceptance. Representative student, administrator, and qualified screen-reader sessions remain pending; use the session pack and sanitized acceptance record before release approval.
