# Frontend Performance Evidence

## Bounded Phase 8 profile

`npm run test:performance` measures a production Next.js build in headless Chromium at 1440×900 over the loopback network. It creates real synthetic student and T&P sessions, then measures the landing page, student dashboard, opportunities, resume workspace/builder, T&P applications, and T&P drives.

The gate records LCP at or below 2,500 ms, CLS below 0.1, observed browser event latency at or below 200 ms, response TTFB, request count, encoded JavaScript transfer size, exact-route retention, and browser console errors. Route-specific JavaScript ceilings are 300 KiB for the landing page, 500–550 KiB for student routes, and 600 KiB for dense T&P routes.

The exact-candidate run recorded at `2026-09-02T15:23:03Z` passed all seven routes with no browser console errors. Observed LCP was 112–180 ms, CLS was 0–0.0026, observed event latency was 16 ms, TTFB was 4.2–6.2 ms, and JavaScript transfer was 136.94–172.99 KiB.

## Evidence boundary

These are repeatable local lab measurements, not production Core Web Vitals or SLO evidence. They do not represent mobile hardware, constrained bandwidth, geographic latency, production concurrency, or field users. Production activation still requires an agreed device/network profile, retained staging measurements, and operational owners for performance regressions.
