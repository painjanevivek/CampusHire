# Phase 6 accessibility engineering status

Status: **engineering automation passed; representative human UAT pending**

This record applies to the stacked `phase/06-accessibility` candidate. It does not
authorize real student data or production release. The candidate remains subject to
the later operations, security, institutional, and release-governance gates.

## Automated evidence

The local synthetic environment exercised six public/degraded routes, six authenticated
Student routes, and four authenticated T&P routes at 320x800, 360x800, 768x1024, and
1440x900. Each engine also ran reduced-motion, forced-colour, and 200%/400% reflow
checks. Authentication used the Backend's development-only synthetic session endpoint;
no credentials or session values were written to evidence.

| Engine | Route/viewport checks | Unexpected console errors | Result | UTC record |
| --- | ---: | ---: | --- | --- |
| Chromium headless | 64 | 0 | Pass | 2026-09-22 21:08:25 |
| Firefox headless | 64 | 0 | Pass | 2026-09-22 21:16:54 |
| WebKit headless | 64 | 0 | Pass | 2026-09-22 21:26:00 |

The matrix checks one visible main landmark and heading, serious/critical axe findings,
keyboard reachability and visible focus, 44px target geometry, horizontal overflow,
expected route access, dependency-degraded states, and unexpected console failures.

## Repairs made from the matrix

- Removed duplicate registration navigation and expanded its consent target to 44px.
- Made keyboard tracking stable across asynchronous DOM updates and native date-input
  subcontrols without suppressing genuine unreachable controls.
- Replaced obsolete Admin operational coverage with the real T&P workspace routes.
- Kept synthetic authentication private to development without restoring public demo
  buttons or persisting credentials.
- Reflowed Student and T&P mobile utilities so 320px and 400% layouts do not overflow.
- Raised shared action targets to the 44px baseline and corrected dark-theme badge and
  resume-action contrast.
- Added a named main landmark, heading, busy state, and live status to onboarding load.
- Made the loopback HTTPS bridge deterministic across Chromium, Firefox, and WebKit.

## Still required before the Phase 6 external gate can close

- Representative Student and T&P Officer keyboard and screen-reader sessions.
- Real Safari testing on supported Apple hardware and the documented Android coverage.
- Retest and disposition of every human finding against the exact candidate commit.
- Accountable accessibility/UAT approval tied to the frozen release candidate.

Until those sessions are recorded, CampusHire must not claim that all critical journeys
have completed representative WCAG 2.2 AA qualification.
