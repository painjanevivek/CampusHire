# Student and Administrator Pilot UAT

Use `docs/PILOT_UAT_SESSION_PACK.md` for deterministic facilitation, `.github/ISSUE_TEMPLATE/accessibility-uat.yml` for findings, and `docs/PILOT_UAT_ACCEPTANCE.md` for the sanitized decision record. Run the production browser matrix before and after fixes with `npm run test:accessibility` against `http://127.0.0.1:3199`.

## Session record

Record the institution, date, facilitator, participant role, device/browser, assistive technology, approved fixture set, frontend/backend commit SHAs, API contract hash, and policy version. Keep identities, credentials, resumes, and production data outside Git.

## Student journey

- Sign in and resume profile creation after leaving mid-step.
- Identify the single next readiness action and explain its reviewed source facts.
- Browse and filter opportunities; distinguish formal eligibility from semantic relevance.
- Inspect an eligible, manual-review, and ineligible explanation; submit an eligible application.
- Upload a safe resume, observe processing/retry, review extraction, reject an unsupported suggestion, generate a new version, and download it.
- Select a roadmap, update progress, review notifications, and open privacy controls.
- Confirm deletion remains disabled until the exact phrase and verify a documented retention hold safely blocks deletion.

## Administrator journey

- Create a company, drive, role, and versioned eligibility rules; publish and close the drive.
- Review applications and decision evidence without treating semantic match as eligibility.
- Exercise a policy-linked override with an authorized account and verify a routine reviewer is denied.
- Inspect worker health, filter job states, cancel a queued job, retry a permitted failure, and open the immutable event timeline.
- Locate audit evidence for publication, eligibility, application, override, and operator actions.

## Accessibility and resilience

Repeat critical actions by keyboard, at 200% zoom, in a 390 px viewport, with reduced motion, and with the selected screen reader. Include the real Safari/macOS Full Keyboard Access session and platform/browser coverage in `docs/BROWSER_SUPPORT_MATRIX.md`. Verify visible focus, meaningful order/names, reflow, non-colour status cues, and announced errors. Exercise loading, empty, unauthorized, offline, provider-unavailable, failed, retry, stale-version, and closed-deadline states.

## Triage and decision

For every observation record severity, affected requirement, owner, target date, evidence, and retest. Cross-tenant access, data loss, dishonest authority, critical/high security, or accessibility blockers reject the release. Final acceptance requires named product, institution T&P, privacy/legal, accessibility, and security/platform approvers; this checklist alone is not sign-off.
