// Job Payload Schema
export type JobPayload =
  | { type: "debug";   target: string; mode?: "full" | "cap" | "settlement" | "a2a"; output_format?: "json" | "markdown"; }
  | { type: "explain"; address: string; network?: "ethereum" | "polygon" | "bsc"; };

// --- Debug Report ---
export interface DebugReport {
  agent_id: string;
  job_id: string;
  target: string;
  summary: "PASS" | "WARN" | "FAIL";
  overall_score: number;           // 0–100 weighted average
  checks: {
    cap_integration?:    CheckResult;
    settlement?:         CheckResult;
    a2a_composability?:  CheckResult;
  };
  recommendations: Recommendation[];
  generated_at: string;            // ISO 8601
  execution_time_ms: number;
}

export interface CheckResult {
  status: "PASS" | "WARN" | "FAIL";
  score: number;                   // 0–100
  details: string;
  errors?: string[];
  raw_data?: Record<string, unknown>;
}

export interface Recommendation {
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  check: string;
  issue: string;
  fix: string;
  docs_url?: string;
}

// --- Explainer Report ---
export interface ExplainerReport {
  agent_id: string;
  job_id: string;
  contract_address: string;
  network: string;
  name?: string;
  verified: boolean;
  deployer?: string;
  deploy_block?: number;
  summary: string;                 // plain-language description
  key_functions: {
    name: string;
    description: string;
    is_payable: boolean;
  }[];
  risk_flags: RiskFlag[];
  generated_at: string;
}

export interface RiskFlag {
  severity: "HIGH" | "MEDIUM" | "LOW";
  label: string;
  description: string;
  affected_function?: string;
}
