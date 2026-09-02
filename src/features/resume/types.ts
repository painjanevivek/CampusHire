export type ResumePipelineStage =
  | "quarantined"
  | "scanning"
  | "scan_retry"
  | "parsing"
  | "parser_retry"
  | "review"
  | "generated"
  | "ready"
  | "failed"
  | "cancelled";

export type ResumeJob = {
  id: string;
  status: "queued" | "processing" | "cancellation_requested" | "completed" | "failed" | "cancelled";
  attempts: number;
  max_attempts: number;
  safe_error_code: string | null;
  retryable: boolean;
  cancellable: boolean;
  started_at: string | null;
  finished_at: string | null;
  duration_ms: number | null;
  stage: ResumePipelineStage;
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
  status: "queued" | "processing" | "review_required" | "completed" | "failed" | "cancelled";
  scan_status: "quarantined" | "clean" | "infected" | "scan_failed";
  page_count: number | null;
  created_at: string;
  review_completed_at: string | null;
  review_revision: number;
  evidence_digest: string;
  generator_version: string | null;
  processing_stage: ResumePipelineStage;
  safe_error_code: string | null;
  locked_by_application: boolean;
  extracted_data: {
    proposed?: Record<string, string | string[]>;
    decisions?: Record<string, { action: "accept" | "edit" | "reject"; value: unknown }>;
    accepted?: Record<string, unknown>;
    evidence_digest?: string;
    generator_version?: string;
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
