# Cloudlight landing width and theme control — design QA

final result: passed

Date: 2026-09-14. Scope: the existing CampusHire landing page container widths and the requested dark/light control only.

## Visual truth and implementation

- Source visual truth: `C:/Users/ASUS/AppData/Local/Temp/codex-clipboard-77b25400-c0c7-4253-947e-1af1d3c9326c.png` (1779 × 1150 px, full dark landing view).
- Focused source truth: `C:/Users/ASUS/AppData/Local/Temp/codex-clipboard-fc3ddd55-cd27-4968-a760-3eba08009a7a.png` (252 × 90 px, account-action region).
- Implementation: <http://127.0.0.1:3002/>. Browser-rendered dark and light captures were taken in Codex's in-app Browser; that capture surface did not expose an on-disk screenshot path.
- Comparison viewport: 1779 × 1150 CSS px, `devicePixelRatio` 1. Source and implementation use the same viewport and no density normalization.
- Additional responsive state: 390 × 844 CSS px, dark theme.

## Comparison evidence

- Full view: the source's nearly edge-to-edge rounded landing frame is retained. Final measured header, hero and following section frames are each 1712px wide at the 1779px viewport; the workspace preview is 1344px wide. No horizontal overflow was observed.
- Focused header region: the required crescent control appears immediately before `Sign In`. Activating it changes the page to the light token set, changes the control to a sun, updates its accessible name to `Switch to dark mode`, and persists `campushire-theme=light`. Activating the sun restores dark mode.
- Focused regions were limited to the shell geometry and account controls because the supplied screenshots did not request changes to lower-page typography, imagery, copy or content hierarchy.
- Browser console check after the final interaction returned no warnings or errors.

## Findings and comparison history

1. **P2, fixed — desktop frames stopped too early.** The previous 87rem outer and 81rem section caps left excessive side space on typical 16-inch/Full-HD displays. Existing header, hero, journey, preview, trust, audience, FAQ and footer frames now share a 107rem cap with responsive gutters. Post-fix evidence measures 1712px at 1779px and 1712px at 1920px.
2. **P2, fixed — workspace preview was undersized.** Its cap increased from 68rem to 84rem, matching the supplied wide hero composition while leaving the hero copy measure unchanged.
3. **P2, fixed — requested theme control was absent.** Added one necessary client control using the already-installed Lucide moon and sun icons. It sits before `Sign In`, has 40px desktop and 35.2px mobile geometry, accessible action labels, system preference fallback and local persistence.

No actionable P0/P1/P2 issue remains in the reviewed desktop, mobile, dark or light states.

## Required fidelity surfaces

- **Typography:** Existing Inter/Manrope/JetBrains Mono hierarchy and line wrapping are unchanged from the selected landing design.
- **Spacing and layout:** Outer frames now use the available desktop width while retaining narrow responsive gutters; the 390px header keeps the brand, toggle, `Sign In` and `Sign Up` on one row.
- **Colors and tokens:** Dark colors remain the default. The light mode uses semantic global tokens for canvas, surfaces, borders, text, focus, status and landing atmospherics rather than page-specific overrides.
- **Image and icon fidelity:** Existing product screenshots and CampusHire brand mark are unchanged. Moon and sun come from the project's existing outline icon library; no custom SVG, emoji or CSS icon was introduced.
- **Copy and content:** No landing copy, section, route or workflow was added or removed.

## Verification

- Focused landing tests: 4 passed, including placement/order, mode switching and persistence.
- Full frontend test suite: 62 files and 213 tests passed.
- Typecheck: passed.
- Lint: passed.
- Production build: passed.
- Browser interactions: dark → light → dark, 1779 × 1150 desktop, 1920 × 1080 Full HD, and 390 × 844 mobile.

## Implementation checklist

- [x] Extend only the existing landing frames for 16-inch/typical desktop screens.
- [x] Add the moon/sun control immediately before `Sign In`.
- [x] Preserve the existing page structure and content.
- [x] Verify desktop/mobile, both themes, accessibility labels, persistence and console health.

---

# Previous QA: Clearline implementation

final result: passed

Date: 2026-09-05. This is a scoped frontend design/interaction review, not a release qualification or a pixel-identical reproduction of fictional records.

## Visual truth and implementation

- Selected option: 1, Clearline.
- Original source: `C:/Users/ASUS/.codex/generated_images/01a0682b-60ac-7903-b02d-e8b7b6ba54fd/exec-ece3cad8-aa37-4a1c-9872-2e402ebe26f5.png`.
- Portable source: [selected-clearline.png](docs/evidence/clearline/selected-clearline.png), 1448 × 1086 design board.
- Preview: <http://127.0.0.1:3001/>; review workspace: <http://127.0.0.1:3001/admin/applications>.
- Frontend base: `cc83ef244e2cb74a0611c2477f1139e7df008df2`, with the uncommitted Clearline changes.
- Backend candidate identifier: `cae7e3f256ae72c54169629360cb719df16a541a`.
- Tracked frontend `src` patch SHA-256: `048f15d1f5c9d5ccc5ad5564721a4a81836ae35b52d74659ce122f94233bdeb5`. Computed from `git -c core.safecrlf=false diff --no-ext-diff -- src`, joining output lines with LF, UTF-8, without a trailing LF. Evidence files are not part of this patch hash.

## Evidence and comparison method

Source and implementation were placed together in each comparison input, then opened and inspected:

- [Applications full comparison](docs/evidence/clearline/applications-comparison.png).
- [Applications focused toolbar/table comparison](docs/evidence/clearline/applications-focused-comparison.png).
- [Student comparison](docs/evidence/clearline/student-comparison.png).
- [Landing comparison](docs/evidence/clearline/landing-comparison.png).
- [Mobile candidate review](docs/evidence/clearline/applications-390.png).
- [Mobile landing](docs/evidence/clearline/landing-390.png).
- [T&P authentication](docs/evidence/clearline/admin-sign-in-1440.png).
- [Actual viewport and geometry observations](docs/evidence/clearline/viewport-checks.json).

The source is a composite concept board, not a browser capture with a declared CSS viewport. Its main application frame is approximately 1409 × 659 pixels; landing and student frames are approximately 673 × 275 and 697 × 275. Comparisons normalize each frame and actual screenshot to a common 1000-pixel width without distorting the aspect ratio. Extra implementation height is retained, not mistaken for a source layout defect. The focused comparison isolates the application title, filters, table headings, and first rows.

Implementation captures use the Codex in-app browser and actual CSS viewports of 390 × 844, 768 × 1024, 1440 × 900, and 1920 × 1080 for the principal screens. At 1440 × 900, the tool returns 1425 × 900 image pixels after excluding the scrollbar. Windows 165% display scaling causes this tool's raster content to occupy the upper-left portion of a padded capture. `normalize-captures.mjs` crops that capture padding at a 1/1.65 ratio and scales it back uniformly. Raw bytes are retained in `*-raw.png` (the tool returns JPEG-encoded bytes despite the filename). No UI, data, text, or missing rows were painted into the captures. These images support composition review, not pixel-sharp antialiasing certification.

State: local synthetic accounts, light theme. The application reference and implementation both show Aarav Sharma / Meridian Systems with a response awaiting officer review. The actual database contains two application records, not the board's illustrative 500. Student state has roadmap guidance, no upcoming items, and an existing match-explanation availability warning; the implementation preserves those facts rather than creating the board's example deadlines.

## Findings and comparison history

1. **P2, fixed — inspector started below the filters.** The early implementation pushed evidence too far down. The selected-record desktop grid now places the inspector in the right column from the page heading. Final observed inspector top is 24px, width 380px, height approximately 853px at 1440 × 900. The mobile view hides the results/filter regions while a candidate is open, retaining Back to results and the review action.
2. **P2, fixed — double student gutters.** The early screenshot had the navigation brand at approximately x=73px but the page heading at x=113px. Removed the redundant width constraint from the student workspace wrapper and synchronized tablet/mobile header gutters. Post-fix DOM measurements put both brand and heading at x=72.73px at 1440 × 900. See the updated student comparison.
3. **P2, fixed — table/toolbar density.** Reduced title, inter-section spacing, queue heading, and cell padding. Final application rows measure approximately 52.6px, with 44px interactive targets; table text is 13px. Native table semantics, page limits, selection, and bounded scrolling are retained. See the post-fix focused comparison.
4. **P1, fixed — cookie launcher covered desktop utilities.** The initial footer controls occupied y=837–881 while the launcher occupied y=833–877. Reserved 64px below the desktop utility row. Post-fix controls end at y=817, with a measured 16px clearance before the launcher; browser hit-testing confirms Help is unobstructed. See [utility-clearance.json](docs/evidence/clearline/utility-clearance.json) and the recaptured application comparison. Mobile retains its top-bar utilities.

No remaining actionable P0/P1/P2 issue was found in the reviewed states. This conclusion does not imply unvisited pages or unperformed accessibility matrices passed.

## Required fidelity surfaces

- **Typography:** Inter content, Manrope controls/navigation, existing JetBrains Mono evidence. Normal body text, medium controls, stronger headings/selected rows/metrics. The board's compact sans-serif hierarchy is preserved; literal font identity cannot be recovered from an image. Headings wrap naturally. Browser computed table font was Inter at 13px. Raster sharpness remains a capture limitation, not an app font defect.
- **Layout:** 200px desktop T&P rail, fluid operational content with 24px gutters, aligned heading/inspector, bounded table scrolling. Student content and navigation share the 1280px grid. Landing retains a controlled split hero, auth retains a focused form and role-specific context, public prose stays narrow. The mobile form/review action comes first.
- **Color/tokens:** Existing cobalt/white/neutral palette, restrained selection fills, quiet borders, smaller radii, green only for verified evidence. The decision spine identifies the active review/primary student action. Persistent decorative tab underlines were not reintroduced.
- **Assets:** Existing supplied CampusHire bridge-C mark and outline icon library reused. No fabricated logos or decorative CSS illustrations. Landing's existing lower product screenshots remain genuine synthetic captures of the preceding interface revision; refreshing those marketing images at full capture resolution is follow-up polish, not evidence of the new interface.
- **Copy/data:** Landing headline follows the chosen board. Existing invitation/access/privacy explanations remain. Real API counts, statuses, timestamps, evidence, corrections, and allowed actions remain authoritative. No invented Export action, reminders, roll numbers, interview schedule, or 500-row browser fixture was introduced.

## Verification actually completed

- `npm test`: **51 files, 189 tests passed**, final full run 2026-09-05 at 12:14 local time.
- `npm run typecheck`: passed.
- `npm run lint`: passed after converting the evidence utilities to ES modules.
- `npm run build`: passed after final visual corrections and the 44px brand-link target.
- `npm run api:check`: passed; checked OpenAPI/types unchanged.
- Focused regression coverage includes a 500-total/25-loaded queue, no detail request before selection, page-bounded selection, existing revision-checked decisions, feedback, URL pagination, bulk previews, and on-demand publishing guide.
- Browser: both synthetic sign-ins; candidate selection; Next candidate; browser Back; Back to results with row focus restoration; page checkbox selection/clear; guide opening/closing; student mobile-menu initial focus and close-after-navigation; cookie preferences opening/saving.
- Browser console error checks returned no entries in the inspected states.
- No production decisions, bulk updates, or publication mutations were performed during the browser review.

Measured containment: applications review, landing, and student dashboard at all four principal widths; both sign-ins at 390/1440; additional admin and student subpages at the actual sizes recorded in `viewport-checks.json`. All recorded settled checks had no page-level horizontal overflow. The JSON deliberately retains some early resize attempts that settled at a different width and two dashboard loading states; those are **not** counted as completed checks of their intended size or loaded content. Wide tables remain internally scrollable.

## Follow-up / pending verification

- Full public/authenticated accessibility and performance runners, 200% browser zoom, screen-reader exercise, full reduced-motion browser matrix, and exhaustive empty/error states were not rerun.
- The real browser fixture has two applications; the 500-record pagination test is an automated component fixture. No 500- or 1000-concurrent-user capacity claim is made.
- The local student dashboard reports existing match-explanation unavailability while preserving formal eligibility. No provider recovery is claimed.
- Refresh lower landing product screenshots when a crisp full-resolution capture is available. The normalized QA images should not replace marketing assets.
- Representative student/T&P usability feedback, staging checks, security qualification, and external approvals remain pending. Authoritative release status was not promoted.
- No commit, push, deployment, paid service, backend change, or database change was performed in this turn.

## Implementation checklist

- [x] Apply selected Clearline direction to shared shells and principal screens.
- [x] Preserve live workflows and real data; compact application table and optional inspector.
- [x] Replace always-visible publishing guide with an on-demand control.
- [x] Fix reviewed alignment/density issues and recapture.
- [x] Record actual automated and representative browser results.
- [ ] Complete the separate release/UAT/security and exhaustive accessibility/performance gates before release approval.
