import { CheckResult } from '../types';
import { validateCapIntegration } from '../modules/debugger/cap-validator';
import { verifySettlement } from '../modules/debugger/settlement';
import { testA2aComposability } from '../modules/debugger/a2a-tester';
import { generateRecommendations, generateEnhancedRecommendations } from '../modules/debugger/recommendations';
import { buildReport } from '../modules/debugger/report';

const MAX_JOB_TIMEOUT = parseInt(process.env.MAX_JOB_TIMEOUT_MS || '30000', 10);

export const runDiagnostics = async (job_id: string, target: string, mode: string = 'full') => {
  const executionStartTime = Date.now();
  const checks: { [key: string]: CheckResult } = {};

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('ERR_JOB_TIMEOUT')), MAX_JOB_TIMEOUT);
  });

  const runChecks = async () => {
    if (mode === 'full' || mode === 'cap') {
      checks.cap_integration = await validateCapIntegration(target);
    }
    if (mode === 'full' || mode === 'settlement') {
      checks.settlement = await verifySettlement(target);
    }
    if (mode === 'full' || mode === 'a2a') {
      checks.a2a_composability = await testA2aComposability(target);
    }
  };

  await Promise.race([runChecks(), timeoutPromise]);

  let recommendations;
  try {
    recommendations = await generateEnhancedRecommendations(checks);
  } catch {
    recommendations = generateRecommendations(checks);
  }

  return buildReport({
    job_id,
    target,
    checks,
    recommendations,
    executionStartTime,
  });
};
