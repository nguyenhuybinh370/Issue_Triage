export type SeverityLevel = 'P0' | 'P1' | 'P2' | 'P3' | null;

export type TriageStatus = 'classified' | 'insufficient_data' | 'out_of_scope' | string;

export interface TriageResultData {
  severity: SeverityLevel;
  status: TriageStatus;
  component: string | null;
  owner_team: string | null;
  needs_urgent_response: boolean;
  reason: string;
}

export type TraceStageType = 
  | 'tool_call' 
  | 'application_executes' 
  | 'tool_result' 
  | 'final_response' 
  | string;

export interface TraceStageItem {
  step: number;
  stage: TraceStageType;
  title: string;
  subtitle: string;
  timestamp: string;
  payload: Record<string, any> | string;
}

export interface TokenUsageMetrics {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
}

export interface TriageApiResponse {
  result: TriageResultData;
  traces: TraceStageItem[];
  usage: TokenUsageMetrics;
}
