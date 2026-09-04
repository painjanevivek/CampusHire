# CampusHire AI

CampusHire AI is a student-first campus recruitment and career-readiness platform. The frontend provides separate, accessible experiences for students and Training and Placement administrators.

## Local development

1. Copy `.env.example` to `.env.local`.
2. Install dependencies with `npm install`.
3. Start the application with `npm run dev`.
4. Open `http://localhost:3000`.

Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` before committing.

When ports 3000/8000 are already occupied, run `npm run dev -- --port 3002` and set `NEXT_PUBLIC_API_URL=http://127.0.0.1:8001/api/v1` in `.env.local`. Do not point this frontend at another project's API.

`npm run api:generate` refreshes typed API declarations from the checked OpenAPI snapshot. `npm run api:check` verifies that the snapshot and generated declarations agree.

For local demo buttons, set the server-only `DEMO_LOGIN_ENABLED=true` in `.env.local` and configure and seed the backend demo accounts as described in the backend README. This frontend flag only renders the student and T&P buttons; the backend remains authoritative and refuses demo sign-in outside development and test environments.

## Product principles

- Eligibility and semantic match are separate results.
- AI supports decisions; deterministic rules and accountable humans remain authoritative.
- GitHub and portfolio links are optional unless a published role explicitly requires them.
- Students review AI-extracted profile data and resume changes before acceptance.
- Core placement workflows must continue when an AI provider is unavailable.
- Personal data is collected only for a documented purpose.

## Documentation

- [Product scope](docs/PRODUCT_SCOPE.md)
- [Project glossary](docs/GLOSSARY.md)
- [Architecture decisions](docs/ARCHITECTURE_DECISIONS.md)
- [Delivery and change control](docs/DELIVERY.md)
- [Contributing](CONTRIBUTING.md)
- [Security policy](SECURITY.md)

## Repositories

- Frontend: <https://github.com/painjanevivek/CampusHire>
- Backend: <https://github.com/painjanevivek/CampusHire-backend>

The backend API URL is configured through `NEXT_PUBLIC_API_URL`.

## Vercel deployment

Import this repository as a Next.js Vercel project and use the repository root
as the Root Directory. Set `NEXT_PUBLIC_API_URL` and `INTERNAL_API_URL` to the
same HTTPS backend base URL. Keep `DEMO_LOGIN_ENABLED=false` in production. See
[the Vercel deployment runbook](docs/VERCEL_DEPLOYMENT.md) for the exact project,
domain, and verification steps.
