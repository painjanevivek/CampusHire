# Contributing

## Workflow

1. Choose an issue with plain-language acceptance criteria.
2. Keep the change focused on one behaviour or capability.
3. Reuse existing components, modules, platform features, and dependencies before adding abstractions.
4. Add or update the smallest tests that prove non-trivial behaviour.
5. Run all relevant checks locally.
6. Review the diff for secrets, personal data, unrelated files, and generated artefacts.
7. Use the phase commit format documented in `docs/DELIVERY.md`.

## Required quality

- Validate trust-boundary input on the backend.
- Enforce authorization and institution ownership server-side.
- Keep secrets out of source, logs, browser bundles, and examples.
- Use accessible semantic HTML and keyboard-operable controls.
- Provide loading, empty, failure, and recovery states.
- Prefer server rendering and progressive disclosure; add client-side state only when interaction requires it.
- Do not introduce a dependency for behaviour that the platform or a few clear lines already provide.
- Keep public API and database changes versioned and documented.

## Review checklist

- Does the change solve the issue without unrelated scope?
- Can a student or administrator understand errors and next actions?
- Are privacy, abuse, authorization, and failure cases handled?
- Does retry remain idempotent?
- Are AI outputs validated, grounded, budgeted, and reviewable?
- Does the UI remain usable at mobile and desktop widths?
- Can the change be disabled, rolled back, or recovered safely?
