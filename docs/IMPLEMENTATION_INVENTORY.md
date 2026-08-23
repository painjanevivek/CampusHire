# Frontend Implementation Inventory

This inventory is the Phase 1 baseline for FR-001 through FR-016. It distinguishes connected behaviour from presentation fixtures so later phases do not mistake a polished screen for a completed workflow.

| Surface | Current disposition | Owner phase |
| --- | --- | --- |
| Landing, privacy, sign-in, sign-up, offline and global error states | Reusable production UI; authentication forms use the credentialed API client | 1 and 6 |
| Student workspace and navigation | Shared shell with Readiness, Opportunities, Resume, Roadmap and Profile routes | 1 |
| Dashboard | Tested readiness hierarchy; data is still a local sample | 5 |
| Onboarding/profile | API-connected base profile form; subresources, autosave conflict handling and membership context remain | 2 |
| Resume workspace and builder | Upload/generate foundations are API-connected; review jobs and immutable user decisions remain | 2 |
| Opportunities and role detail | Familiar, tested search presentation; current role records are fixtures | 3 and 4 |
| Roadmap | Tested presentation over curated sample data; persistence and versioned templates remain | 5 |
| Administration | Separate shell and stable MVP route map; operational data views remain fixtures or explicit empty states | 3 through 5 |

## Contract boundary

`openapi/campushire.openapi.json` is a reviewed snapshot exported from the backend. `npm run api:generate` produces `src/lib/api/generated/`, and `npm run api:check` fails when generated types drift from the checked snapshot. Backend changes must refresh the snapshot before frontend integration.

## Preserved work

The opportunity deadline and Nexora role-detail edits that predated Phase 1 remain unmodified and unstaged by this phase. Tool metadata, `AGENTS.md`, and `design.md` are excluded from release commits.
