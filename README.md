# CampusHire AI

CampusHire AI is a student-first campus recruitment and career-readiness platform. The frontend provides separate, accessible experiences for students and Training and Placement administrators.

## Local development

1. Copy `.env.example` to `.env.local`.
2. Install dependencies with `npm install`.
3. Start the application with `npm run dev`.
4. Open `http://localhost:3000`.

Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` before committing.

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
