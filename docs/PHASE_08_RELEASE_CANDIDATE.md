# Phase 08 Frontend release-candidate record

Status: **engineering candidate complete; real-data and production decision remains NO-GO**.

## Candidate identity

| Item | Value |
| --- | --- |
| Branch | `phase/08-release-candidate` |
| Frontend parent | `6d11b785be47a6aeb56956c99a339e8f7ced7115` |
| Backend parent | `ef790dd1aaea0f671bd17dd165ac3d8075f9ba45` |
| Candidate commits | The Frontend and Backend commits containing this record; report the pushed SHAs together |
| OpenAPI SHA-256 | `B92CE1B65543596FD23AB5D7B5A285405C7016F2983ED90702B34F27A890750E` |
| Backend migration head | `20260923_0036` |
| Data classification | Synthetic only |

## Engineering evidence

- 77 test files and 263 tests pass.
- ESLint, TypeScript typecheck, and the Next.js production build pass.
- The reviewed Backend OpenAPI snapshot is copied byte-for-byte and generated API output is stable
  across repeated generation.
- The Platform Admin institution page exposes protected provisioning as progressive disclosure,
  calls only the authenticated Platform Admin API, and displays the activation code only from the
  immediate response with explicit one-time handoff guidance.
- The focused institution test covers submission, CSRF-bearing API use, one-time code display, and
  safe error handling.

## Security and authority disposition

Frontend standard scan `31893d29-8c23-4f9e-b936-ffcade36a5fd` reported zero findings across nine
reviewed parent surfaces. The Phase 8 UI does not reintroduce the retired operator-key API: the
generated client and institution workspace use the protected `/platform/institutions` contract.
The Backend candidate separately removes the legacy routes and requires the singleton Platform
Admin session, capability, authenticated CSRF, recent MFA, audit attribution, and no-store handling.

This source evidence is not a deployed penetration test, participant UAT, or security approval.
The current UAT record remains pending, and no image digest, SBOM, provenance, signature, approved
registry promotion, named alert recipient, measured capacity/cost result, or final real-data
authorization is recorded for this source pair.

Therefore `main` remains untouched, the application remains synthetic-only, and this branch cannot
be described as production or commercially qualified until the candidate-specific external gates
are completed and an explicit `GO` is recorded.
