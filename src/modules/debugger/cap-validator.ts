import axios from 'axios';
import { CheckResult } from '../../types';
import { logger } from '../../utils/logger';

interface CapCheckItem {
  name: string;
  passed: boolean;
  detail: string;
}

export const validateCapIntegration = async (target: string): Promise<CheckResult> => {
  const checks: CapCheckItem[] = [];
  let totalScore = 0;
  const errors: string[] = [];

  // ── Check 1: Endpoint Reachability (HTTP 200 within 5s) ──
  try {
    logger.info('CAP Validator: checking endpoint reachability', { target });
    const response = await axios.get(target, { timeout: 5000 });

    if (response.status === 200) {
      checks.push({ name: 'Endpoint Reachability', passed: true, detail: 'Endpoint returned HTTP 200.' });
      totalScore += 20;
    } else {
      checks.push({ name: 'Endpoint Reachability', passed: false, detail: `Returned HTTP ${response.status}.` });
      errors.push(`Endpoint returned status ${response.status}`);
    }
  } catch (error: any) {
    const msg = axios.isAxiosError(error)
      ? (error.code === 'ECONNABORTED' ? 'Request timed out (>5s).' : `Network error: ${error.message}`)
      : `Unexpected error: ${error.message}`;
    checks.push({ name: 'Endpoint Reachability', passed: false, detail: msg });
    errors.push(msg);

    // If unreachable, return early — can't check anything else
    return {
      status: 'FAIL',
      score: 0,
      details: 'Endpoint is unreachable. Cannot perform further CAP validation.',
      errors,
      raw_data: { checks },
    };
  }

  // ── Check 2: CAP Handshake Compliance (headers + protocol version) ──
  try {
    logger.info('CAP Validator: checking CAP handshake', { target });
    const response = await axios.get(target, { timeout: 5000 });
    const data = response.data;
    const headers = response.headers;

    // Check for CAP-related headers or metadata in response body
    const hasCapHeader = !!(headers['x-cap-version'] || headers['x-cap-protocol']);
    const hasCapInBody = data && typeof data === 'object' && (data.protocol === 'CAP' || data.cap_version || data.name);

    if (hasCapHeader || hasCapInBody) {
      checks.push({ name: 'CAP Handshake', passed: true, detail: 'Agent exposes CAP protocol metadata.' });
      totalScore += 20;
    } else {
      checks.push({ name: 'CAP Handshake', passed: false, detail: 'No CAP protocol headers or metadata found in response.' });
      errors.push('Missing CAP handshake headers/metadata. Consider adding x-cap-version header or protocol field in root response.');
    }
  } catch (error: any) {
    checks.push({ name: 'CAP Handshake', passed: false, detail: `Handshake check failed: ${error.message}` });
    errors.push(`CAP handshake error: ${error.message}`);
  }

  // ── Check 3: Required Method Exposure (hire, execute, settle) ──
  const methods = [
    { name: 'hire', path: '/hire' },
    { name: 'execute', path: '/execute' },
    { name: 'settle', path: '/settle' },
  ];

  let methodsFound = 0;
  for (const method of methods) {
    try {
      const url = target.replace(/\/$/, '') + method.path;
      logger.debug(`CAP Validator: probing method ${method.name}`, { url });

      // Send empty POST to see if endpoint exists (expect 400 or 200, not 404)
      const response = await axios.post(url, {}, {
        timeout: 5000,
        validateStatus: (status) => status < 500, // Accept 2xx, 3xx, 4xx
      });

      if (response.status !== 404 && response.status !== 405) {
        methodsFound++;
        checks.push({
          name: `Method: ${method.name}()`,
          passed: true,
          detail: `/${method.name} endpoint responds (HTTP ${response.status}).`,
        });
      } else {
        checks.push({
          name: `Method: ${method.name}()`,
          passed: false,
          detail: `/${method.name} returned ${response.status} — method not exposed.`,
        });
        errors.push(`Required method ${method.name}() not found at ${method.path}`);
      }
    } catch (error: any) {
      checks.push({
        name: `Method: ${method.name}()`,
        passed: false,
        detail: `/${method.name} probe failed: ${error.message}`,
      });
      errors.push(`Method ${method.name}() probe failed: ${error.message}`);
    }
  }

  // Score: 20 points per method found (max 60 for all 3)
  totalScore += Math.round((methodsFound / 3) * 60);

  // ── Determine Overall Status ──
  const failedChecks = checks.filter(c => !c.passed);
  let status: CheckResult['status'];

  if (failedChecks.length === 0) {
    status = 'PASS';
  } else if (totalScore >= 60) {
    status = 'WARN';
  } else {
    status = 'FAIL';
  }

  return {
    status,
    score: totalScore,
    details: `CAP Integration: ${checks.filter(c => c.passed).length}/${checks.length} checks passed. Score: ${totalScore}/100.`,
    errors: errors.length > 0 ? errors : undefined,
    raw_data: { checks },
  };
};
