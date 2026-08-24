# Pilot UAT Session Pack

## Safe setup

Use a staging deployment and synthetic tenant only. Label accounts `student-ready`, `student-manual-review`, `student-ineligible`, `tnp-reviewer`, and `tnp-override-authority`; obtain credentials from the approved secret channel. Never place credentials, participant identity, resumes, or recordings in Git. Record candidate SHAs, OpenAPI hash, browser/device, assistive technology, and policy version before starting.

## Student script

1. Resume an interrupted profile, identify the single next action, and explain why it was selected.
2. Compare eligible, manual-review, and ineligible roles; confirm match language is separate from formal eligibility.
3. Submit an eligible application and verify retry/idempotency does not create a duplicate.
4. Upload the approved synthetic PDF, review extraction, reject an unsupported suggestion, create a new resume version, and download it.
5. Progress a roadmap item, open a notification, inspect privacy controls, and exercise a documented offline/provider-unavailable state.

## Administrator script

1. Create a synthetic company, drive, role, and versioned rule set; publish and close the drive.
2. Review decision evidence and verify a routine reviewer cannot perform a policy override.
3. Use the authorized synthetic account to record a policy-linked override reason.
4. Inspect worker health, cancel/retry permitted jobs, and locate immutable audit events.

## Accessibility facilitation

Run the critical journey by keyboard at 200% zoom and 390 px width, then with reduced motion, forced/high-contrast colors, and the selected screen reader. Ask participants to describe focus location, status changes, errors, and decision explanations in their own words. Do not coach an expected answer.

Log every observation with the accessibility/UAT issue template. Blocker/high accessibility defects, cross-tenant exposure, data loss, or misleading authority language stop acceptance and require a fix plus independent retest.
