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
};

export type ResumeChoice = {
  id: string;
  version_number: number | null;
  original_name: string;
  status: string;
  scan_status: string;
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
  resume_version_id: string;
  status: string;
  role_snapshot: Record<string, unknown>;
  resume_snapshot: Record<string, unknown>;
  facts_snapshot: Record<string, unknown>;
  rule_snapshot: Record<string, unknown>;
  eligibility_snapshot: Eligibility;
  created_at: string;
  updated_at: string;
  history: ApplicationEvent[];
  overrides: ApplicationOverride[];
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

export type PlacementRole = Omit<Opportunity, "eligibility" | "saved" | "application_id" | "application_status">;

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
  created_by_user_id: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};
