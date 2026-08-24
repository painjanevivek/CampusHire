# Frontend staging artifact

`Dockerfile` produces a non-root Next.js standalone image from the pinned Node 24 base. Build the public API destination into the client bundle and use the same value at runtime:

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://staging.example.edu/api/v1 \
  --tag registry.example.edu/campushire-frontend:<commit> .
```

Push the image, deploy by immutable digest, and record that digest with the frontend commit and backend OpenAPI hash. The provider-neutral topology routes `/api/*` through the same HTTPS gateway, so browser cookies remain first-party and the CSP `connect-src` stays narrow.

The container runs as the unprivileged `node` user, exposes only port 3000 to the private edge network, disables telemetry, and has a local HTTP health probe. The deployment layer must retain a read-only root filesystem, a writable ephemeral `/tmp`, dropped capabilities, `no-new-privileges`, HSTS, and certificate automation. No database, Redis, parser, storage, or Gemini secret belongs in the frontend image or environment.
