# Phase 08 Frontend release-candidate record

**Status:** Engineering validation is complete for the source pair below. The release remains
**synthetic-only / NO-GO for real student data and production** until institutional policy, external
review, deployment, and final authorization gates are closed.

## Candidate identity

| Item | Value |
| --- | --- |
| Frontend branch | `feat/landing-and-sign-in-experience` |
| Backend branch | `phase/08-release-candidate` |
| Frontend source commit | `533fd4e9c1d6fa5aa8fefed8815d07e3992acb9d` |
| Backend source commit | `532dd83056a95d0769b5d2f4991128688e921bd1` |
| Frontend parent | `bf26df9e431d1364e66098705420aee984073f03` |
| Backend parent | `2dc5e56fd25a6bd028700adf92fff9212d06e615` |
| OpenAPI SHA-256 | `C58EF1A6271958173AAFA6FC60D9FE555C44C477E91634B8EBD649F8660E6D41` |
| Generated `types.gen.ts` SHA-256 | `5D86977D75AE3C1AA02AAAA1ABF3E4D8342C9EFFF32A1B53E2303E91462DC43D` |
| Backend Alembic code head | `20260923_0038` (one head) |
| Data classification | Synthetic only |

## Engineering evidence

- Frontend Vitest: **79 test files, 287 tests passed**.
- Frontend TypeScript typecheck, ESLint, and production build: **passed**.
- Backend pytest: **262 passed, 1 skipped**; Ruff and strict MyPy: **passed** across 149 source files.
- Backend and Frontend OpenAPI snapshots are byte-identical. Repeated generated-client output was
  stable at the SHA-256 above.
- The public production smoke passed on `/`, `/sign-in`, `/admin/sign-in`, and `/privacy`.
- The Chromium public accessibility matrix passed **24 of 24** route/viewport checks across `/`,
  `/offline`, `/privacy`, `/sign-in`, `/sign-up`, and `/unauthorized` at mobile 320px, mobile 360px,
  tablet 768px, and desktop 1440px. It recorded zero axe violations, keyboard traversal failures,
  or unexpected browser console errors.
- Frontend tests cover landing-page rendering and theme behavior, role-preserving sign-in and safe
  return paths, student registration pending/error/retry states, and the onboarding journey.
- Backend integration tests cover student signup and onboarding against the current API contract,
  including empty optional stages, required final review confirmation, privacy acceptance, and the
  project type/description limits.

## Contract and user-policy boundary

The client was regenerated from the committed Backend OpenAPI contract. Onboarding now preserves
the separate education fields required by that API, sends an explicit project type, permits only the
experience and project/skills stages to be empty, and retains required education, placement privacy,
and final confirmation checks. The project description label and helper text are programmatically
associated for assistive technology.

The signup UI can display a pending-review response if the API returns one, and reports unavailable
institution options separately from server validation failures. However, the current student signup
endpoint can create an active student session/membership; institution registration review is a
separate workflow. The institution must decide whether student admission itself requires human
review. Do not describe this candidate as providing institution-reviewed student admission until
that policy is approved and the backend behavior implements it.

The accessibility harness's unavailable-API fixture now returns a credentialed, exact-origin CORS
response and handles preflight explicitly. Its prior wildcard response caused browser errors during
the degraded signup checks; the corrected matrix now passes. This is a test-harness correction, not
a production CORS policy change.

## Remaining release gates

This record establishes engineering checks only. It does not document legal or privacy approval,
representative Student and Officer UAT, accessibility acceptance by the institution, approved
support and alert ownership, staging deployment, current security approval, cost/capacity evidence,
artifact provenance, restore rehearsal, or a final candidate-specific authorization. Those decisions
remain in the authorized institutional record; `REAL_DATA_AUTHORIZATION_LOG.md` is unchanged.

The candidate must remain synthetic-only. Do not claim production or real-data GO until the named
authority records an explicit decision for these source commits and the approved institution, limits,
conditions, and expiry.
