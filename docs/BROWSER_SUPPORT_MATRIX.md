# Browser Support Matrix

## Automated release baseline

Playwright `1.61.0` runs the production bundle in its pinned Chromium, Firefox, and WebKit engines. Each engine covers public and student routes at 360×800, 768×1024, and 1440×900; administrator routes cover tablet and desktop. Release automation requires rendered WCAG 2.0–2.2 A/AA axe checks, a main landmark and heading, complete visible keyboard traversal, visible focus, no horizontal overflow, reduced motion, forced colors, 200% reflow equivalence, and no unexpected console errors.

| Engine | Keyboard mode | Automated status |
| --- | --- | --- |
| Chromium | Native tab order | Required |
| Firefox | Native tab order | Required |
| WebKit | Emulated macOS Full Keyboard Access | Required |

WebKit headless inherits Safari’s OS-level keyboard preference. The runner assigns explicit test-only `tabindex` values to native focusable controls to emulate Full Keyboard Access. This changes only the browser test document, not production code.

## Human compatibility gate

Playwright WebKit is not branded Safari and cannot prove device-specific assistive-technology behavior. Before release, record the critical student and administrator journeys in current stable Chrome, Firefox, Edge, and Safari on supported desktop platforms, plus Safari on iOS and Chrome on Android. Complete a real Safari/macOS keyboard session with Full Keyboard Access enabled and the screen-reader sessions defined in `docs/PILOT_UAT_SESSION_PACK.md`.

Record browser/OS versions, device, viewport, assistive technology, candidate SHAs, result, issue links, and retest evidence. A failing critical journey, inaccessible blocker, or unsupported security behavior rejects the candidate.
