# Delivery and change control

## Milestones

| Milestone | Phases | Outcome |
|---|---|---|
| M1 Foundation | 0-2 | Governance, repository foundations, and secure authentication. |
| M2 Student profile | 3-5 | Onboarding, secure resume processing, and controlled resume improvements. |
| M3 Placement operations | 6-7 | Drives, applications, and deterministic eligibility. |
| M4 Intelligent matching | 8-9 | Evaluated semantic matching and grounded policy explanations. |
| M5 Career readiness | 10-11 | Roadmaps, feedback, dashboards, and notifications. |
| M6 Production pilot | 12-13 | Hardening, evaluation, controlled pilot, and release evidence. |

## Change request

A proposed scope change must state:

1. The user problem and affected users.
2. Why the current MVP cannot solve it.
3. In-scope and out-of-scope behaviour.
4. Data, privacy, security, UI, API, AI, and operational impact.
5. Estimated effort and milestone impact.
6. Acceptance criteria and success evidence.
7. Whether the proposal replaces, extends, or contradicts an existing decision.

Ideas without a current user problem remain future scope.

## Phase completion

A phase is complete only when:

- Its exit criteria are met.
- Relevant lint, type, unit, integration, build, and security checks pass.
- Loading, empty, error, unauthorized, and dependency-failure states are handled where applicable.
- Documentation and API contracts are current.
- Another contributor reviews the changes.
- The phase has one scoped commit per affected repository and is pushed.

## Commit format

Use one of:

```text
feat(phase-N): concise outcome
fix(phase-N): concise correction
```

The commit body uses copy-pastable bullet points describing what changed and how it was verified.

## Team ownership

The team assigns primary ownership for frontend/design, backend/data, and AI/evaluation/platform. Ownership does not remove peer review. At least one contributor other than the author reviews every pull request or phase commit before a production release.

## Evidence policy

- Product metrics are measured against a named baseline.
- AI evaluation records dataset, rubric, model, prompt, and scoring versions.
- Academic references are verified before publication.
- Decisions affecting a student's eligibility or shortlist remain reproducible and appealable.
