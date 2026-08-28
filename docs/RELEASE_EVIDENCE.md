# Frontend release evidence

## Automated gates

Run `npm ci`, `npm run api:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:accessibility`, `npm audit --audit-level=high`, and `npm run release:smoke` against the candidate URL. CI executes the source/build sequence from the lockfile and installs pinned Chromium, Firefox, and WebKit automation dependencies. Tests cover student/admin shells, API-backed workflows, loading/empty/error states, safe links, nonce-based Content Security Policy, API destination validation, privacy confirmation, and both jsdom and rendered axe checks. The release smoke verifies public entry routes and browser policy headers on the deployed artifact. The local 126-check browser result is summarized in `docs/ACCESSIBILITY_AUTOMATION_2026-08-24.md` and scoped by `docs/BROWSER_SUPPORT_MATRIX.md`.

## Manual browser matrix

Use `docs/BROWSER_SUPPORT_MATRIX.md` for the automated and human browser boundary. For each critical flow, record keyboard-only completion, visible focus, zoom at 200%, reduced motion, high-contrast readability, loading, empty, offline, unauthorized, provider-unavailable, retry, and terminal-failure states. Real Safari/macOS Full Keyboard Access and pilot screen-reader reviews remain mandatory because headless engines cannot validate device-specific keyboard preferences, reading order, announcements, or lived usability.

## Release boundary

The frontend consumes the checked backend OpenAPI snapshot. The backend must be released first when a contract is additive, and `npm run api:check` must remain clean. Follow `docs/RELEASE_ROLLBACK.md` and record scenarios in `docs/PILOT_UAT.md`. `AGENTS.md`, local skill metadata, local data, and design reference files are not release artifacts. Separate frontend/backend Deep Security Scans completed and sealed on 2026-08-28; remediation and regression evidence is recorded in `docs/PHASE10_SECURITY_CLOSURE_2026-08-28.md` and the backend document of the same name. Staging browser evidence, institutional privacy approval, and named user-acceptance sign-off remain external release gates.
