# Frontend Implementation Inventory

This inventory records the implementation state through Phase 2. It distinguishes connected behaviour from presentation fixtures so later phases do not mistake a polished screen for a completed workflow.

| Surface | Current disposition | Owner phase |
| --- | --- | --- |
| Landing, privacy, sign-in, sign-up, offline and global error states | Reusable production UI; authentication forms use the credentialed API client | 1 and 6 |
| Student workspace and navigation | Shared shell with Readiness, Opportunities, Resume, Roadmap and Profile routes | 1 |
| Dashboard | Tested readiness hierarchy; data is still a local sample | 5 |
| Onboarding/profile | Resumable API-backed wizard with section autosave, revision-safe conflict recovery and minimum/optional disclosure | Complete in 2 |
| Resume workspace and builder | Quarantined upload status, durable-job polling/retry, field review, suggestion decisions, immutable versions and PDF download | Complete in 2 |
| Opportunities and role detail | Familiar, tested search presentation; current role records are fixtures | 3 and 4 |
| Roadmap | Tested presentation over curated sample data; persistence and versioned templates remain | 5 |
| Administration | Separate shell and stable MVP route map; operational data views remain fixtures or explicit empty states | 3 through 5 |

## Contract boundary

`openapi/campushire.openapi.json` is a reviewed snapshot exported from the backend. `npm run api:generate` produces `src/lib/api/generated/`, and `npm run api:check` fails when generated types drift from the checked snapshot. Backend changes must refresh the snapshot before frontend integration.

## Phase 2 operational boundary

The UI treats uploaded files as unavailable until the API reports a clean scan and completed extraction. Review decisions are explicit and become read-only when a version completes. Authentication redirects new students into onboarding, and the Content Security Policy derives its API origin from `NEXT_PUBLIC_API_URL`.

## Preserved work

The opportunity deadline and Nexora role-detail edits that predated Phase 1 remain unmodified and unstaged by this phase. Tool metadata, `AGENTS.md`, and `design.md` are excluded from release commits.
