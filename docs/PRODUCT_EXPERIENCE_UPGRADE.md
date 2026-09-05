# CampusHire product experience upgrade

Implementation and rollout record: `../../Backend/docs/PRODUCT_EXPERIENCE_UPGRADE.md`.
Authoritative release decision: `../../Backend/docs/CURRENT_RELEASE_STATUS.md`.
Paired working-tree evidence: `../../Backend/docs/evidence/product-experience-20260905.json`.

New routes: `/preparation`, `/opportunities/compare`, `/admin/reports`. Existing routes and deep
links remain supported. Deploy the additive backend through Alembic `20260905_0022` before this
frontend. No new paid service, Redis dependency, environment secret, or stack migration is needed.

The student-priority and T&P review experiences were delivered first. New components in
`src/features/experience` reuse the CampusHire design system, preserve reviewed-source authority,
and keep supplemental responses separate from original application snapshots. Navigation keeps
role-specific groupings, visible focus, mobile access, and cookie controls. The frontend-design
guidance shaped the compact review layout and the distinction between workspaces and marketing.

Landing screenshots in `public/product-evidence` were captured from actual completed interfaces
with local synthetic accounts; they are illustrative, not customer testimonials or live records.

Run `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, and `npm run api:check`.
The final command intentionally compares to committed HEAD: it cannot pass until the new contract
and generated types belong to a committed candidate. Independent regeneration has been checked
for byte stability; this does not turn the Git-clean gate into a pass.

Additional local runners are in `scripts/experience_*`, `scripts/navigation_performance.py`, and
the existing accessibility/performance matrices. Workflow runners use local synthetic accounts
and create retained request/history or drive records; read the backend record before running.

Changes remain uncommitted. Local verification does not authorize real student data, replace
security qualification, or constitute institutional/UAT approval.
