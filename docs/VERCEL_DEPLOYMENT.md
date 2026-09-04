# Vercel frontend deployment

Import the CampusHire frontend Git repository as a separate Vercel project.
Select Next.js, keep the repository root as the Root Directory, and use the
checked-in `npm run build` command. No `vercel.json` is required.

## Production environment

Set the following values in the Vercel Production environment:

```dotenv
NEXT_PUBLIC_API_URL=https://api.campushire.example/api/v1
INTERNAL_API_URL=https://api.campushire.example/api/v1
NEXT_PUBLIC_APPLICATION_WIZARD_V1=false
DEMO_LOGIN_ENABLED=false
```

Connect a stable domain such as `app.campushire.example`. Use a sibling domain
such as `api.campushire.example` for the backend. This keeps the existing secure,
`SameSite=Strict` backend session cookies same-site while the browser sends
credentialed API requests.

Do not use an HTTP backend URL in a production or preview deployment. The
frontend rejects plaintext non-loopback API origins.

## Deployment order

1. Deploy and verify the backend API first.
2. Add the backend HTTPS URL to both API environment variables above.
3. Deploy a frontend Preview build.
4. Verify sign-in, session refresh, CSRF-protected writes, sign-out, résumé
   upload and processing, and administrator MFA.
5. Promote the exact verified Preview deployment to Production.

Vercel preview hostnames change. Do not loosen the backend CORS configuration to
`*`. For authenticated previews, use a stable preview alias plus an isolated
preview backend and database, then add only that exact alias to
`FRONTEND_ORIGINS`.
