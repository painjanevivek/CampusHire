# Student Applications refinement — 2026-09-05

Scope: student `/applications` list only. This verifies the local working tree, including pre-existing uncommitted Clearline changes; it is not release qualification for a pinned candidate pair.

## Changes

- Responsive white application cards with company identity, semantic status badges, saved submission versions, and a clear detail link.
- Display the backend-provided next-step guidance without inferring employer activity or application progress.
- Preserve native expandable status history, original timestamps and reasons, existing API requests, and routes.
- Do not show an empty-state claim when the initial request fails; keep existing results visible during refresh.

The frontend-design skill guided the restrained blue/neutral hierarchy, selective emphasis, and compact metadata. No new imagery, dependencies, backend contracts, or application mutations were introduced.

## Automated verification

- Focused regression tests: 3 passed. Before implementation, 2 of these failed and 1 passed.
- Full frontend suite: 192 tests passed in 52 files.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.

## Browser verification

Local production build at `http://127.0.0.1:3001/applications`, using the existing synthetic student session and two real fixture applications.

| Actual CSS viewport | Document scroll width | Result |
| --- | --- | --- |
| 390 × 844 | 375px | One-column cards; no horizontal overflow |
| 768 × 1024 | 753px | One-column cards; no horizontal overflow |
| 1440 × 900 | 1440px | Two aligned 630px cards; no horizontal overflow |
| 1920 × 1080 | 1920px | Two aligned 630px cards in bounded content region; no horizontal overflow |

The 15px difference on narrower viewports is the vertical scrollbar. Mobile detail links measured approximately 44px high (43.996px browser rounding).

Verified expanding/collapsing the first application's recorded history, opening its detail page, and returning through All applications. Browser error log returned no errors during these checks.

Representative raw captures:

- `clearline/student-applications-1440-raw.png`
- `clearline/student-applications-390-raw.png` (history expanded)

These are unmodified browser screenshot bytes. The local Windows/browser capture surface scales content into the upper-left of its raster; CSS viewport measurements above are the authoritative responsive dimensions.

Full accessibility matrices, user acceptance, staging, external approvals, and security qualification were not performed by this scoped UI check. No commit, push, or deployment was performed. The local frontend was rebuilt and restarted.
