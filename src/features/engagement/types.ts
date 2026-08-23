export type RoadmapTemplate = {
  id: string;
  slug: string;
  title: string;
  version: number;
  summary: string;
  node_count: number;
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
  readiness: number;
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
  };
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
