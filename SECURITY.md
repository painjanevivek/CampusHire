# Security policy

## Reporting

Do not open a public issue containing a vulnerability, exploit, secret, or student data. Report it privately to the project maintainers with the affected area, reproduction steps, impact, and any suggested mitigation.

## Baseline controls

- Least-privilege role and institution authorization.
- UUID identifiers for externally visible resources.
- Argon2id password hashing and revocable server sessions.
- Secure, HttpOnly, SameSite cookies plus CSRF protection.
- Server-side validation and parameterized database access.
- Restricted CORS and production security headers.
- Strict PDF validation, parsing limits, quarantine, and authorized file delivery.
- No backend fetching of arbitrary user URLs in the MVP.
- PII and secrets redacted from logs, traces, and AI requests when not required.
- Uploaded resumes, job descriptions, and policies treated as untrusted content.
- Bounded AI tools, schemas, retries, loops, and cost limits.

## Supported versions

Until the first production release, only the latest `main` branch is maintained. A supported-version table will be added when tagged releases begin.
