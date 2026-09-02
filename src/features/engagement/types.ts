export type RoadmapTemplate = {
  id: string;
  slug: string;
  title: string;
  version: number;
  summary: string;
  node_count: number;
};

export type RoadmapAvailability = {
  status: "available" | "no_target_role" | "no_approved_template" | "institution_restriction";
  reason: string;
  guidance_provider_status: "available" | "unavailable";
  templates: RoadmapTemplate[];
};

export type RoadmapNode = {
  key: string;
  title: string;
  completion: string;
  prerequisites: string[];
  state: "completed" | "next" | "locked";
  evidence: Record<string, unknown>;
};

export type Roadmap = {
  id: string;
  template_id: string;
  slug: string;
  title: string;
  version: number;
  summary: string;
  completed_count: number;
  nodes: RoadmapNode[];
};

export type Notification = {
  id: string;
  event_key: string;
  title: string;
  body: string;
  deep_link: string;
  read_at: string | null;
  created_at: string;
};

export type NotificationPage = {
  items: Notification[];
  unread_count: number;
};

export type DashboardApiResponse = {
  student_name: string;
  readiness: {
    policy_version: string;
    completed_evidence: number;
    total_evidence: number;
    required_complete: boolean;
  };
  state:
    "ready" | "incomplete" | "processing" | "manual-review" | "ai-unavailable";
  next_action: {
    key: string;
    title: string;
    description: string;
    reason: string;
    href: string;
    policy_version: string;
    source_facts: string[];
    estimated_minutes: number;
    unlocks: string;
    completion_criteria: string;
  };
  activation: Array<{
    key: "account_activated" | "profile_minimum" | "target_role" | "resume_reviewed" | "opportunities_unlocked" | "first_application";
    label: string;
    status: "complete" | "current" | "upcoming";
    href: string;
    estimated_minutes: number;
    unlocks: string;
  }>;
  evidence: Array<{
    label: string;
    value: string;
    status: "verified" | "pending" | "review";
  }>;
  opportunities: Array<{
    id: string;
    company: string;
    role: string;
    location: string;
    eligibility: string;
    match: number | null;
    href: string;
  }>;
  roadmap: Roadmap | null;
  unread_notifications: number;
};
