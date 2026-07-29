export type JobType = "generation" | "edit";

export type JobStatus =
  | "queued"
  | "claimed"
  | "processing"
  | "retry_scheduled"
  | "completed"
  | "failed"
  | "cancelled";

export type JobRecord = {
  id: string;
  user_id: string;
  job_type: JobType;
  status: JobStatus;
  idempotency_key: string;
  correlation_id: string;
  resource_id: string;
  payload: Record<string, unknown>;
  input_hash: string;
  output_sha256: string | null;
  output_bytes: number | null;
  priority: number;
  attempt_count: number;
  max_attempts: number;
  available_at: string;
  claimed_at: string | null;
  claimed_by: string | null;
  visibility_expires_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  error_code: string | null;
  estimated_cost_usd: number | null;
  created_at: string;
  updated_at: string;
};

export type PublicJob = {
  id: string;
  type: JobType;
  status: JobStatus;
  resourceId: string;
  attemptCount: number;
  maxAttempts: number;
  errorCode: string | null;
  createdAt: string;
  updatedAt: string;
};

export type QueuedGenerationResponse = {
  jobId: string;
  generationId: string;
  projectId: string;
  status: "queued" | "processing";
};

export type QueuedEditResponse = {
  jobId: string;
  versionId: string;
  sessionId: string;
  status: "queued" | "processing";
};
