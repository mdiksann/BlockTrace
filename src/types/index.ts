// ============================================================
// BlockTrace v2.0.0 — Type Definitions
// ============================================================

// --- Job Payload ---
export interface JobPayload {
  target: string;                                  // endpoint URL, CAP agent ID, or EVM wallet
  mode?: 'full' | 'cap' | 'settlement' | 'a2a';   // default: "full"
  output_format?: 'json' | 'markdown';             // default: "json"
}

// --- Debug Report ---
export interface DebugReport {
  agent_id: string;
  job_id: string;
  target: string;
  summary: 'PASS' | 'WARN' | 'FAIL';
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
  status: 'PASS' | 'WARN' | 'FAIL';
  score: number;                   // 0–100
  details: string;
  errors?: string[];
  raw_data?: Record<string, unknown>;
}

export interface Recommendation {
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  check: string;
  issue: string;
  fix: string;
  docs_url?: string;
}

// --- CAP Protocol Types ---
export interface HireRequest {
  target: string;
  mode?: string;
  output_format?: string;
  payment?: {
    token: string;
    amount: string;
    tx_hash?: string;
  };
}

export interface HireResponse {
  status: 'accepted' | 'rejected';
  job_id: string;
  message: string;
  pricing?: {
    amount: string;
    token: string;
  };
}

export interface SettleRequest {
  job_id: string;
  transaction_hash: string;
}

export interface SettleResponse {
  job_id: string;
  status: 'settled' | 'failed';
  message: string;
  on_chain_confirmation?: {
    tx_hash: string;
    block_number?: number;
    confirmed: boolean;
  };
}
