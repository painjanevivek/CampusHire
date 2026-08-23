# Navigation and Token Baseline

## Student routes

The student shell keeps one predictable sequence: Readiness (`/dashboard`), Opportunities (`/opportunities`), Resume (`/resume`), Roadmap (`/roadmap`), and Profile (`/onboarding`). Opportunity detail and resume builder inherit that shell. The mobile menu exposes the same labels and order.

## Administration routes

Administration remains a separate workspace: Drives, Companies, Applications, Students, and Audit. The CampusHire mark returns to the administrator dashboard. Policy help is a utility rather than student navigation.

## Visual rules

- Cobalt is the only interactive accent; emerald is reserved for verified or successful semantic states.
- Canvas, surface, ink, muted ink, border, focus and status colours use semantic CSS variables from `src/app/globals.css`.
- Cards use a 12px radius, controls use 8px or a full pill, and workspace navigation uses one translucent container.
- Visible focus, minimum 42px controls, semantic landmarks, reduced-motion fallbacks, and non-colour status labels are mandatory.
- Student pages prioritize one next action, then eligible opportunities. Admin pages prioritize operational status, evidence, and auditability.
