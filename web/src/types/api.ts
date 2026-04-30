export interface ScheduleDraft {
  title: string;
  start_at: string | null;
  end_at: string | null;
  all_day: boolean;
  confidence: number;
  notes: string | null;
}

export interface ApiEnvelope<T> {
  code: number;
  msg: string;
  data: T | null;
  traceId: string;
}
