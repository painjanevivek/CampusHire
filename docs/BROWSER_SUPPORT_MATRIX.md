# Browser Support Matrix

## Automated engineering baseline

| Surface | Chromium | Firefox | WebKit | Required viewports |
| --- | --- | --- | --- | --- |
| Public degraded routes | Required | Required | Required | 320×800, 360×800, 768×1024, 1440×900 |
| Authenticated student routes | Required | Required | Required | 320×800, 360×800, 768×1024, 1440×900 |
| Authenticated T&P routes | Required | Required | Required | 320×800, 360×800, 768×1024, 1440×900 |
| Reduced motion | Required | Required | Required | 1440×900 |
| Forced colors | Required | Required | Required | 1440×900 |
| Reflow | Required | Required | Required | 200% and 400% equivalents |

Chromium and Firefox use their native tab order. Headless WebKit explicitly emulates the macOS Full Keyboard Access preference for native controls. That emulation is engineering evidence only and is not a real Safari acceptance result.

## Human compatibility gate

Before a real-data release, retain complete critical-journey results for current stable Chrome, Firefox, Edge, and Safari on supported desktop platforms, Safari on iOS, and Chrome on Android. Complete real Safari/macOS keyboard testing with Full Keyboard Access enabled and the screen-reader sessions in `docs/PILOT_UAT_SESSION_PACK.md`.

Record browser/OS version, device, viewport, assistive technology, exact frontend/backend SHAs, result, issue links, and retest evidence. A failing critical journey, inaccessible blocker, or unsupported security behavior rejects the candidate.
