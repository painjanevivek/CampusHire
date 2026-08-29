# Frontend Release and Rollback

## Build and smoke

Run `npm ci`, `npm run api:check`, `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` against the pinned backend OpenAPI snapshot. Deploy an immutable artifact, then run:

```powershell
$env:BASE_URL = "https://candidate.example.edu"
$env:REQUIRE_HSTS = "true"
npm run release:smoke
```

The smoke verifies landing, student sign-in, administrator sign-in, and privacy routes plus CSP, framing, MIME, referrer, permissions, opener, resource, and optional HSTS policies. Authenticated browser evidence must separately cover readiness, opportunities, resume, roadmap, profile, privacy deletion, and administrator operations.

## Rollback

Rollback selects the preceding immutable frontend artifact; it never rebuilds an old source tree with current dependencies. Confirm that its generated client remains compatible with the deployed additive backend contract. Restore traffic gradually, invalidate only the failed release's assets, and verify sign-in, CSRF, API origin, security headers, and both workspaces.

If the backend contract is incompatible, stop the rollout instead of hiding errors in the UI. Coordinate the backend rollback/runbook, preserve audit evidence, and resume only after the previous frontend/backend pair passes smoke checks.

## Release gates

Separate frontend and backend Deep Security Scans completed and sealed on 2026-08-28; their
closure evidence is recorded in `docs/PHASE10_SECURITY_CLOSURE_2026-08-28.md`. Production
promotion still requires representative authenticated staging tests, human accessibility/UAT
acceptance, approved privacy text, institution-specific operational contacts, managed recovery and
capacity evidence, immutable provenance/signatures, and final authorized `GO`. Development smoke
evidence does not waive these gates.
