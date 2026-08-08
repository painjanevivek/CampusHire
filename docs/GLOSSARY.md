# Project glossary

Consistent language prevents UI, API, and database concepts from drifting apart.

| Term | Meaning |
|---|---|
| Application | A student's submission to one job role using a specific resume version. |
| Company | The organization offering one or more roles in a placement drive. |
| Drive | A time-bound recruitment event managed by TNP. |
| Eligibility | A deterministic result showing whether published formal rules are satisfied. |
| Eligibility rule | A typed, versioned condition such as minimum CGPA or allowed graduation year. |
| Feedback | Constructive, evidence-based guidance derived from approved job requirements and student data. |
| Institution | A college tenant that owns students, administrators, drives, policies, and decisions. |
| Match | A versioned suitability score based on skills, projects, and role context; not a hiring probability. |
| Opportunity | A student-facing job role that is open or otherwise visible. |
| Policy | An approved institutional or company document used as grounded evidence. |
| Profile readiness | A transparent checklist of required and recommended profile information. |
| Resume version | An immutable uploaded or generated resume revision. |
| Roadmap | A reviewed directed graph of role skills, milestones, projects, and prerequisites. |
| Shortlist | The administrator-approved candidate set for a role. |
| Student verification | Confirmation that a student belongs to the institution; separate from profile completion. |
| TNP | The college Training and Placement team responsible for recruitment operations. |

## Status vocabulary

- `draft`: editable and not visible to students.
- `queued`: accepted for background processing but not started.
- `processing`: actively being processed.
- `completed`: finished successfully.
- `failed`: finished unsuccessfully with a safe retry or recovery path.
- `needs_manual_review`: deterministic completion is impossible because approved data is missing or ambiguous.
- `archived`: unavailable for new activity but retained for history and audit.

User-facing copy may be friendlier, but API and database names must preserve these meanings.
