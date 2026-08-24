# Frontend release evidence

## Automated gates

Run `npm ci`, `npm run api:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:accessibility`, `npm audit --audit-level=high`, and `npm run release:smoke` against the candidate URL. CI executes the source/build sequence from the lockfile and installs pinned Chromium automation dependencies. Tests cover student/admin shells, API-backed workflows, loading/empty/error states, safe links, nonce-based Content Security Policy, API destination validation, privacy confirmation, and both jsdom and rendered axe checks. The release smoke verifies public entry routes and browser policy headers on the deployed artifact. The local 2026-08-24 browser result is summarized in `docs/ACCESSIBILITY_AUTOMATION_2026-08-24.md`.

## Manual browser matrix

Validate the landing page and every student route at 360×800, 768×1024, and 1440×900. Validate administrator operations at 768×1024 and 1440×900. For each critical flow, record keyboard-only completion, visible focus, zoom at 200%, reduced motion, high-contrast readability, loading, empty, offline, unauthorized, provider-unavailable, retry, and terminal-failure states. A pilot screen-reader review remains mandatory because jsdom cannot validate reading order, announcements, or rendered colour contrast.

## Release boundary

The frontend consumes the checked backend OpenAPI snapshot. The backend must be released first when a contract is additive, and `npm run api:check` must remain clean. Follow `docs/RELEASE_ROLLBACK.md` and record scenarios in `docs/PILOT_UAT.md`. `AGENTS.md`, local skill metadata, local data, and design reference files are not release artifacts. Separate frontend/backend Deep Security Scans were explicitly deferred by the user on 2026-08-24 and are not counted as passed. Staging browser evidence, institutional privacy approval, and named user-acceptance sign-off remain external release gates.
