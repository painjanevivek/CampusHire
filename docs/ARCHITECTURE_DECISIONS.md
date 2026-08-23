# Architecture decisions

These decisions remain active until replaced by a reviewed Architecture Decision Record.

## ADR-001: Two repositories, two deployables

The Next.js frontend and FastAPI backend live in separate repositories and release independently. The backend OpenAPI schema is the source of truth for the `/api/v1` contract. Frontend API types are generated or checked from that schema.

## ADR-002: Modular backend monolith

The backend is one deployable application organized into business modules, plus separate background workers for slow jobs. Microservices are deferred until measured scaling, reliability, release, or ownership requirements justify extraction.

## ADR-003: Server-side session authentication

The browser receives an opaque identifier in a Secure, HttpOnly, SameSite cookie. Session metadata is revocable server-side. State-changing requests require CSRF protection. Browser local storage is not used for authentication tokens.

## ADR-004: Data-store responsibilities

- PostgreSQL is the durable source of truth.
- Redis stores revocable sessions, rate-limit counters, cache entries, locks, and short-lived queue state.
- Qdrant stores versioned embeddings and searchable vector metadata.
- Object storage holds original and generated files outside the application web root.

Critical business records must not exist only in Redis or Qdrant.

## ADR-005: Deterministic eligibility, separate semantic match

AI may propose structured rules and retrieve evidence, but only a typed deterministic engine decides eligibility. Semantic matching runs separately. Both results retain versions and explanations.

## ADR-006: Bounded AI orchestration

Normal CRUD uses ordinary services. LangGraph is limited to multi-step AI workflows that benefit from explicit state, retry, budgets, and human review. Every run records model and prompt versions, duration, status, and cost indicators.

## ADR-007: Asynchronous document and AI work

Uploads and expensive AI work return a job identifier quickly. Idempotent workers process jobs with bounded retry. The UI progressively renders queued, processing, completed, failed, and retry states.

## ADR-008: Curated roadmap templates

Approved graph templates define valid skills and prerequisites. AI personalizes evidence, progress, gaps, and next actions inside those boundaries. It does not publish unreviewed curricula.

## ADR-009: Progressive onboarding

Only identity, institutional identity, core education, and a target role are required to complete onboarding. Optional sections are autosaved and can be finished later. Profile readiness explains every missing item.

## ADR-010: Accessible semantic design system

The UI uses semantic OKLCH colour tokens, a deliberate type scale, a consistent spacing system, visible focus, reduced-motion support, and responsive progressive disclosure. Status never depends on colour alone.

## ADR-011: Quarantined object storage and mandatory malware scanning

Resume files move through opaque object keys and explicit `quarantined`, `clean`, `infected`, or `scan_failed` states. Development and tests use the filesystem object-store adapter and deterministic marker scanner; staging and production use the same interfaces with S3-compatible private storage and a network-isolated ClamAV service. Parsing and downloads are forbidden until a scan is clean. File metadata, checksums, ownership, retention class, and scan evidence remain authoritative in PostgreSQL.

## ADR-012: PostgreSQL-authoritative jobs with supervised workers

Resume processing jobs are durable PostgreSQL records claimed with row locks. Redis may wake workers or hold short leases, but losing Redis cannot lose a job. The API and worker use the same backend artifact with separate process commands. Workers heartbeat, retry with bounded backoff, and expose terminal safe error codes. Local Windows development uses the same polling worker without requiring a Unix-only process manager; production supervision is provided by the selected container or service platform.

## Deliberately rejected for the MVP

- Microservices and Kubernetes.
- Kafka or an event-streaming platform.
- GraphQL in addition to a sufficient REST API.
- A custom authentication framework.
- Real-time WebSockets before polling proves inadequate.
- Server-side fetching of arbitrary student portfolio URLs.
