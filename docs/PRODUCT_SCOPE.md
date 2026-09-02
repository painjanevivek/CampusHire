# Product scope

## Purpose

CampusHire AI helps students become placement-ready and helps a college Training and Placement cell manage recruitment drives consistently. It is not an autonomous hiring authority.

## MVP users

### Student

A student can:

- Activate a verified institution invitation and create a password.
- Complete a resumable profile questionnaire.
- Add education, skills, preferred roles, and optional professional links.
- Upload, review, improve, version, and download a resume.
- Discover roles, see eligibility and match separately, and apply.
- Receive application updates and constructive feedback.
- Follow a curated, personalized career-roadmap graph.

### TNP administrator

A TNP administrator can:

- Verify institutional student membership.
- Manage companies, placement drives, roles, deadlines, and applications.
- Define and version deterministic eligibility rules.
- Review AI-extracted job requirements and policy evidence.
- Inspect explainable rankings and record shortlist overrides with reasons.
- Publish in-app updates and inspect auditable decision history.

## MVP capabilities

- Invitation-based email/password activation with revocable secure sessions, administrator authenticator MFA, and recovery codes; no phone OTP.
- Student and administrator role separation.
- Progressive onboarding with autosave and clear completion guidance.
- Optional GitHub and portfolio links shown on profiles and generated resumes.
- PDF resume parsing, reviewed structured extraction, and version history.
- Honest AI-assisted grammar, wording, and ATS-readiness suggestions.
- Placement drive, job role, application, shortlist, and status management.
- Deterministic eligibility with rule-by-rule explanations.
- Gemini embeddings and Qdrant semantic matching for eligible candidates.
- RAG retrieval from approved institutional and company policies.
- Curated roadmap templates personalized to a student's evidence and target role.
- In-app notifications.
- PostgreSQL as the source of truth, Redis for temporary operations, and object storage for files.

## Initial career roadmaps

The first release targets eight well-reviewed paths:

1. Software Developer
2. Frontend Developer
3. Backend Developer
4. Full-Stack Developer
5. Mobile Application Developer
6. Data Analyst
7. Machine Learning Engineer
8. AI Engineer

New roadmaps are added only when the team can review their prerequisites, milestones, evidence, and resources.

## Explicit future scope

- AI mock interviews and interview evaluation.
- External recruiter/company accounts.
- Automated GitHub repository or code-quality analysis.
- Labour-market demand analytics.
- External email/SMS placement campaigns and phone OTP.
- Native mobile applications.
- Custom model training.

Future-scope items must not appear as active navigation or implied functionality in the MVP.

## Product guardrails

- Age and date of birth are not collected during normal onboarding.
- Sensitive or protected attributes are excluded from semantic matching.
- A match score is not an eligibility decision or hiring probability.
- Missing data produces a manual-review state, not an unexplained rejection.
- AI cannot invent credentials, achievements, grades, employers, or project outcomes.
- A company can require GitHub or portfolio only through a visible, versioned role rule.
- Historical applications keep the exact resume, policy, rule, and scoring versions used at the time.

## Success evidence

Claims such as matching accuracy, workload reduction, or ATS improvement are targets until measured with a documented dataset, baseline, method, and limitations. Synopsis references and numerical claims must be verified before academic publication.
