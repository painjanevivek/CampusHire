export type Eligibility = {
  status: "eligible" | "ineligible" | "needs_manual_review" | "unavailable";
  rule_set_id: string | null;
  rule_version: string | null;
  results: Array<{ label: string; passed: boolean | null; reason: string }>;
  missing_evidence: string[];
};

export type Opportunity = {
  id: string;
  drive_id: string;
  company_name: string;
  drive_title: string;
  title: string;
  description: string;
  employment_type: string;
  location: string;
  work_mode: string;
  salary_display: string | null;
  skills: string[];
  requirements: string[];
  status: string;
  published_at: string | null;
  deadline_at: string;
  eligibility: Eligibility;
  saved: boolean;
  application_id: string | null;
  application_status: string | null;
};

export type OpportunityPage = {
  items: Opportunity[];
  page: number;
  page_size: number;
  total: number;
  empty_reason: "no_published_drive" | "filters_exclude_results" | "profile_incomplete" | null;
};

export type SemanticMatch = {
  status: "available" | "unavailable";
  score: number | null;
  components: Record<string, number>;
  explanation: string[];
  embedding_model: string;
  embedding_version: string;
  scoring_version: string;
  source_resume_version_id: string | null;
  source_profile_revision: number | null;
  safe_error_code: string | null;
  evaluated_at: string | null;
};

export type ResumeChoice = {
  id: string;
  version_number: number | null;
  original_name: string;
  status: string;
  scan_status: string;
  parent_version_id?: string | null;
  purpose_role_id?: string | null;
};

export type DisclosureQuestion = {
  id: string;
  prompt: string;
  type: "single_select" | "multi_select" | "boolean";
  options: string[];
};

export type ApplicationForm = {
  id: string;
  role_id: string;
  version: number;
  status: string;
  purpose: string;
  compliance_owner: string;
  retention_days: number;
  questions: DisclosureQuestion[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DisclosureAnswer = boolean | string | string[];

export type ApplicationDraft = {
  id: string;
  role_id: string;
  role_title: string;
  company_name: string;
  deadline_at: string;
  current_step: "resume" | "profile" | "disclosures" | "review" | "submitted";
  revision: number;
  expires_at: string;
  last_saved_at: string;
  profile_revision: number | null;
  resume: (ResumeChoice & { created_at: string }) | null;
  form: ApplicationForm | null;
  disclosure_answers: Record<string, DisclosureAnswer>;
  disclosure_completed: boolean;
  submitted_application_id: string | null;
};

export type ApplicationProfile = {
  id: string;
  account_email: string | null;
  full_name: string | null;
  department: string | null;
  academic_year: string | null;
  phone: string | null;
  city: string | null;
  country_code: string | null;
  education: Array<Record<string, unknown>>;
  revision: number;
  updated_at: string;
};

export type ResumeContent = {
  full_name: string;
  email: string;
  phone: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  summary: string;
  skills: string[];
  projects: string[];
  education: string[];
};

export type ApplicationReview = {
  draft: ApplicationDraft;
  profile_snapshot: Record<string, unknown>;
  immutable_notice: string;
};

export type ApplicationEvent = {
  id: string;
  from_status: string | null;
  to_status: string;
  actor_user_id: string;
  reason: string | null;
  created_at: string;
};

export type ApplicationOverride = {
  id: string;
  actor_user_id: string;
  previous_status: string;
  target_status: string;
  reason: string;
  policy_reference: string | null;
  created_at: string;
};

export type PlacementApplication = {
  id: string;
  role_id: string;
  student_user_id: string;
  student_name: string;
  student_email: string;
  resume_version_id: string;
  status: string;
  role_snapshot: Record<string, unknown>;
  resume_snapshot: Record<string, unknown>;
  facts_snapshot: Record<string, unknown>;
  rule_snapshot: Record<string, unknown>;
  eligibility_snapshot: Eligibility;
  decision_snapshot: Record<string, unknown>;
  profile_snapshot: Record<string, unknown>;
  application_form_snapshot: Record<string, unknown>;
  disclosure_status: "not_configured" | "collected" | "declined";
  institution_timezone: string;
  created_at: string;
  updated_at: string;
  withdrawn_at: string | null;
  withdrawal_reason: string | null;
  can_withdraw: boolean;
  history: ApplicationEvent[];
  overrides: ApplicationOverride[];
  appeals: Array<{
    id: string;
    kind: string;
    status: string;
    reason: string;
    supporting_evidence: string[];
    administrator_response: string | null;
    created_at: string;
    updated_at: string;
    resolved_at: string | null;
  }>;
};

export type AdminApplicationPage = {
  items: PlacementApplication[];
  page: number;
  page_size: number;
  total: number;
};

export type Company = {
  id: string;
  name: string;
  website_url: string | null;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type Drive = {
  id: string;
  company_id: string;
  company_name: string;
  title: string;
  description: string;
  location: string;
  work_mode: string;
  opens_at: string;
  deadline_at: string;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  role_count: number;
};

export type PlacementRole = Omit<
  Opportunity,
  "eligibility" | "saved" | "application_id" | "application_status"
>;

export type RuleDefinition = {
  field: string;
  operator: string;
  value: string | number | boolean | string[] | null;
  label: string;
};

export type RuleSet = {
  id: string;
  role_id: string;
  version: number;
  status: string;
  rules: RuleDefinition[];
  policy_references: Array<{
    id: string;
    title: string;
    version: number;
    source_reference: string;
    approved_at: string | null;
  }>;
  created_by_user_id: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PolicyDocument = {
  id: string;
  title: string;
  version: number;
  source_reference: string;
  sections: Array<{ section: string; page: number; text: string }>;
  status: string;
  review_reason: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PolicyAnswer = {
  answer: string;
  citations: string[];
  policy_id: string | null;
  policy_version: number | null;
  grounded: boolean;
};

export type ExtractionProposal = {
  id: string;
  role_id: string;
  proposed_requirements: string[];
  proposed_skills: string[];
  provider_name: string;
  model_version: string;
  prompt_version: string;
  status: string;
  review_reason: string | null;
  created_at: string;
  updated_at: string;
};
