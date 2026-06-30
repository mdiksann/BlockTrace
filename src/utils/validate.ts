import { createError } from './errors';

export interface ValidatedJobPayload {
  target: string;
  mode: 'full' | 'cap' | 'settlement' | 'a2a';
  output_format: 'json' | 'markdown';
}

const VALID_MODES = ['full', 'cap', 'settlement', 'a2a'] as const;
const VALID_FORMATS = ['json', 'markdown'] as const;

export const validateJobPayload = (body: unknown): ValidatedJobPayload => {
  if (!body || typeof body !== 'object') {
    throw createError('ERR_INVALID_PAYLOAD', 'Request body must be a JSON object.');
  }

  const payload = body as Record<string, unknown>;

  if (!payload.target || typeof payload.target !== 'string' || payload.target.trim().length === 0) {
    throw createError(
      'ERR_INVALID_PAYLOAD',
      'Missing or invalid "target" field. Must be a non-empty string (endpoint URL, CAP agent ID, or EVM wallet address).'
    );
  }

  const mode = (payload.mode as string) || 'full';
  if (!VALID_MODES.includes(mode as any)) {
    throw createError(
      'ERR_INVALID_PAYLOAD',
      `Invalid "mode" value: "${mode}". Must be one of: ${VALID_MODES.join(', ')}.`
    );
  }

  const output_format = (payload.output_format as string) || 'json';
  if (!VALID_FORMATS.includes(output_format as any)) {
    throw createError(
      'ERR_INVALID_PAYLOAD',
      `Invalid "output_format" value: "${output_format}". Must be one of: ${VALID_FORMATS.join(', ')}.`
    );
  }

  return {
    target: payload.target.trim(),
    mode: mode as ValidatedJobPayload['mode'],
    output_format: output_format as ValidatedJobPayload['output_format'],
  };
};

export const isValidEvmAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};
