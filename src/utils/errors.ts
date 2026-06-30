export const ErrorCodes = {
  ERR_UNREACHABLE: 'ERR_UNREACHABLE',
  ERR_INVALID_ADDRESS: 'ERR_INVALID_ADDRESS',
  ERR_LLM_TIMEOUT: 'ERR_LLM_TIMEOUT',
  ERR_RPC_UNAVAILABLE: 'ERR_RPC_UNAVAILABLE',
  ERR_INVALID_PAYLOAD: 'ERR_INVALID_PAYLOAD',
  ERR_JOB_TIMEOUT: 'ERR_JOB_TIMEOUT',
  ERR_SETTLEMENT_FAILED: 'ERR_SETTLEMENT_FAILED',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

export class BlockTraceError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;

  constructor(code: ErrorCode, message: string, statusCode: number = 500) {
    super(message);
    this.name = 'BlockTraceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export const createError = (code: ErrorCode, message: string, statusCode?: number): BlockTraceError => {
  const defaults: Record<ErrorCode, number> = {
    ERR_UNREACHABLE: 502,
    ERR_INVALID_ADDRESS: 400,
    ERR_LLM_TIMEOUT: 504,
    ERR_RPC_UNAVAILABLE: 503,
    ERR_INVALID_PAYLOAD: 400,
    ERR_JOB_TIMEOUT: 504,
    ERR_SETTLEMENT_FAILED: 502,
  };
  return new BlockTraceError(code, message, statusCode ?? defaults[code] ?? 500);
};
