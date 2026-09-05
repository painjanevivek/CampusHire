# Student profile navigation — scoped verification

Date: 2026-09-05. Local working-tree changes on frontend base `ffd5ebf` and backend base `5fd4701`, not qualification of a committed release pair.

## Delivered

- Student header utilities contain notifications and the profile avatar. The avatar opens Profile, Settings, and Sign out; Settings deep-links to the existing account-settings region.
- Mobile retains a single navigation trigger and 44px utility targets. Navigation, notifications, and the account menu use mutually exclusive open state. Profile-menu keyboard opening, Escape focus restoration, outside dismissal, and link closure are preserved.
- Activation moves into the Profile completion card as an in-flow disclosure. Loading does not claim all steps are complete.
- Optional photo upload/change/removal persists through the authenticated backend; the shared header updates after a successful change. Existing photos survive failed mutations.
- A wrapping support/policy footer contains Help center, Contact support, Accessibility, Privacy, and Terms. Existing cookie controls remain available.
- Tightened Profile mobile copy/spacing and prevented completion counts wrapping.

The frontend-design skill guided the restrained cobalt/neutral layout and the secure-coding skill guided ownership, CSRF, and server-side image validation. The webapp-testing skill guided a native Playwright browser runner, using a fresh local synthetic demo session with normal cookie preference handling.

## Actual checks

- Frontend typecheck, lint, and production build passed.
- Full frontend suite: 194 tests passed in 53 files. Focused tests cover the menu/footer and photo success/failure/removal.
- Full backend suite: 193 passed, 1 skipped; Ruff and MyPy passed.
- Authoritative OpenAPI snapshots match between repositories; checked frontend types regenerated. The ordinary `api:check` git-diff gate was not claimed clean, because these intentional contract changes remain uncommitted.
- Chromium 149.0.7827.55, headless local production build, reduced-motion preference. Actual viewports: 320×800, 390×844, 768×1024, 1440×900, 1920×1080.
- No page horizontal overflow; measured header targets 44×44px; notifications remained inside the viewport.
- Scoped axe WCAG 2 A/AA and 2.1 AA checks on the Profile page reported no violations at all five widths. An initial prohibited ARIA label on the new photo preview was corrected and the checks repeated.
- Menu keyboard opening and Escape focus restoration, Settings anchor navigation, footer Help visibility, and a real photo upload/header update/reload/removal round trip were verified. The first cleanup attempt was blocked by the first-visit cookie panel; the runner was corrected to save essential-only preferences, and the synthetic photo was subsequently removed.
- No page JavaScript errors were reported by the final runner.

## Reproduce and inspect

With the local API/frontend running and existing development-only synthetic demo access configured:

```text
python scripts/profile_mobile_check.py --exercise-photo
```

The runner only allows loopback hosts. Existing photos are preserved; the photo round trip is skipped if one is already present. It records no cookies, passwords, or session tokens.

- [Browser results](profile-navigation/results.json)
- [Mobile profile](profile-navigation/profile-390.png)
- [Mobile account menu](profile-navigation/menu-390.png)
- [Desktop profile](profile-navigation/profile-1440.png)

The local photo migration applied successfully. The wider backend `alembic check` reports unrelated older schema differences; see the backend profile-photo documentation. Full accessibility matrices across all routes/browsers, usability feedback, staging, performance/capacity qualification, security qualification, and external approvals remain pending. No commit, push, or deployment was performed.
