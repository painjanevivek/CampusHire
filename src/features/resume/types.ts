export type ResumeJob = {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  attempts: number;
  max_attempts: number;
  safe_error_code: string | null;
  retryable: boolean;
};

export type ResumeSuggestion = {
  id: string;
  field_path: string;
  original_text: string;
  proposed_text: string;
  rationale: string;
  status: "pending" | "accepted" | "edited" | "rejected";
  decided_text: string | null;
};

export type ResumeVersion = {
  id: string;
  version_number: number | null;
  source: "upload" | "generated";
  original_name: string;
  status: "queued" | "processing" | "review_required" | "completed" | "failed";
  scan_status: "quarantined" | "clean" | "infected" | "scan_failed";
  page_count: number | null;
  created_at: string;
  review_completed_at: string | null;
  safe_error_code: string | null;
  extracted_data: {
    proposed?: Record<string, string | string[]>;
    decisions?: Record<string, { action: "accept" | "edit" | "reject"; value: unknown }>;
    accepted?: Record<string, unknown>;
  };
  job: ResumeJob | null;
  suggestions: ResumeSuggestion[];
};

export type ResumeUpload = {
  id: string;
  version_number: number | null;
  status: ResumeVersion["status"];
  scan_status: ResumeVersion["scan_status"];
  duplicate: boolean;
  job_id: string | null;
};
