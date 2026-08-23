# Frontend release evidence

## Automated gates

Run `npm ci`, `npm run api:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm audit --audit-level=high`, and `npm run release:smoke` against the candidate URL. CI executes the source/build sequence from the lockfile. Tests cover student/admin shells, API-backed workflows, loading/empty/error states, safe links, nonce-based Content Security Policy, API destination validation, privacy confirmation, and axe-core checks for critical shells. The release smoke verifies public entry routes and browser policy headers on the deployed artifact.

## Manual browser matrix

Validate the landing page and every student route at 360×800, 768×1024, and 1440×900. Validate administrator operations at 768×1024 and 1440×900. For each critical flow, record keyboard-only completion, visible focus, zoom at 200%, reduced motion, high-contrast readability, loading, empty, offline, unauthorized, provider-unavailable, retry, and terminal-failure states. A pilot screen-reader review remains mandatory because jsdom cannot validate reading order, announcements, or rendered colour contrast.

## Release boundary

The frontend consumes the checked backend OpenAPI snapshot. The backend must be released first when a contract is additive, and `npm run api:check` must remain clean. Follow `docs/RELEASE_ROLLBACK.md` and record scenarios in `docs/PILOT_UAT.md`. `AGENTS.md`, local skill metadata, local data, and design reference files are not release artifacts. Separate frontend/backend Deep Security Scan reports, staging browser evidence, institutional privacy approval, and named user-acceptance sign-off remain external release gates.
