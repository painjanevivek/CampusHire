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

The frontend Deep Security Scan was explicitly deferred by the user on 2026-08-24; the current audit does not claim it passed. Production promotion still requires representative authenticated staging tests, human accessibility/UAT acceptance, approved privacy text, institution-specific operational contacts, and resolution or formal resumption of deferred security review. Development smoke evidence does not waive these gates.
